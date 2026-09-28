import { prisma } from '../db/prisma.js';
import { getUserLocalDateTime, isValidTimezone } from '../utils/timezone.js';
import { AppError } from '../middlewares/errorHandler.js';
import { NotificationType, NotificationStatus } from '@prisma/client';

export interface UpdatePreferencesInput {
  taskNotificationsEnabled?: boolean;
  notificationTime?: string; // HH:mm format (e.g. "20:00")
  timezone?: string;
}

export interface EvaluationResult {
  userId: string;
  evaluated: boolean;
  notified: boolean;
  reason?: string;
  notificationId?: string;
  pendingTasksCount?: number;
  targetDate?: string;
}

export class NotificationService {
  /**
   * Retrieves or auto-creates user's notification preferences
   */
  static async getOrCreatePreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const defaultTz = user?.timezone && isValidTimezone(user.timezone) ? user.timezone : 'UTC';

      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          taskNotificationsEnabled: true,
          notificationTime: '20:00',
          timezone: defaultTz,
        },
      });
    }

    return pref;
  }

  /**
   * Updates notification preferences
   */
  static async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    await this.getOrCreatePreferences(userId);

    if (input.timezone && !isValidTimezone(input.timezone)) {
      throw new AppError('Invalid IANA timezone identifier (e.g. "Asia/Kolkata", "America/New_York")', 400);
    }

    if (input.notificationTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.notificationTime)) {
      throw new AppError('Invalid notification time format. Expected 24-hour HH:mm (e.g. "20:00")', 400);
    }

    const updated = await prisma.notificationPreference.update({
      where: { userId },
      data: {
        ...(input.taskNotificationsEnabled !== undefined && {
          taskNotificationsEnabled: input.taskNotificationsEnabled,
        }),
        ...(input.notificationTime !== undefined && {
          notificationTime: input.notificationTime,
        }),
        ...(input.timezone !== undefined && {
          timezone: input.timezone,
        }),
      },
    });

    // Also sync User.timezone if updated
    if (input.timezone) {
      await prisma.user.update({
        where: { id: userId },
        data: { timezone: input.timezone },
      });
    }

    return updated;
  }

  /**
   * Evaluates pending tasks for a user and creates an idempotent notification if eligible.
   * Enforces:
   * 1. Date-specific evaluation (only evaluates targetDate).
   * 2. Previous-day rule (never sends notifications for older dates).
   * 3. Idempotency (at most one PENDING_TASK notification per user per calendar day).
   * 4. Multi-task summary generation.
   * 5. Completed tasks ignored.
   */
  static async evaluatePendingTasksForUser(
    userId: string,
    options: {
      forceEvaluation?: boolean;
      targetDate?: string;
      referenceTime?: Date;
    } = {}
  ): Promise<EvaluationResult> {
    const pref = await this.getOrCreatePreferences(userId);

    if (!pref.taskNotificationsEnabled) {
      return {
        userId,
        evaluated: false,
        notified: false,
        reason: 'Task notifications are disabled in user preferences',
      };
    }

    const userTime = getUserLocalDateTime(pref.timezone, options.referenceTime || new Date());
    const targetDate = options.targetDate || userTime.localDate;

    // Check time eligibility (unless forced or evaluating past date test)
    if (!options.forceEvaluation) {
      // User's current local time must have reached the configured notificationTime
      if (userTime.localTime < pref.notificationTime) {
        return {
          userId,
          evaluated: true,
          notified: false,
          reason: `Notification time (${pref.notificationTime}) not reached yet (current local time: ${userTime.localTime})`,
          targetDate,
        };
      }
    }

    // IDEMPOTENCY CHECK: Check if a PENDING_TASK notification already exists for this date
    const existingNotification = await prisma.notification.findUnique({
      where: {
        userId_targetDate_type: {
          userId,
          targetDate,
          type: NotificationType.PENDING_TASK,
        },
      },
    });

    if (existingNotification) {
      return {
        userId,
        evaluated: true,
        notified: false,
        reason: `Pending task notification already generated for ${targetDate}`,
        notificationId: existingNotification.id,
        targetDate,
      };
    }

    // Find incomplete task instances specifically for targetDate
    const pendingInstances = await prisma.taskInstance.findMany({
      where: {
        userId,
        taskDate: targetDate,
        completed: false,
      },
      orderBy: { priority: 'desc' },
    });

    if (pendingInstances.length === 0) {
      return {
        userId,
        evaluated: true,
        notified: false,
        reason: `No pending tasks found for ${targetDate}`,
        targetDate,
      };
    }

    // Build notification title and summary message
    let title: string;
    let message: string;
    let primaryInstanceId: string | null = null;

    if (pendingInstances.length === 1) {
      const single = pendingInstances[0];
      title = 'Pending Task Reminder';
      message = `You still have "${single.title}" pending for today. Complete it to maintain your streak!`;
      primaryInstanceId = single.id;
    } else {
      title = `${pendingInstances.length} Tasks Pending Today`;
      const taskNames = pendingInstances.map((t) => t.title).join(', ');
      message = `${pendingInstances.length} tasks are still pending today: ${taskNames}. Complete them before midnight to earn your Daily XP Bonus!`;
      primaryInstanceId = null; // Summary notification
    }

    // Atomic creation protected by @@unique([userId, targetDate, type])
    const notification = await prisma.notification.create({
      data: {
        userId,
        taskInstanceId: primaryInstanceId,
        type: NotificationType.PENDING_TASK,
        title,
        message,
        targetDate,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Mark task instances as notified
    await prisma.taskInstance.updateMany({
      where: {
        id: { in: pendingInstances.map((t) => t.id) },
      },
      data: {
        notificationSent: true,
        notificationSentAt: new Date(),
      },
    });

    return {
      userId,
      evaluated: true,
      notified: true,
      notificationId: notification.id,
      pendingTasksCount: pendingInstances.length,
      targetDate,
    };
  }

  /**
   * Retrieves notifications for user with optional status filter
   */
  static async getNotifications(
    userId: string,
    options: {
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { userId };
    if (options.status) {
      where.status = options.status;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 30,
        skip: options.offset || 0,
        include: {
          taskInstance: {
            select: { id: true, title: true, completed: true, taskDate: true },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, status: NotificationStatus.SENT },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Fast count of unread notifications for navbar badge
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, status: NotificationStatus.SENT },
    });
  }

  /**
   * Marks a specific notification as read (with caller ownership verification)
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found or unauthorized', 404);
    }

    if (notification.status === NotificationStatus.READ) {
      return notification;
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.SENT,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      markedCount: result.count,
    };
  }

  /**
   * Records a browser notification delivery attempt
   */
  static async recordBrowserDeliveryAttempt(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found or unauthorized', 404);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        browserDeliveryAttempted: true,
      },
    });
  }
}
