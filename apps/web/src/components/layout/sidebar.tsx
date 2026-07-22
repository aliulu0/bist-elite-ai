'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/stores';
import { useI18n } from '@/hooks/use-i18n';

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: '📊' },
  { key: 'scanner', href: '/scanner', icon: '🔍' },
  { key: 'watchlist', href: '/watchlist', icon: '⭐' },
  { key: 'signals', href: '/signals', icon: '📡' },
  { key: 'portfolio', href: '/portfolio', icon: '💼' },
  { key: 'backtest', href: '/backtest', icon: '📈' },
  { key: 'reports', href: '/reports', icon: '📋' },
  { key: 'settings', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold">{t('app.name')}</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{t(`nav.${item.key}` as any)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
