import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, BarChart3, Hash, Activity } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface AnalysisHeaderProps {
  data: AnalysisResult;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const TIMEFRAMES = [
  { value: '1d', label: 'Günlük' },
  { value: '1w', label: 'Haftalık' },
  { value: '1m', label: 'Aylık' },
];

export function AnalysisHeader({ data, timeframe, onTimeframeChange, onRefresh, loading }: AnalysisHeaderProps) {
  const change = 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">{data.symbol}</h2>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Hash className="h-3.5 w-3.5" />
            <span>{data.symbol}</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <Activity className="h-3.5 w-3.5" />
            <span>{data.timeframe}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="h-3.5 w-3.5 text-success" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={cn('text-sm font-semibold tabular-nums', isPositive && 'text-success', isNegative && 'text-destructive')}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>

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

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-label="Tazele"
          >
            <Activity className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Tazele
          </button>
        </div>
      </div>
    </div>
  );
}
