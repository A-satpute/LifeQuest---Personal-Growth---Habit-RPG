import { request } from './api';
import type {
  AnalyticsOverview,
  CompletionTrendItem,
  DailyXpItem,
  XpTransactionHistoryItem,
  ActivityHeatmapData,
  GoalAnalyticsItem,
  AchievementsResponse,
  HistoryFilters,
  TimeRange,
} from '../types/analytics';
import type { TaskInstance } from '../types/tasks';

export class AnalyticsService {
  /**
   * Fetches the overall analytics dashboard data
   */
  static async getOverview(range: TimeRange = '30d', timezone?: string): Promise<AnalyticsOverview> {
    const tzParam = timezone ? `&timezone=${encodeURIComponent(timezone)}` : '';
    const res = await request<{ success: boolean; data: AnalyticsOverview }>(
      `/analytics/overview?range=${range}${tzParam}`
    );
    return res.data;
  }

  /**
   * Fetches daily task completion trend points
   */
  static async getCompletion(range: TimeRange = '30d', timezone?: string): Promise<{
    range: string;
    startDate: string;
    endDate: string;
    trends: CompletionTrendItem[];
  }> {
    const tzParam = timezone ? `&timezone=${encodeURIComponent(timezone)}` : '';
    const res = await request<{
      success: boolean;
      data: { range: string; startDate: string; endDate: string; trends: CompletionTrendItem[] };
    }>(`/analytics/completion?range=${range}${tzParam}`);
    return res.data;
  }

  /**
   * Fetches daily XP progression and recent transactions
   */
  static async getXp(range: TimeRange = '30d'): Promise<{
    range: string;
    startDate: string;
    endDate: string;
    dailyXp: DailyXpItem[];
    recentHistory: XpTransactionHistoryItem[];
  }> {
    const res = await request<{
      success: boolean;
      data: {
        range: string;
        startDate: string;
        endDate: string;
        dailyXp: DailyXpItem[];
        recentHistory: XpTransactionHistoryItem[];
      };
    }>(`/analytics/xp?range=${range}`);
    return res.data;
  }

  /**
   * Fetches annual activity heatmap
   */
  static async getHeatmap(year?: number, timezone?: string): Promise<ActivityHeatmapData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (timezone) params.append('timezone', timezone);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await request<{ success: boolean; data: ActivityHeatmapData }>(
      `/analytics/heatmap${query}`
    );
    return res.data;
  }

  /**
   * Fetches goal progress breakdown
   */
  static async getGoals(): Promise<GoalAnalyticsItem[]> {
    const res = await request<{ success: boolean; data: GoalAnalyticsItem[] }>(
      '/analytics/goals'
    );
    return res.data;
  }

  /**
   * Fetches filtered historical task instances
   */
  static async getHistory(filters: HistoryFilters = {}): Promise<TaskInstance[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.goalId) params.append('goalId', filters.goalId);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ success: boolean; count: number; data: TaskInstance[] }>(
      `/analytics/history${query}`
    );
    return res.data;
  }

  /**
   * Fetches all user achievements with progress
   */
  static async getAchievements(): Promise<AchievementsResponse> {
    const res = await request<{ success: boolean; data: AchievementsResponse }>(
      '/achievements'
    );
    return res.data;
  }

  /**
   * Evaluates achievements explicitly
   */
  static async evaluateAchievements(): Promise<any[]> {
    const res = await request<{ success: boolean; newlyUnlocked: any[] }>(
      '/achievements/evaluate',
      { method: 'POST' }
    );
    return res.newlyUnlocked;
  }
  /**
   * Fetches monthly calendar task completion data
   */
  static async getMonthCalendar(year?: number, month?: number): Promise<{
    year: number;
    month: number;
    daysInMonth: number;
    days: Record<string, { total: number; completed: number; pending: number; isAllCompleted: boolean; xpEarned: number; taskTitles: string[] }>;
  }> {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{
      success: boolean;
      data: {
        year: number;
        month: number;
        daysInMonth: number;
        days: Record<string, { total: number; completed: number; pending: number; isAllCompleted: boolean; xpEarned: number; taskTitles: string[] }>;
      };
    }>(`/analytics/calendar${query}`);
    return res.data;
  }
}

export const analyticsService = AnalyticsService;

