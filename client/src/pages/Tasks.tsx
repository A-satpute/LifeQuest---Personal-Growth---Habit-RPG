import React, { useState, useEffect } from 'react';
import type { TaskInstance, CreateTaskPayload } from '../types/tasks';
import { TaskService } from '../services/task.service';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

type ViewTab = 'TODAY' | 'UPCOMING' | 'ALL' | 'PENDING' | 'COMPLETED';

export const Tasks: React.FC = () => {
  const { showRpgToast, showInfoToast, showSuccessToast, showErrorToast } = useToast();
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, completionPercentage: 0 });
  const [activeTab, setActiveTab] = useState<ViewTab>('TODAY');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'TODAY') {
        const res = await TaskService.getTodayTasks();
        setTasks(res.tasks);
        setTodayStats(res.stats);
      } else if (activeTab === 'UPCOMING') {
        const res = await TaskService.getUpcomingTasks();
        setTasks(res.tasks);
      } else {
        const statusMap = {
          ALL: undefined,
          PENDING: 'pending' as const,
          COMPLETED: 'completed' as const,
        };
        const data = await TaskService.getTasks({
          status: statusMap[activeTab as 'ALL' | 'PENDING' | 'COMPLETED'],
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          search: searchQuery || undefined,
        });
        setTasks(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab, categoryFilter, priorityFilter]);

  const handleToggleTask = async (id: string, completed: boolean) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null } : t))
    );

    try {
      const res = await TaskService.toggleComplete(id, completed);

      if (completed) {
        const g = res.gamification;
        const achievementTitle = g?.unlockedAchievements?.[0]?.title;
        showRpgToast({
          title: 'Quest Completed! ⚡',
          message: g?.xpAwarded ? `+${g.xpAwarded} XP awarded to your hero.` : 'Task completed!',
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

      // Refresh today stats if on today tab
      if (activeTab === 'TODAY') {
        const todayData = await TaskService.getTodayTasks();
        setTodayStats(todayData.stats);
      }
    } catch (err: any) {
      showErrorToast('Failed to update task', err.message || 'Could not save task state.');
      await fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await TaskService.deleteInstance(id);
      showSuccessToast('Task Deleted', 'The task instance has been removed.');
      await fetchTasks();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to delete task.');
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      await TaskService.createTask(payload);
      showSuccessToast('Task Created!', `"${payload.title}" added to your quests.`);
      await fetchTasks();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to create task.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'TODAY' || activeTab === 'UPCOMING') {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Phase 2: Task & Routine Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Daily Tasks & Routines
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Execute your daily action plan with one-click completions. Individual task instances are isolated by date for flawless consistency tracking.
          </p>
        </div>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Controls */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Main Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'TODAY', label: "Today's Tasks" },
            { id: 'UPCOMING', label: 'Upcoming (7 Days)' },
            { id: 'ALL', label: 'All Occurrences' },
            { id: 'PENDING', label: 'Pending Only' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ViewTab)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                  ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="Fitness">Fitness</option>
            <option value="Learning">Learning</option>
            <option value="Health">Health</option>
            <option value="Routine">Routine</option>
            <option value="Career">Career</option>
            <option value="Personal">Personal</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Today Progress Header (when Today tab is selected) */}
      {activeTab === 'TODAY' && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {todayStats.completionPercentage}%
            </div>
            <div>
              <p className="text-xs font-bold text-white">Today's Quest Completion</p>
              <p className="text-[11px] text-slate-400">
                {todayStats.completed} of {todayStats.total} tasks completed
              </p>
            </div>
          </div>

          <div className="w-48 hidden sm:block">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${todayStats.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading tasks and synchronizing daily routines...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Tasks Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {activeTab === 'TODAY'
              ? "You have no tasks scheduled for today. Add a new task or routine to start today's journey!"
              : 'No tasks match the selected filters.'}
          </p>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
