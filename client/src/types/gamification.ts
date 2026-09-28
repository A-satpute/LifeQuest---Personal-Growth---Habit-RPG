export type CharacterStage =
  | 'Beginner'
  | 'Developing'
  | 'Disciplined'
  | 'Advanced'
  | 'Master';

export interface CharacterStats {
  strength: number;
  knowledge: number;
  discipline: number;
  focus: number;
  consistency: number;
}

export interface LevelInfo {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercentage: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  gender?: 'MALE' | 'FEMALE' | string;
  level: number;
  stage: CharacterStage;
  currentXP: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  description: string | null;
  createdAt: string;
}

export interface GamificationProfile {
  character: Character;
  levelInfo: LevelInfo;
  stats: CharacterStats;
  recentTransactions: XPTransaction[];
}
