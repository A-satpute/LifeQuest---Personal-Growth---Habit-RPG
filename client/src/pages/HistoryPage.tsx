import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnalyticsService } from '../services/analytics.service';
import { GoalService } from '../services/goal.service';
import { gamificationService } from '../services/gamification.service';
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar';
import type { TaskInstance } from '../types/tasks';
import type { Goal } from '../types/goals';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  X,
  Flame
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDateParam = searchParams.get('date') || '';

  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selected date from calendar or URL
  const [selectedDate, setSelectedDate] = useState<string>(urlDateParam);

  // Filters State
  const [startDate, setStartDate] = useState(urlDateParam);
  const [endDate, setEndDate] = useState(urlDateParam);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [historyData, goalsData, profileData] = await Promise.all([
        AnalyticsService.getHistory({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          goalId: selectedGoalId || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        }),
        GoalService.getGoals(),
        gamificationService.getProfile().catch(() => null),
      ]);
      setInstances(historyData);
      setGoals(goalsData);
      if (profileData?.character) {
        setCurrentStreak(profileData.character.currentStreak || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, selectedGoalId, selectedCategory, selectedStatus]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setStartDate(dateStr);
    setEndDate(dateStr);
    setSearchParams({ date: dateStr });
  };

  const clearSelectedDate = () => {
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  const clearFilters = () => {
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    setSelectedGoalId('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchParams({});
  };

  // Group instances by taskDate
  const groupedByDate: Record<string, TaskInstance[]> = {};
  for (const inst of instances) {
    if (!groupedByDate[inst.taskDate]) {
      groupedByDate[inst.taskDate] = [];
    }
    groupedByDate[inst.taskDate].push(inst);
  }

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const categories = ['ALL', 'Fitness', 'Learning', 'Work', 'Health', 'Habit', 'Mindfulness', 'General'];

  // Detail stats for selected day (or overall if none selected)
  const activeFocusInstances = selectedDate ? instances.filter((i) => i.taskDate === selectedDate) : instances;
  const activeFocusCompleted = activeFocusInstances.filter((i) => i.completed).length;
  const activeFocusXp = activeFocusInstances.filter((i) => i.completed).reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Quest History & Calendar Log
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect past daily routines, review completed milestones, and track your consistency trail.
          </p>
        </div>

        {selectedDate && (
          <button
            onClick={clearSelectedDate}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Clear Date Focus ({selectedDate})</span>
          </button>
        )}
      </div>

      {/* Month Calendar Component */}
      <DashboardCalendar
        compact={true}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        className="border-indigo-500/20"
      />

      {/* Selected Day Focus Banner (Section 10 Requirement) */}
      {selectedDate && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                History for {selectedDate}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Day Performance Summary
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Streak: {currentStreak} days</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Tasks Completed</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {activeFocusCompleted} / {activeFocusInstances.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">XP Earned</span>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                +{activeFocusXp} XP
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Day Rating</span>
              <div className="text-lg font-bold font-mono mt-0.5">
                {activeFocusInstances.length > 0 && activeFocusCompleted === activeFocusInstances.length ? (
                  <span className="text-emerald-400">100% Perfect ✓</span>
                ) : activeFocusInstances.length === 0 ? (
                  <span className="text-slate-500">No Quests</span>
                ) : (
                  <span className="text-amber-400">
                    {Math.round((activeFocusCompleted / activeFocusInstances.length) * 100)}% Complete
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Task Overview</span>
              <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                {activeFocusInstances.length === 0 ? (
                  'No actions logged'
                ) : (
                  activeFocusInstances.slice(0, 2).map((t) => (t.completed ? '✓ ' : '✗ ') + t.title).join(' • ')
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Historical Records</span>
          </span>

          {(startDate || endDate || selectedGoalId || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>

          {/* Goal Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Goal</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            >
              <option value="">All Goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Log Timeline */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading historical entries...
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dayInstances = groupedByDate[dateStr];
            const completedCount = dayInstances.filter((t) => t.completed).length;

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Header Badge */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white font-mono">{dateStr}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {completedCount} / {dayInstances.length} Completed
                  </span>
                </div>

                {/* Day Tasks List */}
                <div className="space-y-2">
                  {dayInstances.map((inst) => (
                    <div
                      key={inst.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        inst.completed
                          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            inst.completed
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {inst.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <h4 className={`text-xs sm:text-sm font-semibold ${inst.completed ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                            {inst.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{inst.category}</span>
                            <span>•</span>
                            <span className="font-mono">{inst.priority}</span>
                            {inst.goal && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400">🎯 {inst.goal.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {inst.completed ? (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <p className="text-sm font-semibold text-slate-300">No History Records Found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or complete more daily tasks.</p>
        </div>
      )}
    </div>
  );
};
