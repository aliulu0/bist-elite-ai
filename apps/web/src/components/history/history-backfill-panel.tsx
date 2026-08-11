import { useEffect, useState } from 'react';
import { Card, EmptyState } from '@/components/shared';
import type { HistoricalBackfillAllResult, HistoricalBackfillInfo, HistoricalBackfillResult, HistoricalBackfillStatus } from './history-types';
import { BACKFILL_STATUS_COLORS, BACKFILL_STATUS_LABELS } from './history-types';
import { PlayCircle, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryBackfillPanelProps {
  selectedSymbol: string | null;
  timeframe: string;
  backfillInfo: HistoricalBackfillInfo | null;
  backfillResult: HistoricalBackfillResult | null;
  bulkResult: HistoricalBackfillAllResult | null;
  running: boolean;
  onBackfillSymbol: (symbol: string, timeframe: string, rangeStart: string, rangeEnd: string) => void;
  onBackfillBulk: (timeframe: string) => void;
}

export function HistoryBackfillPanel({
  selectedSymbol,
  timeframe,
  backfillInfo,
  backfillResult,
  bulkResult,
  running,
  onBackfillSymbol,
  onBackfillBulk,
}: HistoryBackfillPanelProps) {
  const [symbol, setSymbol] = useState(selectedSymbol ?? '');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  useEffect(() => {
    if (selectedSymbol && !symbol) setSymbol(selectedSymbol);
  }, [selectedSymbol, symbol]);

  const statusBadge = (status: string) => (
    <span className={cn('rounded border px-2 py-0.5 text-xs', BACKFILL_STATUS_COLORS[status as HistoricalBackfillStatus] ?? BACKFILL_STATUS_COLORS.idle)}>
      {BACKFILL_STATUS_LABELS[status as HistoricalBackfillStatus] ?? status}
    </span>
  );

  return (
    <div className="space-y-4">
      <Card title="Tek Sembol Backfill" description="Seçilen sembol için eksik tarihsel aralıkları getirir.">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="history-symbol-input">Sembol</label>
            <input
              id="history-symbol-input"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="THYAO"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="history-from-input">Başlangıç (opsiyonel)</label>
            <input
              id="history-from-input"
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="history-to-input">Bitiş (opsiyonel)</label>
            <input
              id="history-to-input"
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={() => symbol.trim() && onBackfillSymbol(symbol.trim(), timeframe, rangeStart, rangeEnd)}
            disabled={running || !symbol.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Backfill Başlat
          </button>
        </div>
        {backfillInfo && (
          <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span>Durum: {statusBadge(backfillInfo.status)}</span>
              <span>Son çalışma: {backfillInfo.lastRunAt ? new Date(backfillInfo.lastRunAt).toLocaleString('tr-TR') : '—'}</span>
              <span>Getirilen: {backfillInfo.fetchedBars} bar</span>
              <span>İstenen: {backfillInfo.requestedRanges} aralık</span>
              <span>Kalan: {backfillInfo.remainingRanges}</span>
            </div>
            {backfillInfo.lastError && <p className="mt-1 text-destructive">{backfillInfo.lastError}</p>}
          </div>
        )}
      </Card>

      {backfillResult && (
        <Card title={`Son Backfill Sonucu — ${backfillResult.symbol}`}>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span>Durum: {statusBadge(backfillResult.status)}</span>
              <span className="font-mono text-xs">{backfillResult.message}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Provider: {backfillResult.actualProvider ?? '—'}
                {backfillResult.fallbackUsed ? ' (fallback)' : ''}
              </span>
              <span>Deneme: {backfillResult.providerAttempts}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Getirilen</p>
                <p className="font-semibold">{backfillResult.fetchedBars}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-xs text-muted-foreground">İstenen</p>
                <p className="font-semibold">{backfillResult.requestedRanges}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Tamamlanan</p>
                <p className="font-semibold">{backfillResult.completedRanges}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Başarısız</p>
                <p className="font-semibold">{backfillResult.failedRanges}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-xs text-muted-foreground">Kalan</p>
                <p className="font-semibold">{backfillResult.remainingRanges}</p>
              </div>
            </div>
            {backfillResult.warnings.length > 0 && (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {backfillResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        </Card>
      )}

      <Card title="Toplu Backfill" description="Tüm aktif BIST sembolleri için eksik aralıkları (muhafazakar eşzamanlılıkla) getirir.">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBackfillBulk(timeframe)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            <Layers className="h-3.5 w-3.5" />
            Tümünü Backfill Et
          </button>
          <span className="text-xs text-muted-foreground">Periyot: {timeframe}</span>
        </div>
      </Card>

      {bulkResult && (
        <Card title="Toplu Backfill Sonucu">
          {bulkResult.results.length === 0 ? (
            <EmptyState title="Sonuç yok" description="Toplu backfill henüz çalıştırılmadı." />
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {bulkResult.results.map((r) => (
                <div key={r.symbol} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="flex items-center gap-2">
                    {statusBadge(r.status)}
                    <span className="font-mono text-muted-foreground">{r.message}</span>
                  </span>
                </div>
              ))}
              {bulkResult.failedSymbols.length > 0 && (
                <p className="pt-2 text-xs text-destructive">Başarısız semboller: {bulkResult.failedSymbols.join(', ')}</p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
