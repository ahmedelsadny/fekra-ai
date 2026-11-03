import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';
import { TransactionType, ApprovalStatus, VoteType } from '@fekra/shared-types';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

export class VoteExpenseDto {
  @IsIn(['APPROVE', 'REJECT', 'ABSTAIN'])
  decision: 'APPROVE' | 'REJECT' | 'ABSTAIN';

  @IsString()
  @IsOptional()
  comments?: string;
}

export class CreateDepositDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  source?: string;

  /** Optional: link this income to a specific client project */
  @IsUUID()
  @IsOptional()
  projectId?: string;
}

export class CreateExpenseDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** Optional: link this expense to a specific client project */
  @IsUUID()
  @IsOptional()
  projectId?: string;
}

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get organization financial dashboard overview' })
  async getOverview(@CurrentUser() user: AuthUser) {
    return this.financeService.getOverview(user.orgId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List active accounts with computed current balances' })
  async getAccounts(@CurrentUser() user: AuthUser) {
    return this.financeService.getAccounts(user.orgId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List financial categories (optional ?type=INCOME|EXPENSE)' })
  async getCategories(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: 'INCOME' | 'EXPENSE',
  ) {
    return this.financeService.getCategories(user.orgId, type as TransactionType);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List organization transactions (optional ?type=&status=&take=)' })
  async listTransactions(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: 'INCOME' | 'EXPENSE' | 'TRANSFER',
    @Query('status') status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED',
    @Query('take') take?: string,
  ) {
    return this.financeService.listTransactions({
      organizationId: user.orgId,
      type: type as TransactionType,
      status: status as ApprovalStatus,
      take: take ? Math.min(Number(take) || 100, 500) : 100,
    });
  }

  @Get('pending-expenses')
  @ApiOperation({ summary: 'List expenses awaiting the unanimous 4-partner approval' })
  async getPendingExpenses(@CurrentUser() user: AuthUser) {
    return this.financeService.getPendingExpenses(user.orgId);
  }

  @Post('deposits')
  @ApiOperation({ summary: 'Record a new income/deposit into a company account' })
  async createDeposit(@CurrentUser() user: AuthUser, @Body() body: CreateDepositDto) {
    return this.financeService.createDeposit({
      organizationId: user.orgId,
      userId: user.id,
      accountId: body.accountId,
      amount: body.amount,
      categoryId: body.categoryId,
      description: body.description,
      source: body.source,
      projectId: body.projectId,
    });
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Submit a new expense (requires unanimous 4-partner approval)' })
  async createExpense(@CurrentUser() user: AuthUser, @Body() body: CreateExpenseDto) {
    return this.financeService.createExpense({
      organizationId: user.orgId,
      userId: user.id,
      accountId: body.accountId,
      amount: body.amount,
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      requester: user.fullName,
      projectId: body.projectId,
    });
  }

  @Post('transactions/:id/vote')
  @ApiOperation({ summary: 'Cast partner vote on expense transaction (4-partner unanimous rule)' })
  async voteOnExpense(
    @CurrentUser() user: AuthUser,
    @Param('id') transactionId: string,
    @Body() body: VoteExpenseDto,
  ) {
    return this.financeService.voteOnExpense({
      organizationId: user.orgId,
      transactionId,
      partnerUserId: user.id,
      decision: body.decision as VoteType,
      comments: body.comments,
    });
  }
}
