import React from 'react';
import type { CompletionTrendItem } from '../../types/analytics';

interface CompletionChartProps {
  trends: CompletionTrendItem[];
  loading?: boolean;
}

export const CompletionChart: React.FC<CompletionChartProps> = ({ trends, loading }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-4">Task Completion Trends</h3>
        <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
          Loading trend data...
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md text-center py-12">
        <p className="text-sm font-semibold text-slate-300">No Task Activity in Selected Range</p>
        <p className="text-xs text-slate-500 mt-1">Complete your daily routine tasks to generate completion trends.</p>
      </div>
    );
  }

  // Find max total count for scaling bars
  const maxTotal = Math.max(...trends.map((t) => t.total), 1);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📊</span> Task Completion Dynamics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily ratio of completed vs pending quest actions
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Pending
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[500px] h-48 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
          {trends.slice(-14).map((t, idx) => {
            const totalHeight = ((t.completed + t.pending) / maxTotal) * 100;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono text-slate-200">
                  {t.date}: {t.completed}/{t.total} done ({t.completionRate}%)
                </div>

                {/* Stacked Bar */}
                <div
                  className="w-full max-w-[28px] rounded-t flex flex-col-reverse overflow-hidden bg-slate-800/50"
                  style={{ height: `${Math.max(totalHeight, 6)}%` }}
                >
                  <div
                    className="bg-emerald-500 hover:bg-emerald-400 transition-all"
                    style={{ height: `${(t.completed / Math.max(t.total, 1)) * 100}%` }}
                  />
                  <div
                    className="bg-slate-700/80 hover:bg-slate-600 transition-all"
                    style={{ height: `${(t.pending / Math.max(t.total, 1)) * 100}%` }}
                  />
                </div>

                {/* Date Label */}
                <span className="text-[10px] text-slate-400 font-mono mt-1 rotate-0 truncate">
                  {t.date.split('-').slice(1).join('/')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
