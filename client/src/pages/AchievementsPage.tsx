import React, { useEffect, useState } from 'react';
import { AnalyticsService } from '../services/analytics.service';
import type { AchievementItem, AchievementsResponse } from '../types/analytics';
import { 
  Trophy, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  Flame, 
  Target, 
  Zap, 
  Crown,
  RefreshCw
} from 'lucide-react';
import { ProgressBar } from '../components/ui/ProgressBar';

export const AchievementsPage: React.FC = () => {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AnalyticsService.getAchievements();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load achievements:', err);
      setError('Unable to load achievements.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      await AnalyticsService.evaluateAchievements();
      await fetchAchievements();
    } catch (err: any) {
      console.error('Failed to sync achievements:', err);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const categories = [
    { key: 'ALL', label: 'All Badges' },
    { key: 'TASKS', label: 'Tasks' },
    { key: 'STREAK', label: 'Streaks' },
    { key: 'LEVEL', label: 'Levels' },
    { key: 'GOALS', label: 'Goals' },
    { key: 'XP', label: 'XP Hunter' },
  ];

  const getAchievementIcon = (key: string, iconStr: string) => {
    switch (key) {
      case 'FIRST_STEP':
        return '👟';
      case 'GETTING_STARTED':
        return '🚀';
      case 'TASK_MASTER':
        return '⚔️';
      case 'CONSISTENT_7':
        return '🔥';
      case 'DEDICATED_30':
        return '🛡️';
      case 'LEVEL_5':
        return '✨';
      case 'LEVEL_10':
        return '👑';
      case 'GOAL_CRUSHER':
        return '🏆';
      case 'XP_HUNTER':
        return '⚡';
      case 'XP_CHAMPION':
        return '🌟';
      default:
        return '🏅';
    }
  };

  const filteredAchievements = (data?.achievements || []).filter((ach) => {
    if (activeCategory === 'ALL') return true;
    return ach.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Hero Achievements & Badges
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Unlock legendary milestones as you build habits, level up, and conquer your goals.
          </p>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={evaluating || loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
          <span>{evaluating ? 'Evaluating...' : 'Check Unlocks'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Overview Progress Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 border border-purple-500/30 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Badge Collection Progress
            </span>
            <span className="font-mono text-xs font-bold text-white">
              {data?.stats.unlocked ?? 0} of {data?.stats.total ?? 0} Unlocked ({data?.stats.completionPercentage ?? 0}%)
            </span>
          </div>

          <ProgressBar
            progress={data?.stats.completionPercentage ?? 0}
            size="md"
            color="purple"
          />

          <p className="text-xs text-slate-400">
            Keep completing daily quests to unlock the remaining {data?.stats.locked ?? 0} badges!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
            🏆
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === c.key
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const isUnlocked = ach.isUnlocked;

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                isUnlocked
                  ? 'bg-slate-900/80 border-purple-500/30 shadow-lg shadow-purple-950/30'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                      isUnlocked
                        ? 'bg-purple-500/20 border-purple-500/40 shadow-md shadow-purple-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? getAchievementIcon(ach.key, ach.icon) : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      +{ach.xpReward} XP
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={`text-base font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                  {ach.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress Section */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Progress</span>
                  <span className={isUnlocked ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                    {ach.progress.current} / {ach.progress.target}
                  </span>
                </div>

                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isUnlocked ? 'bg-emerald-500' : 'bg-purple-500/60'
                    }`}
                    style={{ width: `${ach.progress.percentage}%` }}
                  />
                </div>

                {isUnlocked && ach.unlockedAt && (
                  <p className="text-[10px] text-slate-500 font-mono pt-1">
                    Unlocked on {new Date(ach.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
