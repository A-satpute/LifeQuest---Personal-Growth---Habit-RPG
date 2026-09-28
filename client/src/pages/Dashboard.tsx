import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { TaskInstance, CreateTaskPayload } from '../types/tasks';
import type { Goal, CreateGoalPayload } from '../types/goals';
import type { GamificationProfile } from '../types/gamification';
import { TaskService } from '../services/task.service';
import { GoalService } from '../services/goal.service';
import { gamificationService } from '../services/gamification.service';
import { TaskCard } from '../components/tasks/TaskCard';
import { GoalCard } from '../components/goals/GoalCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { GoalFormModal } from '../components/goals/GoalFormModal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CharacterAvatar } from '../components/character/CharacterAvatar';
import { DailyAiSuggestionsCard } from '../components/dashboard/DailyAiSuggestionsCard';
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar';
import { analyticsService } from '../services/analytics.service';
import type { AnalyticsOverview } from '../types/analytics';
import { 
  Sparkles, 
  Target, 
  CheckSquare, 
  Plus, 
  ArrowRight,
  Clock,
  Flame,
  Shield,
  BookOpen,
  Award,
  BarChart3,
  Trophy,
  Calendar,
  Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [todayTasks, setTodayTasks] = useState<TaskInstance[]>([]);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, pending: 0, completionPercentage: 0 });
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [taskModalGoalId, setTaskModalGoalId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [todayData, goalsData, profileData, analyticsData] = await Promise.all([
        TaskService.getTodayTasks(),
        GoalService.getGoals('ACTIVE'),
        gamificationService.getProfile().catch(() => null),
        analyticsService.getOverview('30d').catch(() => null),
      ]);
      setTodayTasks(todayData.tasks);
      setTodayStats(todayData.stats);
      setActiveGoals(goalsData);
      if (profileData) {
        setProfile(profileData);
      }
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const { showRpgToast, showInfoToast, showErrorToast } = useToast();

  const handleToggleTask = async (id: string, completed: boolean) => {
    // Optimistic UI update
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null } : t))
    );

    try {
      const res = await TaskService.toggleComplete(id, completed);
      
      if (completed) {
        const g = res.gamification;
        const achievementTitle = g?.unlockedAchievements?.[0]?.title;
        showRpgToast({
          title: 'Quest Completed! ⚡',
          message: g?.xpAwarded ? `+${g.xpAwarded} XP awarded to your hero.` : 'Task marked as done!',
          xp: g?.xpAwarded,
          streak: g?.currentStreak,
          leveledUp: g?.leveledUp,
          newLevel: g?.newLevel,
          newStage: g?.newStage,
          dailyBonus: g?.dailyBonusAwarded,
          achievementTitle,
        });
      } else {
        showInfoToast('Task Uncompleted', 'Task marked pending. XP and streak adjusted.');
      }

      // Reload stats, goal progress, gamification profile, and analytics
      const [todayData, goalsData, profileData, analyticsData] = await Promise.all([
        TaskService.getTodayTasks(),
        GoalService.getGoals('ACTIVE'),
        gamificationService.getProfile().catch(() => null),
        analyticsService.getOverview('30d').catch(() => null),
      ]);
      setTodayStats(todayData.stats);
      setActiveGoals(goalsData);
      if (profileData) {
        setProfile(profileData);
      }
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      showErrorToast('Failed to update task', 'Could not save task state to server.');
      await loadDashboardData();
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    await TaskService.createTask(payload);
    await loadDashboardData();
  };

  const handleCreateGoal = async (payload: CreateGoalPayload) => {
    await GoalService.createGoal(payload);
    await loadDashboardData();
  };

  const char = profile?.character;
  const levelInfo = profile?.levelInfo;
  const stats = profile?.stats;

  return (
    <div className="space-y-6">
      {/* Gamified Hero Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 shadow-xl">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Link to="/profile" className="flex-shrink-0 group relative block" title="Manage Hero Profile Picture">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-all">
                <div className="w-full h-full bg-[#0c1220] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-indigo-400">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                Lv.{char?.level || 1}
              </div>
            </Link>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Level {char?.level || 1} • {char?.stage || 'Beginner'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {char?.currentStreak || 0} Day Streak
                </span>
                {analytics && (
                  <Link
                    to="/achievements"
                    className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{analytics.achievements.unlockedCount} / {analytics.achievements.totalCount} Badges</span>
                  </Link>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name}! ⚡
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Every task completed builds your character stats, earns XP, and advances your life goals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <Link
              to="/analytics"
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/achievements"
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Badges</span>
            </Link>
            <Link
              to="/history"
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>History</span>
            </Link>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Target className="w-4 h-4 text-indigo-400" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Level XP Progress Bar in Hero */}
        {levelInfo && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span>XP Progress:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForNextLevel} XP
              </span>
              <span className="text-slate-500">({levelInfo.progressPercentage}%)</span>
            </div>
            <div className="flex-grow max-w-md">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-slate-400 text-[11px] font-mono">
              Total: {char?.totalXP || 0} XP
            </div>
          </div>
        )}
      </div>

      {/* Quick Insights Matrix (Phase 6 Polish) */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link
            to="/analytics"
            className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>30-Day Completion</span>
              <BarChart3 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono">
                {analytics.tasks.completionRate}%
              </div>
              <div className="text-[11px] text-slate-400">
                {analytics.tasks.completed} done of {analytics.tasks.total} instances
              </div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Habit Streak</span>
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono">
                {analytics.streak.currentStreak} Days
              </div>
              <div className="text-[11px] text-slate-400">
                Best Record: {analytics.streak.longestStreak} Days
              </div>
            </div>
          </Link>

          <Link
            to="/achievements"
            className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Achievements</span>
              <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono">
                {analytics.achievements.unlockedCount} / {analytics.achievements.totalCount}
              </div>
              <div className="text-[11px] text-slate-400">
                {analytics.achievements.unlockRate}% badges claimed
              </div>
            </div>
          </Link>

          <Link
            to="/history"
            className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Goal Journey</span>
              <Target className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono">
                {analytics.goals.completed} / {analytics.goals.total}
              </div>
              <div className="text-[11px] text-slate-400">
                {analytics.goals.active} active quests in progress
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 2-Column Section: Today's Progress & Month Consistency Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Progress + Daily AI Coach */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Progress Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                  <span>Today's Progress</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todayStats.completed} of {todayStats.total} daily actions completed
                  {todayStats.total > 0 && todayStats.completed === todayStats.total && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-mono text-[10px]">
                      Daily Bonus Earned! (+25 XP)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {todayStats.completionPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <ProgressBar
              progress={todayStats.completionPercentage}
              size="lg"
              color={todayStats.completionPercentage === 100 ? 'emerald' : todayStats.completionPercentage > 50 ? 'indigo' : 'amber'}
            />
          </div>

          {/* Daily AI Coach Suggestions */}
          <DailyAiSuggestionsCard />
        </div>

        {/* Right Column: Month Calendar (Visualizes daily task completion consistency) */}
        <div className="lg:col-span-5">
          <DashboardCalendar />
        </div>
      </div>

      {/* Main 2-Column Section: Today's Tasks & Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Today's Tasks Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Today's Tasks</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {todayTasks.length}
              </span>
            </div>
            <Link
              to="/tasks"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Loading today's quest tasks...
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
              <p className="text-xs text-slate-400 mb-3">No tasks scheduled for today yet.</p>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right (1 Col): Active Goals Roadmap */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Active Goals</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {activeGoals.length}
              </span>
            </div>
            <Link
              to="/goals"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Loading active goals...
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
              <p className="text-xs text-slate-400 mb-3">No active goals found.</p>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Goal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onStatusChange={loadDashboardData}
                  onDelete={loadDashboardData}
                  onAddTask={(gId) => {
                    setTaskModalGoalId(gId);
                    setIsTaskModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalGoalId(null);
        }}
        onSubmit={handleCreateTask}
        goals={activeGoals}
        defaultGoalId={taskModalGoalId || undefined}
      />

      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
};
