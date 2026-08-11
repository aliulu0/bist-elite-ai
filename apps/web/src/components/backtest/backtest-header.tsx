import { cn } from '@/lib/utils';
import { Play, RotateCcw, Settings } from 'lucide-react';
import type { BacktestConfig } from './backtest-types';

interface BacktestHeaderProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  config: BacktestConfig;
  onRun: () => void;
  onReset: () => void;
  loading: boolean;
}

const TIMEFRAMES = [
  { value: '1d', label: 'Günlük' },
  { value: '1w', label: 'Haftalık' },
  { value: '1m', label: 'Aylık' },
];

export function BacktestHeader({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  config,
  onRun,
  onReset,
  loading,
}: BacktestHeaderProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Backtest Motoru</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
              placeholder="Hisse kodu (ör: GARAN)"
              className="w-32 rounded-md border bg-muted/50 px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Hisse kodu"
            />
            <div className="flex items-center rounded-md border">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onTimeframeChange(tf.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    timeframe === tf.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {config.initialCapital.toLocaleString('tr-TR')} ₺ başlangıç
          </span>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Sıfırla"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Sıfırla
          </button>
          <button
            onClick={onRun}
            disabled={!symbol.trim() || loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Backtest çalıştır"
          >
            <Play className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Çalıştırılıyor...' : 'Backtest Çalıştır'}
          </button>
        </div>
      </div>
    </div>
  );
}
