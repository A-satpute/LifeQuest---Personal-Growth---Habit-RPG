# 📊 LifeQuest — Final Year Capstone Project Presentation Deck Outline

**Project Title:** LifeQuest — Personal Growth & Habit RPG  
**Domain:** Full-Stack Web Engineering, Applied AI, Gamification Systems  
**Slides Count:** 20 Slides  
**Target Audience:** Board of Examiners, Project Committee, Technical Evaluators  

---

## Slide 1: Title Slide
- **Title:** LifeQuest: Gamified Self-Improvement & Habit Tracking System
- **Subtitle:** Engineering a Full-Stack RPG Habit Formation Platform with Applied AI Assistance
- **Student Details:** [Candidate Name / Registration Number / Department]
- **Supervisor / Guide:** [Faculty Guide Name / Designation]
- **Academic Institution:** [Department of Computer Science & Engineering / College Name]
- **Academic Year:** 2025–2026

---

## Slide 2: Problem Statement
- **The Modern Habit Formation Crisis:**
  - High initial enthusiasm followed by rapid habit decay (the "January effect").
  - Over 80% of users abandon conventional to-do list applications within 30 days.
  - Lack of immediate positive feedback loops for repetitive daily effort.
- **Cognitive Overload in Goal Planning:**
  - High-level ambitions (e.g. "Become a Full-Stack Engineer", "Run a Marathon") are often too vague to translate into actionable daily habits.
- **Notification Fatigue:**
  - Repetitive, generic notifications lead to notification blindness and app uninstalls.

---

## Slide 3: Proposed Solution
- **The LifeQuest Paradigm:**
  - Merges psychological habit loops (Cue $\rightarrow$ Routine $\rightarrow$ Reward) with Role-Playing Game (RPG) mechanics.
  - Translates real-world tasks into Experience Points (XP), Character Attribute advancements, and Avatar Evolution.
  - Integrates an **AI Goal Architect** to decompose abstract goals into structured weekly phases and daily task instances.
  - Employs a **Date-Specific Recurrence Engine** with idempotent task instances and smart notification deduplication.

---

## Slide 4: Project Objectives
- **Core Engineering Goals:**
  1. Build a high-performance, responsive Single-Page Application (SPA) using React 19, TypeScript, and Tailwind CSS.
  2. Implement a secure, layered Node.js / Express backend with strict multi-tenant data isolation.
  3. Design a normalized relational PostgreSQL schema enforcing ACID transactions and zero-data-loss cascade rules.
  4. Develop a deterministic RPG progression engine (XP calculation, streak rules, leveling curves, and attribute mapping).
  5. Architect an AI roadmap synthesis pipeline with schema validation and offline fallback resilience.
  6. Deliver comprehensive visual analytics: 52-week activity heatmap, completion ratios, and historical calendar audit logs.

---

## Slide 5: Key Features Overview
- **Authentication & Security:** Stateless JWT, bcrypt hashing (12 rounds), tenant-scoped queries.
- **Goal & Routine Management:** Long-term goals linked to daily, weekly, and custom recurring tasks.
- **Task Instance Engine:** On-demand date-isolated instantiation with compound unique indexing.
- **Gamification Suite:** Multi-tier XP calculation, streak protection, 5 RPG stats, and 10 milestone achievements.
- **AI Goal Architect:** Natural language goal input $\rightarrow$ Structured Zod-validated roadmap $\rightarrow$ User preview & edit.
- **Real-Time Analytics:** 52-week GitHub-style commit heatmap, XP trend graphs, and completion percentage donuts.
- **Smart Notifications:** Task-instance bound reminders without repeated stale alerts.

---

## Slide 6: System Architecture
- **Layered 3-Tier Enterprise Pattern:**
  - **Client Tier:** React 19 SPA, Tailwind CSS, Lucide Icons, React Router, Context API state management.
  - **Application Tier:** Node.js + Express REST API with modular routers, Zod validation, JWT middleware, domain services, and centralized error handling.
  - **Persistence Tier:** PostgreSQL relational database managed by Prisma ORM client with parameterized queries.
  - **External Integrations:** Google Gemini Generative AI API with deterministic architectural fallback templates.

---

## Slide 7: Database Design & Relational Schema
- **Entity Relationship Highlights (10 Core Models):**
  - `User`: Root tenant holding credentials, timezone, XP accumulator, level, and streak counters.
  - `Goal` $\rightarrow$ `Task` $\rightarrow$ `TaskInstance`: 3-tier hierarchy separating strategy, templates, and executions.
  - `XPTransaction`: Immutable financial-grade audit ledger for XP awards and reversals.
  - `Character` & `CharacterStat`: RPG avatar configuration and 5 core skill metrics.
  - `Notification`: In-app alert queue bound to specific entities and users.
  - `Achievement` & `UserAchievement`: Canonical badge definitions and user claim records.
- **Integrity Constraints:** Compound unique constraints `@@unique([taskId, date])` and `@@unique([userId, achievementId])`.

---

## Slide 8: Authentication & Security Architecture
- **Zero-Trust Identity Flow:**
  - Password hashed on registration using bcrypt with 12 salt rounds.
  - Cryptographically signed JWT issued on authentication (HMAC SHA-256).
  - Client stores token in secure memory/storage and passes Bearer header.
  - Backend `auth.middleware.ts` extracts and validates token payload.
  - **Strict Principle:** The client `userId` is never trusted. All database operations strictly filter by verified `req.user.id`.

---

## Slide 9: Goal & Task Instance Management
- **The Template vs. Instance Pattern:**
  - **The Problem:** Storing recurring habits as a single boolean row destroys historical audit logs and streak calculation.
  - **The Solution:** The `Task` record acts as a reusable blueprint. A `TaskInstance` is generated for each specific calendar date (`YYYY-MM-DD`).
  - **Lazy Materialization:** Instances are generated idempotently on-demand when requested by the client, avoiding database bloat while maintaining historical fidelity.

---

## Slide 10: Gamification & Progression Mechanics
- **Deterministic XP Formula:**
  - Priority Tier: `LOW` (+10 XP), `MEDIUM` (+15 XP), `HIGH` (+25 XP).
  - Goal Attachment Bonus (+10 XP) and Daily Completion Bonus (+50 XP).
- **Non-Linear Leveling Curve:**
  $$\text{Level} = \left\lfloor \sqrt{\frac{\text{Total XP}}{25}} \right\rfloor + 1$$
- **Streak Calculation Engine:**
  - Evaluates local calendar date diffs ($D - \text{lastCompletedDate}$).
  - Increments on consecutive days, maintains on same day, resets to 1 if a day is skipped.
  - Handles complete rollbacks if tasks are unchecked.

---

## Slide 11: Character RPG System & Visual Evolution
- **5 Core Real-World Attributes:**
  - **Strength:** Fed by Physical Fitness & Sports tasks.
  - **Knowledge:** Fed by Reading, Research & Academic tasks.
  - **Discipline:** Fed by Morning Routines, Chores & Habitual tasks.
  - **Focus:** Fed by Deep Work, Coding & Study sessions.
  - **Consistency:** Fed by Meditation, Streaks & Wellness.
- **Stage Evolution Tiers:**
  - Level 1–4: *Novice Adventurer*
  - Level 5–9: *Apprentice Pioneer*
  - Level 10–19: *Skilled Pathfinder*
  - Level 20–29: *Veteran Champion*
  - Level 30+: *Ascended Legend*

---

## Slide 12: Smart Notification Architecture
- **Date-Specific Notification Rules:**
  - A notification is tied to an explicit `(taskInstanceId, date)` coordinate.
  - Pending notifications on Date $D$ are dispatched once.
  - On Date $D+1$, Date $D$'s alerts are never re-sent, preventing alert spam.
- **Delivery Channels:**
  - Primary: In-app Notification Center stored in PostgreSQL.
  - Progressive Enhancement: Optional Web Notifications API for browser desktop popups.

---

## Slide 13: AI Goal Architect & Daily Advisor
- **Human-in-the-Loop AI Pipeline:**
  1. User inputs goal statement + difficulty + time budget.
  2. Backend prompts Google Gemini with strict JSON schema instructions.
  3. Response parsed and validated against `AiRoadmapSchema` (Zod).
  4. Interactive client preview allows user to edit milestones and toggle tasks.
  5. User explicitly approves plan $\rightarrow$ Backend creates Goal and Task entities.
  6. **Resilience:** Built-in domain fallback generator activates if external API is unreachable.

---

## Slide 14: Analytics, Heatmap & Achievement Engine
- **Visual Performance Proof:**
  - **52-Week Activity Heatmap:** 365-day rolling matrix grouped by completion density (Levels 0–4).
  - **Completion Rate Metrics:** Accurate calculation over 7-day, 30-day, and all-time windows.
  - **XP Trend Line Chart:** Chronological accumulation graph.
- **Achievement System:**
  - 10 milestone badges (First Step, 7-Day Warrior, Centurion, Goal Crusher, etc.).
  - Evaluated asynchronously upon task completion; unlocked badges recorded with timestamps.

---

## Slide 15: Technology Stack Summary
| Tier | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Fast Single-Page Application & Component UI |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive glassmorphic dark-theme design |
| **Backend** | Node.js, Express.js, TypeScript | Layered RESTful API & Domain Services |
| **ORM** | Prisma Client & Migrations | Type-safe database queries & schema management |
| **Database** | PostgreSQL | ACID-compliant relational persistence |
| **Validation** | Zod | Runtime schema validation for requests & AI outputs |
| **AI Engine** | Google Gemini API | Structured goal decomposition & daily advice |

---

## Slide 16: Verification, Testing & Quality Assurance
- **Comprehensive Test Suites (134 / 134 Automated Tests Passed):**
  - Phase 1: Authentication & User Isolation (10 / 10)
  - Phase 2: Goal Lifecycle & Recurrence Engine (15 / 15)
  - Phase 3: Gamification, XP Ledger & Streaks (30 / 30)
  - Phase 4: Date-Specific Smart Notifications (40 / 40)
  - Phase 5: AI Goal Architect & Fallback Logic (12 / 12)
  - Phase 6: Analytics Aggregations & Achievements (27 / 27)
- **Production Build Status:**
  - Backend: `npm run build` $\rightarrow$ 0 TypeScript compilation errors.
  - Frontend: `npm run build` $\rightarrow$ 0 bundling errors, optimized Vite chunking.

---

## Slide 17: Results & Demonstration Highlights
- **Functional Achievements:**
  - Full-stack end-to-end integration running with sub-50ms API response times.
  - Zero-drift client-server TypeScript types.
  - Seamless live demonstration flow: Login $\rightarrow$ Dashboard $\rightarrow$ Task Tick $\rightarrow$ Real-time Toast $\rightarrow$ AI Roadmap $\rightarrow$ Analytics Heatmap $\rightarrow$ Achievement Unlocks.
  - High aesthetic satisfaction: cohesive dark-mode RPG styling with high-contrast accessibility.

---

## Slide 18: Honest Technical Limitations
- **External AI Latency & Rate Limits:** Relies on third-party cloud LLM APIs (mitigated by automated fallback).
- **Browser Notification Permissions:** Web Notification API requires explicit user permission; does not function if browser is closed (no mobile APNs/FCM yet).
- **Single-Node In-Memory Scheduler:** Periodic notification checker runs within the Node.js process rather than a distributed Redis task queue.
- **Offline Mode:** The application currently requires an active network connection (no PWA Service Worker caching).

---

## Slide 19: Future Scope & Roadmap
- **Production Enhancements:**
  1. **Distributed Job Queue:** Integrate BullMQ and Redis for distributed background workers.
  2. **Mobile Applications:** Port UI to React Native or Flutter using the existing REST API.
  3. **Social & Guilds:** Co-op party quests, shared accountability challenges, and friends leaderboards.
  4. **Native Push Notifications:** Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM).
  5. **Wearable Integration:** Sync physical fitness tasks with Apple Health and Google Health Connect.

---

## Slide 20: Conclusion & Acknowledgments
- **Project Summary:**
  - LifeQuest proves that integrating RPG game mechanics and intelligent AI decomposition into daily productivity software creates engaging, sustainable self-improvement habits.
  - Built with modern software engineering best practices: strict typing, modular layered architecture, relational integrity, and automated testing.
- **Acknowledgments:**
  - Special thanks to our project supervisor, department faculty, and open-source software communities.
- **Q&A Session:** Open for evaluation and questions.
