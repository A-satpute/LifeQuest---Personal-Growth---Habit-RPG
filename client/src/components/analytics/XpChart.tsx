import React from 'react';
import type { DailyXpItem, XpTransactionHistoryItem } from '../../types/analytics';
import { Zap, Clock } from 'lucide-react';

interface XpChartProps {
  dailyXp: DailyXpItem[];
  recentHistory: XpTransactionHistoryItem[];
  loading?: boolean;
}

export const XpChart: React.FC<XpChartProps> = ({ dailyXp, recentHistory, loading }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-4">XP History</h3>
        <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
          Loading XP trends...
        </div>
      </div>
    );
  }

  const maxXp = Math.max(...dailyXp.map((d) => d.xp), 50);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚡</span> XP Momentum & Transaction Audit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real XP earned across task completions, daily consistency, and streaks
          </p>
        </div>
      </div>

      {/* Visual daily XP bars */}
      {dailyXp.length > 0 ? (
        <div className="overflow-x-auto pb-2 mb-6">
          <div className="min-w-[480px] h-36 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {dailyXp.slice(-14).map((d, idx) => {
              const heightPercent = Math.max((d.xp / maxXp) * 100, 8);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <div className="absolute -top-8 bg-slate-950 border border-slate-800 text-[10px] px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono text-amber-300">
                    {d.date}: +{d.xp} XP ({d.transactionCount} events)
                  </div>

                  <div
                    className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-amber-600/80 to-amber-400 hover:from-amber-500 hover:to-amber-300 transition-all shadow-sm shadow-amber-500/20"
                    style={{ height: `${heightPercent}%` }}
                  />

                  <span className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                    {d.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-500">
          No XP transactions recorded in this range.
        </div>
      )}

      {/* Recent XP Activity List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Recent XP Ledger</span>
        </h4>

        {recentHistory.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {recentHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-[11px] font-bold">
                    ⚡
                  </span>
                  <div>
                    <span className="text-slate-200 font-medium">
                      {item.reason.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2 font-mono">
                      {item.date}
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-amber-400 text-xs">
                  +{item.amount} XP
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No recent transactions.</p>
        )}
      </div>
    </div>
  );
};
