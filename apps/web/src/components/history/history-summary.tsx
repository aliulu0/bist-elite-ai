import { StatCard } from '@/components/shared';
import type { HistoricalAllSymbolsReport } from './history-types';
import { Database, CheckCircle2, AlertTriangle, XCircle, Layers, RefreshCw, Clock } from 'lucide-react';

interface HistorySummaryProps {
  report: HistoricalAllSymbolsReport | null;
}

export function HistorySummary({ report }: HistorySummaryProps) {
  if (!report) return null;

  const lastUpdated = report.generatedAt ? new Date(report.generatedAt).toLocaleTimeString('tr-TR') : '—';

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard title="Toplam Sembol" value={report.totalSymbols} icon={Database} />
      <StatCard title="Veri Olan" value={report.symbolsWithHistory} icon={Layers} />
      <StatCard title="Tamamlanan" value={report.completeSymbols} icon={CheckCircle2} variant="success" />
      <StatCard title="Eksik" value={report.incompleteSymbols} icon={AlertTriangle} variant="warning" />
      <StatCard
        title="Ort. Kapsam"
        value={`%${report.averageCoverage.toFixed(1)}`}
        icon={Layers}
        variant={report.averageCoverage >= 90 ? 'success' : report.averageCoverage >= 50 ? 'warning' : 'danger'}
      />
      <StatCard title="Bayat" value={report.staleSymbols} icon={Clock} variant="warning" />
      <StatCard title="Geçersiz" value={report.invalidSymbols} icon={XCircle} variant="danger" />
      <StatCard title="Son Güncelleme" value={lastUpdated} icon={RefreshCw} />
    </div>
  );
}
