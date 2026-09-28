import React, { useEffect, useState } from 'react';
import { AiService } from '../../services/ai.service';
import type { DailySuggestionsData } from '../../types/ai';
import { Sparkles, RefreshCw, Clock, Target, Lightbulb, Flame } from 'lucide-react';

export const DailyAiSuggestionsCard: React.FC = () => {
  const [data, setData] = useState<DailySuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AiService.getDailySuggestions();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load daily suggestions:', err);
      setError('AI coaching recommendations temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/30 border border-indigo-500/20 backdrop-blur-md shadow-xl mb-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Daily AI Focus Coach
              </h3>
              {data && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 font-mono">
                  <Flame className="w-3 h-3 text-indigo-400" />
                  {data.focusTheme}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {data?.greeting || 'Personalized quest actions grounded in your goals and consistency'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
          title="Refresh AI suggestions"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {loading && !data && (
        <div className="py-8 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Analyzing active goals, streaks, and schedule...</p>
        </div>
      )}

      {error && !data && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.suggestions.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.estimatedMinutes}m
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100 mb-1 leading-snug">
                    {idx + 1}. {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                {item.relatedGoalTitle && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/30 text-[10px] text-indigo-400 font-medium flex items-center gap-1 truncate">
                    <Target className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.relatedGoalTitle}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Inspirational quote */}
          <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/15 flex items-center gap-2 text-xs text-slate-300 italic">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 not-italic" />
            <span className="text-[11px] font-sans">"{data.motivationalQuote}"</span>
          </div>
        </div>
      )}
    </div>
  );
};
