# 🗄️ LifeQuest — Database Schema & Entity-Relationship (ER) Specification

This document provides the complete database design, entity relationships, compound unique constraints, and indexing strategy for the LifeQuest PostgreSQL database managed via Prisma ORM.

---

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o| CHARACTER : "has"
    USER ||--o| NOTIFICATION_PREFERENCE : "configures"
    USER ||--o{ GOAL : "creates"
    USER ||--o{ TASK : "owns"
    USER ||--o{ TASK_INSTANCE : "executes"
    USER ||--o{ XP_TRANSACTION : "earns"
    USER ||--o{ DAILY_BONUS_RECORD : "receives"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AI_PLAN : "generates"
    USER ||--o{ USER_ACHIEVEMENT : "unlocks"

    CHARACTER ||--|| CHARACTER_STAT : "tracks"
    GOAL ||--o{ TASK : "contains"
    GOAL ||--o{ TASK_INSTANCE : "tracks"
    TASK ||--o{ TASK_INSTANCE : "materializes"
    ACHIEVEMENT ||--o{ USER_ACHIEVEMENT : "awarded_via"
    TASK_INSTANCE ||--o{ XP_TRANSACTION : "triggers"

    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role
        string bio
        string avatarUrl
        string timezone
        datetime createdAt
        datetime updatedAt
    }

    CHARACTER {
        string id PK
        string userId FK,UK
        string name
        string title
        int level
        int currentXP
        int totalXP
        int currentStreak
        int longestStreak
        string lastActiveDate
        string stage
        datetime createdAt
        datetime updatedAt
    }

    CHARACTER_STAT {
        string id PK
        string characterId FK,UK
        int strength
        int knowledge
        int discipline
        int focus
        int consistency
        datetime updatedAt
    }

    GOAL {
        string id PK
        string userId FK
        string title
        string description
        string category
        enum priority
        enum status
        int progress
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        string id PK
        string userId FK
        string goalId FK
        string title
        string description
        string category
        enum priority
        boolean isRecurring
        enum recurrenceType
        int_array recurrenceDays
        string dueTime
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
    }

    TASK_INSTANCE {
        string id PK
        string taskId FK
        string userId FK
        string goalId FK
        string title
        string description
        string category
        enum priority
        string taskDate UK_PART
        string dueTime
        boolean completed
        datetime completedAt
        boolean xpAwarded
        int xpEarned
        boolean notificationSent
        datetime notificationSentAt
        datetime createdAt
        datetime updatedAt
    }

    XP_TRANSACTION {
        string id PK
        string userId FK
        string taskInstanceId FK
        int amount
        enum reason
        string description
        datetime createdAt
    }

    NOTIFICATION {
        string id PK
        string userId FK,UK_PART
        string targetDate UK_PART
        enum type UK_PART
        string title
        string message
        enum status
        boolean browserDeliveryAttempted
        datetime createdAt
        datetime updatedAt
    }

    ACHIEVEMENT {
        string id PK
        string key UK
        string title
        string description
        string icon
        string category
        string requirementType
        int requirementValue
        int xpReward
        datetime createdAt
        datetime updatedAt
    }

    USER_ACHIEVEMENT {
        string id PK
        string userId FK,UK_PART
        string achievementId FK,UK_PART
        datetime unlockedAt
    }
```

---

## 2. Table Specifications & Data Dictionary

### 2.1 Table: `users`
Represents an authenticated user account.
* `id` (`UUID`, PK): Unique user identifier.
* `email` (`VARCHAR(255)`, Unique): User login email. Indexed.
* `passwordHash` (`VARCHAR(255)`): Bcrypt hashed password (12 rounds).
* `name` (`VARCHAR(100)`): Display name of the user.
* `role` (`ENUM(Role)`): `USER` or `ADMIN`.
* `timezone` (`VARCHAR(50)`): Default `'UTC'`, configured via preferences.

### 2.2 Table: `characters`
Represents the gamified RPG avatar linked 1:1 to a User.
* `id` (`UUID`, PK): Unique character identifier.
* `userId` (`UUID`, FK, Unique): References `users(id)` with `ON DELETE CASCADE`.
* `level` (`INT`): Current RPG level, calculated as $\lfloor \sqrt{\text{totalXP} / 25} \rfloor + 1$.
* `currentXP` (`INT`): XP earned within current level tier.
* `totalXP` (`INT`): Lifetime cumulative XP earned.
* `currentStreak` (`INT`): Consecutive active days.
* `longestStreak` (`INT`): Historical record streak.
* `stage` (`VARCHAR(50)`): Character evolutionary tier (`Beginner`, `Developing`, `Disciplined`, `Advanced`, `Master`).

### 2.3 Table: `character_stats`
Stores the 5 core RPG attributes linked 1:1 to a Character.
* `characterId` (`UUID`, FK, Unique): References `characters(id)` with `ON DELETE CASCADE`.
* `strength` (`INT`): Increased by `Fitness` tasks.
* `knowledge` (`INT`): Increased by `Learning` tasks.
* `discipline` (`INT`): Increased by `Routine` tasks.
* `focus` (`INT`): Increased by `Career` tasks.
* `consistency` (`INT`): Increased by daily completion momentum.

### 2.4 Table: `goals`
Strategic life objectives owned by a User.
* `id` (`UUID`, PK): Unique goal identifier.
* `userId` (`UUID`, FK): References `users(id)` with `ON DELETE CASCADE`.
* `title` (`VARCHAR(255)`): Goal name.
* `category` (`VARCHAR(50)`): Goal domain (Fitness, Learning, Career, etc.).
* `status` (`ENUM(GoalStatus)`): `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`.
* `progress` (`INT`): Dynamically computed completion percentage ($0\text{--}100$).

### 2.5 Table: `tasks` (Recurring Task Templates)
Parent blueprint for one-off and recurring tasks.
* `id` (`UUID`, PK): Template identifier.
* `isRecurring` (`BOOLEAN`): Flags whether instances repeat.
* `recurrenceType` (`ENUM(RecurrenceType)`): `NONE`, `DAILY`, `WEEKLY`, `SELECTED_DAYS`, `CUSTOM`.
* `recurrenceDays` (`INT[]`): Array of weekdays ($0 = \text{Sunday}, 6 = \text{Saturday}$).

### 2.6 Table: `task_instances` (Date-Specific Concrete Tasks)
The primary operational entity for daily execution.
* `id` (`UUID`, PK): Instance identifier.
* `taskId` (`UUID`, FK): References parent `tasks(id)` with `ON DELETE CASCADE`.
* `userId` (`UUID`, FK): References `users(id)` with `ON DELETE CASCADE`.
* `goalId` (`UUID`, FK, Nullable): Optional reference to connected `goals(id)`.
* `taskDate` (`VARCHAR(10)`): Local calendar date formatted as `YYYY-MM-DD`.
* `completed` (`BOOLEAN`): True if executed; false if pending.
* `xpAwarded` (`BOOLEAN`): True if XP has been credited to prevent double-crediting.
* `xpEarned` (`INT`): Specific XP amount awarded.

### 2.7 Table: `xp_transactions`
Audit ledger tracking every XP credit and debit.
* `id` (`UUID`, PK): Transaction identifier.
* `userId` (`UUID`, FK): References `users(id)` with `ON DELETE CASCADE`.
* `taskInstanceId` (`UUID`, FK, Nullable): References `task_instances(id)` with `ON DELETE SET NULL`.
* `amount` (`INT`): Positive for awards; negative for reversals.
* `reason` (`ENUM(XPReason)`): `TASK_COMPLETED`, `TASK_UNCOMPLETED`, `DAILY_BONUS`, `STREAK_BONUS`, `ACHIEVEMENT_BONUS`.

### 2.8 Table: `notifications`
Date-specific alerts for pending tasks, reminders, and achievements.
* `id` (`UUID`, PK): Notification identifier.
* `userId` (`UUID`, FK): References `users(id)`.
* `targetDate` (`VARCHAR(10)`): The specific calendar date this notification applies to.
* `type` (`ENUM(NotificationType)`): `PENDING_TASK`, `TASK_REMINDER`, `GOAL_MILESTONE`, `ACHIEVEMENT`.
* `status` (`ENUM(NotificationStatus)`): `PENDING`, `SENT`, `READ`, `FAILED`.

### 2.9 Table: `achievements` & `user_achievements`
Badges and milestone achievements.
* `achievements.key` (`VARCHAR(50)`, Unique): Unique identifier (e.g., `FIRST_STEP`, `CONSISTENT_7`).
* `user_achievements`: Join table recording `userId`, `achievementId`, and `unlockedAt`.

---

## 3. Compound Unique Constraints & Business Justification

| Constraint | Table | Business Purpose |
|---|---|---|
| `@@unique([taskId, taskDate])` | `TaskInstance` | **Prevents Duplicate Daily Tasks**: Guarantees that a recurring task template can never materialize more than one instance for any given calendar date. |
| `@@unique([userId, targetDate, type])` | `Notification` | **Guarantees Notification Idempotency**: Prevents the background scheduler from sending multiple pending task alerts for the same user on the same date. |
| `@@unique([userId, achievementId])` | `UserAchievement` | **Prevents Duplicate Badges**: Guarantees that a user can unlock a specific achievement milestone exactly once. |
| `@@unique([userId, date])` | `DailyBonusRecord` | **Prevents Duplicate Daily Bonuses**: Ensures the $+25\text{ XP}$ daily completion bonus is awarded at most once per calendar date. |
| `@@unique([characterId])` | `CharacterStat` | **Enforces 1:1 RPG Stat Profile**: Guarantees each character avatar has exactly one RPG statistics record. |

---

## 4. Indexing Strategy for High Query Performance

* **`TaskInstance` Indexes**:
  * `@@index([userId, taskDate])`: Optimizes `/tasks/today` and daily query views.
  * `@@index([userId, completed, taskDate])`: Accelerates pending task calculations and scheduler queries.
  * `@@index([goalId])`: Enables rapid goal progress recalculation.
* **`XPTransaction` Indexes**:
  * `@@index([userId, createdAt])`: Optimizes time-range XP trend graphs and transaction history audit trails.
  * `@@index([taskInstanceId, reason])`: Enables fast lookup when safely reversing XP upon task uncompletion.
* **`Notification` Indexes**:
  * `@@index([userId, status, createdAt])`: Optimizes the Notification Center unread count query and read/unread sorting.
