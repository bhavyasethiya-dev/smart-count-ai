import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden transition-colors duration-500">
      <div className="fixed inset-0 mesh-bg z-[-1]" />
      <TopAppBar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-32">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
}
