import { prisma } from '../db/prisma.js';
import { NotificationService } from './notification.service.js';

export class NotificationScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static intervalMs = 60 * 1000; // Run every 60 seconds

  /**
   * Starts the background scheduler loop
   */
  static start(intervalMs = 60 * 1000) {
    this.intervalMs = intervalMs;
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`⏰ Notification Scheduler initialized (Interval: ${this.intervalMs / 1000}s)`);

    // Initial check
    this.tick().catch((err) => console.error('Error during initial scheduler tick:', err));

    this.timer = setInterval(() => {
      this.tick().catch((err) => console.error('Error during scheduler tick:', err));
    }, this.intervalMs);
  }

  /**
   * Stops the background scheduler loop
   */
  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('⏰ Notification Scheduler stopped');
    }
  }

  /**
   * Core scheduler evaluation tick
   */
  static async tick(referenceTime: Date = new Date()) {
    if (this.isRunning) {
      return { skipped: true, reason: 'Previous tick still executing' };
    }

    this.isRunning = true;
    let evaluatedCount = 0;
    let notifiedCount = 0;

    try {
      // Find all users who have enabled task notifications
      const preferences = await prisma.notificationPreference.findMany({
        where: { taskNotificationsEnabled: true },
        select: { userId: true },
      });

      for (const pref of preferences) {
        try {
          const result = await NotificationService.evaluatePendingTasksForUser(pref.userId, {
            referenceTime,
          });

          evaluatedCount++;
          if (result.notified) {
            notifiedCount++;
            console.log(
              `🔔 [Scheduler] Notified user ${pref.userId} (${result.pendingTasksCount} pending tasks on ${result.targetDate})`
            );
          }
        } catch (userErr) {
          console.error(`Error evaluating notifications for user ${pref.userId}:`, userErr);
        }
      }

      return {
        success: true,
        evaluatedCount,
        notifiedCount,
        timestamp: referenceTime.toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual run helper for testing or administrator trigger
   */
  static async triggerManualRun(referenceTime?: Date) {
    return await this.tick(referenceTime || new Date());
  }
}
