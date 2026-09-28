import React, { useEffect, useState } from 'react';
import { gamificationService } from '../services/gamification.service';
import type { GamificationProfile } from '../types/gamification';
import { CharacterAvatar } from '../components/character/CharacterAvatar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { getCharacterAppearance, type CharacterGender } from '../services/characterProgression';
import { useToast } from '../context/ToastContext';
import {
  Flame,
  Trophy,
  Shield,
  BookOpen,
  CheckCircle2,
  Crosshair,
  Repeat,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  Zap,
  Lock,
} from 'lucide-react';

export const CharacterPage: React.FC = () => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGender, setCurrentGender] = useState<CharacterGender>('MALE');
  const [isUpdatingGender, setIsUpdatingGender] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await gamificationService.getProfile();
      setProfile(data);
      if (data.character?.gender) {
        setCurrentGender(data.character.gender.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE');
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load character profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleGenderChange = async (newGender: CharacterGender) => {
    if (newGender === currentGender || isUpdatingGender) return;
    setCurrentGender(newGender);
    setIsUpdatingGender(true);

    try {
      await gamificationService.updateGender(newGender);
      showSuccessToast('Hero Gender Updated', `Switched character model to ${newGender === 'FEMALE' ? 'Female' : 'Male'} Hero.`);
      if (profile) {
        setProfile({
          ...profile,
          character: {
            ...profile.character,
            gender: newGender,
          },
        });
      }
    } catch (err) {
      console.error('Failed to update character gender:', err);
      showErrorToast('Update Failed', 'Could not save gender selection.');
      // Revert on error
      if (profile?.character?.gender) {
        setCurrentGender(profile.character.gender.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE');
      }
    } finally {
      setIsUpdatingGender(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Awakening your hero...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Character Sync Error</h3>
        <p className="text-rose-200/80 text-sm mb-4">{error || 'Unable to fetch hero data'}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { character, levelInfo, stats } = profile;

  // Resolve evolution appearance
  const appearance = getCharacterAppearance({
    gender: currentGender,
    level: character.level,
    stats,
    currentStreak: character.currentStreak,
  });

  // Stat metadata & category mappings
  const statConfig = [
    {
      key: 'strength',
      name: 'Strength',
      value: stats.strength,
      icon: Shield,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      description: 'Built by Fitness and Physical Health routines.',
      maxRef: 100,
    },
    {
      key: 'knowledge',
      name: 'Knowledge',
      value: stats.knowledge,
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      description: 'Forged through Learning, Reading, and Studying.',
      maxRef: 100,
    },
    {
      key: 'discipline',
      name: 'Discipline',
      value: stats.discipline,
      icon: CheckCircle2,
      color: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      description: 'Earned from Work, completing high-priority tasks & habits.',
      maxRef: 100,
    },
    {
      key: 'focus',
      name: 'Focus',
      value: stats.focus,
      icon: Crosshair,
      color: 'from-cyan-500 to-teal-600',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      description: 'Honed through Mindfulness and Deep Work sessions.',
      maxRef: 100,
    },
    {
      key: 'consistency',
      name: 'Consistency',
      value: stats.consistency,
      icon: Repeat,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      description: 'Boosted by daily bonuses and unbroken streaks.',
      maxRef: 100,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar display with 3D Character Model */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <CharacterAvatar
              gender={currentGender}
              stage={character.stage}
              level={character.level}
              stats={stats}
              currentStreak={character.currentStreak}
              size="xl"
              showBadge={true}
              showArchetype={false}
            />

            {/* Character Gender Selector */}
            <div className="mt-5 p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleGenderChange('MALE')}
                disabled={isUpdatingGender}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentGender === 'MALE'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👦</span>
                <span>Male</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('FEMALE')}
                disabled={isUpdatingGender}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentGender === 'FEMALE'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👧</span>
                <span>Female</span>
              </button>
            </div>
          </div>

          {/* Hero Identity & Level Details */}
          <div className="flex-grow space-y-4 text-center md:text-left w-full">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{character.name}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {character.title}
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {character.stage} Stage
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm">
                Your character advances in power, stats, and appearance as you complete daily goals and habits.
              </p>
            </div>

            {/* Level & XP Progress Meter */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Level {levelInfo.level} Hero
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  {levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForNextLevel} XP ({levelInfo.progressPercentage}%)
                </span>
              </div>
              <ProgressBar
                progress={levelInfo.progressPercentage}
                color="purple"
                size="md"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total XP Earned: <strong className="text-slate-300 font-mono">{character.totalXP} XP</strong></span>
                <span>Next Rank at: <strong className="text-slate-300 font-mono">{levelInfo.nextLevelXP} XP</strong></span>
              </div>
            </div>

            {/* Streak & Activity Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Active Streak</div>
                  <div className="text-base sm:text-lg font-bold text-white font-mono">{character.currentStreak} Days</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Longest Streak</div>
                  <div className="text-base sm:text-lg font-bold text-white font-mono">{character.longestStreak} Days</div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Last Active</div>
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {character.lastActiveDate || 'Today'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Evolution Card (Mandatory Requirement 5 & 9) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Character Evolution Matrix</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual transformation powered by your task categories, consistency, and RPG stats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Archetype: {appearance.archetype}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Current Focus */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Focus</span>
            <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {appearance.focusTitle}
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {appearance.evolutionSummary}
            </p>
          </div>

          {/* Unlocked Visual Elements */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Visual Traits</span>
            <div className="flex flex-wrap gap-1.5">
              {appearance.unlockedFeatures.map((trait, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[11px] font-medium"
                >
                  ✓ {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Next Evolution Milestone */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Next Evolution Milestone
            </span>
            <p className="text-sm font-semibold text-slate-200">
              {appearance.nextUnlockPreview}
            </p>
            <p className="text-[11px] text-slate-500">
              Complete more tasks in your focus areas to evolve your character's visual stage.
            </p>
          </div>
        </div>
      </div>

      {/* RPG Character Attributes / Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              RPG Character Stats
            </h2>
            <p className="text-slate-400 text-xs">
              Every completed task channels power into corresponding character attributes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statConfig.map((item) => {
            const Icon = item.icon;
            const percentage = Math.min(100, Math.round((item.value / item.maxRef) * 100));

            return (
              <div
                key={item.key}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-mono font-extrabold ${item.textColor}`}>
                      {item.value}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">PTS</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="text-[11px]">Power Tier</span>
                    <span className="font-mono text-[11px]">{item.value} / {item.maxRef}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
