import { ApprovalStatus, VoteType } from './enums';

/**
 * Core Governance Constants for Fekra AI
 */
export const REQUIRED_PARTNER_COUNT = 4;
export const INITIAL_PARTNER_OWNERSHIP_PERCENT = 25.0;

export interface PartnerVoteRecord {
  partnerId: string;
  partnerName: string;
  vote: VoteType | null;
  comments?: string | null;
  votedAt?: string | null;
}

export interface ExpenseApprovalEvaluation {
  status: ApprovalStatus;
  totalRequired: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isUnanimouslyApproved: boolean;
  isRejected: boolean;
}

/**
 * Mandatory Business Rule: Unanimous 4-Partner Expense Approval Rule
 *
 * Rules:
 * - Exactly 4 eligible partners are required.
 * - Any single REJECT immediately marks the transaction REJECTED.
 * - Exactly 4 APPROVE votes are required to mark the transaction APPROVED.
 * - If fewer than 4 have voted and no one has rejected, it remains PENDING.
 * - Abstentions DO NOT count as approval.
 */
export function evaluateExpenseApprovals(votes: { decision: VoteType }[]): ExpenseApprovalEvaluation {
  const approvedCount = votes.filter((v) => v.decision === VoteType.APPROVE).length;
  const rejectedCount = votes.filter((v) => v.decision === VoteType.REJECT).length;
  const pendingCount = Math.max(0, REQUIRED_PARTNER_COUNT - votes.length);

  const isRejected = rejectedCount > 0;
  const isUnanimouslyApproved = approvedCount === REQUIRED_PARTNER_COUNT;

  let status = ApprovalStatus.PENDING;
  if (isRejected) {
    status = ApprovalStatus.REJECTED;
  } else if (isUnanimouslyApproved) {
    status = ApprovalStatus.APPROVED;
  }

  return {
    status,
    totalRequired: REQUIRED_PARTNER_COUNT,
    approvedCount,
    rejectedCount,
    pendingCount,
    isUnanimouslyApproved,
    isRejected,
  };
}
