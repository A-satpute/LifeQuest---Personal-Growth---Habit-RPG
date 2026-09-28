export type NotificationType =
  | 'PENDING_TASK'
  | 'TASK_REMINDER'
  | 'GOAL_MILESTONE'
  | 'ACHIEVEMENT';

export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';

export interface NotificationItem {
  id: string;
  userId: string;
  taskInstanceId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  targetDate: string; // YYYY-MM-DD
  status: NotificationStatus;
  sentAt: string;
  readAt?: string | null;
  browserDeliveryAttempted: boolean;
  createdAt: string;
  taskInstance?: {
    id: string;
    title: string;
    completed: boolean;
    taskDate: string;
  } | null;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  taskNotificationsEnabled: boolean;
  notificationTime: string; // HH:mm
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}
