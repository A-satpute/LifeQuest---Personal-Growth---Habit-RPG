import React, { useState } from 'react';
import type { TaskInstance } from '../../types/tasks';
import { TaskCheckbox } from './TaskCheckbox';
import { 
  Clock, 
  Target, 
  Repeat, 
  Trash2, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface TaskCardProps {
  task: TaskInstance;
  onToggle: (id: string, completed: boolean) => void;
  onDelete?: (id: string) => void;
  onDeleteTemplate?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onDelete,
  onDeleteTemplate,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityStyles = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`
        glass-panel p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 group
        ${
          task.completed
            ? 'bg-slate-900/40 border-slate-800/60 opacity-70 hover:opacity-100'
            : 'hover:border-slate-700/80 hover:shadow-lg hover:shadow-black/20'
        }
      `}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <TaskCheckbox
          checked={task.completed}
          onChange={(newChecked) => onToggle(task.id, newChecked)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={`text-sm font-semibold tracking-tight transition-all duration-200 ${
              task.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}
          >
            {task.title}
          </span>

          {/* Priority Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              priorityStyles[task.priority] || priorityStyles.MEDIUM
            }`}
          >
            {task.priority}
          </span>

          {/* Category */}
          <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">
            {task.category}
          </span>

          {/* Recurring indicator */}
          {task.task?.isRecurring && (
            <span
              title={`Recurring: ${task.task.recurrenceType}`}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20"
            >
              <Repeat className="w-3 h-3" />
              <span>{task.task.recurrenceType}</span>
            </span>
          )}
        </div>

        {task.description && (
          <p
            className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
              task.completed ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
          {/* Linked Goal */}
          {task.goal && (
            <div className="flex items-center gap-1 text-indigo-400 font-medium">
              <Target className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{task.goal.title}</span>
            </div>
          )}

          {/* Due Time */}
          {task.dueTime && (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{task.dueTime}</span>
            </div>
          )}

          {/* Task Date */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{task.taskDate}</span>
          </div>

          {/* Completion timestamp if completed */}
          {task.completed && task.completedAt && (
            <span className="text-[10px] text-emerald-500/80">
              ✓ Done {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Delete Action */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete this task occurrence"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
