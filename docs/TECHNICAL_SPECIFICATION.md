# FEKRA AI
## Technical Specification & Engineering Blueprint

**Product:** Fekra AI – Company Operating System  
**Document:** Technical Specification  
**Version:** 1.0.0  
**Status:** Approved for Development  
**Architecture:** Modular Monolith  
**Database:** PostgreSQL  
**Frontend:** Next.js + TypeScript  
**Backend:** NestJS + TypeScript  
**ORM:** Prisma

---

# 1. Product Definition

## 1.1 Product Objective

Fekra AI is an internal business operating platform designed to manage the company's entire operational structure.

The system supports:
- Four equal business partners.
- Multiple business units.
- Multiple departments.
- Employees and managers.
- Projects and tasks.
- Work logs and daily reports.
- Company finances.
- Clients and business opportunities.
- Meetings and decisions.
- Performance analytics.
- Internal notifications.
- Audit trails.

## 1.2 Approved Business Rules

| Rule | Implementation |
|---|---|
| Partners | Exactly four initial partners |
| Ownership | 25% each initially |
| Partner visibility | All partners access all company financial details |
| Expense approval | Unanimous approval from all four partners |
| Employee tracking | Tasks + working hours + daily reports |
| Languages | Arabic and English |
| Currency | Configurable, default EGP |
| Timezone | Configurable, default Africa/Cairo |
| Business units | Multiple |
| Departments | Multiple |
| Employees | Unlimited, subject to infrastructure |
| Architecture | Multi-tenant-ready organization model |

Ownership percentage and voting rights must be stored separately. A future ownership change must not automatically change voting rules.

## 1.3 Out of Scope for MVP

- Payroll calculations.
- Full accounting / double-entry bookkeeping.
- Public customer portal.
- Native mobile applications.
- Advanced AI agent execution.
- Automated bank integrations.
- External payment processing.

---

# 2. System Architecture

## 2.1 High-Level Architecture

```text
                    USERS
                      |
                      v
             NEXT.JS APPLICATION
             --------------------
             Dashboard
             Projects
             Finance
             Team
             Reports
             Settings
                      |
                 HTTPS / REST
                      |
                      v
               NESTJS API
             ----------------
             Auth Module
             Organization
             Partners
             Employees
             Permissions
             Projects
             Tasks
             Work Logs
             Finance
             CRM
             Meetings
             Decisions
             Notifications
             Analytics
             Audit Logs
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
      PostgreSQL    Redis       S3 Storage
          |           |
          |           v
          |        BullMQ
          |           |
          |           v
          |      Background Jobs
          |
          v
       Prisma ORM
```

## 2.2 Repository Structure

Recommended monorepo:

```text
fekra-ai/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── public/
│   │   ├── messages/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       ├── prisma/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── validation/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Use pnpm workspaces to manage the monorepo.

---

# 3. Frontend Technical Specification

## 3.1 Technology Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Application framework |
| React | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| TanStack Query | API state management |
| Zustand | Client-side state |
| React Hook Form | Forms |
| Zod | Validation |
| Recharts | Analytics charts |
| next-intl | Internationalization |
| Lucide | Icons |

## 3.2 Design System

Product identity:

- Brand: FEKRA AI
- Primary theme: Dark Navy.
- Accent: Cyan / Electric Blue.
- Surface: Dark neutral.
- Typography: Inter for English, a suitable Arabic font such as IBM Plex Sans Arabic.
- Style: Modern enterprise SaaS.
- Layout: Sidebar + Topbar + Content.

Required UI capabilities:

1. Dark and Light themes.
2. Arabic RTL.
3. English LTR.
4. Responsive layouts.
5. Loading skeletons.
6. Empty states.
7. Error states.
8. Confirmation dialogs.
9. Toast notifications.
10. Global search.

## 3.3 Frontend Routes

```text
/login
/forgot-password
/accept-invitation

/dashboard
/activity
/calendar

/business-units
/business-units/[id]

/departments
/team
/team/[id]
/partners
/partners/[id]

/projects
/projects/[id]
/projects/[id]/board
/projects/[id]/timeline

/tasks
/tasks/[id]
/my-work

/work-logs
/daily-reports
/reports

/finance
/finance/accounts
/finance/transactions
/finance/expenses
/finance/approvals
/finance/categories

/clients
/clients/[id]
/deals

/meetings
/meetings/[id]
/decisions
/decisions/[id]

/documents
/notifications
/settings
/settings/profile
/settings/organization
/settings/users
/settings/roles
/settings/permissions
/settings/localization

/audit-logs
```

---

# 4. Backend Technical Specification

## 4.1 NestJS Modules

```text
src/
├── main.ts
├── app.module.ts
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── middleware/
│   └── utils/
│
├── config/
│
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── users/
│   ├── invitations/
│   ├── partners/
│   ├── employees/
│   ├── roles/
│   ├── permissions/
│   ├── business-units/
│   ├── departments/
│   ├── projects/
│   ├── tasks/
│   ├── work-logs/
│   ├── daily-reports/
│   ├── milestones/
│   ├── finance/
│   ├── clients/
│   ├── deals/
│   ├── meetings/
│   ├── decisions/
│   ├── files/
│   ├── notifications/
│   ├── reports/
│   ├── analytics/
│   └── audit-logs/
│
└── jobs/
    ├── notifications/
    ├── reports/
    └── reminders/
```

## 4.2 API Standards

Base URL: `/api/v1`

---

# 5. Database Schema & Business Logic

Full schema definition includes:
- Multi-tenancy through `Organization`
- User, `OrganizationMember`, `Partner` (4 equal partners, 25% ownership)
- `Role`, `Permission`, `RolePermission`, `UserRole`
- `BusinessUnit`, `Department`, `Project`, `Task`, `WorkLog`, `DailyReport`
- `FinancialAccount`, `FinancialCategory`, `Transaction`, `TransactionApproval`
- Unanimous 4-partner approval rule for company expenses
- `Client`, `Deal`, `Meeting`, `Decision`, `DecisionVote`
- `Notification`, `StoredFile`, `AuditLog`
