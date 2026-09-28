import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services/analytics.service';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface DayData {
  total: number;
  completed: number;
  pending: number;
  isAllCompleted: boolean;
  xpEarned: number;
  taskTitles: string[];
}

interface DashboardCalendarProps {
  className?: string;
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
  compact?: boolean;
}

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ 
  className = '', 
  onSelectDate, 
  selectedDate,
  compact = false 
}) => {
  const navigate = useNavigate();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [daysData, setDaysData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchCalendarData = async (y: number, m: number) => {
    try {
      setLoading(true);
      const res = await analyticsService.getMonthCalendar(y, m);
      setDaysData(res.days || {});
    } catch (err) {
      console.error('Failed to load dashboard calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleDateClick = (dateStr: string) => {
    if (onSelectDate) {
      onSelectDate(dateStr);
    } else {
      navigate(`/history?date=${dateStr}`);
    }
  };

  // Calendar grid calculations
  const firstDayOfWeek = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay(); // 0=Sun..6=Sat
  const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

  const padMonth = String(currentMonth).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Count month stats
  let totalTasksMonth = 0;
  let completedTasksMonth = 0;
  let perfectDaysCount = 0;

  for (const d of Object.values(daysData)) {
    totalTasksMonth += d.total;
    completedTasksMonth += d.completed;
    if (d.isAllCompleted) perfectDaysCount++;
  }

  return (
    <div className={`glass-panel ${compact ? 'p-3.5 sm:p-4 rounded-2xl' : 'p-5 sm:p-6 rounded-3xl'} border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl ${className}`}>
      {/* Header with Month Navigation */}
      <div className={`flex items-center justify-between gap-3 ${compact ? 'mb-2.5' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400`}>
            <CalendarIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <div>
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white tracking-tight flex items-center gap-2`}>
              <span>{monthNames[currentMonth - 1]} {currentYear}</span>
              {loading && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
            </h3>
            <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-400`}>
              {perfectDaysCount} perfect days • {completedTasksMonth}/{totalTasksMonth} tasks done
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className={`${compact ? 'p-1' : 'p-1.5'} rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors`}
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
          <button
            onClick={() => {
              setCurrentYear(today.getFullYear());
              setCurrentMonth(today.getMonth() + 1);
            }}
            className={`${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'} rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold transition-colors`}
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className={`${compact ? 'p-1' : 'p-1.5'} rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors`}
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className={`grid grid-cols-7 gap-1 text-center ${compact ? 'mb-1' : 'mb-1.5'}`}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
          <div key={idx} className={`${compact ? 'text-[9px] py-0.5' : 'text-[11px] py-1'} font-semibold text-slate-500 uppercase tracking-wider`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className={`${compact ? 'h-8 sm:h-9' : 'h-10 sm:h-12'} rounded-xl bg-slate-900/30 border border-transparent`} />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const padDay = String(dayNum).padStart(2, '0');
          const dateStr = `${currentYear}-${padMonth}-${padDay}`;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const data = daysData[dateStr] || { total: 0, completed: 0, isAllCompleted: false };

          const hasTasks = data.total > 0;
          const isComplete = data.isAllCompleted; // strictly total > 0 && completed === total

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(dateStr)}
              className={`${compact ? 'h-8 sm:h-9 p-0.5' : 'h-10 sm:h-12 p-1'} rounded-xl transition-all flex flex-col items-center justify-between text-left group relative border ${
                isSelected
                  ? 'ring-2 ring-amber-400 bg-indigo-950/90 border-amber-400 shadow-md shadow-amber-500/20'
                  : isComplete
                  ? 'bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                  : hasTasks
                  ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-750'
                  : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-800/40'
              } ${isToday && !isSelected ? 'ring-2 ring-indigo-500/80 ring-offset-1 ring-offset-slate-950' : ''}`}
            >
              {/* Day Number */}
              <div className="w-full flex items-center justify-between">
                <span
                  className={`${compact ? 'text-[10px]' : 'text-xs'} font-mono font-bold leading-none ${
                    isSelected
                      ? 'text-amber-300'
                      : isToday
                      ? 'text-indigo-400'
                      : isComplete
                      ? 'text-emerald-300'
                      : hasTasks
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {dayNum}
                </span>

                {/* Completed Checkmark Indicator (Mandatory requirement 2) */}
                {isComplete && (
                  <span className={`text-emerald-400 ${compact ? 'text-[10px]' : 'text-xs'} font-black leading-none drop-shadow`}>
                    ✓
                  </span>
                )}
              </div>

              {/* Task Completion Status Badge / Dots */}
              <div className="w-full flex items-center justify-end">
                {isComplete ? (
                  <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-mono font-bold text-emerald-400/90 leading-none`}>
                    {data.completed}/{data.total}
                  </span>
                ) : hasTasks ? (
                  <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-mono text-slate-400 leading-none`}>
                    {data.completed}/{data.total}
                  </span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className={`${compact ? 'mt-2.5 pt-2 text-[10px]' : 'mt-4 pt-3 text-[11px]'} border-t border-slate-800/80 flex items-center justify-between text-slate-400 flex-wrap gap-2`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[8px] text-emerald-400 font-bold">✓</span>
            <span>All Tasks Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
            <span>Incomplete / No Tasks</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/history')}
          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Full History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
