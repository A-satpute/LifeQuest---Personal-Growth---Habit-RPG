export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface GoalMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  status: GoalStatus;
  progress: number;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  metrics?: GoalMetrics;
}

export interface CreateGoalPayload {
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  startDate: string;
  endDate?: string | null;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string | null;
  category?: string;
  priority?: Priority;
  status?: GoalStatus;
  startDate?: string;
  endDate?: string | null;
}
