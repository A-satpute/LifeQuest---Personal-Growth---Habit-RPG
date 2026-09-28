import React, { useState } from 'react';
import type { Goal, GoalStatus } from '../../types/goals';
import { ProgressBar } from '../ui/ProgressBar';
import { 
  Target, 
  Calendar, 
  Play, 
  Pause, 
  CheckCircle, 
  Trash2, 
  Plus,
  CheckCircle2
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onStatusChange: (id: string, status: GoalStatus) => void;
  onDelete: (id: string) => void;
  onAddTask?: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onStatusChange,
  onDelete,
  onAddTask,
}) => {
  const [isBusy, setIsBusy] = useState(false);

  const statusStyles: Record<GoalStatus, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CANCELLED: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const priorityStyles = {
    LOW: 'text-emerald-400',
    MEDIUM: 'text-blue-400',
    HIGH: 'text-amber-400',
    URGENT: 'text-rose-400',
  };

  const handleTogglePause = async () => {
    setIsBusy(true);
    try {
      const nextStatus: GoalStatus = goal.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      await onStatusChange(goal.id, nextStatus);
    } finally {
      setIsBusy(false);
    }
  };

  const handleComplete = async () => {
    setIsBusy(true);
    try {
      const nextStatus: GoalStatus = goal.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
      await onStatusChange(goal.id, nextStatus);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete goal "${goal.title}"?`)) {
      setIsBusy(true);
      try {
        await onDelete(goal.id);
      } finally {
        setIsBusy(false);
      }
    }
  };

  const metrics = goal.metrics || {
    completedTasks: 0,
    totalTasks: 0,
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
      <div>
        {/* Header row: category, priority, status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">
              {goal.category}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityStyles[goal.priority]}`}>
              ● {goal.priority}
            </span>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyles[goal.status]}`}>
            {goal.status}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-white tracking-tight leading-snug mb-1">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {goal.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="space-y-1.5 my-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Goal Progress</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[11px] text-slate-400">
                ({metrics.completedTasks}/{metrics.totalTasks} tasks)
              </span>
              <span className="font-extrabold text-white">{Math.round(goal.progress)}%</span>
            </div>
          </div>
          <ProgressBar
            progress={goal.progress}
            size="md"
            color={goal.progress === 100 ? 'emerald' : goal.progress > 50 ? 'indigo' : 'amber'}
          />
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-600" />
            <span>Started: {new Date(goal.startDate).toLocaleDateString()}</span>
          </div>
          {goal.endDate && (
            <div className="flex items-center gap-1">
              <span>Target: {new Date(goal.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5">
          {/* Pause / Resume */}
          <button
            type="button"
            disabled={isBusy}
            onClick={handleTogglePause}
            title={goal.status === 'PAUSED' ? 'Resume Goal' : 'Pause Goal'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            {goal.status === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Complete / Uncomplete */}
          <button
            type="button"
            disabled={isBusy}
            onClick={handleComplete}
            title={goal.status === 'COMPLETED' ? 'Mark In Progress' : 'Mark Completed'}
            className={`p-1.5 rounded-lg transition-colors ${
              goal.status === 'COMPLETED'
                ? 'text-purple-400 hover:bg-purple-500/10'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            disabled={isBusy}
            onClick={handleDelete}
            title="Delete Goal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Add task shortcut */}
        {onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(goal.id)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};
