import {
  MemberType,
  MemberStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  WorkCategory,
  ApprovalStatus,
  TransactionType,
  PaymentStatus,
  DecisionStatus,
  VoteType,
  DailyReportStatus,
  DealStage,
  AccountType,
} from './enums';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  } | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  locale: string;
  isActive: boolean;
  memberType?: MemberType;
}

export interface PartnerSummary {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  title?: string | null;
  ownership: number;
  joinedAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  defaultLang: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  businessUnitId: string;
  businessUnitName?: string;
  managerId?: string | null;
  managerName?: string | null;
  budget?: number | null;
  currency: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  tasksCount?: number;
  completedTasksCount?: number;
}

export interface TaskSummary {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToAvatar?: string | null;
  createdById: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours?: number | null;
  dueDate?: string | null;
  commentsCount?: number;
}

export interface DailyReportSummary {
  id: string;
  userId: string;
  userName: string;
  reportDate: string;
  accomplishments: string;
  nextSteps?: string | null;
  blockers?: string | null;
  status: DailyReportStatus;
  submittedAt?: string | null;
}

export interface WorkLogSummary {
  id: string;
  userId: string;
  userName: string;
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  workDate: string;
  durationMinutes: number;
  description: string;
  category: WorkCategory;
  approvalStatus: ApprovalStatus;
}

export interface TransactionSummary {
  id: string;
  type: TransactionType;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
  description: string;
  transactionDate: string;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus;
  approvals: {
    partnerId: string;
    partnerName: string;
    decision: VoteType;
    comments?: string | null;
    decidedAt: string;
  }[];
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  currency: string;
}
