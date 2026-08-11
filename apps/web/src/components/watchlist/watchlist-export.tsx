import { Download } from 'lucide-react';
import type { WatchlistItem } from './watchlist-types';

interface WatchlistExportProps {
  items: WatchlistItem[];
}

export function WatchlistExport({ items }: WatchlistExportProps) {
  const exportCSV = () => {
    const header = 'Hisse,Şirket,Sektör,Elite Skoru,Derece,Fırsat,Güven,Son Fiyat,Günlük %,Haftalık %,Smart Money,Trend,Durum,Alarm\n';
    const rows = items
      .map(
        (i) =>
          `${i.symbol},${i.name},${i.sector},${i.eliteScore},${i.eliteRating},${i.opportunityLevel},${i.confidence},${i.currentPrice},${i.dailyChangePercent},${i.weeklyChangePercent},${i.smartMoneyScore},${i.trend},${i.status},${i.alert ? 'Evet' : 'Hayır'}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `izleme_listesi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `izleme_listesi_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        disabled={items.length === 0}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        onClick={exportJSON}
        disabled={items.length === 0}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        JSON
      </button>
    </div>
  );
}
