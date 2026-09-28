import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  ShieldCheck, 
  BarChart3, 
  Menu 
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const navItemClass = ({ isActive }: { isActive: boolean }) => `
    flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-all
    ${isActive ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'}
  `;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1 flex items-center justify-around shadow-2xl"
    >
      <NavLink to="/" end className={navItemClass}>
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/tasks" className={navItemClass}>
        <CheckSquare className="w-5 h-5 mb-0.5" />
        <span>Tasks</span>
      </NavLink>

      <NavLink to="/goals" className={navItemClass}>
        <Target className="w-5 h-5 mb-0.5" />
        <span>Goals</span>
      </NavLink>

      <NavLink to="/character" className={navItemClass}>
        <ShieldCheck className="w-5 h-5 mb-0.5 text-purple-400" />
        <span>Hero</span>
      </NavLink>

      <NavLink to="/analytics" className={navItemClass}>
        <BarChart3 className="w-5 h-5 mb-0.5 text-emerald-400" />
        <span>Stats</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-all"
        aria-label="Open Full Menu"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
};
