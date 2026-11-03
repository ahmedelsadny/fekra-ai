# FEKRA AI — Company Operating System

> **One Company • One Workspace • Complete Operational Visibility**

Fekra AI is an internal enterprise operating platform engineered to manage the company's full operational lifecycle:
- **Four Equal Founding Partners:** 25% ownership each with equal voting rights.
- **Unanimous Expense Approval:** 4 out of 4 partner approvals are mandatory to approve company expenses.
- **Multiple Business Units & Departments:** Structured organizational isolation.
- **Projects & Tasks:** Per-project chat, tasks with review gates, and project profitability tracking.
- **Meetings & Calls:** Private 1-on-1 chats + a permanent partners group room with real-time video calls (camera, mic & screen-share).
- **Real-time Everything:** Socket.IO — messages, chat rooms and notifications reach every partner's device instantly.
- **Audit Trail:** Every financial / project / task action is permanently recorded (who did what & when).
- **Bilingual Interface:** Full native Arabic (RTL) and English (LTR) support.
- **Design System:** Light "White + Sky Blue" premium theme with `#1E7CF7` accents.
- **Zero Mock Data:** The system starts completely EMPTY — balances at 0, no fake transactions, projects or reports.

---

## 🚀 Deployment (Server)

The full step-by-step server guide lives in **[DEPLOY.md](./DEPLOY.md)** — one command brings up PostgreSQL + API + Web:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- **Web Platform:** `http://<server>:3000`
- **API Backend:** `http://<server>:4000/api/v1`
- **API Swagger Docs:** `http://<server>:4000/docs`
- **Real-time (Socket.IO):** same port as the API (4000)

---

## 🖥️ Local Development (without Docker)

Prerequisites: **Node.js v20+** and a local PostgreSQL on `localhost:5432` (`DATABASE_URL` in `apps/api/.env` — see `.env.example`).

```bash
npm install
npm run db:generate   # generate Prisma client
npm run db:migrate    # sync schema to your local database
npm run db:seed       # seed the 4 founding partners + accounts + categories
npm run dev           # runs Web (3000) + API (4000) together
```

> 💡 If the API is not running, the web app still works in **offline/demo mode** (data stays in the browser) and the Topbar shows a "وضع تجريبي" badge. When the API is reachable, login becomes fully JWT-secured and everything syncs to PostgreSQL.

---

> ⚠️ These are INITIAL passwords — change them right after the first deployment (see DEPLOY.md §7).

---

## 🔒 Mandatory Business Rule: Unanimous 4-Partner Approval

Implemented in `apps/api/src/modules/finance/finance.service.ts` using Prisma interactive transactions:
- Only eligible active partners can vote.
- Exactly 4 active partners are expected.
- **Any single `REJECT`** immediately marks the transaction `REJECTED`.
- **Exactly 4 `APPROVE`** marks the transaction `APPROVED` (and it is deducted from the treasury the same day).
- 3 approvals are not sufficient.
- Abstentions do not count toward approval.
- An immutable audit trail + real-time notification is emitted for each vote cast.

---

## 🧱 Architecture Overview

```text
apps/
├── web/                # Next.js 14 (App Router, Tailwind, RTL-first, Socket.IO client, Jitsi calls)
└── api/                # NestJS 10 modular API
    └── src/modules/
        ├── auth/          # JWT login (argon2)
        ├── partners/       # Partners & ownership
        ├── finance/        # Treasury, deposits, expenses, unanimous 4/4 vote engine
        ├── projects/       # Projects & tasks (with live assignee notifications)
        ├── chat/           # Socket.IO gateway + persistent chat rooms (group / DM / project)
        ├── notifications/  # Persistent + real-time notifications
        └── audit/           # Immutable audit trail

packages/shared-types/  # Enums, DTO contracts & 4-partner governance evaluation
docker-compose.prod.yml # One-command production stack (PostgreSQL + API + Web)
DEPLOY.md               # Full server deployment guide (Arabic)
```

