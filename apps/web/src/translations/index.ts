export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Brand & General
    brandName: 'فكرة AI',
    tagline: 'نظام التشغيل والإدارة المؤسسية المتكامل',
    oneCompany: 'شركة واحدة • مساحة عمل واحدة • شفافية تشغيلية كاملة',
    searchPlaceholder: 'بحث عام في المشاريع، المهام، المعاملات...',

    // Navigation
    navDashboard: 'لوحة القيادة',
    navPartners: 'الشركاء المؤسسون',
    navBusinessUnits: 'وحدات الأعمال',
    navDepartments: 'الأقسام',
    navProjects: 'المشاريع',
    navTasks: 'المهام والكانبان',
    navDailyReports: 'التقارير اليومية',
    navWorkLogs: 'سجلات العمل',
    navFinance: 'المالية والخزينة',
    navExpenseApprovals: 'اعتمادات المصروفات (إجماع الشركاء)',
    navDecisions: 'قرارات الشركاء والتصويت',
    navAuditLogs: 'سجل التدقيق والأمان',
    navSettings: 'الإعدادات العامة',

    // Dashboard Widgets
    totalProjects: 'إجمالي المشاريع',
    activeProjects: 'مشاريع قيد التنفيذ',
    completedTasks: 'مهام مكتملة',
    overdueTasks: 'مهام متأخرة',
    pendingApprovals: 'اعتمادات معلقة',
    totalRevenue: 'إجمالي الإيرادات',
    totalExpenses: 'إجمالي المصروفات المعتمدة',
    netCashFlow: 'صافي التدفق النقدي',
    currencyEGP: 'ج.م',

    // Partner Governance
    equalPartnership: 'حوكمة الشركاء الأربعة المتساوون (25% لكل شريك)',
    unanimousRule: 'قاعدة الإجماع الإلزامية: اعتماد أي مصروف يتطلب موافقة 4 من 4 شركاء دون أي رفض',
    partnerApprovalStatus: 'حالة اعتماد المصروف',
    votesCast: 'الأصوات المسجلة',
    unanimousApprovedBadge: 'معتمد بالإجماع (4/4)',
    rejectedBadge: 'مرفوض',
    pendingVoteBadge: 'قيد انتظار تصويت الشركاء',
    castVoteAs: 'التصويت بصفتك:',
    voteApprove: 'موافقة على الصرف',
    voteReject: 'رفض الصرف',
    voteAbstain: 'امتناع',
    voteReason: 'ملاحظات التصويت...',
    votingDeadline: 'الموعد النهائي للتصويت',

    // Projects & Tasks
    projectBoard: 'لوحة متابعة المشاريع والمهام',
    columnTodo: 'قيد الانتظار',
    columnInProgress: 'جاري العمل',
    columnInReview: 'مراجعة واعتماد',
    columnDone: 'مكتمل',
    priorityUrgent: 'عاجل جداً',
    priorityHigh: 'أولوية عالية',
    priorityMedium: 'أولوية متوسطة',
    priorityLow: 'منخفضة',
    assignee: 'المسؤول',
    dueDate: 'تاريخ الاستحقاق',

    // Daily Reports
    dailyReportTitle: 'تقارير الإنجاز اليومية',
    accomplishments: 'ما تم إنجازه اليوم',
    nextSteps: 'الخطوات القادمة غداً',
    blockers: 'المعوقات والتحديات (إن وجدت)',
    submittedAt: 'وقت الإرسال',
    statusSubmitted: 'تم الإرسال',

    // Language Toggle
    switchLang: 'English',
  },
  en: {
    // Brand & General
    brandName: 'FEKRA AI',
    tagline: 'Company Operating System & Executive Workspace',
    oneCompany: 'One Company • One Workspace • Complete Operational Visibility',
    searchPlaceholder: 'Search projects, tasks, transactions...',

    // Navigation
    navDashboard: 'Dashboard',
    navPartners: 'Founding Partners',
    navBusinessUnits: 'Business Units',
    navDepartments: 'Departments',
    navProjects: 'Projects',
    navTasks: 'Tasks & Kanban',
    navDailyReports: 'Daily Reports',
    navWorkLogs: 'Work Logs',
    navFinance: 'Finance & Treasury',
    navExpenseApprovals: 'Expense Approvals (4-Partner)',
    navDecisions: 'Partner Decisions & Votes',
    navAuditLogs: 'Audit Logs & Security',
    navSettings: 'Settings',

    // Dashboard Widgets
    totalProjects: 'Total Projects',
    activeProjects: 'Active Projects',
    completedTasks: 'Completed Tasks',
    overdueTasks: 'Overdue Tasks',
    pendingApprovals: 'Pending Approvals',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Approved Expenses',
    netCashFlow: 'Net Cash Flow',
    currencyEGP: 'EGP',

    // Partner Governance
    equalPartnership: 'Founding Partner Governance (4 Equal Partners, 25% each)',
    unanimousRule: 'Mandatory Unanimous Rule: Expense approval requires 4 out of 4 partner approvals. Any rejection rejects the expense.',
    partnerApprovalStatus: 'Expense Approval Status',
    votesCast: 'Votes Cast',
    unanimousApprovedBadge: 'Unanimously Approved (4/4)',
    rejectedBadge: 'Rejected',
    pendingVoteBadge: 'Awaiting Partner Votes',
    castVoteAs: 'Cast vote as:',
    voteApprove: 'Approve Expense',
    voteReject: 'Reject Expense',
    voteAbstain: 'Abstain',
    voteReason: 'Vote remarks / comments...',
    votingDeadline: 'Voting Deadline',

    // Projects & Tasks
    projectBoard: 'Projects & Tasks Kanban Board',
    columnTodo: 'To Do',
    columnInProgress: 'In Progress',
    columnInReview: 'In Review',
    columnDone: 'Done',
    priorityUrgent: 'Urgent',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    assignee: 'Assignee',
    dueDate: 'Due Date',

    // Daily Reports
    dailyReportTitle: 'Daily Accomplishment Reports',
    accomplishments: 'Accomplishments Today',
    nextSteps: 'Next Steps Tomorrow',
    blockers: 'Blockers / Challenges',
    submittedAt: 'Submitted At',
    statusSubmitted: 'Submitted',

    // Language Toggle
    switchLang: 'العربية (RTL)',
  },
};
