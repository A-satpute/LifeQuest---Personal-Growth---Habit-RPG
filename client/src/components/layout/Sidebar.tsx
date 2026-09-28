import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Target, 
  CheckSquare, 
  ShieldCheck, 
  Sparkles, 
  BarChart3, 
  Trophy,
  History
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const activeClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-medium text-sm transition-all";
  const inactiveClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm font-medium transition-all";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside className={`
        fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#0a0f1c] border-r border-slate-800/80 z-40
        flex flex-col justify-between p-4 transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Active Navigation */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quest Hub
            </p>
            <nav className="space-y-1">
              <NavLink 
                to="/" 
                end
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink 
                to="/character" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Hero & Character</span>
              </NavLink>

              <NavLink 
                to="/goals" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <Target className="w-4 h-4" />
                <span>Goals</span>
              </NavLink>

              <NavLink 
                to="/ai-architect" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <div className="flex items-center justify-between w-full">
                  <span>AI Architect</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 font-mono">NEW</span>
                </div>
              </NavLink>

              <NavLink 
                to="/tasks" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks & Routines</span>
              </NavLink>

              <NavLink 
                to="/analytics" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Analytics</span>
              </NavLink>

              <NavLink 
                to="/achievements" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Achievements</span>
              </NavLink>

              <NavLink 
                to="/history" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>Calendar & History</span>
              </NavLink>

              <NavLink 
                to="/profile" 
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <User className="w-4 h-4" />
                <span>Hero Profile</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold">LifeQuest RPG Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Gamified self-improvement with real-time XP, streaks, AI roadmap, and badges.
          </p>
        </div>
      </aside>
    </>
  );
};
