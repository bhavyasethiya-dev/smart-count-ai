import { Activity, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopAppBar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 w-full glass-panel !rounded-none border-t-0 border-x-0 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-blue rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center overflow-hidden">
          <img 
            className="w-full h-full object-cover opacity-80" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCtH9ITMzTjzrByMCJPmBgpEJ2yy8BB0Vufl3qv8_wR0qpWbMk8hm72cIe8xZKsj_mI1CokWedNJtJ6xLZh2803ksyHHOFvlT04YOFJsuJgypVsYRM4nJqLqWnaEVU9rEuAUmBVojPFU3_l3VQC-X_r7sM4iXATIGEjvDRCtat1XmFj5JW1_7NhAC6Q0GyPDozRHz4D1fuw0IBmyQHdtixbmKlpvZFSgKzeqktNWo-7cBNxYWJL7cXjTLd-DGZOjgr0Hc92_HdZrA" 
            alt="Logo"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-['Space_Grotesk']">SmartCount</h1>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6">
          <Link to="/" className="font-medium tracking-tight text-accent-cyan hover:text-white transition-colors">Home</Link>
          <Link to="/history" className="font-medium tracking-tight text-slate-400 hover:text-white transition-colors">History</Link>
          <Link to="/settings" className="font-medium tracking-tight text-slate-400 hover:text-white transition-colors">Settings</Link>
        </nav>
        <button className="text-accent-cyan hover:text-white transition-all p-2">
          <Activity className="w-6 h-6" />
        </button>
      </div>

      <div className="md:hidden">
        <button className="text-zinc-500 p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
