import React, { useState } from 'react';
import type { ActivityHeatmapData } from '../../types/analytics';

interface ActivityHeatmapProps {
  data: ActivityHeatmapData | null;
  loading?: boolean;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, loading }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  if (loading || !data) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>📅</span> Annual Consistency Heatmap
        </h3>
        <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
          Loading activity heatmap...
        </div>
      </div>
    );
  }

  // Build a 52-week calendar array for the year
  const year = data.year;
  const countMap = new Map<string, number>();
  for (const d of data.days) {
    countMap.set(d.date, d.count);
  }

  // Generate all days of the year
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  // Determine starting day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const startDayOfWeek = startDate.getUTCDay();

  // Create weeks array: each week has 7 days (index 0 to 6)
  const weeks: Array<Array<{ dateStr: string; count: number; inYear: boolean }>> = [];
  let currentWeek: Array<{ dateStr: string; count: number; inYear: boolean }> = [];

  // Pad beginning of first week if year doesn't start on Sunday
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push({ dateStr: '', count: 0, inYear: false });
  }

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dateStr = cur.toISOString().split('T')[0];
    const count = countMap.get(dateStr) || 0;
    currentWeek.push({ dateStr, count, inYear: true });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ dateStr: '', count: 0, inYear: false });
    }
    weeks.push(currentWeek);
  }

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/40 border-slate-700/30';
    if (count === 1) return 'bg-emerald-900 border-emerald-700/60 text-emerald-200';
    if (count <= 3) return 'bg-emerald-700 border-emerald-600/70 text-emerald-100';
    if (count <= 5) return 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30';
    return 'bg-emerald-400 border-emerald-300 text-slate-900 shadow-md shadow-emerald-400/50';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📅</span> Activity Heatmap ({year})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.totalCompletedTasks} tasks completed across {data.totalCompletedDays} active days
          </p>
        </div>

        {/* Hover info badge */}
        <div className="text-xs text-slate-300 h-5 font-mono">
          {hoveredDay ? (
            <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              {hoveredDay.date}: <strong>{hoveredDay.count}</strong> {hoveredDay.count === 1 ? 'task' : 'tasks'} completed
            </span>
          ) : (
            <span className="text-slate-500">Hover over a square to inspect activity</span>
          )}
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* Month labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pl-6 pr-2 mb-1.5">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono pr-1.5 h-[98px]">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={() => {
                        if (day.inYear) {
                          setHoveredDay({ date: day.dateStr, count: day.count });
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3 h-3 rounded-[2px] transition-transform hover:scale-125 border ${
                        day.inYear ? getCellColor(day.count) : 'opacity-0 pointer-events-none'
                      }`}
                      style={{ cursor: day.inYear ? 'pointer' : 'default' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 font-mono mt-3 pt-3 border-t border-slate-800">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800/40 border border-slate-700/30" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900 border border-emerald-700/60" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 border border-emerald-600/70" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 border border-emerald-400" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
        <span>More</span>
      </div>
    </div>
  );
};
