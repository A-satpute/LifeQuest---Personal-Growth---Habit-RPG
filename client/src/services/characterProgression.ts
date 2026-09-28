import type { CharacterStats } from '../types/gamification';

export type CharacterGender = 'MALE' | 'FEMALE';

export interface CharacterProgressionInput {
  gender?: CharacterGender | string;
  level: number;
  stats?: Partial<CharacterStats>;
  currentStreak?: number;
}

export interface CharacterAppearance {
  gender: CharacterGender;
  imageSrc: string;
  stageName: string;
  stageLevel: number;
  archetype: string;
  focusTitle: string;
  evolutionSummary: string;
  dominantPath: 'fitness' | 'knowledge' | 'hybrid' | 'balanced';
  unlockedFeatures: string[];
  nextUnlockPreview: string;
  glowColor: string;
  borderColor: string;
}

/**
 * Central Character Progression & Visual Evolution Resolver
 * Maps user level, RPG stats, and gender to clean 3D RPG character assets.
 */
export function getCharacterAppearance(input: CharacterProgressionInput): CharacterAppearance {
  const gender: CharacterGender = input.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
  const level = Math.max(1, input.level || 1);
  const stats = input.stats || {};
  const strength = stats.strength ?? 10;
  const knowledge = stats.knowledge ?? 10;

  const genderFolder = gender === 'FEMALE' ? 'female' : 'male';

  // Determine Dominant Path from real stats
  const strengthDiff = strength - 10;
  const knowledgeDiff = knowledge - 10;

  let dominantPath: 'fitness' | 'knowledge' | 'hybrid' | 'balanced' = 'balanced';
  if (strengthDiff >= 5 && knowledgeDiff >= 5) {
    dominantPath = 'hybrid';
  } else if (strengthDiff >= 5 && strengthDiff >= knowledgeDiff) {
    dominantPath = 'fitness';
  } else if (knowledgeDiff >= 5 && knowledgeDiff > strengthDiff) {
    dominantPath = 'knowledge';
  } else if (level >= 5) {
    if (strength > knowledge) dominantPath = 'fitness';
    else if (knowledge > strength) dominantPath = 'knowledge';
    else dominantPath = 'hybrid';
  }

  // Determine stage & asset
  let imageFilename = 'base.jpg';
  let stageName = 'Novice Adventurer';
  let stageLevel = 1;
  let archetype = gender === 'FEMALE' ? 'Novice Heroine' : 'Novice Hero';
  let focusTitle = 'Foundation & Fundamentals';
  let evolutionSummary = 'Beginning the quest. Basic daily habits create the hero foundation.';
  let nextUnlockPreview = 'Reach Level 3 & build Strength or Knowledge for Early Evolution.';
  let glowColor = 'rgba(99, 102, 241, 0.25)';
  let borderColor = 'border-indigo-500/30';
  const unlockedFeatures = ['Base Adventurer Gear', 'Daily Quest Tracking'];

  if (level >= 10 || (level >= 7 && (strength >= 30 || knowledge >= 30))) {
    // Stage 5: Elite / Master
    stageLevel = 5;
    stageName = 'Master Sovereign';
    glowColor = 'rgba(245, 158, 11, 0.7)';
    borderColor = 'border-amber-500/60';
    unlockedFeatures.push('Master Celestial Aura', 'Elite Gear Synthesis', 'Sovereign Runes');

    if (dominantPath === 'fitness') {
      imageFilename = 'fitness.jpg';
      archetype = gender === 'FEMALE' ? 'Titan Champion' : 'Apex Athlete';
      focusTitle = 'Peak Physical Mastery';
      evolutionSummary = 'Maximum athletic conditioning, unshakeable stamina, and elite physical dominance.';
      nextUnlockPreview = 'Maximum Master Tier Achieved!';
    } else if (dominantPath === 'knowledge') {
      imageFilename = 'knowledge.jpg';
      archetype = gender === 'FEMALE' ? 'Grand Polymath' : 'Visionary Architect';
      focusTitle = 'Intellectual Supremacy';
      evolutionSummary = 'Deep knowledge mastery, strategic brilliance, and supreme mental acuity.';
      nextUnlockPreview = 'Maximum Master Tier Achieved!';
    } else {
      imageFilename = 'hybrid.jpg';
      archetype = gender === 'FEMALE' ? 'Elysian Vanguard' : 'Transcendent Paragon';
      focusTitle = 'Dual Ascendance: Body & Mind';
      evolutionSummary = 'The ultimate balance: supreme athletic prowess united with elite intellectual mastery.';
      nextUnlockPreview = 'Maximum Master Tier Achieved!';
    }
  } else if (level >= 7) {
    // Stage 4: Advanced
    stageLevel = 4;
    stageName = 'Advanced Challenger';
    glowColor = 'rgba(244, 63, 94, 0.55)';
    borderColor = 'border-rose-500/50';
    unlockedFeatures.push('Advanced Combat/Study Gear', 'Resonant Focus Aura');
    nextUnlockPreview = 'Reach Level 10 to unlock Master Sovereign transformation!';

    if (dominantPath === 'fitness') {
      imageFilename = 'fitness.jpg';
      archetype = gender === 'FEMALE' ? 'Iron Athlete' : 'Iron Striker';
      focusTitle = 'Endurance & Strength Focus';
      evolutionSummary = 'Toned athletic posture and refined training gear built through consistent workouts.';
    } else if (dominantPath === 'knowledge') {
      imageFilename = 'knowledge.jpg';
      archetype = gender === 'FEMALE' ? 'Senior Scholar' : 'Tech Innovator';
      focusTitle = 'Deep Knowledge Focus';
      evolutionSummary = 'Tailored blazer, smart optical visor, and research tools forged from study sessions.';
    } else {
      imageFilename = 'hybrid.jpg';
      archetype = gender === 'FEMALE' ? 'Combat Sage' : 'Athletic Scholar';
      focusTitle = 'Fitness + Knowledge Equilibrium';
      evolutionSummary = 'Harmonious athletic physique combined with cutting-edge intellectual accessories.';
    }
  } else if (level >= 5) {
    // Stage 3: Developing
    stageLevel = 3;
    stageName = 'Developing Adventurer';
    glowColor = 'rgba(168, 85, 247, 0.45)';
    borderColor = 'border-purple-500/40';
    unlockedFeatures.push('Specialized Category Outfit', 'Streak Catalyst');
    nextUnlockPreview = 'Reach Level 7 for Advanced Evolution & Enhanced Appearance.';

    if (dominantPath === 'fitness') {
      imageFilename = 'fitness.jpg';
      archetype = gender === 'FEMALE' ? 'Fitness Enthusiast' : 'Gym Crusader';
      focusTitle = 'Physical Fitness Discipline';
      evolutionSummary = 'Visible athletic toning, sporty performance jacket, and athletic footwear.';
    } else if (dominantPath === 'knowledge') {
      imageFilename = 'knowledge.jpg';
      archetype = gender === 'FEMALE' ? 'Knowledge Seeker' : 'Scholar Explorer';
      focusTitle = 'Learning & Skill Pursuit';
      evolutionSummary = 'Smart professional attire and interactive digital holograms reflecting studious growth.';
    } else {
      imageFilename = 'hybrid.jpg';
      archetype = gender === 'FEMALE' ? 'Balanced Adept' : 'Dual Disciplinarian';
      focusTitle = 'Fitness + Study Integration';
      evolutionSummary = 'Balanced development showing athletic vitality and intellectual focus.';
    }
  } else if (level >= 3) {
    // Stage 2: Early Progress
    stageLevel = 2;
    stageName = 'Early Progress';
    glowColor = 'rgba(59, 130, 246, 0.35)';
    borderColor = 'border-blue-500/30';
    unlockedFeatures.push('Adventurer Utility Belt', 'Energy Pulse');
    nextUnlockPreview = 'Reach Level 5 to unlock specialized Fitness / Scholar visual outfits.';

    if (dominantPath === 'fitness') {
      imageFilename = 'fitness.jpg';
      archetype = gender === 'FEMALE' ? 'Active Trainee' : 'Active Runner';
      focusTitle = 'Awakening Strength';
      evolutionSummary = 'Early muscle definition and athletic momentum beginning to show.';
    } else if (dominantPath === 'knowledge') {
      imageFilename = 'knowledge.jpg';
      archetype = gender === 'FEMALE' ? 'Apprentice Scholar' : 'Junior Analyst';
      focusTitle = 'Expanding Intellect';
      evolutionSummary = 'Developing analytical habits and structured study routines.';
    } else {
      imageFilename = 'base.jpg';
      archetype = gender === 'FEMALE' ? 'Evolving Heroine' : 'Evolving Hero';
      focusTitle = 'Holistic Growth';
      evolutionSummary = 'Balanced improvements across daily routines and task consistency.';
    }
  }

  return {
    gender,
    imageSrc: `/characters/${genderFolder}/${imageFilename}`,
    stageName,
    stageLevel,
    archetype,
    focusTitle,
    evolutionSummary,
    dominantPath,
    unlockedFeatures,
    nextUnlockPreview,
    glowColor,
    borderColor,
  };
}
