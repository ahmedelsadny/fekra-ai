import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { VoteType } from '@fekra/shared-types';

export class VoteExpenseDto {
  decision: VoteType;
  comments?: string;
}

@ApiTags('Finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get organization financial dashboard overview' })
  async getOverview(@Query('organizationId') orgId: string) {
    // For MVP demonstration / integration
    return this.financeService.getOverview(orgId);
  }

  @Post('transactions/:id/vote')
  @ApiOperation({ summary: 'Cast partner vote on expense transaction (4-partner unanimous rule)' })
  async voteOnExpense(
    @Param('id') transactionId: string,
    @Body() body: VoteExpenseDto,
    @Headers('x-organization-id') orgId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.financeService.voteOnExpense({
      organizationId: orgId,
      transactionId,
      partnerUserId: userId,
      decision: body.decision,
      comments: body.comments,
    });
  }
}
