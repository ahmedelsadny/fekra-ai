# FEKRA AI — Company Operating System

> **One Company • One Workspace • Complete Operational Visibility**

Fekra AI is an internal enterprise operating platform engineered to manage the company's full operational lifecycle:
- **Four Equal Founding Partners:** 25% ownership each with equal voting rights.
- **Unanimous Expense Approval:** 4 out of 4 partner approvals are mandatory to approve company expenses.
- **Multiple Business Units & Departments:** Structured organizational isolation.
- **Projects & Kanban:** Multi-stage task lifecycle with review gates.
- **Daily Reports & Work Logs:** Transparent productivity and blocker tracking.
- **Bilingual Interface:** Full native Arabic (RTL) and English (LTR) support.
- **Design System:** Sleek Dark Navy theme (`#060B18`) with Electric Blue / Cyan accents (`#00F0FF`).

---

## 🏗️ Repository Architecture (pnpm Monorepo)

```text
سيستم متابعه شغل/
│
├── apps/
│   ├── web/                     # Next.js 14 App Router, Tailwind CSS, Arabic RTL/English LTR
│   │   ├── src/app/             # Layout & Dashboard page
│   │   ├── src/components/      # 4-Partner Approval Widget, Kanban, Daily Reports, Topbar, Sidebar
│   │   ├── src/context/         # LanguageContext (Arabic/English switcher)
│   │   └── src/translations/    # Bilingual dictionary
│   │
│   └── api/                     # NestJS 10 Modular API
│       ├── prisma/              # schema.prisma & seed.ts (4 Partners, Org, BU, Accounts)
│       └── src/
│           ├── common/          # Global interceptors, filters, guards
│           ├── database/        # PrismaService & PrismaModule
│           └── modules/         # Auth, Partners, Finance (Unanimous Approval Engine)
│
├── packages/
│   └── shared-types/            # Enums, DTO contracts & 4-Partner governance evaluation functions
│
├── docs/
│   └── TECHNICAL_SPECIFICATION.md  # Approved v1.0.0 Specification
│
├── docker-compose.yml           # PostgreSQL 16, Redis 7, MinIO S3
├── pnpm-workspace.yaml          # Monorepo workspaces definition
├── package.json                 # Monorepo scripts
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or higher (`npm install -g pnpm`)
- **Docker**: For local PostgreSQL and Redis

### 2. Start PostgreSQL & Redis
```bash
docker compose up -d
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Database Setup (Prisma)
```bash
# Generate Prisma Client
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Seed 4 Founding Partners, Accounts, Categories & Permissions
pnpm db:seed
```

### 5. Run Applications Concurrently
```bash
pnpm dev
```
- **Web Platform:** [http://localhost:3000](http://localhost:3000)
- **API Backend:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **API Swagger Docs:** [http://localhost:4000/docs](http://localhost:4000/docs)

---

## 🏛️ Initial Seeded Founding Partners (25% Each)

| Partner | Title & Unit | Initial Ownership | Voting Power |
|---|---|---|---|
| **Ahmed Mansour** | Managing Partner & Strategy | 25.00% | 1 Vote (Equal) |
| **Sarah El-Sayed** | Technical Partner & CTO (BU-AI) | 25.00% | 1 Vote (Equal) |
| **Tarek Hassan** | Financial Partner & CFO (FIN-OPS) | 25.00% | 1 Vote (Equal) |
| **Nour Khalil** | Operations Partner & COO (BU-DTC) | 25.00% | 1 Vote (Equal) |

*Default seed password for all initial partners:* `Fekra@2026!`

---

## 🔒 Mandatory Business Rule: Unanimous 4-Partner Approval

Implemented in `apps/api/src/modules/finance/finance.service.ts` using Prisma interactive transactions:
- Only eligible active partners can vote.
- Exactly 4 active partners are expected.
- **Any single `REJECT`** immediately marks the transaction `REJECTED`.
- **Exactly 4 `APPROVE`** marks the transaction `APPROVED`.
- 3 approvals are not sufficient.
- Abstentions do not count toward approval.
- An immutable audit trail is appended for each vote cast.
