import { Priority } from './goals';

export type TimeRange = '7d' | '30d' | '90d' | 'year' | 'all';

export interface AnalyticsOverview {
  range: string;
  startDate: string;
  endDate: string;
  timezone: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  xp: {
    totalEarnedInRange: number;
    lifetimeTotalXP: number;
    currentXP: number;
    currentLevel: number;
    stage: string;
  };
  streak: {
    current: number;
    longest: number;
  };
  character: {
    name: string;
    title: string;
    level: number;
    stage: string;
    stats: {
      strength: number;
      knowledge: number;
      discipline: number;
      focus: number;
      consistency: number;
    } | null;
  };
  goals: {
    active: number;
    completed: number;
    total: number;
  };
  achievements: {
    unlocked: number;
    total: number;
    percentage: number;
  };
}

export interface CompletionTrendItem {
  date: string;
  completed: number;
  pending: number;
  total: number;
  completionRate: number;
}

export interface DailyXpItem {
  date: string;
  xp: number;
  transactionCount: number;
}

export interface XpTransactionHistoryItem {
  id: string;
  amount: number;
  reason: string;
  date: string;
  timestamp: string;
}

export interface ActivityHeatmapDay {
  date: string;
  count: number;
  level: number; // 0, 1, 2, 3, 4
}

export interface ActivityHeatmapData {
  year: number;
  totalCompletedDays: number;
  totalCompletedTasks: number;
  days: ActivityHeatmapDay[];
}

export interface GoalAnalyticsItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  status: string;
  progress: number;
  startDate: string;
  endDate?: string | null;
  taskTemplateCount: number;
  metrics: {
    totalTaskInstances: number;
    completedTaskInstances: number;
    pendingTaskInstances: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AchievementItem {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

export interface AchievementsResponse {
  stats: {
    total: number;
    unlocked: number;
    locked: number;
    completionPercentage: number;
  };
  achievements: AchievementItem[];
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  goalId?: string;
  category?: string;
  status?: 'COMPLETED' | 'PENDING' | 'ALL';
}
