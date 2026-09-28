import { prisma } from '../db/prisma.js';
import { XP_CONFIG, calculateLevelFromXP, LevelInfo } from '../config/xpConfig.js';
import { getStatDeltasForCategory, getCharacterStage, CharacterStage } from '../config/statMapping.js';
import { recalculateGoalProgress } from './goal.service.js';
import { AchievementService } from './achievement.service';
import { Priority, XPReason } from '@prisma/client';

export interface GamificationProfileResponse {
  character: {
    id: string;
    name: string;
    title: string;
    gender: string;
    level: number;
    stage: CharacterStage;
    currentXP: number;
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  levelInfo: LevelInfo;
  stats: {
    strength: number;
    knowledge: number;
    discipline: number;
    focus: number;
    consistency: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    reason: string;
    description: string | null;
    createdAt: Date;
  }>;
}

export interface TaskCompletionResult {
  completed: boolean;
  xpAwarded: number;
  dailyBonusAwarded: boolean;
  levelInfo: LevelInfo;
  levelUp: boolean;
  currentStreak: number;
  stage: CharacterStage;
  goalProgress?: number;
}

function getYesterdayDateString(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Ensures a Character and CharacterStat record exist for the user.
 */
export async function getOrCreateCharacter(userId: string, tx: any = prisma) {
  let character = await tx.character.findUnique({
    where: { userId },
    include: { stats: true },
  });

  if (!character) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    const heroName = user?.name ? `${user.name}'s Hero` : 'Novice Hero';

    character = await tx.character.create({
      data: {
        userId,
        name: heroName,
        title: 'Novice Quester',
        level: 1,
        currentXP: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        stage: 'Beginner',
        stats: {
          create: {
            strength: 10,
            knowledge: 10,
            discipline: 10,
            focus: 10,
            consistency: 10,
          },
        },
      },
      include: { stats: true },
    });
  }

  return character;
}

/**
 * Calculates XP for a specific task instance based on its priority and goal status.
 */
export function calculateTaskXP(instance: { priority: Priority; goalId?: string | null }): number {
  let xp = XP_CONFIG.BASE_TASK_XP;
  xp += XP_CONFIG.PRIORITY_BONUS[instance.priority] || 0;
  if (instance.goalId) {
    xp += XP_CONFIG.GOAL_TASK_BONUS;
  }
  return xp;
}

/**
 * Completes a task instance, awards XP, updates character stats, updates streak,
 * checks for daily bonus, and updates goal progress atomically inside a transaction.
 */
export async function completeTaskInstance(taskInstanceId: string, userId: string): Promise<TaskCompletionResult> {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch task instance with ownership check
    const instance = await tx.taskInstance.findFirst({
      where: { id: taskInstanceId, userId },
      include: { task: true },
    });

    if (!instance) {
      throw new Error('Task instance not found');
    }

    // 2. Fetch or create character
    const character = await getOrCreateCharacter(userId, tx);
    const initialLevel = character.level;

    // Idempotency: If already completed and XP awarded, return existing state with 0 XP awarded
    if (instance.completed && instance.xpAwarded) {
      const levelInfo = calculateLevelFromXP(character.totalXP);
      return {
        completed: true,
        xpAwarded: 0,
        dailyBonusAwarded: false,
        levelInfo,
        levelUp: false,
        currentStreak: character.currentStreak,
        stage: character.stage as CharacterStage,
      };
    }

    // 3. Calculate task XP
    const taskXP = calculateTaskXP(instance);

    // 4. Update task instance state
    await tx.taskInstance.update({
      where: { id: taskInstanceId },
      data: {
        completed: true,
        completedAt: new Date(),
        xpAwarded: true,
        xpEarned: taskXP,
      },
    });

    // 5. Record XP transaction
    await tx.xPTransaction.create({
      data: {
        userId,
        taskInstanceId: instance.id,
        amount: taskXP,
        reason: XPReason.TASK_COMPLETED,
        description: `Completed: ${instance.title}`,
      },
    });

    let currentTotalXP = character.totalXP + taskXP;

    // 6. Update Character Stats based on category
    const statDeltas = getStatDeltasForCategory(instance.category);
    await tx.characterStat.upsert({
      where: { characterId: character.id },
      create: {
        characterId: character.id,
        strength: 10 + (statDeltas.strength || 0),
        knowledge: 10 + (statDeltas.knowledge || 0),
        discipline: 10 + (statDeltas.discipline || 0),
        focus: 10 + (statDeltas.focus || 0),
        consistency: 10 + (statDeltas.consistency || 0),
      },
      update: {
        strength: { increment: statDeltas.strength || 0 },
        knowledge: { increment: statDeltas.knowledge || 0 },
        discipline: { increment: statDeltas.discipline || 0 },
        focus: { increment: statDeltas.focus || 0 },
        consistency: { increment: statDeltas.consistency || 0 },
      },
    });

    // 7. Update Streak
    const today = instance.taskDate;
    const yesterday = getYesterdayDateString(today);
    let newCurrentStreak = character.currentStreak;
    let newLongestStreak = character.longestStreak;
    let newLastActiveDate = character.lastActiveDate;

    if (character.lastActiveDate === today) {
      // User already completed a task today; streak count stays the same
      newCurrentStreak = character.currentStreak;
    } else if (character.lastActiveDate === yesterday) {
      // Consecutive day!
      newCurrentStreak = character.currentStreak + 1;
      newLastActiveDate = today;
    } else {
      // First day or streak broken
      newCurrentStreak = 1;
      newLastActiveDate = today;
    }
    newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);

    // 8. Daily Completion Bonus Check
    let dailyBonusAwarded = false;
    const totalDayInstances = await tx.taskInstance.count({
      where: { userId, taskDate: today },
    });
    const completedDayInstances = await tx.taskInstance.count({
      where: { userId, taskDate: today, completed: true },
    });

    if (totalDayInstances > 0 && completedDayInstances === totalDayInstances) {
      // Check if daily bonus was already claimed today
      const existingBonus = await tx.dailyBonusRecord.findUnique({
        where: {
          userId_bonusDate: {
            userId,
            bonusDate: today,
          },
        },
      });

      if (!existingBonus) {
        const bonusXP = XP_CONFIG.DAILY_COMPLETION_BONUS;
        await tx.dailyBonusRecord.create({
          data: {
            userId,
            bonusDate: today,
            xpAmount: bonusXP,
          },
        });

        await tx.xPTransaction.create({
          data: {
            userId,
            amount: bonusXP,
            reason: XPReason.DAILY_BONUS,
            description: `Daily Completion Bonus for ${today}`,
          },
        });

        currentTotalXP += bonusXP;
        dailyBonusAwarded = true;

        // Stat bonus for full consistency
        await tx.characterStat.update({
          where: { characterId: character.id },
          data: {
            consistency: { increment: 3 },
            discipline: { increment: 2 },
          },
        });
      }
    }

    // 9. Calculate new Level & Stage
    const levelInfo = calculateLevelFromXP(currentTotalXP);
    const newStage = getCharacterStage(levelInfo.level);

    // 10. Update Character record
    await tx.character.update({
      where: { id: character.id },
      data: {
        totalXP: currentTotalXP,
        currentXP: levelInfo.xpInCurrentLevel,
        level: levelInfo.level,
        stage: newStage,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: newLastActiveDate,
      },
    });

    // 11. Recalculate Goal Progress if task belongs to a goal
    let goalProgress: number | undefined;
    if (instance.goalId) {
      goalProgress = await recalculateGoalProgress(instance.goalId, tx);
    }

    return {
      completed: true,
      xpAwarded: taskXP + (dailyBonusAwarded ? XP_CONFIG.DAILY_COMPLETION_BONUS : 0),
      dailyBonusAwarded,
      levelInfo,
      levelUp: levelInfo.level > initialLevel,
      currentStreak: newCurrentStreak,
      stage: newStage,
      goalProgress,
    };
  });

  // Evaluate achievements asynchronously after task completion
  AchievementService.evaluateAchievements(userId).catch((err) => {
    console.error('Error evaluating achievements on task completion:', err);
  });

  return result;
}

/**
 * Uncompletes a task instance, safely reverses XP with history, reverses character stats,
 * checks and reverts daily bonus if broken, and recalculates goal progress.
 */
export async function uncompleteTaskInstance(taskInstanceId: string, userId: string): Promise<TaskCompletionResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch task instance with ownership check
    const instance = await tx.taskInstance.findFirst({
      where: { id: taskInstanceId, userId },
      include: { task: true },
    });

    if (!instance) {
      throw new Error('Task instance not found');
    }

    const character = await getOrCreateCharacter(userId, tx);

    // If not completed or not awarded, simply ensure state is uncompleted
    if (!instance.completed && !instance.xpAwarded) {
      const levelInfo = calculateLevelFromXP(character.totalXP);
      return {
        completed: false,
        xpAwarded: 0,
        dailyBonusAwarded: false,
        levelInfo,
        levelUp: false,
        currentStreak: character.currentStreak,
        stage: character.stage as CharacterStage,
      };
    }

    // 2. XP to reverse
    const xpToReverse = instance.xpEarned || calculateTaskXP(instance);

    // 3. Record reversal XP transaction
    await tx.xPTransaction.create({
      data: {
        userId,
        taskInstanceId: instance.id,
        amount: -xpToReverse,
        reason: XPReason.TASK_UNCOMPLETED,
        description: `Uncompleted: ${instance.title}`,
      },
    });

    // 4. Update task instance state
    await tx.taskInstance.update({
      where: { id: taskInstanceId },
      data: {
        completed: false,
        completedAt: null,
        xpAwarded: false,
        xpEarned: 0,
      },
    });

    let currentTotalXP = Math.max(0, character.totalXP - xpToReverse);

    // 5. Reverse Character Stats
    const statDeltas = getStatDeltasForCategory(instance.category);
    await tx.characterStat.update({
      where: { characterId: character.id },
      data: {
        strength: { decrement: statDeltas.strength || 0 },
        knowledge: { decrement: statDeltas.knowledge || 0 },
        discipline: { decrement: statDeltas.discipline || 0 },
        focus: { decrement: statDeltas.focus || 0 },
        consistency: { decrement: statDeltas.consistency || 0 },
      },
    });

    // 6. Check and revert daily completion bonus if it was awarded
    const today = instance.taskDate;
    const existingBonus = await tx.dailyBonusRecord.findUnique({
      where: {
        userId_bonusDate: {
          userId,
          bonusDate: today,
        },
      },
    });

    if (existingBonus) {
      // Revert bonus
      await tx.dailyBonusRecord.delete({
        where: { id: existingBonus.id },
      });

      await tx.xPTransaction.create({
        data: {
          userId,
          amount: -existingBonus.xpAmount,
          reason: XPReason.TASK_UNCOMPLETED,
          description: `Daily bonus reversed due to uncompleted task on ${today}`,
        },
      });

      currentTotalXP = Math.max(0, currentTotalXP - existingBonus.xpAmount);

      await tx.characterStat.update({
        where: { characterId: character.id },
        data: {
          consistency: { decrement: 3 },
          discipline: { decrement: 2 },
        },
      });
    }

    // 7. Check if user still has other completed tasks on this date for streak preservation
    const remainingCompletedToday = await tx.taskInstance.count({
      where: { userId, taskDate: today, completed: true },
    });

    let currentStreak = character.currentStreak;
    let lastActiveDate = character.lastActiveDate;

    if (remainingCompletedToday === 0 && character.lastActiveDate === today) {
      // Find the most recent date with a completed task before today
      const previousActiveInstance = await tx.taskInstance.findFirst({
        where: {
          userId,
          completed: true,
          taskDate: { lt: today },
        },
        orderBy: { taskDate: 'desc' },
      });

      if (previousActiveInstance) {
        lastActiveDate = previousActiveInstance.taskDate;
        // If previous active date was yesterday, streak is decremented by 1
        const yesterday = getYesterdayDateString(today);
        if (previousActiveInstance.taskDate === yesterday) {
          currentStreak = Math.max(0, character.currentStreak - 1);
        } else {
          currentStreak = 1;
        }
      } else {
        lastActiveDate = null;
        currentStreak = 0;
      }
    }

    // 8. Recalculate level and stage
    const levelInfo = calculateLevelFromXP(currentTotalXP);
    const newStage = getCharacterStage(levelInfo.level);

    // 9. Update Character record
    await tx.character.update({
      where: { id: character.id },
      data: {
        totalXP: currentTotalXP,
        currentXP: levelInfo.xpInCurrentLevel,
        level: levelInfo.level,
        stage: newStage,
        currentStreak,
        lastActiveDate,
      },
    });

    // 10. Recalculate Goal Progress if task belongs to a goal
    let goalProgress: number | undefined;
    if (instance.goalId) {
      goalProgress = await recalculateGoalProgress(instance.goalId, tx);
    }

    return {
      completed: false,
      xpAwarded: -xpToReverse,
      dailyBonusAwarded: false,
      levelInfo,
      levelUp: false,
      currentStreak,
      stage: newStage,
      goalProgress,
    };
  });
}

/**
 * Toggles task instance completion state.
 */
export async function toggleTaskInstance(taskInstanceId: string, userId: string): Promise<TaskCompletionResult> {
  const instance = await prisma.taskInstance.findFirst({
    where: { id: taskInstanceId, userId },
  });

  if (!instance) {
    throw new Error('Task instance not found');
  }

  if (instance.completed) {
    return await uncompleteTaskInstance(taskInstanceId, userId);
  } else {
    return await completeTaskInstance(taskInstanceId, userId);
  }
}

/**
 * Retrieves the full gamification profile for a user.
 */
export async function getGamificationProfile(userId: string): Promise<GamificationProfileResponse> {
  const character = await getOrCreateCharacter(userId);
  const levelInfo = calculateLevelFromXP(character.totalXP);

  const stats = character.stats || {
    strength: 10,
    knowledge: 10,
    discipline: 10,
    focus: 10,
    consistency: 10,
  };

  const recentTransactions = await prisma.xPTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      reason: true,
      description: true,
      createdAt: true,
    },
  });

  return {
    character: {
      id: character.id,
      name: character.name,
      title: character.title,
      gender: (character as any).gender || 'MALE',
      level: levelInfo.level,
      stage: character.stage as CharacterStage,
      currentXP: levelInfo.xpInCurrentLevel,
      totalXP: character.totalXP,
      currentStreak: character.currentStreak,
      longestStreak: character.longestStreak,
      lastActiveDate: character.lastActiveDate,
    },
    levelInfo,
    stats: {
      strength: stats.strength,
      knowledge: stats.knowledge,
      discipline: stats.discipline,
      focus: stats.focus,
      consistency: stats.consistency,
    },
    recentTransactions,
  };
}

/**
 * Updates the user's character gender (MALE / FEMALE)
 */
export async function updateCharacterGender(userId: string, gender: string) {
  const normalizedGender = gender.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
  const character = await getOrCreateCharacter(userId);

  return await prisma.character.update({
    where: { id: character.id },
    data: { gender: normalizedGender },
    include: { stats: true },
  });
}

