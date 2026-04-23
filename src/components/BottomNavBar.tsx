import { LayoutGrid, History, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function BottomNavBar() {
  const navItems = [
    { to: '/', icon: LayoutGrid, label: 'Home' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe glass-panel !rounded-none border-b-0 border-x-0 backdrop-blur-2xl shadow-2xl md:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-2 transition-all duration-200 active:scale-95",
              isActive ? "text-accent-cyan" : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          <Icon className="w-6 h-6" />
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
