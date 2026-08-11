import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import type { PerformanceSnapshot } from './performance-types';

interface PerformanceExportProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceExport({ snapshot }: PerformanceExportProps) {
  const handleExport = (format: string) => {
    if (!snapshot) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(snapshot, null, 2);
        filename = `performans-${new Date().toISOString().slice(0, 10)}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(snapshot);
        filename = `performans-${new Date().toISOString().slice(0, 10)}.csv`;
        mimeType = 'text/csv';
        break;
      case 'pdf':
        content = generateReport(snapshot);
        filename = `performans-${new Date().toISOString().slice(0, 10)}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Performans verilerini dışa aktarın</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('json')}
          disabled={!snapshot}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <FileJson className="h-3.5 w-3.5" />
          JSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={!snapshot}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={!snapshot}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <FileText className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}

function convertToCSV(snapshot: PerformanceSnapshot): string {
  const rows = [
    ['Metrik', 'Değer'],
    ['Sağlık', snapshot.health],
    ['Toplam İstek', String(snapshot.totalRequests)],
    ['Ortalama Yanıt Süresi', `${Math.round(snapshot.avgLatencyMs)}ms`],
    ['P95', `${Math.round(snapshot.p95LatencyMs)}ms`],
    ['P99', `${Math.round(snapshot.p99LatencyMs)}ms`],
    ['Cache Hit Oranı', `%${snapshot.cacheHitRate.toFixed(1)}`],
    ['Workflow Süresi', `${Math.round(snapshot.workflowAvgDurationMs)}ms`],
    ['Queue Süresi', `${Math.round(snapshot.queueAvgWaitTimeMs)}ms`],
    ['', ''],
    ['Motor', 'Ortalama Süre'],
    ...snapshot.engines.map((e) => [e.name, `${Math.round(e.avgDurationMs)}ms`]),
    ['', ''],
    ['API Endpoint', 'Ortalama Latans'],
    ...snapshot.apiMetrics.map((a) => [a.endpoint, `${Math.round(a.avgLatencyMs)}ms`]),
  ];
  return rows.map((r) => r.join(',')).join('\n');
}

function generateReport(snapshot: PerformanceSnapshot): string {
  return [
    '=== PERFORMANS RAPORU ===',
    `Tarih: ${new Date(snapshot.timestamp).toLocaleString('tr-TR')}`,
    `Sağlık: ${snapshot.health}`,
    '',
    '--- ÖZET ---',
    `Toplam İstek: ${snapshot.totalRequests}`,
    `Ortalama Yanıt: ${Math.round(snapshot.avgLatencyMs)}ms`,
    `P95: ${Math.round(snapshot.p95LatencyMs)}ms`,
    `P99: ${Math.round(snapshot.p99LatencyMs)}ms`,
    `Cache Hit: %${snapshot.cacheHitRate.toFixed(1)}`,
    '',
    '--- MOTORLAR ---',
    ...snapshot.engines.map((e) => `  ${e.name}: ${Math.round(e.avgDurationMs)}ms ort., %${e.successRate.toFixed(1)} başarı`),
    '',
    '--- SİSTEM ---',
    `CPU: %${snapshot.systemMetrics.cpuUsagePercent.toFixed(1)}`,
    `Bellek: ${snapshot.systemMetrics.memoryUsageMb.toFixed(0)} MB`,
    `Heap: ${snapshot.systemMetrics.heapUsedMb.toFixed(0)}/${snapshot.systemMetrics.heapTotalMb.toFixed(0)} MB`,
    '',
    `Uyarı Sayısı: ${snapshot.alerts.length}`,
    ...snapshot.alerts.map((a) => `  [${a.severity}] ${a.title}`),
  ].join('\n');
}
