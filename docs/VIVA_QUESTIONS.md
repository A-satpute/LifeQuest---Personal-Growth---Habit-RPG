# 🎓 LifeQuest — Viva Voce Preparation Guide & Technical Defense

This guide provides comprehensive, technically precise answers to anticipated questions for final-year engineering defense, external examiner reviews, and technical viva voce examinations.

---

## 📌 1. General & Domain Questions

### Q1: What is LifeQuest?
**Answer:**  
LifeQuest is a full-stack personal self-improvement and routine tracking web application that incorporates Role-Playing Game (RPG) mechanics and Artificial Intelligence. It translates daily real-world activities—such as exercise, study, work, and wellness routines—into RPG character experience points (XP), attribute progression, streak tracking, level advancements, and visual avatar evolution, while offering an AI Goal Architect to synthesize ambitious goals into structured, executable milestones.

---

### Q2: What core problem does LifeQuest solve?
**Answer:**  
Traditional productivity applications and to-do lists suffer from exceptionally high user abandonment rates (often over 80% within the first 30 days) due to the lack of immediate feedback loops and long feedback delays between daily effort and eventual real-world rewards.  
LifeQuest solves this through:
1. **Immediate Dopaminergic Feedback:** Providing immediate XP, level progression, and attribute feedback upon task completion.
2. **Cognitive Load Reduction:** Decomposing overwhelming long-term goals into bite-sized daily task instances using an AI Goal Architect.
3. **Accountability & Consistency:** Implementing streak protection, date-isolated task instances, and smart notifications to prevent fatigue and habit decay.

---

### Q3: Why did you choose this project for your final year?
**Answer:**  
1. **Technical Depth:** It spans complex distributed full-stack challenges: complex relational data modeling, idempotent recurrence scheduling, atomic transaction management, strict multi-tenant authorization, client-side state caching, and external AI provider integration with fallback resilience.
2. **Architectural Discipline:** It requires a clean separation of concerns across layered architectures (Express controllers, domain services, type-safe ORM persistence) and solving difficult edge cases like timezone-aware recurrence and duplicate notification prevention.
3. **Societal Relevance:** It tackles digital wellness and productivity burnout using ethical gamification rather than predatory dark patterns.

---

## 🏗️ 2. Architectural Design & Technology Stack

### Q4: Why React for the frontend?
**Answer:**  
- **Component-Based Modularity:** React allows modular decomposition into re-usable UI components (e.g., `TaskCard`, `ActivityHeatmap`, `CharacterAvatar`, `StatBar`).
- **Declarative State & Reactivity:** Real-time updates to XP bars, level badge unlocks, and toast notifications occur declaratively without manual DOM manipulation.
- **Rich Ecosystem & Tooling:** Using React 19 with Vite provides instantaneous Hot Module Replacement (HMR) and optimized Tree-Shaken production bundles under 350 KB.

---

### Q5: Why Node.js & Express for the backend?
**Answer:**  
- **End-to-End TypeScript:** Sharing TypeScript types across frontend and backend eliminates impedance mismatch and contract drift between client and server.
- **Asynchronous Non-Blocking I/O:** Ideal for handling concurrent I/O-bound operations such as external AI API streaming, database queries, and scheduled notification tasks.
- **Maturity & Middleware Pipeline:** Express offers fine-grained control over middleware execution order: CORS $\rightarrow$ JSON parsing $\rightarrow$ JWT authentication $\rightarrow$ Zod validation $\rightarrow$ Service execution $\rightarrow$ Centralized error handling.

---

### Q6: Why PostgreSQL instead of MongoDB or another NoSQL database?
**Answer:**  
- **Relational Integrity & Foreign Keys:** LifeQuest has deeply relational data: `User` $\rightarrow$ `Goal` $\rightarrow$ `Task` $\rightarrow$ `TaskInstance` $\rightarrow$ `XPTransaction`. Relational foreign keys with `ON DELETE CASCADE` prevent orphaned records.
- **ACID Transactions:** Financial-grade consistency is required when awarding XP: writing an `XPTransaction`, updating `Character` level, updating `CharacterStats`, and unlocking `UserAchievement` must happen atomically within an isolated transaction.
- **Compound Unique Constraints:** Essential for idempotency (e.g., `@@unique([taskId, date])` and `@@unique([userId, achievementId])`). In NoSQL, preventing duplicate writes across concurrent requests requires complex distributed locking.

---

### Q7: Why Prisma ORM?
**Answer:**  
- **End-to-End Type Safety:** Prisma generates TypeScript client bindings directly from `schema.prisma`. Any database schema change results in compile-time type errors in service code before runtime bugs can occur.
- **Declarative Migrations:** Automatic migration history and tracking with `prisma migrate` or rapid prototyping with `prisma db push`.
- **Query Optimization & Safety:** Automatically parameterizes SQL queries, eliminating SQL injection vulnerabilities.

---

### Q8: Why REST API over GraphQL or gRPC?
**Answer:**  
- **Predictable HTTP Semantics:** Standard HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`) and status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`) provide an intuitive, standard contract for web browsers.
- **Native Browser Compatibility:** Direct compatibility with standard browser APIs (`fetch`) without requiring heavy client runtime libraries.
- **Simplicity of Multi-Tenant Security:** In REST, endpoint route handlers cleanly enforce tenant isolation at the service boundary using the decoded JWT `req.user.id`.

---

## 🗄️ 3. Database & Data Modeling

### Q9: Why are Task Instances required instead of treating recurring tasks as a single record?
**Answer:**  
If a recurring task (e.g., "Morning Jog") were stored as a single row with a `completed: boolean` flag:
1. Checking it off on Monday would overwrite Sunday's historical completion status.
2. Historical completion rates, streaks, and calendar heatmaps would be impossible to calculate because past dates lack individual audit records.
3. Notifications could not differentiate whether the task was missed today or missed 3 days ago.

**Solution:** LifeQuest uses a two-tier pattern:
- **`Task`**: The persistent blueprint/template defining title, frequency, category, and priority.
- **`TaskInstance`**: Concrete date-specific execution row containing `taskId`, `date` (`YYYY-MM-DD`), `completed: boolean`, and `completedAt: timestamp`.  
A compound unique constraint `@@unique([taskId, date])` guarantees exactly one instance exists per task per day.

---

### Q10: How are recurring tasks generated and queried?
**Answer:**  
When a user requests their tasks for date $D$:
1. The backend queries active `Task` templates for the user where $D$ falls between `startDate` and optional `endDate`.
2. The recurrence rule (`DAILY`, `WEEKLY`, `CUSTOM`) is evaluated against the day of week of $D$.
3. If eligible, the backend performs an **idempotent upsert**: if a `TaskInstance` already exists for $(taskId, D)$, it returns it; if not, it automatically seeds a new pending `TaskInstance` for that date.
4. This on-demand lazy instantiation prevents database bloat from pre-generating thousands of future dates while ensuring historical data remains immutable.

---

### Q11: How is strict multi-tenant data isolation enforced in the database queries?
**Answer:**  
Data isolation is enforced at the database query level, never trusted from the client:
1. The authenticated user's ID is extracted exclusively from the cryptographically verified JWT payload (`req.user.id`).
2. Every Prisma query includes an explicit `where: { userId }` clause:
   ```typescript
   await prisma.goal.findFirst({ where: { id: goalId, userId: req.user.id } });
   ```
3. For child entities (e.g. `TaskInstance`), ownership is verified through relational joins (`task: { userId: req.user.id }`).
4. If an entity exists but belongs to another user, the server returns a `404 Not Found` or `403 Forbidden`, preventing enumeration attacks.

---

## 🎮 4. Gamification & Progression Mechanics

### Q12: How is XP calculated and awarded?
**Answer:**  
XP is calculated by a centralized `GamificationService` using deterministic rules:
- **Base Task XP:** Based on priority: `LOW` = 10 XP, `MEDIUM` = 15 XP, `HIGH` = 25 XP.
- **Goal-Linked Multiplier:** Completing a task linked to an active goal awards a +10 XP bonus.
- **Daily Completion Bonus:** Completing all scheduled tasks for a day awards a +50 XP bonus.
- **Streak Milestone Bonus:** Maintaining active streaks awards tiered bonuses (e.g. +100 XP at 7 days).

Every award creates an immutable row in `XPTransaction` (`userId`, `amount`, `reason`, `taskId`). If a user unchecks a task, an inverse negative transaction (`amount: -25`, `reason: TASK_UNCOMPLETED`) is recorded, preventing infinite XP farming exploits.

---

### Q13: What is the Level calculation formula?
**Answer:**  
LifeQuest uses a square-root progression curve:
$$\text{Level} = \left\lfloor \sqrt{\frac{\text{Total XP}}{25}} \right\rfloor + 1$$

- Level 1: 0 – 24 XP
- Level 2: 25 – 99 XP
- Level 3: 100 – 224 XP
- Level 4: 225 – 399 XP
- Level 5: 400 – 624 XP

This quadratic XP requirement ensures early levels are achieved quickly to hook the user, while higher levels demand sustained long-term consistency.

---

### Q14: How does character attribute progression and evolution work?
**Answer:**  
1. **5 Core Attributes:** `Strength` (Fitness), `Knowledge` (Learning), `Discipline` (Habits/Routines), `Focus` (Work/Productivity), and `Consistency` (Mindfulness/Streaks).
2. **Category Mapping:** Each task category directly increments its corresponding attribute in the `CharacterStat` table upon completion.
3. **Visual Stage Evolution:** The avatar evolves through 5 distinct tiers based on overall Level:
   - Tier 1: *Novice Adventurer* (Lv 1–4)
   - Tier 2: *Apprentice Pioneer* (Lv 5–9)
   - Tier 3: *Skilled Pathfinder* (Lv 10–19)
   - Tier 4: *Veteran Champion* (Lv 20–29)
   - Tier 5: *Ascended Legend* (Lv 30+)

---

### Q15: How are streaks calculated?
**Answer:**  
1. The user record maintains `currentStreak`, `longestStreak`, and `lastCompletedDate`.
2. When a task is completed on local date $D$:
   - If `lastCompletedDate == D`: Streak is unchanged (already active today).
   - If `lastCompletedDate == D - 1`: Streak increments by $+1$. If `currentStreak > longestStreak`, `longestStreak` is updated.
   - If `lastCompletedDate < D - 1`: The user missed one or more days; `currentStreak` resets to $1$.
3. When uncompleting tasks: if all tasks for date $D$ become incomplete, the streak rolls back to its state on $D - 1$.

---

## 🔔 5. Smart Notification System

### Q16: How do date-specific notifications work?
**Answer:**  
A notification is uniquely bound to a specific `(taskInstanceId, date)` tuple.
- On Day 1: If Task Instance 101 is pending at the scheduled reminder time, an alert is dispatched and recorded in the database with `type: TASK_REMINDER` and `entityId: taskInstance.id`.
- On Day 2: The background scheduler evaluates Day 2's new Task Instance 102. Day 1's pending status is completely ignored and will never fire a duplicate alert.

---

### Q17: How are duplicate notifications prevented?
**Answer:**  
Duplicate prevention uses a two-phase check:
1. **Database Existence Check:** Before creating a notification, the scheduler checks:
   ```typescript
   const existing = await prisma.notification.findFirst({
     where: { userId, type: 'TASK_REMINDER', entityId: taskInstance.id }
   });
   if (existing) return; // Idempotent skip
   ```
2. **Atomic Insert:** Combined with indexing on `(userId, entityId, type)`, this prevents race conditions if multiple workers run concurrently.

---

### Q18: Why is backend scheduling used instead of pure browser notifications?
**Answer:**  
1. **Device Independence:** Browser timers (`setTimeout` or service workers) die if the tab or browser is closed.
2. **Persistent Audit History:** In-app notifications must be stored in the database so users can view unread notifications across devices, on mobile browsers, or when logging in from a different computer.
3. **Browser Notifications as Progressive Enhancement:** The backend is the source of truth; if the user grants browser notification permission, the client shows desktop toasts via the Web Notifications API as an optional enhancement.

---

## 🤖 6. Artificial Intelligence Architecture

### Q19: How does the AI Goal Architect generate roadmaps?
**Answer:**  
1. **User Input:** The user provides an open-ended goal (e.g., "Prepare for GRE exam in 3 months") and parameters (difficulty, weekly hours).
2. **System Prompt Formulation:** The backend constructs an engineering prompt instructing the Google Gemini model to return a strictly compliant JSON schema.
3. **Schema Validation:** The raw AI string is parsed and validated using a **Zod schema** (`AiRoadmapSchema`). If fields are malformed or missing, the validation fails gracefully.
4. **Fallback Mechanism:** If the external AI service is unreachable, has high latency, or exhausts API quota, the backend activates a built-in domain fallback engine that generates grounded, high-quality roadmaps algorithmically.

---

### Q20: Why must AI NOT directly modify user progress or database records?
**Answer:**  
- **Human-in-the-Loop Principle:** AI is non-deterministic and can hallucinate impractical tasks or absurd schedules.
- **User Agency & Customization:** The user must be able to review, adjust milestones, toggle optional tasks, and edit deadlines in an interactive preview before anything commits to the database.
- **Architectural Isolation:** AI services should remain pure advisors. Allowing external LLM outputs to directly write to `XPTransaction`, `Character`, or complete tasks would create severe security vulnerabilities and data corruption risks.

---

### Q21: How are AI API keys protected?
**Answer:**  
1. The Gemini API key is stored exclusively in server-side environment variables (`GEMINI_API_KEY`).
2. The client frontend has zero knowledge of the key; it only communicates with our backend endpoint (`/api/ai/plan-goal`).
3. The API key is loaded via `dotenv` and omitted from version control via `.gitignore`.

---

## 🔒 7. Security & Authentication

### Q22: How is password storage secured?
**Answer:**  
Passwords are never stored in plaintext. They are hashed using **bcrypt** with a work factor (salt rounds) of 12. Bcrypt incorporates an automatic cryptographic salt and is resistant to rainbow table lookups and GPU-accelerated brute-force attacks.

---

### Q23: How does JWT authentication work and how is session state managed?
**Answer:**  
1. On successful login or registration, the server signs a JSON Web Token using HMAC SHA-256 (`HS256`) containing the claims: `{ userId, email }`.
2. The token has an expiration timestamp (`7d`).
3. The client stores the token in `localStorage` and transmits it in the HTTP `Authorization: Bearer <token>` header on subsequent requests.
4. The backend `auth.middleware.ts` verifies the signature using `JWT_SECRET`. If valid, it attaches `req.user` to the request pipeline.
5. Invalid or expired tokens receive an immediate `401 Unauthorized` response.

---

### Q24: How do you prevent Horizontal Privilege Escalation (Insecure Direct Object References - IDOR)?
**Answer:**  
IDOR occurs when an attacker modifies an ID in an API call (e.g. `DELETE /api/goals/5`) to alter another user's resource.  
In LifeQuest, every mutating query joins on the authenticated `userId`:
```typescript
const deleted = await prisma.goal.deleteMany({
  where: { id: goalId, userId: req.user.id }
});
if (deleted.count === 0) throw new AppError('Goal not found or access denied', 404);
```
An attacker cannot affect any record not owned by their verified JWT identity.

---

## 📊 8. Analytics & Heatmap Engine

### Q25: How is the 52-week activity heatmap computed?
**Answer:**  
1. The client requests heatmap data for a 365-day rolling window.
2. The backend queries `TaskInstance` grouped by `date`:
   ```typescript
   const completions = await prisma.taskInstance.groupBy({
     by: ['date'],
     where: { task: { userId }, completed: true, date: { gte: oneYearAgo } },
     _count: { id: true }
   });
   ```
3. Count frequencies are normalized into 5 discrete visual intensity tiers:
   - Level 0: 0 completions (dark/dim cell)
   - Level 1: 1–2 completions
   - Level 2: 3–4 completions
   - Level 3: 5–6 completions
   - Level 4: 7+ completions
4. The client renders an SVG/CSS grid organized into 52 columns (weeks) and 7 rows (Sunday–Saturday).

---

### Q26: What is the authoritative source of truth for user metrics?
**Answer:**  
- **Completed Tasks:** Count of `TaskInstance` records with `completed: true`.
- **XP Volume:** Sum of `amount` in `XPTransaction` (or the cached accumulator on `User.xp`, which matches the ledger sum).
- **Goal Progress:** Ratio of completed task instances to total scheduled task instances for all tasks linked to that goal.
- **Badges:** Records in `UserAchievement` joined with canonical `Achievement` definitions.

---

### Q27: How are timezones handled between client and server?
**Answer:**  
1. The server operates internally in UTC for system timestamps (`createdAt`, `updatedAt`, `completedAt`).
2. Calendar business dates are formatted as ISO strings (`YYYY-MM-DD`).
3. When calculating "today" or daily reminders, the client's local timezone (e.g. `Intl.DateTimeFormat().resolvedOptions().timeZone` or the user's stored `timezone` preference) is used to project UTC moments into the user's local midnight-to-midnight window.

---

## ⚡ 9. Scalability & Future Architecture

### Q28: How would you scale LifeQuest to handle 100,000 active daily users?
**Answer:**  
1. **Stateless Web Tier:** The Express backend is completely stateless (JWT authentication). Multiple instances can run behind an Nginx or AWS Application Load Balancer with zero session stickiness required.
2. **Database Read Replicas & Connection Pooling:** Use Prisma Accelerate or PgBouncer to manage PostgreSQL connection pools, routing read queries (Analytics, Heatmap, History) to read-replicas.
3. **Redis Caching:** Cache frequently read, slow-to-compute data such as user profile summaries, leaderboards, and achievement definitions using Redis with a 5-minute TTL.
4. **CDN for Static Assets:** Deliver the compiled React/Vite assets via Cloudflare or AWS CloudFront edge servers.

---

### Q29: How would you improve the notification scheduler for production scale?
**Answer:**  
Currently, the scheduler runs as an in-process `setInterval` or cron loop suitable for single-instance setups.  
For enterprise scale:
1. **Distributed Job Queue:** Transition to **BullMQ** or **Temporal** backed by Redis.
2. **Partitioned Workers:** Separate web request servers from worker processes so heavy background calculations do not block the HTTP event loop.
3. **Web Push & Mobile APNs:** Integrate Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs) for native mobile and OS-level delivery when the browser is closed.
