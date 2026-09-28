import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Goal, GoalStatus, CreateGoalPayload } from '../types/goals';
import type { CreateTaskPayload } from '../types/tasks';
import { GoalService } from '../services/goal.service';
import { TaskService } from '../services/task.service';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalFormModal } from '../components/goals/GoalFormModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { useToast } from '../context/ToastContext';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'ALL' | GoalStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [taskModalGoalId, setTaskModalGoalId] = useState<string | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GoalService.getGoals(statusFilter === 'ALL' ? undefined : statusFilter);
      setGoals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [statusFilter]);

  const handleCreateGoal = async (payload: CreateGoalPayload) => {
    try {
      await GoalService.createGoal(payload);
      showSuccessToast('Goal Created!', `"${payload.title}" has been launched.`);
      await fetchGoals();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to create goal.');
    }
  };

  const handleStatusChange = async (id: string, status: GoalStatus) => {
    try {
      await GoalService.updateGoalStatus(id, status);
      showSuccessToast('Goal Updated', `Status changed to ${status}.`);
      await fetchGoals();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to update goal status.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await GoalService.deleteGoal(id);
      showSuccessToast('Goal Deleted', 'The goal and its milestones have been removed.');
      await fetchGoals();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to delete goal.');
    }
  };

  const handleCreateTaskForGoal = async (payload: CreateTaskPayload) => {
    try {
      await TaskService.createTask(payload);
      showSuccessToast('Task Added!', `"${payload.title}" connected to your goal.`);
      await fetchGoals();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Failed to add task.');
    }
  };

  // Filtered goals by search text
  const filteredGoals = goals.filter((g) => {
    if (!searchQuery.trim()) return true;
    return (
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Core Objective Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Strategic Life Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Define your self-improvement objectives. Every task instance completed contributes directly to your goal's progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            to="/ai-architect"
            className="px-3.5 py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Roadmap</span>
          </Link>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'PAUSED'] as const).map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                  ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }
                `}
              >
                {tab === 'ALL' ? 'All Goals' : tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading your life goals...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Goals Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {searchQuery
              ? 'No goals match your search filter.'
              : 'You haven’t established any goals yet. Start your quest manually or let our AI Architect craft a complete roadmap for you!'}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Goal</span>
            </button>
            <Link
              to="/ai-architect"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI Architect</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteGoal}
              onAddTask={(gId) => setTaskModalGoalId(gId)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      <TaskFormModal
        isOpen={!!taskModalGoalId}
        defaultGoalId={taskModalGoalId || undefined}
        onClose={() => setTaskModalGoalId(null)}
        onSubmit={handleCreateTaskForGoal}
      />
    </div>
  );
};
