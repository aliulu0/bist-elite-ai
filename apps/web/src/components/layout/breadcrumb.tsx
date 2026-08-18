import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'Kontrol Paneli',
  '/scanner': 'Tarayıcı',
  '/daily-scan': 'Günlük BIST Taraması',
  '/analysis': 'Analiz',
  '/backtest': 'Geri Test',
  '/workflows': 'İş Akışları',
  '/configuration': 'Yapılandırma',
  '/performance': 'Performans',
  '/providers': 'Sağlayıcılar',
  '/events': 'Olaylar',
  '/diagnostics': 'Tanılama',
  '/audit': 'Denetim Günlüğü',
  '/settings': 'Ayarlar',
  '/portfolio': 'Portföy',
  '/watchlist': 'İzleme Listesi',
  '/alerts': 'Alarmlar',
  '/telegram': 'Telegram Radarı',
  '/ai-assistant': 'AI Asistan',
  '/ai-reports': 'AI Raporlar',
};

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [{ label: 'Ana Sayfa', href: '/' }];

  let currentPath = '';
  for (const seg of segments) {
    currentPath += `/${seg}`;
    crumbs.push({
      label: routeLabels[currentPath] || seg,
      href: currentPath,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Home className="h-3 w-3" />
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
