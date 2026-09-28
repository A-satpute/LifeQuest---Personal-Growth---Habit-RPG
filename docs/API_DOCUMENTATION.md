# 📡 LifeQuest — REST API Specification

All API endpoints are hosted under `/api`. All endpoints except `/api/auth/register`, `/api/auth/login`, and `/api/health` require a valid JWT Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication & User Profile (`/api/auth`, `/api/users`)

### 1.1 Register New User
* **Method**: `POST`
* **Endpoint**: `/api/auth/register`
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Alex Vance"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Alex Vance",
        "role": "USER"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
* **Errors**: `400 Bad Request` (Validation error), `409 Conflict` (Email already registered).

### 1.2 User Login
* **Method**: `POST`
* **Endpoint**: `/api/auth/login`
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "name": "Alex Vance" },
      "token": "eyJhbGciOi..."
    }
  }
  ```
* **Errors**: `401 Unauthorized` (Invalid email or password).

### 1.3 Get Current Authenticated Profile
* **Method**: `GET`
* **Endpoint**: `/api/auth/me`
* **Authentication**: Required (`Bearer JWT`)
* **Success Response (200 OK)**: Returns user record and linked character summary.

### 1.4 Update User Profile
* **Method**: `PUT`
* **Endpoint**: `/api/users/profile`
* **Authentication**: Required
* **Request Body**: `{ "name": "Alex", "bio": "Adventurer", "timezone": "Asia/Kolkata" }`

---

## 2. Goal Management (`/api/goals`)

### 2.1 List All Goals
* **Method**: `GET`
* **Endpoint**: `/api/goals`
* **Authentication**: Required
* **Query Parameters**:
  * `status`: Optional filter (`ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`).
* **Success Response (200 OK)**: Array of goal objects with dynamically computed `progress` percentages.

### 2.2 Create Goal
* **Method**: `POST`
* **Endpoint**: `/api/goals`
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "title": "Master React & TypeScript",
    "description": "Build high-performance web applications.",
    "category": "Learning",
    "priority": "HIGH",
    "startDate": "2026-09-26",
    "endDate": "2026-12-31"
  }
  ```
* **Success Response (201 Created)**: Returns the newly created goal record.

### 2.3 Update Goal / Status
* **Method**: `PUT /api/goals/:id` or `PATCH /api/goals/:id/status`
* **Authentication**: Required
* **Request Body**: `{ "status": "COMPLETED" }`

### 2.4 Delete Goal
* **Method**: `DELETE`
* **Endpoint**: `/api/goals/:id`
* **Authentication**: Required
* **Success Response (200 OK)**: `{ "success": true, "message": "Goal deleted successfully" }`

---

## 3. Tasks & Task Instances (`/api/tasks`)

### 3.1 Get Today's Tasks
* **Method**: `GET`
* **Endpoint**: `/api/tasks/today`
* **Authentication**: Required
* **Query Parameters**:
  * `date`: Optional client date string (`YYYY-MM-DD`). Defaults to server/user local date.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-09-26",
      "stats": {
        "total": 3,
        "completed": 1,
        "pending": 2,
        "completionPercentage": 33
      },
      "tasks": [ ... ]
    }
  }
  ```

### 3.2 Create Task (One-Off or Recurring Template)
* **Method**: `POST`
* **Endpoint**: `/api/tasks`
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "title": "Gym Resistance Training",
    "category": "Fitness",
    "priority": "HIGH",
    "goalId": "optional-goal-uuid",
    "taskDate": "2026-09-26",
    "isRecurring": true,
    "recurrenceType": "SELECTED_DAYS",
    "recurrenceDays": [1, 3, 5]
  }
  ```
* **Success Response (201 Created)**: Returns created parent template and initial materialized instance.

### 3.3 Toggle Task Completion (The Gamification Hook)
* **Method**: `PATCH`
* **Endpoint**: `/api/tasks/instances/:id/toggle`
* **Authentication**: Required
* **Request Body**: `{ "completed": true }` (optional boolean; toggles if omitted).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task completed!",
    "data": {
      "instance": { "id": "uuid", "completed": true, "completedAt": "..." },
      "goalProgress": 50,
      "gamification": {
        "xpAwarded": 45,
        "currentStreak": 3,
        "leveledUp": false,
        "dailyBonusAwarded": false,
        "unlockedAchievements": []
      }
    }
  }
  ```

### 3.4 Delete Task Instance
* **Method**: `DELETE`
* **Endpoint**: `/api/tasks/instances/:id`
* **Authentication**: Required
* **Success Response (200 OK)**: `{ "success": true, "message": "Task instance deleted" }`

---

## 4. Gamification & Character RPG (`/api/gamification`, `/api/character`)

### 4.1 Get Gamification Profile
* **Method**: `GET`
* **Endpoint**: `/api/gamification/profile` or `/api/character/profile`
* **Authentication**: Required
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "character": {
        "level": 3,
        "totalXP": 320,
        "currentStreak": 4,
        "longestStreak": 7,
        "stage": "Developing"
      },
      "stats": {
        "strength": 22,
        "knowledge": 28,
        "discipline": 25,
        "focus": 20,
        "consistency": 20
      },
      "levelInfo": {
        "currentLevel": 3,
        "xpInCurrentLevel": 95,
        "xpRequiredForNextLevel": 125,
        "progressPercentage": 76
      }
    }
  }
  ```

---

## 5. Smart Notifications (`/api/notifications`)

### 5.1 List In-App Notifications
* **Method**: `GET`
* **Endpoint**: `/api/notifications`
* **Authentication**: Required
* **Query Parameters**:
  * `unreadOnly`: `true` | `false`
  * `limit`: `1-100` (default 50)
* **Success Response (200 OK)**: Returns notification list and unread count.

### 5.2 Get Unread Count
* **Method**: `GET`
* **Endpoint**: `/api/notifications/unread-count`
* **Authentication**: Required
* **Success Response (200 OK)**: `{ "success": true, "data": { "unreadCount": 2 } }`

### 5.3 Mark As Read / Mark All Read
* **Method**: `PATCH /api/notifications/:id/read` or `PATCH /api/notifications/mark-all-read`
* **Authentication**: Required

### 5.4 Update Notification Preferences
* **Method**: `PUT`
* **Endpoint**: `/api/notifications/preferences`
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "notificationTime": "21:00",
    "timezone": "America/New_York",
    "browserNotifications": true
  }
  ```

---

## 6. AI Goal Architect (`/api/ai`)

### 6.1 Generate Goal Roadmap Blueprint
* **Method**: `POST`
* **Endpoint**: `/api/ai/architect`
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "prompt": "I want to master React and build modern web apps in 3 months",
    "category": "Learning",
    "skillLevel": "Beginner",
    "availableTimePerDay": 60,
    "daysPerWeek": 5
  }
  ```
* **Success Response (201 Created)**: Returns structured `AiPlan` in `DRAFT` state with milestones, phases, and task suggestions.

### 6.2 Regenerate with Custom Guidance
* **Method**: `POST`
* **Endpoint**: `/api/ai/regenerate`
* **Authentication**: Required
* **Request Body**: `{ "planId": "uuid", "guidanceNotes": "Focus more on Next.js" }`

### 6.3 Accept and Materialize AI Roadmap
* **Method**: `POST`
* **Endpoint**: `/api/ai/accept`
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "planId": "uuid",
    "goalTitle": "Master React Development",
    "category": "Learning",
    "priority": "HIGH",
    "selectedTasks": [ ... ]
  }
  ```
* **Success Response (201 Created)**: Creates the real `Goal`, creates tasks, and materializes initial `TaskInstance` records in PostgreSQL.

### 6.4 Get Daily AI Suggestions
* **Method**: `GET`
* **Endpoint**: `/api/ai/daily-suggestions`
* **Authentication**: Required
* **Success Response (200 OK)**: Grounded daily recommendations analyzing today's tasks and active streaks.

---

## 7. Analytics & History (`/api/analytics`)

### 7.1 Analytics Overview
* **Method**: `GET`
* **Endpoint**: `/api/analytics/overview`
* **Authentication**: Required
* **Query Parameters**:
  * `range`: `'7d' | '30d' | '90d' | 'year' | 'all'` (default `'30d'`)
  * `timezone`: Optional string (e.g., `'Asia/Kolkata'`)
* **Success Response (200 OK)**: Aggregated task completion rates, XP velocity, streaks, RPG stats, and badge rates.

### 7.2 Activity Heatmap
* **Method**: `GET`
* **Endpoint**: `/api/analytics/activity`
* **Authentication**: Required
* **Success Response (200 OK)**: 52-week activity matrix with intensity levels 0–4.

### 7.3 Filterable Task History
* **Method**: `GET`
* **Endpoint**: `/api/analytics/history`
* **Authentication**: Required
* **Query Parameters**:
  * `startDate`, `endDate`, `status` (`all` | `completed` | `pending`), `goalId`, `category`.

---

## 8. Achievements (`/api/achievements`)

### 8.1 List All Achievements with Progress
* **Method**: `GET`
* **Endpoint**: `/api/achievements`
* **Authentication**: Required
* **Success Response (200 OK)**: List of all 10 badges showing unlock status, unlocked date, and numerical progress ($x/y$).

### 8.2 Explicit Evaluation Check
* **Method**: `POST`
* **Endpoint**: `/api/achievements/evaluate`
* **Authentication**: Required
* **Success Response (200 OK)**: `{ "success": true, "newlyUnlocked": [ ... ] }`

---

## 9. System Health Check (`/api/health`)

* **Method**: `GET`
* **Endpoint**: `/api/health`
* **Authentication**: None (Public)
* **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "database": "connected (PostgreSQL)",
    "timestamp": "2026-09-26T04:40:06.402Z",
    "uptime": 124.5
  }
  ```
