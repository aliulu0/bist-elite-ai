import { Download } from 'lucide-react';
import type { Holding } from './portfolio-types';

interface PortfolioExportProps {
  holdings: Holding[];
}

export function PortfolioExport({ holdings }: PortfolioExportProps) {
  const exportCSV = () => {
    const header = 'Hisse,Lot,Maliyet,Güncel Fiyat,K/Z,K/Z %,Portföy %,AI Skoru,Risk,Elite Derece\n';
    const rows = holdings
      .map(
        (h) =>
          `${h.symbol},${h.lots},${h.avgCost},${h.currentPrice},${h.pnl},${h.pnlPercent.toFixed(2)},${h.portfolioWeight.toFixed(1)},${h.aiScore.toFixed(0)},${h.risk},${h.eliteRating}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfoy_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      disabled={holdings.length === 0}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      CSV Dışa Aktar
    </button>
  );
}
