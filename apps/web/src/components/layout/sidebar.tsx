import { NavLink } from 'react-router-dom';
import { useLayoutStore } from '@/stores';
import { cn } from '@/lib/utils';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/lib/constants';
import {
  LayoutDashboard,
  ScanSearch,
  LineChart,
  FlaskConical,
  Briefcase,
  Eye,
  Bell,
  GitBranch,
  Settings,
  Gauge,
  Server,
  Radio,
  Stethoscope,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Brain,
  FileText,
  ListChecks,
  Radar,
  History,
  Send,
} from 'lucide-react';

const navigation = [
  { key: 'dashboard', label: 'Kontrol Paneli', href: '/', icon: LayoutDashboard },
  { key: 'scanner', label: 'Tarayıcı', href: '/scanner', icon: ScanSearch },
  { key: 'analysis', label: 'Analiz', href: '/analysis', icon: LineChart },
  { key: 'backtest', label: 'Geri Test', href: '/backtest', icon: FlaskConical },
  { key: 'portfolio', label: 'Portföy', href: '/portfolio', icon: Briefcase },
  { key: 'watchlist', label: 'İzleme', href: '/watchlist', icon: Eye },
  { key: 'alerts', label: 'Alarmlar', href: '/alerts', icon: Bell },
  { key: 'telegram', label: 'Telegram', href: '/telegram', icon: Send },
  { key: 'workflows', label: 'İş Akışları', href: '/workflows', icon: GitBranch },
  { key: 'pipeline-status', label: 'İş Hattı', href: '/pipeline-status', icon: ListChecks },
  { key: 'ai-assistant', label: 'AI Asistan', href: '/ai-assistant', icon: Brain },
  { key: 'ai-reports', label: 'AI Raporlar', href: '/ai-reports', icon: FileText },
  { key: 'research-intelligence', label: 'Araştırma İstihbaratı', href: '/research-intelligence', icon: Radar },
  { key: 'market-data-history', label: 'Tarihsel Veri', href: '/market-data-history', icon: History },
  { key: 'configuration', label: 'Yapılandırma', href: '/configuration', icon: Settings },
  { key: 'performance', label: 'Performans', href: '/performance', icon: Gauge },
  { key: 'providers', label: 'Sağlayıcılar', href: '/providers', icon: Server },
  { key: 'events', label: 'Olaylar', href: '/events', icon: Radio },
  { key: 'diagnostics', label: 'Tanılama', href: '/diagnostics', icon: Stethoscope },
  { key: 'audit', label: 'Denetim Günlüğü', href: '/audit', icon: ScrollText },
  { key: 'settings', label: 'Ayarlar', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      role="navigation"
      aria-label="Ana menü"
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">BIST Elite AI</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin" aria-label="Sayfa navigasyonu">
        <ul className="space-y-0.5" role="list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key} role="listitem">
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      collapsed && 'justify-center px-2',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t px-3 py-3">
          <p className="text-[10px] text-muted-foreground">BIST Elite AI v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
