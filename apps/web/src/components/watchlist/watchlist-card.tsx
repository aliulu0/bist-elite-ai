import { Eye, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from './watchlist-types';

interface WatchlistCardProps {
  item: WatchlistItem;
  onSelect?: (symbol: string) => void;
}

export function WatchlistCard({ item, onSelect }: WatchlistCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/50',
        item.alert && 'border-destructive/30',
      )}
      onClick={() => onSelect?.(item.symbol)}
      role="button"
      tabIndex={0}
      aria-label={`${item.symbol} detayı`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">{item.symbol}</span>
        <span className="text-xs font-mono">{item.eliteScore}</span>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Fırsat</span>
          <span>{item.opportunityLevel}</span>
        </div>
        <div className="flex justify-between">
          <span>Güven</span>
          <span className="font-mono">{(item.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Günlük</span>
          <span className={item.dailyChangePercent >= 0 ? 'text-success' : 'text-destructive'}>
            {item.dailyChangePercent >= 0 ? '+' : ''}{item.dailyChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {item.alert && (
          <span className="flex items-center gap-1 text-[10px] text-destructive">
            <AlertTriangle className="h-3 w-3" /> Alarm
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{item.status}</span>
      </div>
    </div>
  );
}
