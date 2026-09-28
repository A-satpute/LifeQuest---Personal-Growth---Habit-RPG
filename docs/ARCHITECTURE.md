# 🏛️ LifeQuest — System Architecture Specification

## 1. High-Level System Overview

LifeQuest is built using a decoupled, multi-tier client-server architecture designed for reliability, strict data isolation, high responsiveness, and verifiable real-time gamification.

```
                              ┌──────────────────────────────────────────┐
                              │               CLIENT TIER                │
                              │       React 19 + TypeScript + Vite       │
                              │   Tailwind CSS • Lucide Icons • Toasts   │
                              └─────────────────────┬────────────────────┘
                                                    │ HTTPS / JSON REST API
                                                    │ Bearer JWT in Header
                                                    ▼
                              ┌──────────────────────────────────────────┐
                              │            APPLICATION TIER              │
                              │       Express.js + TypeScript (Node)     │
                              ├──────────────────────────────────────────┤
                              │ • Security & Auth Middlewares (JWT)      │
                              │ • Zod Schema Request Validation Engine   │
                              │ • Domain Services & Business Logic       │
                              │ • Recurrence Materialization Engine      │
                              │ • Gamification & Character RPG Engine    │
                              │ • Google Gemini AI Goal Architect        │
                              │ • Smart Notification Scheduler           │
                              │ • Centralized Analytics & History Engine │
                              │ • Achievement Rules Evaluator            │
                              └─────────────────────┬────────────────────┘
                                                    │ Prisma Client (ORM)
                                                    ▼
                              ┌──────────────────────────────────────────┐
                              │             PERSISTENCE TIER             │
                              │        PostgreSQL Database Engine        │
                              │   Relational Tables & Compound Indexes   │
                              └──────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (React 19 + TypeScript)

The frontend is constructed using modern React principles emphasizing type safety, optimistic UI updates, and an engaging dark-mode glassmorphic design system:

* **State & Context Management**:
  * `AuthContext`: Manages user authentication state, token persistence in `localStorage`, and automated logout upon 401 token invalidation.
  * `ToastContext`: A centralized reactive notification stack providing real-time RPG feedback (reward sounds/animations, `+XP` badges, streak updates, level-ups, badge unlocks).
* **Navigation Architecture**:
  * Dual-mode navigation: Desktop sticky sidebar + Mobile bottom navigation bar (`MobileBottomNav`) prioritizing the 5 essential screens (Home, Tasks, Goals, Hero Hub, Analytics) with a collapsible menu drawer.
* **Component Layering**:
  * `components/layout/`: Responsive shells, navigation bars, and drawers.
  * `components/analytics/`: Interactive 52-week activity heatmap, completion trend charts, and XP volume charts.
  * `components/character/`: Dynamic avatar visualizer, stage badge indicators, and 5-stat RPG bars.
  * `components/goals/`: Goal progress cards and modal forms with date validation.
  * `components/tasks/`: Task item cards, one-click checkboxes, and recurring day pickers.
  * `components/notifications/`: In-app notification bell, counter, and unread management popover.

---

## 3. Backend Architecture (Node.js + Express + TypeScript)

The backend follows the clean **Layered Architecture Pattern**, strictly separating transport, validation, business rules, and persistence:

1. **Routing Layer (`src/routes/`)**: Mounts REST endpoints and attaches required middlewares.
2. **Middleware Layer (`src/middlewares/`)**:
   * `requireAuth`: Verifies JWT bearer token, extracts payload, and injects `req.user = { id, email, role }`.
   * `validateBody`: Parses and validates request bodies against Zod schemas before execution.
   * `errorHandler`: Centralized error filter converting application exceptions into consistent JSON error responses.
3. **Controller Layer (`src/controllers/`)**: Handles request parameters, HTTP headers, and status code dispatching.
4. **Service Layer (`src/services/`)**: Encapsulates all domain logic:
   * `AuthService`: Password hashing (bcrypt 12 rounds), login verification, JWT token issuance.
   * `GoalService`: Goal CRUD, milestone tracking, and status transitions.
   * `TaskService`: Materializes recurring tasks into date-specific instances, handles checkbox toggles.
   * `GamificationService`: Atomic transactions awarding XP, updating streaks, leveling up, and evolving characters.
   * `AiGoalService`: Calls Google Gemini API, validates structured outputs, and previews roadmaps.
   * `NotificationService` & `NotificationScheduler`: Timezone-aware pending task evaluation and delivery.
   * `AnalyticsService`: Date-range metrics, completion rates, and historical logs.
   * `AchievementService`: Rule evaluation, badge unlocking, and notification dispatching.
5. **Persistence Layer (`src/db/prisma.ts`)**: Type-safe Prisma ORM communicating with PostgreSQL.

---

## 4. Authentication & Security Architecture

* **Stateless JWT**: Sessions use cryptographic JSON Web Tokens signed with HS256 and an expiring TTL (default `7d`).
* **Zero Trust for Client Identity**: The frontend `userId` is never trusted. Every single query and mutation derives `userId` exclusively from the verified JWT token (`req.user.id`).
* **Cross-Tenant Data Isolation**: All database queries enforce `where: { userId }`. Attempts to access another user's resources return `404 Not Found` rather than `403 Forbidden` to prevent resource enumeration attacks.
* **Password Security**: Passwords must contain a minimum of 8 characters with at least one letter and one number, hashed using `bcryptjs` with 12 salt rounds.

---

## 5. Task Instance Architecture: Template vs. Instance

Traditional todo applications treat a task as a single database row, which fails for recurring habits. If a task "Workout" is repeated daily, marking it completed today either overwrites yesterday's status or requires destructive edits.

LifeQuest implements a **Hybrid Template-Instance Architecture**:

```
                       ┌────────────────────────────────────────┐
                       │             Task (Template)            │
                       │  • title: "45-Min Resistance Workout"  │
                       │  • isRecurring: true                   │
                       │  • recurrenceType: SELECTED_DAYS       │
                       │  • recurrenceDays: [1, 3, 5] (M, W, F) │
                       └───────────────────┬────────────────────┘
                                           │ Materialization Engine
                                           ▼
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│  TaskInstance   │               │  TaskInstance   │               │  TaskInstance   │
│ • date: Monday  │               │ • date: Wed     │               │ • date: Friday  │
│ • completed: true│              │ • completed: false              │ • completed: false
│ • XP: 45        │               │ • XP: 0         │               │ • XP: 0         │
└─────────────────┘               └─────────────────┘               └─────────────────┘
```

### Why Task Instances are Essential:
1. **Accurate Streak Calculation**: A streak requires verifying that *every* scheduled instance on date $D$ was completed before advancing the counter.
2. **Immutable Historical Records**: Past days retain their exact completion state, enabling reliable retrospective analytics.
3. **Date-Specific Notifications**: Alerts can be dispatched for a specific date's instance without repeating if future instances exist.
4. **Idempotent Materialization**: An index constraint `@@unique([taskId, taskDate])` guarantees that recurring templates materialize at most once per calendar date.

---

## 6. Gamification & Progression Architecture

The gamification engine translates discipline into tangible RPG character growth:

```
User Checks Task
       │
       ▼
TaskInstance Marked Completed
       │
       ▼
Atomic Transaction (Prisma $transaction):
  ├── 1. Calculate XP: Base + Priority Multiplier + Goal Task Bonus
  ├── 2. Create Immutable XPTransaction Record
  ├── 3. Increment Character.totalXP and Character.currentXP
  ├── 4. Evaluate Level Curve: Level = floor(sqrt(totalXP / 25)) + 1
  ├── 5. Check Level-Up & Stage Progression (Beginner -> Developing -> Disciplined -> Advanced -> Master)
  ├── 6. Update Character RPG Stats:
  │      • Fitness   -> Strength
  │      • Learning  -> Knowledge
  │      • Routine   -> Discipline
  │      • Career    -> Focus
  │      • Health    -> Consistency
  ├── 7. Evaluate Daily Completion Bonus (+25 XP if all daily tasks are done)
  └── 8. Check Active Habit Streak (increments if yesterday was active; maintains momentum)
       │
       ▼
Post-Transaction Hooks:
  ├── Recalculate Connected Goal Progress %
  ├── Trigger AchievementService.evaluateAchievements()
  └── Dispatch Rewarding Client Toast
```

---

## 7. Smart Notification Architecture

LifeQuest enforces a date-specific notification policy to eliminate duplicate alerts:

* **The Core Rule**:
  * An incomplete task instance on Date $D$ triggers a single consolidated notification on Date $D$.
  * Subsequent scheduler runs on Date $D$ detect existing alerts and exit idempotently.
  * When Date $D+1$ arrives, Date $D$ tasks are **never** re-notified. Date $D+1$ evaluates only Date $D+1$ instances.
* **Architecture Flow**:
  1. `NotificationScheduler` runs on a configurable interval (default every 60 seconds).
  2. Resolves each user's local calendar date using their configured timezone (`America/New_York`, `Asia/Kolkata`, etc.).
  3. Checks notification preferences (`notificationTime`, `emailNotifications`, `browserNotifications`).
  4. Queries pending task instances for today's local date.
  5. Inserts an in-app `Notification` record with `@@unique([userId, targetDate, type])` protecting against duplicate inserts.
  6. Dispatches to browser Push/Notification API if permission has been granted.

---

## 8. AI Goal Architect Architecture

The AI module serves as an expert planning assistant without taking administrative control away from the user:

```
User Input ("Learn React in 3 months")
                 │
                 ▼
Express /api/ai/architect Endpoint
                 │
                 ▼
AiGoalService -> Google Gemini API
                 │
                 ▼
Raw LLM Response JSON
                 │
                 ▼
Zod Schema Validation (Enforces milestones, tasks, difficulty, daysPerWeek)
                 │
                 ▼
Store as AiPlan (status: "DRAFT")
                 │
                 ▼
Client Interactive Preview
(User can edit title, customize tasks, toggle tasks ON/OFF)
                 │
                 ▼
User Accepts Plan
                 │
                 ▼
AiGoalService.acceptPlan()
  ├── Creates Real Goal in PostgreSQL
  ├── Materializes Selected Tasks
  └── Generates Initial Task Instances for Today
```

* **Safety Principle**: AI generation creates *draft blueprints*. AI cannot directly award XP, modify character stats, or complete tasks; real progression only occurs when the user completes materialized tasks.

---

## 9. Analytics & History Architecture

All analytics are aggregated on-demand from primary database tables:

* **Completion Rate**: $\text{Completed Task Instances} / \text{Total Eligible Task Instances} \times 100$.
* **XP Analytics**: Sourced from the immutable `XPTransaction` ledger.
* **Streak Analytics**: Read from the active `Character` record.
* **Activity Heatmap**: 52-week matrix aggregated from `TaskInstance.completedAt` mapped to local calendar days with intensity levels 0 to 4.
* **Timezone Safety**: Dates are formatted with ISO-8601 strings and resolved using `Intl.DateTimeFormat` against the user's timezone before grouping.

---

## 10. Achievement Engine Architecture

* **Decoupled Evaluator**: Achievements are evaluated dynamically through `AchievementService.evaluateAchievements(userId)`.
* **Rules Evaluated**:
  * Total tasks completed (`FIRST_STEP`, `GETTING_STARTED`, `TASK_MASTER`).
  * Continuous streak days (`CONSISTENT_7`, `DEDICATED_30`).
  * RPG Level milestones (`LEVEL_5`, `LEVEL_10`).
  * Finished goals (`GOAL_CRUSHER`).
  * Cumulative XP earned (`XP_HUNTER`, `XP_CHAMPION`).
* **Duplicate Prevention**: Guaranteed by PostgreSQL compound unique index `@@unique([userId, achievementId])` on `UserAchievement`.
* **Notification Integration**: Unlocks immediately generate an in-app `ACHIEVEMENT` notification and client toast.
