import React, { useState, useEffect } from 'react';
import type { CreateTaskPayload, RecurrenceType } from '../../types/tasks';
import type { Goal, Priority } from '../../types/goals';
import { GoalService } from '../../services/goal.service';
import { 
  X, 
  Calendar, 
  Clock, 
  Repeat, 
  Target, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  initialDate?: string;
  defaultGoalId?: string;
}

const CATEGORIES = ['Fitness', 'Learning', 'Health', 'Routine', 'Career', 'Personal'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  defaultGoalId,
}) => {
  const todayStr = initialDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState(defaultGoalId || '');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [taskDate, setTaskDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('');

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 3, 5]); // default Mon, Wed, Fri
  const [endDate, setEndDate] = useState('');

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      GoalService.getGoals('ACTIVE')
        .then(setGoals)
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    if (recurrenceDays.includes(day)) {
      if (recurrenceDays.length > 1) {
        setRecurrenceDays(recurrenceDays.filter((d) => d !== day));
      }
    } else {
      setRecurrenceDays([...recurrenceDays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (isRecurring && (recurrenceType === 'WEEKLY' || recurrenceType === 'SELECTED_DAYS') && recurrenceDays.length === 0) {
      setError('Please select at least one recurrence day');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        goalId: goalId || null,
        category,
        priority,
        taskDate,
        dueTime: dueTime || null,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : 'NONE',
        recurrenceDays: isRecurring ? recurrenceDays : [],
        endDate: isRecurring && endDate ? endDate : null,
      });
      onClose();
      // reset form
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="task-modal-title" className="text-lg font-bold text-white leading-tight">Create Quest Task</h2>
              <p className="text-xs text-slate-400">Add an action item or recurring routine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Minutes Cardio Workout"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, reps, or checklists..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Goal Linkage & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Link to Goal (Optional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="">-- Independent Task --</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`
                      py-1.5 text-xs font-bold rounded-lg border transition-all text-center
                      ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                      }
                    `}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Task Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Time (Optional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Recurring Task Accordion */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">Make this a Recurring Routine</span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Recurrence Schedule
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="DAILY">Daily (Every Day)</option>
                    <option value="WEEKLY">Weekly on Selected Days</option>
                    <option value="SELECTED_DAYS">Custom Selected Days</option>
                  </select>
                </div>

                {recurrenceType !== 'DAILY' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Active Days
                    </label>
                    <div className="flex items-center justify-between gap-1">
                      {DAYS_OF_WEEK.map((d) => {
                        const selected = recurrenceDays.includes(d.value);
                        return (
                          <button
                            type="button"
                            key={d.value}
                            onClick={() => toggleDay(d.value)}
                            className={`
                              flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all
                              ${
                                selected
                                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/30'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                              }
                            `}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating Task...' : 'Add Task to Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
