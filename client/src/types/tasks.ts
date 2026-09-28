import type { Priority } from './goals';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'SELECTED_DAYS' | 'CUSTOM';

export interface TaskTemplate {
  id: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
}

export interface TaskInstance {
  id: string;
  taskId: string;
  userId: string;
  goalId?: string | null;
  goal?: {
    id: string;
    title: string;
    category: string;
    priority: Priority;
    progress?: number;
  } | null;
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  taskDate: string;
  dueTime?: string | null;
  completed: boolean;
  completedAt?: string | null;
  xpAwarded?: boolean;
  xpEarned?: number;
  task?: TaskTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface TodayStats {
  total: number;
  completed: number;
  pending: number;
  completionPercentage: number;
}

export interface TodayTasksResponse {
  date: string;
  stats: TodayStats;
  tasks: TaskInstance[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  goalId?: string | null;
  category: string;
  priority: Priority;
  taskDate: string;
  dueTime?: string | null;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  endDate?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  goalId?: string | null;
  category?: string;
  priority?: Priority;
  dueTime?: string | null;
  taskDate?: string;
  completed?: boolean;
}

export interface ToggleTaskResponse {
  instance: TaskInstance;
  goalProgress: number | null;
  gamification?: {
    xpAwarded?: number;
    currentStreak?: number;
    longestStreak?: number;
    leveledUp?: boolean;
    newLevel?: number;
    newStage?: string;
    statIncreases?: Record<string, number>;
    dailyBonusAwarded?: boolean;
    unlockedAchievements?: Array<{
      id: string;
      key: string;
      title: string;
      description: string;
      xpReward?: number;
    }>;
  };
}
