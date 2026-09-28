export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'TASKS' | 'STREAK' | 'LEVEL' | 'GOALS' | 'XP' | 'GENERAL';
  requirementType: 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'LEVEL_REACHED' | 'GOALS_COMPLETED' | 'TOTAL_XP';
  requirementValue: number;
  xpReward: number;
}

export const DEFAULT_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: 'FIRST_STEP',
    title: 'First Step',
    description: 'Complete your first task in LifeQuest.',
    icon: 'footprints',
    category: 'TASKS',
    requirementType: 'TASKS_COMPLETED',
    requirementValue: 1,
    xpReward: 50,
  },
  {
    key: 'GETTING_STARTED',
    title: 'Getting Started',
    description: 'Complete 5 tasks and begin your journey.',
    icon: 'check-circle',
    category: 'TASKS',
    requirementType: 'TASKS_COMPLETED',
    requirementValue: 5,
    xpReward: 75,
  },
  {
    key: 'TASK_MASTER',
    title: 'Task Master',
    description: 'Complete 25 actionable quest tasks.',
    icon: 'target',
    category: 'TASKS',
    requirementType: 'TASKS_COMPLETED',
    requirementValue: 25,
    xpReward: 150,
  },
  {
    key: 'CONSISTENT_7',
    title: 'Consistent Warrior',
    description: 'Maintain a 7-day consistency streak.',
    icon: 'flame',
    category: 'STREAK',
    requirementType: 'STREAK_DAYS',
    requirementValue: 7,
    xpReward: 100,
  },
  {
    key: 'DEDICATED_30',
    title: 'Iron Discipline',
    description: 'Maintain a 30-day consistency streak.',
    icon: 'shield',
    category: 'STREAK',
    requirementType: 'STREAK_DAYS',
    requirementValue: 30,
    xpReward: 300,
  },
  {
    key: 'LEVEL_5',
    title: 'Rising Adventurer',
    description: 'Level up your character to Level 5.',
    icon: 'sparkles',
    category: 'LEVEL',
    requirementType: 'LEVEL_REACHED',
    requirementValue: 5,
    xpReward: 100,
  },
  {
    key: 'LEVEL_10',
    title: 'Hero of Legend',
    description: 'Reach Character Level 10.',
    icon: 'crown',
    category: 'LEVEL',
    requirementType: 'LEVEL_REACHED',
    requirementValue: 10,
    xpReward: 250,
  },
  {
    key: 'GOAL_CRUSHER',
    title: 'Goal Crusher',
    description: 'Successfully complete your first life goal.',
    icon: 'trophy',
    category: 'GOALS',
    requirementType: 'GOALS_COMPLETED',
    requirementValue: 1,
    xpReward: 150,
  },
  {
    key: 'XP_HUNTER',
    title: 'XP Hunter',
    description: 'Earn a total of 500 XP through positive habits.',
    icon: 'zap',
    category: 'XP',
    requirementType: 'TOTAL_XP',
    requirementValue: 500,
    xpReward: 100,
  },
  {
    key: 'XP_CHAMPION',
    title: 'XP Champion',
    description: 'Amass 2,000 XP in your personal quest.',
    icon: 'star',
    category: 'XP',
    requirementType: 'TOTAL_XP',
    requirementValue: 2000,
    xpReward: 250,
  },
];
