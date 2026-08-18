import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Monitor, ChevronDown, Loader2 } from 'lucide-react';
import { useThemeStore, useNotificationStore } from '@/stores';
import { cn } from '@/lib/utils';
import { TOPBAR_HEIGHT } from '@/lib/constants';
import { sdkClient } from '@/lib/sdk';
import { useState, useRef, useEffect, useCallback } from 'react';

const routeTitles: Record<string, string> = {
  '/': 'Kontrol Paneli',
  '/portfolio': 'Portföy Yönetimi',
  '/watchlist': 'Canlı İzleme',
  '/alerts': 'Alarm Merkezi',
  '/telegram': 'Telegram Radarı',
  '/ai-assistant': 'AI Asistan',
  '/ai-reports': 'AI Raporlar',
  '/research-intelligence': 'Araştırma İstihbaratı',
  '/scanner': 'Tarayıcı',
  '/daily-scan': 'Günlük BIST Taraması',
  '/radar': 'Fırsat Radarı',
  '/signals': 'Sinyaller',
  '/bist-market-intelligence': 'BIST Pazar Intelligence',
  '/analysis': 'Analiz',
  '/backtest': 'Geri Test',
  '/workflows': 'İş Akışları',
  '/pipeline-status': 'Pipeline Status',
  '/configuration': 'Yapılandırma',
  '/performance': 'Performans',
  '/providers': 'Sağlayıcılar',
  '/events': 'Olaylar',
  '/diagnostics': 'Tanılama',
  '/audit': 'Denetim Günlüğü',
  '/market-data-history': 'Tarihsel Veri',
  '/settings': 'Ayarlar',
};

const routePrefixes: Array<[string, string]> = [
  ['/stock/', 'Hisse Detay'],
  ['/radar/', 'Fırsat Radarı'],
];

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ ticker: string; company: string; sector: string }>
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const title =
    routeTitles[location.pathname] ||
    routePrefixes.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ||
    'Sayfa Bulunamadı';

  const handleThemeChange = useCallback(
    (t: 'dark' | 'light' | 'system') => {
      setTheme(t);
      setShowThemeMenu(false);
    },
    [setTheme],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await sdkClient.symbolsSearch(searchQuery.trim(), undefined, 8);
        setSearchResults(
          (res.data ?? []).map((s) => ({ ticker: s.ticker, company: s.company, sector: s.sector })),
        );
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
        setSearchOpen(false);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const unread = unreadCount();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm"
      style={{ height: TOPBAR_HEIGHT }}
      role="banner"
    >
      <div className="flex items-center gap-4 px-6">
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2 px-4">
        <div ref={searchRef} className="relative">
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors',
              searchFocused ? 'border-ring bg-background' : 'bg-muted/50',
            )}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hisse ara..."
              className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-48"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/stock/${encodeURIComponent(searchQuery.trim().toUpperCase())}`);
                  setSearchOpen(false);
                }
              }}
              aria-label="Hisse arama"
            />
            {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {searchOpen && searchResults.length > 0 && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-md border bg-popover shadow-md animate-fade-in"
              role="listbox"
              aria-label="Arama sonuçları"
            >
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {searchResults.map((r) => (
                  <button
                    key={r.ticker}
                    onClick={() => {
                      navigate(`/stock/${encodeURIComponent(r.ticker)}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left transition-colors last:border-0 hover:bg-accent"
                    role="option"
                  >
                    <span>
                      <span className="block text-sm font-medium">{r.ticker}</span>
                      <span className="block text-xs text-muted-foreground">{r.company}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{r.sector}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={themeRef} className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Tema ayarları"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
          </button>
          {showThemeMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-popover p-1 shadow-md animate-fade-in"
              role="menu"
            >
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                    theme === t && 'bg-accent',
                  )}
                  role="menuitem"
                >
                  {t === 'dark' ? 'Karanlık' : t === 'light' ? 'Aydınlık' : 'Sistem'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Bildirimler"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {unread}
              </span>
            )}
          </button>
          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-1 w-80 rounded-md border bg-popover shadow-md animate-fade-in"
              role="menu"
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">Bildirimler</span>
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Bildirim bulunmuyor
                  </p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left transition-colors hover:bg-accent',
                        !n.read && 'bg-accent/50',
                      )}
                      role="menuitem"
                    >
                      <span className="text-xs font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex h-8 items-center gap-2 rounded-md border px-2"
          role="button"
          tabIndex={0}
          aria-label="Kullanıcı menüsü"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            KA
          </div>
          <span className="text-xs font-medium hidden sm:inline">Kullanıcı</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
