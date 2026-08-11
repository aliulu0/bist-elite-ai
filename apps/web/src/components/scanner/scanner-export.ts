import type { ScannerRow } from './scanner-table';

const HEADERS = [
  'Kod', 'Şirket', 'Sektör', 'Elite', 'Opportunity', 'Finansal', 'Teknik',
  'Smart Money', 'Toplam Puan', 'Durum', 'PD/DD', 'FD/FAVÖK', 'Net Kar Artışı',
  'Hacim', 'Likidite', 'Beta', 'Temettü', 'Piyasa Değeri',
];

const STATUS_LABELS: Record<string, string> = {
  TOP_CANDIDATE: 'Aday',
  WATCHLIST: 'İzleme',
  REJECTED: 'Red',
};

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(data: ScannerRow[], filename = 'scanner-results.csv'): void {
  const rows = data.map((r) => [
    r.symbol,
    r.name || '',
    r.sector || '',
    r.eliteScore?.toFixed(1) || '',
    r.opportunityScore?.toFixed(1) || '',
    r.financialScore?.toFixed(1) || '',
    r.technicalScore?.toFixed(1) || '',
    r.smartMoneyScore?.toFixed(1) || '',
    r.totalScore?.toFixed(1) || '',
    STATUS_LABELS[r.status] || r.status || '',
    r.pdRatio?.toFixed(2) || '',
    r.fdFavok?.toFixed(2) || '',
    r.netIncomeGrowth?.toFixed(1) || '',
    r.volume?.toString() || '',
    r.liquidity?.toFixed(2) || '',
    r.beta?.toFixed(2) || '',
    r.dividendYield?.toFixed(2) || '',
    r.marketCap?.toString() || '',
  ]);

  const csv = [HEADERS.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
