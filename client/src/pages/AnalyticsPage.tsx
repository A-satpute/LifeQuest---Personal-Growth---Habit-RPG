import React, { useEffect, useState } from 'react';
import { AnalyticsService } from '../services/analytics.service';
import type { AnalyticsOverview, CompletionTrendItem, DailyXpItem, XpTransactionHistoryItem, ActivityHeatmapData, GoalAnalyticsItem, TimeRange } from '../types/analytics';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { CompletionChart } from '../components/analytics/CompletionChart';
import { XpChart } from '../components/analytics/XpChart';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Zap, 
  Target, 
  Trophy, 
  Shield, 
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { ProgressBar } from '../components/ui/ProgressBar';

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('30d');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [completionTrends, setCompletionTrends] = useState<CompletionTrendItem[]>([]);
  const [dailyXp, setDailyXp] = useState<DailyXpItem[]>([]);
  const [recentXpHistory, setRecentXpHistory] = useState<XpTransactionHistoryItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<ActivityHeatmapData | null>(null);
  const [goalsAnalytics, setGoalsAnalytics] = useState<GoalAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedRange: TimeRange) => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, completionData, xpData, heatmapRes, goalsRes] = await Promise.all([
        AnalyticsService.getOverview(selectedRange),
        AnalyticsService.getCompletion(selectedRange),
        AnalyticsService.getXp(selectedRange),
        AnalyticsService.getHeatmap(new Date().getFullYear()),
        AnalyticsService.getGoals(),
      ]);

      setOverview(overviewData);
      setCompletionTrends(completionData.trends);
      setDailyXp(xpData.dailyXp);
      setRecentXpHistory(xpData.recentHistory);
      setHeatmapData(heatmapRes);
      setGoalsAnalytics(goalsRes);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const ranges: Array<{ key: TimeRange; label: string }> = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Progress & Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Measurable, date-accurate tracking of your consistency, XP momentum, and goal completions.
          </p>
        </div>

        {/* Range Selector Pill Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl self-start sm:self-auto">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {overview?.tasks.completionRate ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview?.tasks.completed ?? 0} of {overview?.tasks.total ?? 0} tasks done
          </p>
        </div>

        {/* XP Earned */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>XP in Period</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              +{overview?.xp.totalEarnedInRange ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">XP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lifetime: {overview?.xp.lifetimeTotalXP ?? 0} XP
          </p>
        </div>

        {/* Consistency Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Streak Defense</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {overview?.streak.current ?? 0}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Longest record: {overview?.streak.longest ?? 0} days
          </p>
        </div>

        {/* Achievements Unlocked */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Badges Unlocked</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
              {overview?.achievements.unlocked ?? 0}
            </span>
            <span className="text-xs text-slate-400">/ {overview?.achievements.total ?? 0}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview?.achievements.percentage ?? 0}% completed
          </p>
        </div>
      </div>

      {/* GitHub-style Annual Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} loading={loading} />

      {/* Completion & XP Charts 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionChart trends={completionTrends} loading={loading} />
        <XpChart dailyXp={dailyXp} recentHistory={recentXpHistory} loading={loading} />
      </div>

      {/* Goals Progress Breakdown & Character Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Progress Breakdown (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🎯</span> Goal Trajectory & Task Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated completion percentages based on concrete task instances
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {overview?.goals.active ?? 0} Active • {overview?.goals.completed ?? 0} Done
            </span>
          </div>

          {goalsAnalytics.length > 0 ? (
            <div className="space-y-4">
              {goalsAnalytics.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{goal.title}</h4>
                      <span className="text-[11px] text-slate-400">
                        {goal.category} • {goal.priority} priority
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {goal.progress}%
                    </span>
                  </div>

                  <ProgressBar progress={goal.progress} size="sm" color="indigo" />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>
                      {goal.metrics.completedTaskInstances} / {goal.metrics.totalTaskInstances} tasks completed
                    </span>
                    <span>Status: {goal.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              No goals registered yet. Create a goal to track trajectory.
            </div>
          )}
        </div>

        {/* Character RPG Stats Progress (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Hero RPG Stats</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
              Level {overview?.character.level ?? 1}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {overview?.character.name} ({overview?.character.stage})
          </p>

          {overview?.character.stats ? (
            <div className="space-y-3 pt-2">
              {[
                { label: 'Strength (Fitness)', value: overview.character.stats.strength, icon: '⚔️', color: 'rose' },
                { label: 'Knowledge (Learning)', value: overview.character.stats.knowledge, icon: '📚', color: 'indigo' },
                { label: 'Discipline (Daily Routines)', value: overview.character.stats.discipline, icon: '🛡️', color: 'purple' },
                { label: 'Focus (Deep Work)', value: overview.character.stats.focus, icon: '🎯', color: 'emerald' },
                { label: 'Consistency (Streaks)', value: overview.character.stats.consistency, icon: '🔥', color: 'amber' },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span>{stat.icon}</span>
                      <span>{stat.label}</span>
                    </span>
                    <span className="font-mono font-bold text-white">{stat.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${stat.color}-500 transition-all`}
                      style={{ width: `${Math.min(stat.value * 2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Character stats pending initialization.</p>
          )}
        </div>
      </div>
    </div>
  );
};
