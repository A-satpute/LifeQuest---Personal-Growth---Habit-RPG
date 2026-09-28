import { prisma } from '../db/prisma';
import { DEFAULT_ACHIEVEMENTS } from '../config/achievements';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class AchievementService {
  private static initialized = false;

  /**
   * Idempotently seeds / syncs default achievement definitions in the database
   */
  static async initAchievements(): Promise<void> {
    if (this.initialized) return;

    for (const def of DEFAULT_ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { key: def.key },
        update: {
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          requirementType: def.requirementType,
          requirementValue: def.requirementValue,
          xpReward: def.xpReward,
        },
        create: {
          key: def.key,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          requirementType: def.requirementType,
          requirementValue: def.requirementValue,
          xpReward: def.xpReward,
        },
      });
    }

    this.initialized = true;
  }

  /**
   * Evaluates all achievement rules for a user based on real database records
   * Idempotent: Can be called multiple times without duplicate unlocks
   */
  static async evaluateAchievements(userId: string): Promise<any[]> {
    await this.initAchievements();

    // 1. Gather live metrics from database
    const [character, completedTasksCount, completedGoalsCount, existingUnlocked] = await Promise.all([
      prisma.character.findUnique({ where: { userId } }),
      prisma.taskInstance.count({ where: { userId, completed: true } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

    const unlockedKeySet = new Set(existingUnlocked.map((ua) => ua.achievement.key));
    const allAchievements = await prisma.achievement.findMany();

    const newlyUnlocked: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    const totalXP = character?.totalXP || 0;
    const level = character?.level || 1;
    const streak = Math.max(character?.currentStreak || 0, character?.longestStreak || 0);

    for (const ach of allAchievements) {
      if (unlockedKeySet.has(ach.key)) continue;

      let isEligible = false;

      switch (ach.requirementType) {
        case 'TASKS_COMPLETED':
          if (completedTasksCount >= ach.requirementValue) isEligible = true;
          break;
        case 'STREAK_DAYS':
          if (streak >= ach.requirementValue) isEligible = true;
          break;
        case 'LEVEL_REACHED':
          if (level >= ach.requirementValue) isEligible = true;
          break;
        case 'GOALS_COMPLETED':
          if (completedGoalsCount >= ach.requirementValue) isEligible = true;
          break;
        case 'TOTAL_XP':
          if (totalXP >= ach.requirementValue) isEligible = true;
          break;
      }

      if (isEligible) {
        try {
          // Idempotent record creation using unique constraint
          const userAch = await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: ach.id,
              unlockedAt: new Date(),
            },
            include: { achievement: true },
          });

          newlyUnlocked.push(userAch);

          // Create in-app Notification for the achievement (handling unique constraint on userId_targetDate_type)
          const existingNotif = await prisma.notification.findUnique({
            where: {
              userId_targetDate_type: {
                userId,
                targetDate: todayStr,
                type: NotificationType.ACHIEVEMENT,
              },
            },
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                userId,
                type: NotificationType.ACHIEVEMENT,
                title: `Achievement Unlocked: ${ach.title}!`,
                message: `${ach.description} (+${ach.xpReward} XP reward available)`,
                targetDate: todayStr,
                status: NotificationStatus.SENT,
              },
            });
          } else {
            await prisma.notification.update({
              where: { id: existingNotif.id },
              data: {
                title: `Achievement Unlocked: ${ach.title}!`,
                message: `${existingNotif.message} • ${ach.title}!`,
                readAt: null,
                status: NotificationStatus.SENT,
              },
            });
          }
        } catch (err: any) {
          // Unique constraint violation (already unlocked in concurrent request)
          if (!err.message?.includes('Unique constraint')) {
            console.error(`Error unlocking achievement ${ach.key}:`, err);
          }
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Retrieves all achievements with user unlock status and progress calculation
   */
  static async getUserAchievements(userId: string) {
    await this.initAchievements();

    const [allAchievements, userAchievements, character, completedTasksCount, completedGoalsCount] =
      await Promise.all([
        prisma.achievement.findMany({ orderBy: { requirementValue: 'asc' } }),
        prisma.userAchievement.findMany({ where: { userId } }),
        prisma.character.findUnique({ where: { userId } }),
        prisma.taskInstance.count({ where: { userId, completed: true } }),
        prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      ]);

    const unlockedMap = new Map<string, string>();
    for (const ua of userAchievements) {
      unlockedMap.set(ua.achievementId, ua.unlockedAt.toISOString());
    }

    const totalXP = character?.totalXP || 0;
    const level = character?.level || 1;
    const streak = Math.max(character?.currentStreak || 0, character?.longestStreak || 0);

    const achievementsWithProgress = allAchievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      const unlockedAt = unlockedMap.get(ach.id) || null;

      let current = 0;
      switch (ach.requirementType) {
        case 'TASKS_COMPLETED':
          current = completedTasksCount;
          break;
        case 'STREAK_DAYS':
          current = streak;
          break;
        case 'LEVEL_REACHED':
          current = level;
          break;
        case 'GOALS_COMPLETED':
          current = completedGoalsCount;
          break;
        case 'TOTAL_XP':
          current = totalXP;
          break;
      }

      const clampedCurrent = Math.min(current, ach.requirementValue);
      const percentage = Math.round((clampedCurrent / ach.requirementValue) * 100);

      return {
        id: ach.id,
        key: ach.key,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        requirementType: ach.requirementType,
        requirementValue: ach.requirementValue,
        xpReward: ach.xpReward,
        isUnlocked,
        unlockedAt,
        progress: {
          current: clampedCurrent,
          target: ach.requirementValue,
          percentage: isUnlocked ? 100 : percentage,
        },
      };
    });

    const unlockedCount = userAchievements.length;
    const totalCount = allAchievements.length;

    return {
      stats: {
        total: totalCount,
        unlocked: unlockedCount,
        locked: totalCount - unlockedCount,
        completionPercentage: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
      },
      achievements: achievementsWithProgress,
    };
  }
}
