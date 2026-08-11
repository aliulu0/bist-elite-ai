import { useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useLayoutStore } from '@/stores';
import { cn } from '@/lib/utils';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT } from '@/lib/constants';

export function AppLayout() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((s) => s.setSidebarCollapsed);
  const location = useLocation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    },
    [setSidebarCollapsed],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, setSidebarCollapsed]);

  const marginLeft = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn('transition-all duration-300 ease-in-out')}
        style={{ marginLeft }}
      >
        <div style={{ height: TOPBAR_HEIGHT }}>
          <Topbar />
        </div>
        <main id="main-content" className="p-6" role="main">
          <Outlet />
        </main>
        <footer className="border-t px-6 py-4 text-xs text-muted-foreground" role="contentinfo">
          <div className="flex items-center justify-between">
            <span>BIST Elite AI v1.0.0</span>
            <span>Borsa Istanbul Analiz Platformu</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
