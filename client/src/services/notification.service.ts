import { request } from './api';
import type {
  NotificationItem,
  NotificationPreference,
  NotificationListResponse,
  NotificationStatus,
} from '../types/notification';

export class NotificationClientService {
  static async getNotifications(params: {
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());

    const res = await request<{ success: boolean; data: NotificationListResponse }>(
      `/notifications?${query.toString()}`
    );
    return res.data;
  }

  static async getUnreadCount(): Promise<number> {
    const res = await request<{ success: boolean; data: { unreadCount: number } }>(
      '/notifications/unread-count'
    );
    return res.data.unreadCount;
  }

  static async markAsRead(id: string): Promise<NotificationItem> {
    const res = await request<{ success: boolean; data: NotificationItem }>(
      `/notifications/${id}/read`,
      { method: 'PATCH' }
    );
    return res.data;
  }

  static async markAllAsRead(): Promise<{ success: boolean; markedCount: number }> {
    const res = await request<{ success: boolean; data: { success: boolean; markedCount: number } }>(
      '/notifications/read-all',
      { method: 'PATCH' }
    );
    return res.data;
  }

  static async getPreferences(): Promise<NotificationPreference> {
    const res = await request<{ success: boolean; data: NotificationPreference }>(
      '/notifications/preferences'
    );
    return res.data;
  }

  static async updatePreferences(payload: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const res = await request<{ success: boolean; data: NotificationPreference }>(
      '/notifications/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  }

  static async recordDeliveryAttempt(id: string): Promise<void> {
    await request(`/notifications/${id}/delivery-attempted`, {
      method: 'PATCH',
    }).catch(() => {});
  }

  static async simulateRun(targetDate?: string): Promise<any> {
    const res = await request<{ success: boolean; data: any }>(
      '/notifications/simulate-run',
      {
        method: 'POST',
        body: JSON.stringify({ targetDate }),
      }
    );
    return res.data;
  }
}
