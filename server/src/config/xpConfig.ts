import { Priority } from '@prisma/client';

export interface LevelInfo {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercentage: number;
}

export const XP_CONFIG = {
  BASE_TASK_XP: 10,
  PRIORITY_BONUS: {
    [Priority.LOW]: 0,
    [Priority.MEDIUM]: 5,
    [Priority.HIGH]: 10, // Total 10 + 10 = 20, or base 10 + 5 = 15
    [Priority.URGENT]: 15,
  },
  GOAL_TASK_BONUS: 10, // Task linked to an active goal
  DAILY_COMPLETION_BONUS: 25, // Awarded once per day when all tasks on that day are finished
  STREAK_MILESTONE_BONUS_7_DAYS: 50,
};

/**
 * Returns total XP required to reach Level L.
 * Progression curve:
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 450 XP
 * Level 5: 700 XP
 * Formula: threshold(L) = 25 * (L^2 + L - 2) for L >= 1
 */
export function getXPThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level * level + level - 2);
}

/**
 * Calculates current level, next level target, and percentage progress for a given total XP.
 */
export function calculateLevelFromXP(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, Math.floor(totalXP));
  
  // Inverse quadratic: 25(L^2 + L - 2) <= safeXP
  // L = floor( (sqrt(9 + 4 * (safeXP / 25)) - 1) / 2 )
  const calculatedLevel = Math.max(
    1,
    Math.floor((Math.sqrt(9 + (4 * safeXP) / 25) - 1) / 2)
  );

  const currentLevelXP = getXPThresholdForLevel(calculatedLevel);
  const nextLevelXP = getXPThresholdForLevel(calculatedLevel + 1);
  const xpRequiredForNextLevel = nextLevelXP - currentLevelXP;
  const xpInCurrentLevel = safeXP - currentLevelXP;
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100))
  );

  return {
    level: calculatedLevel,
    currentLevelXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progressPercentage,
  };
}
