import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function formatDate(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(): string {
  return new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardHeader({ onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate()} — {formatTime()}
        </p>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
          aria-label="Yenile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Yenileniyor...' : 'Yenile'}
        </button>
      )}
    </div>
  );
}
