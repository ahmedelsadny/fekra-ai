import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ApprovalStatus,
  TransactionType,
  VoteType,
  evaluateExpenseApprovals,
  REQUIRED_PARTNER_COUNT,
} from '@fekra/shared-types';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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
      const evaluation = evaluateExpenseApprovals(allVotes);

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
  }
}
