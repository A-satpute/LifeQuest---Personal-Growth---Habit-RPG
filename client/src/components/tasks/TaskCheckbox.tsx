import React from 'react';
import { Check } from 'lucide-react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TaskCheckbox: React.FC<TaskCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconMap = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`
        ${sizeMap[size]} rounded-lg flex items-center justify-center transition-all duration-200 shrink-0
        ${
          checked
            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400 text-white shadow-lg shadow-emerald-600/30 scale-105'
            : 'bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500 text-transparent hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Check
        className={`${iconMap[size]} stroke-[3] transition-transform duration-200 ${
          checked ? 'scale-100' : 'scale-0'
        }`}
      />
    </button>
  );
};
