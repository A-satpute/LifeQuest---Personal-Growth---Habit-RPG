import { prisma } from '../db/prisma';
import { getUserLocalDateTime } from '../utils/timezone';
import { AchievementService } from './achievement.service';

export interface DateRangeBounds {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rangeLabel: string;
}

export class AnalyticsService {
  /**
   * Resolves the start and end dates for a given range relative to the user's timezone
   */
  static getDateRangeBounds(range: string = '30d', timezone: string = 'UTC'): DateRangeBounds {
    const { localDate } = getUserLocalDateTime(timezone, new Date());
    const today = new Date(`${localDate}T12:00:00.000Z`);

    let start = new Date(today);

    switch (range.toLowerCase()) {
      case '7d':
        start.setUTCDate(today.getUTCDate() - 6);
        break;
      case '30d':
        start.setUTCDate(today.getUTCDate() - 29);
        break;
      case '90d':
        start.setUTCDate(today.getUTCDate() - 89);
        break;
      case 'year':
        start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
        break;
      case 'all':
        // Epoch or early application baseline
        start = new Date('2024-01-01T00:00:00.000Z');
        break;
      default:
        start.setUTCDate(today.getUTCDate() - 29);
        break;
    }

    const startDate = start.toISOString().split('T')[0];
    const endDate = localDate;

    return {
      startDate,
      endDate,
      rangeLabel: range,
    };
  }

  /**
   * Main overview analytics for the dashboard
   */
  static async getOverview(userId: string, range: string = '30d', clientTimezone?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreference: true,
        character: {
          include: { stats: true },
        },
      },
    });

    const timezone = clientTimezone || user?.notificationPreference?.timezone || user?.timezone || 'UTC';
    const bounds = this.getDateRangeBounds(range, timezone);

    // 1. Task Instances in range
    const taskDateFilter: any = {};
    if (range.toLowerCase() !== 'all') {
      taskDateFilter.taskDate = {
        gte: bounds.startDate,
        lte: bounds.endDate,
      };
    }

    const [
      totalTasksInRange,
      completedTasksInRange,
      xpTransactionsInRange,
      activeGoalsCount,
      completedGoalsCount,
      achievementsData,
    ] = await Promise.all([
      prisma.taskInstance.count({
        where: {
          userId,
          ...taskDateFilter,
        },
      }),
      prisma.taskInstance.count({
        where: {
          userId,
          completed: true,
          ...taskDateFilter,
        },
      }),
      prisma.xPTransaction.findMany({
        where: {
          userId,
          amount: { gt: 0 },
          ...(range.toLowerCase() !== 'all'
            ? {
                createdAt: {
                  gte: new Date(`${bounds.startDate}T00:00:00.000Z`),
                  lte: new Date(`${bounds.endDate}T23:59:59.999Z`),
                },
              }
            : {}),
        },
        select: { amount: true },
      }),
      prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      AchievementService.getUserAchievements(userId),
    ]);

    const pendingTasksInRange = totalTasksInRange - completedTasksInRange;
    const completionRate =
      totalTasksInRange > 0 ? Math.round((completedTasksInRange / totalTasksInRange) * 100) : 0;

    const totalXpEarnedInRange = xpTransactionsInRange.reduce((acc, t) => acc + t.amount, 0);

    const char = user?.character;

    return {
      range: bounds.rangeLabel,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      timezone,
      tasks: {
        total: totalTasksInRange,
        completed: completedTasksInRange,
        pending: pendingTasksInRange,
        completionRate,
      },
      xp: {
        totalEarnedInRange: totalXpEarnedInRange,
        lifetimeTotalXP: char?.totalXP || 0,
        currentXP: char?.currentXP || 0,
        currentLevel: char?.level || 1,
        stage: char?.stage || 'Beginner',
      },
      streak: {
        current: char?.currentStreak || 0,
        longest: char?.longestStreak || 0,
      },
      character: {
        name: char?.name || 'Novice Hero',
        title: char?.title || 'Novice Quester',
        level: char?.level || 1,
        stage: char?.stage || 'Beginner',
        stats: char?.stats
          ? {
              strength: char.stats.strength,
              knowledge: char.stats.knowledge,
              discipline: char.stats.discipline,
              focus: char.stats.focus,
              consistency: char.stats.consistency,
            }
          : null,
      },
      goals: {
        active: activeGoalsCount,
        completed: completedGoalsCount,
        total: activeGoalsCount + completedGoalsCount,
      },
      achievements: {
        unlocked: achievementsData.stats.unlocked,
        total: achievementsData.stats.total,
        percentage: achievementsData.stats.completionPercentage,
      },
    };
  }

  /**
   * Daily task completion trends over the selected range
   */
  static async getCompletionTrends(userId: string, range: string = '30d', clientTimezone?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });
    const timezone = clientTimezone || user?.notificationPreference?.timezone || user?.timezone || 'UTC';
    const bounds = this.getDateRangeBounds(range, timezone);

    const taskInstances = await prisma.taskInstance.findMany({
      where: {
        userId,
        ...(range.toLowerCase() !== 'all'
          ? {
              taskDate: {
                gte: bounds.startDate,
                lte: bounds.endDate,
              },
            }
          : {}),
      },
      select: {
        taskDate: true,
        completed: true,
        category: true,
        priority: true,
      },
      orderBy: { taskDate: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, { completed: number; pending: number; total: number }>();

    for (const ti of taskInstances) {
      const entry = dateMap.get(ti.taskDate) || { completed: 0, pending: 0, total: 0 };
      if (ti.completed) {
        entry.completed++;
      } else {
        entry.pending++;
      }
      entry.total++;
      dateMap.set(ti.taskDate, entry);
    }

    const trends = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      completed: counts.completed,
      pending: counts.pending,
      total: counts.total,
      completionRate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }));

    return {
      range: bounds.rangeLabel,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      trends,
    };
  }

  /**
   * Daily XP analytics and recent transaction history
   */
  static async getXpTrends(userId: string, range: string = '30d') {
    const bounds = this.getDateRangeBounds(range, 'UTC');

    const [transactions, recentHistory] = await Promise.all([
      prisma.xPTransaction.findMany({
        where: {
          userId,
          ...(range.toLowerCase() !== 'all'
            ? {
                createdAt: {
                  gte: new Date(`${bounds.startDate}T00:00:00.000Z`),
                  lte: new Date(`${bounds.endDate}T23:59:59.999Z`),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.xPTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Group XP by date string (YYYY-MM-DD)
    const dateMap = new Map<string, { earned: number; count: number }>();

    for (const t of transactions) {
      const dateStr = t.createdAt.toISOString().split('T')[0];
      const entry = dateMap.get(dateStr) || { earned: 0, count: 0 };
      entry.earned += t.amount;
      entry.count++;
      dateMap.set(dateStr, entry);
    }

    const dailyXp = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      xp: data.earned,
      transactionCount: data.count,
    }));

    return {
      range: bounds.rangeLabel,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      dailyXp,
      recentHistory: recentHistory.map((h) => ({
        id: h.id,
        amount: h.amount,
        reason: h.reason,
        date: h.createdAt.toISOString().split('T')[0],
        timestamp: h.createdAt,
      })),
    };
  }

  /**
   * GitHub-style Activity Heatmap for a calendar year
   */
  static async getActivityHeatmap(userId: string, yearParam?: number, clientTimezone?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });
    const timezone = clientTimezone || user?.notificationPreference?.timezone || user?.timezone || 'UTC';
    const { localDate } = getUserLocalDateTime(timezone, new Date());
    const year = yearParam || parseInt(localDate.split('-')[0], 10);

    const startYearStr = `${year}-01-01`;
    const endYearStr = `${year}-12-31`;

    const completedInstances = await prisma.taskInstance.findMany({
      where: {
        userId,
        completed: true,
        taskDate: {
          gte: startYearStr,
          lte: endYearStr,
        },
      },
      select: {
        taskDate: true,
      },
    });

    // Map counts per date
    const countMap = new Map<string, number>();
    for (const inst of completedInstances) {
      countMap.set(inst.taskDate, (countMap.get(inst.taskDate) || 0) + 1);
    }

    const days = Array.from(countMap.entries()).map(([date, count]) => {
      let level = 0;
      if (count === 1) level = 1;
      else if (count <= 3) level = 2;
      else if (count <= 5) level = 3;
      else level = 4;

      return {
        date,
        count,
        level,
      };
    });

    return {
      year,
      totalCompletedDays: countMap.size,
      totalCompletedTasks: completedInstances.length,
      days,
    };
  }

  /**
   * Goal progress and historical metrics
   */
  static async getGoalsAnalytics(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        tasks: {
          select: { id: true },
        },
        taskInstances: {
          select: { id: true, completed: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => {
      const totalInstances = goal.taskInstances.length;
      const completedInstances = goal.taskInstances.filter((t) => t.completed).length;
      const pendingInstances = totalInstances - completedInstances;

      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        priority: goal.priority,
        status: goal.status,
        progress: goal.progress,
        startDate: goal.startDate.toISOString().split('T')[0],
        endDate: goal.endDate ? goal.endDate.toISOString().split('T')[0] : null,
        taskTemplateCount: goal.tasks.length,
        metrics: {
          totalTaskInstances: totalInstances,
          completedTaskInstances: completedInstances,
          pendingTaskInstances: pendingInstances,
        },
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };
    });
  }

  /**
   * Filterable Historical Task Instances
   */
  static async getTaskHistory(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      goalId?: string;
      category?: string;
      status?: 'COMPLETED' | 'PENDING' | 'ALL';
    } = {}
  ) {
    const where: any = { userId };

    if (filters.startDate || filters.endDate) {
      where.taskDate = {};
      if (filters.startDate) where.taskDate.gte = filters.startDate;
      if (filters.endDate) where.taskDate.lte = filters.endDate;
    }

    if (filters.goalId) {
      where.goalId = filters.goalId;
    }

    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.completed = filters.status === 'COMPLETED';
    }

    const instances = await prisma.taskInstance.findMany({
      where,
      include: {
        goal: {
          select: { id: true, title: true, category: true },
        },
        task: {
          select: { isRecurring: true, recurrenceType: true },
        },
      },
      orderBy: [{ taskDate: 'desc' }, { dueTime: 'asc' }, { createdAt: 'desc' }],
      take: 100, // Safe query pagination limit
    });

    return instances;
  }

  /**
   * Calendar month task completion status for Dashboard & History calendar
   * Follows strict rule: isAllCompleted === (completed === total && total > 0)
   */
  static async getMonthCalendar(
    userId: string,
    yearParam?: number,
    monthParam?: number,
    clientTimezone?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });
    const timezone = clientTimezone || user?.notificationPreference?.timezone || user?.timezone || 'UTC';
    const { localDate } = getUserLocalDateTime(timezone, new Date());

    const nowParts = localDate.split('-').map(Number);
    const year = yearParam || nowParts[0];
    const month = monthParam || nowParts[1]; // 1-12

    const mm = String(month).padStart(2, '0');
    const startStr = `${year}-${mm}-01`;

    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endStr = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        taskDate: {
          gte: startStr,
          lte: endStr,
        },
      },
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        taskDate: true,
        completed: true,
        xpEarned: true,
      },
    });

    const days: Record<
      string,
      { total: number; completed: number; pending: number; isAllCompleted: boolean; xpEarned: number; taskTitles: string[] }
    > = {};

    for (let day = 1; day <= lastDay; day++) {
      const dStr = `${year}-${mm}-${String(day).padStart(2, '0')}`;
      days[dStr] = {
        total: 0,
        completed: 0,
        pending: 0,
        isAllCompleted: false,
        xpEarned: 0,
        taskTitles: [],
      };
    }

    for (const inst of instances) {
      if (!days[inst.taskDate]) {
        days[inst.taskDate] = {
          total: 0,
          completed: 0,
          pending: 0,
          isAllCompleted: false,
          xpEarned: 0,
          taskTitles: [],
        };
      }
      const entry = days[inst.taskDate];
      entry.total += 1;
      if (inst.completed) {
        entry.completed += 1;
        entry.xpEarned += inst.xpEarned || 0;
      } else {
        entry.pending += 1;
      }
      entry.taskTitles.push(inst.title);
    }

    for (const key of Object.keys(days)) {
      const e = days[key];
      e.isAllCompleted = e.total > 0 && e.completed === e.total;
    }

    return {
      year,
      month,
      daysInMonth: lastDay,
      days,
    };
  }
}

