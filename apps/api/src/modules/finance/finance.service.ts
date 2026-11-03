import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApprovalStatus,
  PaymentStatus,
  TransactionType,
  VoteType,
  evaluateExpenseApprovals,
  REQUIRED_PARTNER_COUNT,
} from '@fekra/shared-types';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** User ids of all active partners (optionally excluding the actor) */
  private async partnerUserIds(organizationId: string, excludeUserId?: string) {
    const partners = await this.prisma.partner.findMany({
      where: { organizationId },
      include: { member: { select: { userId: true } } },
    });
    return partners
      .map((p) => p.member.userId)
      .filter((id) => id && id !== excludeUserId);
  }

  /**
   * Retrieves high-level company finance overview
   */
  async getOverview(organizationId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { organizationId, isActive: true },
    });

    const totalBalance = accounts.reduce((acc, a) => acc + Number(a.openingBalance), 0);

    const transactions = await this.prisma.transaction.findMany({
      where: { organizationId },
      include: { category: true, approvals: { include: { partner: { include: { member: { include: { user: true } } } } } } },
      orderBy: { transactionDate: 'desc' },
      take: 20,
    });

    const incomeTotal = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseTotal = transactions
      .filter((t) => t.type === TransactionType.EXPENSE && t.approvalStatus === ApprovalStatus.APPROVED)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingExpensesCount = await this.prisma.transaction.count({
      where: {
        organizationId,
        type: TransactionType.EXPENSE,
        approvalStatus: ApprovalStatus.PENDING,
      },
    });

    return {
      totalTreasuryBalance: totalBalance,
      currency: 'EGP',
      incomeTotal,
      approvedExpenseTotal: expenseTotal,
      netCashFlow: incomeTotal - expenseTotal,
      pendingExpensesCount,
      accounts,
      recentTransactions: transactions,
    };
  }

  /**
   * List active financial accounts with computed current balance:
   * openingBalance + approved INCOME - approved EXPENSE.
   */
  async getAccounts(organizationId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { organizationId, isActive: true },
    });

    const balances = new Map<string, number>(accounts.map((a) => [a.id, Number(a.openingBalance)]));

    const txs = await this.prisma.transaction.findMany({
      where: { organizationId },
      select: { accountId: true, type: true, amount: true, approvalStatus: true },
    });

    for (const t of txs) {
      const current = balances.get(t.accountId) ?? 0;
      const amount = Number(t.amount);
      if (t.approvalStatus !== ApprovalStatus.APPROVED) continue;
      if (t.type === TransactionType.INCOME) {
        balances.set(t.accountId, current + amount);
      } else if (t.type === TransactionType.EXPENSE) {
        balances.set(t.accountId, current - amount);
      }
    }

    return accounts.map((a) => ({
      ...a,
      openingBalance: Number(a.openingBalance),
      currentBalance: balances.get(a.id) ?? 0,
    }));
  }

  /**
   * List organization transactions with rich relations.
   */
  async listTransactions(params: {
    organizationId: string;
    type?: TransactionType;
    status?: ApprovalStatus;
    take?: number;
  }) {
    return this.prisma.transaction.findMany({
      where: {
        organizationId: params.organizationId,
        ...(params.type ? { type: params.type } : {}),
        ...(params.status ? { approvalStatus: params.status } : {}),
      },
      include: {
        category: true,
        account: true,
        project: true,
        createdBy: { select: { id: true, fullName: true } },
        approvals: {
          include: {
            partner: {
              include: { member: { include: { user: { select: { id: true, fullName: true, email: true } } } } },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
      take: params.take ?? 100,
    });
  }

  /**
   * Pending expense transactions awaiting the unanimous 4-partner vote.
   */
  async getPendingExpenses(organizationId: string) {
    return this.listTransactions({
      organizationId,
      type: TransactionType.EXPENSE,
      status: ApprovalStatus.PENDING,
    });
  }

  /**
   * Financial categories (for deposit/expense pickers).
   */
  async getCategories(organizationId: string, type?: TransactionType) {
    return this.prisma.financialCategory.findMany({
      where: { organizationId, ...(type ? { transactionType: type } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Record a new income/deposit. Income does not require partner approval,
   * so it is stored directly as APPROVED and immediately affects the balance.
   * Optionally linked to a client project.
   */
  async createDeposit(params: {
    organizationId: string;
    userId: string;
    accountId: string;
    amount: number;
    categoryId?: string;
    description?: string;
    source?: string;
    projectId?: string;
  }) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: params.accountId, organizationId: params.organizationId },
    });
    if (!account) throw new NotFoundException('Account not found in this organization');

    const category = params.categoryId
      ? await this.prisma.financialCategory.findFirst({
          where: { id: params.categoryId, organizationId: params.organizationId },
        })
      : await this.prisma.financialCategory.findFirst({
          where: { organizationId: params.organizationId, transactionType: TransactionType.INCOME },
        });
    if (!category) throw new NotFoundException('No income category configured for this organization');

    // Optional project link — must belong to the same organization
    let project = null;
    if (params.projectId) {
      project = await this.prisma.project.findFirst({
        where: { id: params.projectId, organizationId: params.organizationId },
      });
      if (!project) throw new NotFoundException('Project not found in this organization');
    }

    const description = params.source
      ? `${params.source} — ${params.description || 'إيداع رصيد'}`
      : params.description || 'إيداع رصيد';

    const tx = await this.prisma.transaction.create({
      data: {
        organizationId: params.organizationId,
        accountId: account.id,
        categoryId: category.id,
        createdById: params.userId,
        projectId: project?.id ?? null,
        type: TransactionType.INCOME,
        amount: params.amount,
        description,
        transactionDate: new Date(),
        paymentStatus: PaymentStatus.PAID,
        approvalStatus: ApprovalStatus.APPROVED,
        submittedAt: new Date(),
        approvedAt: new Date(),
        paidAt: new Date(),
      },
      include: { account: true, category: true, project: true },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId,
        action: 'FINANCE_DEPOSIT_CREATED',
        entityType: 'Transaction',
        entityId: tx.id,
        newValues: {
          amount: params.amount,
          accountId: account.id,
          source: params.source ?? null,
          projectId: project?.id ?? null,
        },
      },
    });

    // Live + persistent notification for the other partners
    const recipients = await this.partnerUserIds(params.organizationId, params.userId);
    await this.notifications.notifyUsers(params.organizationId, recipients, {
      title: 'إيداع جديد في الخزينة',
      body: `تم إيداع مبلغ ${params.amount.toLocaleString()} ج.م${project ? ` على مشروع "${project.name}"` : ''} — الرصيد اتحدث للجميع.`,
      type: NotificationType.SYSTEM,
      referenceId: tx.id,
    });

    return tx;
  }

  /**
   * Submit a new company expense. Expenses always start as PENDING and
   * require the unanimous approval of all 4 partners before they affect balances.
   */
  async createExpense(params: {
    organizationId: string;
    userId: string;
    accountId: string;
    amount: number;
    categoryId?: string;
    title: string;
    description?: string;
    requester?: string;
    projectId?: string;
  }) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: params.accountId, organizationId: params.organizationId },
    });
    if (!account) throw new NotFoundException('Account not found in this organization');

    const category = params.categoryId
      ? await this.prisma.financialCategory.findFirst({
          where: { id: params.categoryId, organizationId: params.organizationId },
        })
      : await this.prisma.financialCategory.findFirst({
          where: { organizationId: params.organizationId, transactionType: TransactionType.EXPENSE },
        });
    if (!category) throw new NotFoundException('No expense category configured for this organization');

    // Optional project link — must belong to the same organization
    let project = null;
    if (params.projectId) {
      project = await this.prisma.project.findFirst({
        where: { id: params.projectId, organizationId: params.organizationId },
      });
      if (!project) throw new NotFoundException('Project not found in this organization');
    }

    const description = [params.title, params.description].filter(Boolean).join(' — ');

    const tx = await this.prisma.transaction.create({
      data: {
        organizationId: params.organizationId,
        accountId: account.id,
        categoryId: category.id,
        createdById: params.userId,
        projectId: project?.id ?? null,
        type: TransactionType.EXPENSE,
        amount: params.amount,
        description,
        transactionDate: new Date(),
        paymentStatus: PaymentStatus.UNPAID,
        approvalStatus: ApprovalStatus.PENDING,
        submittedAt: new Date(),
      },
      include: { account: true, category: true, project: true },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId,
        action: 'FINANCE_EXPENSE_SUBMITTED',
        entityType: 'Transaction',
        entityId: tx.id,
        newValues: {
          amount: params.amount,
          accountId: account.id,
          title: params.title,
          requester: params.requester ?? null,
        },
      },
    });

    // Live + persistent notification — the expense needs everyone's approval
    const recipients = await this.partnerUserIds(params.organizationId, params.userId);
    await this.notifications.notifyUsers(params.organizationId, recipients, {
      title: 'مصروف مستني اعتمادك',
      body: `تم تسجيل ${params.title} بمبلغ ${params.amount.toLocaleString()} ج.م — محتاج موافقة 4/4 شركاء، راجع صفحة اعتمادات المصروفات.`,
      type: NotificationType.EXPENSE_APPROVAL,
      referenceId: tx.id,
    });

    return tx;
  }

  /**
   * Mandatory Business Logic: Submit a partner vote for an expense transaction.
   * Enforces unanimous 4-partner approval rule inside an atomic transaction.
   */
  async voteOnExpense(params: {
    organizationId: string;
    transactionId: string;
    partnerUserId: string;
    decision: VoteType;
    comments?: string;
  }) {
    const { organizationId, transactionId, partnerUserId, decision, comments } = params;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Verify transaction exists and belongs to organization
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { approvals: true },
      });

      if (!transaction || transaction.organizationId !== organizationId) {
        throw new NotFoundException('Transaction not found in this organization');
      }

      if (transaction.type !== TransactionType.EXPENSE) {
        throw new BadRequestException('Approval voting only applies to expense transactions');
      }

      if (transaction.approvalStatus !== ApprovalStatus.PENDING && transaction.approvalStatus !== ApprovalStatus.DRAFT) {
        throw new BadRequestException(`Cannot vote on transaction with status: ${transaction.approvalStatus}`);
      }

      // 2. Resolve Partner record for this user
      const partnerMember = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: partnerUserId,
          },
        },
        include: { partner: true },
      });

      if (!partnerMember || !partnerMember.partner) {
        throw new ForbiddenException('Only active founding partners can vote on company expenses');
      }

      const partnerId = partnerMember.partner.id;

      // 3. Upsert the partner's vote
      await tx.transactionApproval.upsert({
        where: {
          transactionId_partnerId: {
            transactionId,
            partnerId,
          },
        },
        update: {
          decision,
          comments,
          decidedAt: new Date(),
        },
        create: {
          transactionId,
          partnerId,
          decision,
          comments,
        },
      });

      // 4. Fetch all active partners for the organization (must equal 4)
      const activePartners = await tx.partner.findMany({
        where: { organizationId },
      });

      if (activePartners.length !== REQUIRED_PARTNER_COUNT) {
        throw new BadRequestException(
          `Company governance requires exactly ${REQUIRED_PARTNER_COUNT} active partners, found ${activePartners.length}`,
        );
      }

      // 5. Fetch all votes cast so far
      const allVotes = await tx.transactionApproval.findMany({
        where: { transactionId },
      });

      // 6. Evaluate using the exact governance rule
      //    (cast: prisma enum → shared-types enum, structurally identical)
      const evaluation = evaluateExpenseApprovals(
        allVotes.map((v) => ({ decision: v.decision as VoteType })),
      );

      // 7. Update transaction status
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          approvalStatus: evaluation.status,
          approvedAt: evaluation.isUnanimouslyApproved ? new Date() : null,
        },
        include: {
          approvals: {
            include: {
              partner: {
                include: {
                  member: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // 8. Create immutable Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: partnerUserId,
          action: 'FINANCE_EXPENSE_VOTE',
          entityType: 'Transaction',
          entityId: transactionId,
          newValues: {
            decision,
            resultingStatus: evaluation.status,
            approvedCount: evaluation.approvedCount,
            rejectedCount: evaluation.rejectedCount,
          },
        },
      });

      return {
        transaction: updated,
        evaluation,
      };
    });

    // Live + persistent notification about the vote outcome (all partners)
    const outcome = result.evaluation.status;
    const recipients = await this.partnerUserIds(organizationId);
    await this.notifications.notifyUsers(organizationId, recipients, {
      title: outcome === 'APPROVED' ? 'تم اعتماد مصروف بالإجماع 4/4 🎉' : outcome === 'REJECTED' ? 'تم رفض مصروف' : 'صوت جديد على مصروف',
      body:
        outcome === 'APPROVED'
          ? 'تم اعتماد المصروف بإجماع الشركاء الأربعة واتخصم من رصيد الشركة فوراً.'
          : outcome === 'REJECTED'
            ? 'صوت واحد بالرفض ألغى اعتماد المصروف نهائياً.'
            : 'تم تسجيل صوت جديد — في انتظار باقي الشركاء.',
      type: NotificationType.EXPENSE_APPROVAL,
      referenceId: transactionId,
    });

    return result;
  }
}
