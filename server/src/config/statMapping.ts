export interface CharacterStatDeltas {
  strength?: number;
  knowledge?: number;
  discipline?: number;
  focus?: number;
  consistency?: number;
}

export type CharacterStage =
  | 'Beginner'
  | 'Developing'
  | 'Disciplined'
  | 'Advanced'
  | 'Master';

/**
 * Progression stages mapped deterministically from character level
 */
export function getCharacterStage(level: number): CharacterStage {
  if (level >= 30) return 'Master';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Disciplined';
  if (level >= 5) return 'Developing';
  return 'Beginner';
}

/**
 * Centralized mapping of task activity category to character stat gains.
 */
export const CATEGORY_STAT_MAPPING: Record<string, CharacterStatDeltas> = {
  fitness: { strength: 5, discipline: 2 },
  health: { strength: 3, discipline: 3 },
  learning: { knowledge: 5, focus: 2 },
  study: { knowledge: 5, focus: 2 },
  reading: { knowledge: 3, focus: 2 },
  mindfulness: { focus: 5, consistency: 3 },
  work: { discipline: 3, focus: 3 },
  career: { knowledge: 3, discipline: 3 },
  habit: { discipline: 3, consistency: 3 },
  personal: { discipline: 3, consistency: 3 },
  general: { consistency: 2, discipline: 2 },
};

/**
 * Returns the stat deltas for a given task category.
 */
export function getStatDeltasForCategory(category: string): CharacterStatDeltas {
  const normalized = (category || 'general').trim().toLowerCase();
  return CATEGORY_STAT_MAPPING[normalized] || { consistency: 2, discipline: 2 };
}
