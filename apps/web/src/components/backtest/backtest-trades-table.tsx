import { useState } from 'react';
import type { BacktestTrade } from './backtest-types';
import { useBacktestStore } from '@/stores/backtest-store';

interface BacktestTradesTableProps {
  trades: BacktestTrade[];
}

export function BacktestTradesTable({ trades }: BacktestTradesTableProps) {
  const { sortKey, sortDir, setSort, tradePage, setTradePage, tradesPerPage } = useBacktestStore();

  const sorted = [...trades].sort((a, b) => {
    const aVal = a[sortKey as keyof BacktestTrade];
    const bVal = b[sortKey as keyof BacktestTrade];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sorted.length / tradesPerPage);
  const paged = sorted.slice(tradePage * tradesPerPage, (tradePage + 1) * tradesPerPage);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'desc');
    }
  };

  const ExitLabel: Record<string, string> = {
    STOP_LOSS: 'Zarar Durdurma',
    TAKE_PROFIT: 'Kâr Hedefleme',
    TRAILING_STOP: 'Takip Eden Durdurma',
    TIME_BASED: 'Zamana Bağlı',
    RSI_OVERBOUGHT: 'RSI Aşırı Alım',
    CLOSE_BELOW_EMA: 'Kapanış EMA Altında',
    HOLD_UNTIL_END: 'Sonuna Kadar Tut',
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold">İşlemler ({trades.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-t bg-muted/50">
              {[
                { key: 'entryTimestamp', label: 'Giriş' },
                { key: 'exitTimestamp', label: 'Çıkış' },
                { key: 'entryPrice', label: 'Giriş Fiyatı' },
                { key: 'exitPrice', label: 'Çıkış Fiyatı' },
                { key: 'holdingDays', label: 'Gün' },
                { key: 'returnPercent', label: 'Getiri %' },
                { key: 'returnAbsolute', label: 'Getiri ₺' },
                { key: 'exitReason', label: 'Çıkış Nedeni' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((trade, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2">{trade.entryTimestamp ? new Date(trade.entryTimestamp).toLocaleDateString('tr-TR') : '-'}</td>
                <td className="px-3 py-2">{trade.exitTimestamp ? new Date(trade.exitTimestamp).toLocaleDateString('tr-TR') : '-'}</td>
                <td className="px-3 py-2 font-mono">₺{trade.entryPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 font-mono">₺{trade.exitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-center">{trade.holdingDays}</td>
                <td className={`px-3 py-2 font-mono font-semibold ${trade.returnPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trade.returnPercent >= 0 ? '+' : ''}{(trade.returnPercent * 100).toFixed(2)}%
                </td>
                <td className={`px-3 py-2 font-mono ${trade.returnAbsolute >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trade.returnAbsolute >= 0 ? '+' : ''}₺{trade.returnAbsolute.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2">{ExitLabel[trade.exitReason] || trade.exitReason}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">İşlem bulunamadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            Sayfa {tradePage + 1} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setTradePage(Math.max(0, tradePage - 1))}
              disabled={tradePage === 0}
              className="rounded border px-2 py-1 text-xs disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => setTradePage(Math.min(totalPages - 1, tradePage + 1))}
              disabled={tradePage >= totalPages - 1}
              className="rounded border px-2 py-1 text-xs disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
