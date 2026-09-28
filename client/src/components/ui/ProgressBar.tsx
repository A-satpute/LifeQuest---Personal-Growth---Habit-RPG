import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'purple';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  showLabel = false,
  color = 'indigo',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorGradients = {
    indigo: 'from-indigo-600 via-indigo-500 to-purple-500',
    emerald: 'from-emerald-600 via-emerald-500 to-teal-400',
    amber: 'from-amber-600 via-amber-500 to-yellow-400',
    purple: 'from-purple-600 via-purple-500 to-pink-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-slate-400 font-medium">Progress</span>
          <span className="font-bold text-slate-200">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/80 ${sizeStyles[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorGradients[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
