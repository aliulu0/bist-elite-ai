import { KpiCard } from '@/components/dashboard/kpi-card';
import { ScanSearch, Target, Eye, XCircle, Star } from 'lucide-react';
import type { ScannerRow } from './scanner-table';

interface ScannerKpiProps {
  data: ScannerRow[];
  loading?: boolean;
}

export function ScannerKpi({ data, loading }: ScannerKpiProps) {
  const total = data.length;
  const aaaCount = data.filter((s) => s.eliteScore >= 80).length;
  const watchlistCount = data.filter((s) => s.status === 'WATCHLIST').length;
  const rejectedCount = data.filter((s) => s.status === 'REJECTED').length;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard label="Toplam Taranan" value={total} icon={ScanSearch} loading={loading} />
      <KpiCard label="Filtrelenen" value={total} icon={Target} loading={loading} />
      <KpiCard label="AAA" value={aaaCount} icon={Star} loading={loading} variant={aaaCount > 0 ? 'success' : 'default'} />
      <KpiCard label="İzleme Listesi" value={watchlistCount} icon={Eye} loading={loading} variant={watchlistCount > 0 ? 'warning' : 'default'} />
      <KpiCard label="Reddedilen" value={rejectedCount} icon={XCircle} loading={loading} variant={rejectedCount > 0 ? 'danger' : 'default'} />
    </div>
  );
}
