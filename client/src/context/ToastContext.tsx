import React, { createContext, useContext, useState, useCallback } from 'react';
import { Sparkles, Flame, Trophy, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'rpg' | 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  xp?: number;
  streak?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newStage?: string;
  dailyBonus?: boolean;
  achievementTitle?: string;
  duration?: number;
}

export interface RpgToastOptions {
  title?: string;
  message?: string;
  xp?: number;
  streak?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newStage?: string;
  dailyBonus?: boolean;
  achievementTitle?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  showRpgToast: (options: RpgToastOptions) => void;
  showSuccessToast: (title: string, message?: string) => void;
  showErrorToast: (title: string, message?: string) => void;
  showInfoToast: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts

    const duration = toast.duration ?? (toast.type === 'rpg' ? 5000 : 4000);
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  const showRpgToast = useCallback((options: RpgToastOptions) => {
    showToast({
      type: 'rpg',
      title: options.title || 'Task Completed!',
      message: options.message,
      xp: options.xp,
      streak: options.streak,
      leveledUp: options.leveledUp,
      newLevel: options.newLevel,
      newStage: options.newStage,
      dailyBonus: options.dailyBonus,
      achievementTitle: options.achievementTitle,
    });
  }, [showToast]);

  const showSuccessToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showErrorToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const showInfoToast = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showRpgToast,
        showSuccessToast,
        showErrorToast,
        showInfoToast,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Stack */}
      <div 
        role="region"
        aria-label="Notification Messages"
        aria-live="polite"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`
              pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0
              ${
                toast.type === 'rpg'
                  ? 'bg-slate-900/95 border-indigo-500/40 shadow-indigo-950/50'
                  : toast.type === 'success'
                  ? 'bg-slate-900/95 border-emerald-500/40 shadow-emerald-950/50'
                  : toast.type === 'error'
                  ? 'bg-slate-900/95 border-rose-500/40 shadow-rose-950/50'
                  : 'bg-slate-900/95 border-slate-700/60 shadow-slate-950/50'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {toast.type === 'rpg' ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : toast.type === 'success' ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : toast.type === 'error' ? (
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {toast.title}
                    </h4>

                    {/* Gamification Pills */}
                    {toast.xp !== undefined && toast.xp > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
                        +{toast.xp} XP
                      </span>
                    )}

                    {toast.streak !== undefined && toast.streak > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {toast.streak}d
                      </span>
                    )}
                  </div>

                  {toast.message && (
                    <p className="text-xs text-slate-300 leading-snug">
                      {toast.message}
                    </p>
                  )}

                  {/* Level Up Announcement */}
                  {toast.leveledUp && (
                    <div className="mt-1.5 p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Level Up! Reached Level {toast.newLevel} ({toast.newStage})</span>
                    </div>
                  )}

                  {/* Daily Bonus Announcement */}
                  {toast.dailyBonus && (
                    <div className="mt-1 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <span>⭐ Daily Bonus Achieved! (+25 XP)</span>
                    </div>
                  )}

                  {/* Achievement Unlocked Announcement */}
                  {toast.achievementTitle && (
                    <div className="mt-1.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Achievement Unlocked: {toast.achievementTitle}!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
