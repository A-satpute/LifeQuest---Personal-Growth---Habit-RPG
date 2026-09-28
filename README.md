# 🛡️ LifeQuest — Gamified Self-Improvement & Habit RPG

> **Final-Year Engineering Project • Full-Stack Web Application**  
> *Production-Ready Gamified Goal & Routine System with AI Architect, Real-Time Analytics, RPG Progression, and Smart Notifications.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20API-orange.svg?logo=google)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-134%2F134%20Passing-brightgreen.svg)]()

---

## 📚 1. Project Overview

**LifeQuest** is an enterprise-grade, gamified goal and habit progression system designed to solve the chronic dropout rate associated with traditional productivity tools. By translating daily discipline into classic RPG progression, character evolution, actionable AI roadmaps, and verifiable real-time analytics, LifeQuest turns personal self-improvement into an engaging hero journey.

### ❓ Problem Statement
Traditional to-do apps and habit trackers suffer from an industry-wide abandonment rate of over 80% within the first 30 days. The root causes are:
1. **Feedback Delay:** The lag between daily effort and real-world results leaves users demoralized.
2. **Cognitive Overload:** Abstract long-term goals lack concrete day-to-day actionable steps.
3. **Notification Blindness:** Generic, repeated alerts cause notification fatigue and app uninstalls.

### 🎯 Objectives
- **Immediate Gamified Feedback:** Provide instant XP, level scaling, and RPG attribute advancements upon task completion.
- **AI-Powered Decomposition:** Translate high-level ambitions into structured weekly phases and daily task instances using Google Gemini.
- **Date-Specific Habit Architecture:** Use a robust template-to-instance pattern preventing duplicate notifications and preserving historical audit logs.
- **Measurable Progress Visualization:** Provide an authentic 52-week activity heatmap, completion ratios, and historical inspection.

---

## 📂 2. Comprehensive Documentation Directory

All technical specifications, defense guides, and architectural diagrams are organized in the [`docs/`](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs) folder:

| Document | Description |
|---|---|
| 📖 [**Technical Architecture Document**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/ARCHITECTURE.md) | In-depth breakdown of client, server, domain services, and progression pipelines. |
| 🗄️ [**Database ER Diagram & Dictionary**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/DATABASE_ERD.md) | Mermaid ER diagram, data dictionary for all 10 tables, and compound unique constraints. |
| 🔌 [**REST API Documentation**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/API_DOCUMENTATION.md) | Complete endpoints, request/response bodies, query params, and status codes. |
| 🎓 [**Viva Voce Preparation & Q&A**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/VIVA_QUESTIONS.md) | 29 in-depth questions and answers covering architecture, database, AI, security, and scalability. |
| 🎬 [**Evaluation Live Demo Script**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/DEMO_SCRIPT.md) | Step-by-step 7–10 minute demonstration flow for examiners and presentations. |
| 📊 [**Presentation Deck Outline**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/PRESENTATION_OUTLINE.md) | 20-slide final-year project presentation structure. |
| 📸 [**Screenshot Checklist**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/SCREENSHOT_CHECKLIST.md) | Inventory of all 18 standard screenshots required for the project report. |
| 🧪 [**Test Verification Report**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/TESTING_REPORT.md) | Automated test execution matrix showing 134/134 verified tests passing. |
| 🚀 [**Production Deployment Guide**](file:///c:/Users/ashish/OneDrive/Desktop/LifeQuest%20%E2%80%94%20Personal%20Growth%20&%20Habit%20RPG/docs/DEPLOYMENT_GUIDE.md) | Cloud architecture, managed PostgreSQL, Docker, and environment configuration. |

---

## ✨ 3. Feature Inventory

### 🔐 Authentication & Security
- User registration, login, and logout.
- Passwords hashed with bcrypt (12 salt rounds).
- Stateless JWT authentication with strict tenant-scoped database queries (`where: { userId }`).
- Protected frontend client routes with automatic session restoration.

### 🎯 Goal Management
- Lifecycle states: `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`.
- Category tagging, priority weighting, and target deadline tracking.
- Dynamic progress calculation derived from completed task instances.

### 📝 Task & Recurrence System
- **Template vs. Instance Pattern:** Decouples recurring templates from date-specific executions.
- Recurrence modes: `DAILY`, `WEEKLY`, and `CUSTOM` selected days.
- On-demand lazy instantiation with compound unique constraint `@@unique([taskId, date])`.
- Atomic completion toggling with execution timestamps.

### 🎮 RPG Gamification Suite
- **Centralized XP Engine:** Deterministic awards (+10 to +25 XP by priority, +10 for goal link, +50 daily bonus).
- **Immutable XP Ledger:** Reversible `XPTransaction` records preventing double XP exploits.
- **Level Scaling:** Quadratic progression formula $\text{Level} = \lfloor\sqrt{\text{Total XP}/25}\rfloor + 1$.
- **5 Character RPG Attributes:** `Strength`, `Knowledge`, `Discipline`, `Focus`, and `Consistency`.
- **Visual Avatar Evolution:** 5 tiers from *Novice Adventurer* to *Ascended Legend*.
- **Streak Engine:** Consecutive day tracking with automatic rollback on task uncheck.

### 🔔 Smart Notification System
- Date-specific alerts strictly tied to discrete `(taskInstanceId, date)` coordinates.
- Prevention of duplicate alerts on the same date and no repeated stale alerts on subsequent days.
- In-app Notification Center with unread counter, read/unread states, and progressive browser alerts.

### 🤖 AI Goal Architect & Daily Advisor
- Natural language goal input synthesized into structured JSON roadmaps.
- Strict runtime validation using Zod (`AiRoadmapSchema`).
- Interactive user preview and customization before database commitment (human-in-the-loop).
- Built-in deterministic fallback engine for offline or quota-exceeded resilience.
- Context-aware daily suggestions card based on real active streaks and goals.

### 📊 Real-Time Analytics & Achievements
- 52-week GitHub-style activity heatmap with 5 green intensity tiers (0–4).
- 7-day, 30-day, and all-time completion ratios and XP volume graphs.
- Filterable historical calendar audit log.
- 10 milestone achievements with idempotent unlock evaluations and celebratory toast alerts.

---

## 🛠️ 4. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express.js, TypeScript.
- **Database & ORM:** PostgreSQL, Prisma ORM.
- **Validation:** Zod schemas.
- **AI Engine:** Google Gemini Generative AI API (with built-in offline fallback).
- **Security:** bcryptjs, jsonwebtoken, CORS.

---

## 🏗️ 5. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      Client Tier                       │
                    │               React 19 + TypeScript + Vite             │
                    │       Tailwind CSS • React Router • Lucide Icons       │
                    │        Toast Context • Mobile Bottom Navigation        │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API (Bearer JWT)
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                    Application Tier                    │
                    │               Express.js + TypeScript (Node.js)        │
                    ├────────────────────────────────────────────────────────┤
                    │ • CORS & Body Parser Middlewares                       │
                    │ • Zod Schema Request Validation Middleware             │
                    │ • JWT Authentication & Tenant Isolation Middleware     │
                    │ • Gamification & Character RPG Engine                  │
                    │ • Smart Timezone-Aware Notification Scheduler          │
                    │ • Google Gemini AI Goal Architect & Daily Advisor      │
                    │ • Analytics Aggregation & Historical Query Engine      │
                    │ • Achievement Rule Evaluation & Idempotency Filter     │
                    │ • Centralized Exception & AppError Handler             │
                    └───────────────────────────┬────────────────────────────┘
                                                │ Type-Safe ORM
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   Data & Persistence                   │
                    │                 PostgreSQL Database Engine             │
                    │                      Prisma ORM Client                 │
                    │      Users • Goals • Tasks • TaskInstances • Characters│
                    │     CharacterStats • XPTransactions • Notifications    │
                    │             Achievements • UserAchievements            │
                    └────────────────────────────────────────────────────────┘
```

---

## 📁 6. Project Structure

```
LifeQuest — Personal Growth & Habit RPG/
├── client/                                 # Frontend Web App (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/                  # ActivityHeatmap, CompletionChart, XpChart
│   │   │   ├── character/                  # CharacterAvatar, CharacterCard, StatBar
│   │   │   ├── common/                     # ProtectedRoute
│   │   │   ├── dashboard/                  # DailyAiSuggestionsCard
│   │   │   ├── goals/                      # GoalCard, GoalFormModal
│   │   │   ├── layout/                     # AppLayout, Navbar, Sidebar, MobileBottomNav
│   │   │   ├── notifications/              # NotificationCenter, NotificationItem
│   │   │   ├── tasks/                      # TaskCard, TaskCheckbox, TaskFormModal
│   │   │   └── ui/                         # ProgressBar, Badge, Modal
│   │   ├── context/                        # AuthContext, ToastContext
│   │   ├── pages/                          # Dashboard, Goals, Tasks, Character, Analytics, etc.
│   │   ├── services/                       # API service layer (auth, goals, tasks, etc.)
│   │   └── types/                          # TypeScript DTOs and entity models
├── server/                                 # Backend Web API (Node.js + Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma                   # Complete relational database schema
│   │   └── seed.ts                         # Rich development and demo seeding script
│   └── src/
│       ├── config/                         # XP rules, Level curve, Achievement definitions
│       ├── controllers/                    # Express request controllers
│       ├── db/                             # Prisma client instance & local DB runner
│       ├── middlewares/                    # Authentication, validation, and error handling
│       ├── routes/                         # Express REST API routes
│       ├── schemas/                        # Zod runtime validation schemas
│       ├── services/                       # Business logic (gamification, AI, analytics, etc.)
│       └── test-*.ts                       # Automated integration test suites (Phases 1–6)
├── docs/                                   # Complete Final-Year Technical Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_ERD.md
│   ├── API_DOCUMENTATION.md
│   ├── VIVA_QUESTIONS.md
│   ├── DEMO_SCRIPT.md
│   ├── PRESENTATION_OUTLINE.md
│   ├── SCREENSHOT_CHECKLIST.md
│   ├── TESTING_REPORT.md
│   └── DEPLOYMENT_GUIDE.md
└── README.md                               # Master Project Overview
```

---

## ⚡ 7. Installation & Quick Start

### Prerequisites
- **Node.js** (v18 or higher recommended; v20+ tested)
- **npm** (v9+)
- PostgreSQL Database (local or cloud)

### Step 1: Clone and Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/lifequest?schema=public"
JWT_SECRET="super_secret_jwt_key_change_in_production"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"

# Optional: Google Gemini API Key for AI Goal Architect & Daily Coach
GEMINI_API_KEY="your_gemini_api_key_here"

# Notifications
NOTIFICATION_SCHEDULER_ENABLED=true
```

### Step 3: Run Database Migrations & Seed Demo Data
```bash
cd server

# Synchronize schema with database
npm run prisma:push

# Seed demo hero account with pre-populated goals, tasks, XP, and badges
npm run prisma:seed
```

### Step 4: Run Application in Development
Open two terminal windows:
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 8. Automated Test Execution

All 6 automated test suites (134 tests) can be run from the `server` directory:

```bash
cd server

npm test             # Phase 1: Authentication & Tenant Security (10/10)
npm run test:phase2  # Phase 2: Goals, Tasks & Recurrence Engine (15/15)
npm run test:phase3  # Phase 3: Gamification, XP Ledger & Streaks (30/30)
npm run test:phase4  # Phase 4: Smart Date-Specific Notifications (40/40)
npm run test:phase5  # Phase 5: AI Goal Architect & Fallbacks (12/12)
npm run test:phase6  # Phase 6: Analytics, History & Achievements (27/27)
```

---

## 🚀 9. Production Build

```bash
# Build Backend TypeScript to /dist
cd server
npm run build

# Build Frontend Vite Assets to /dist
cd client
npm run build
```

---

## 🦸 10. Demo Credentials

For live evaluations and presentation:
- **Email:** `hero@lifequest.com`
- **Password:** `HeroPassword123!`
- *(Or click the 1-Click **"Demo Hero"** button on the `/login` page)*

---

## 📜 11. Academic Attribution
Created for Academic Engineering Degree Final-Year Capstone Project. Built using standard TypeScript, React 19, Node.js, PostgreSQL, and Google Gemini API.
