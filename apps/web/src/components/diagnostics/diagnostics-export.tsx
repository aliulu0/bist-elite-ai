import { FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import type { DiagnosticsSnapshot } from './diagnostics-types';

interface DiagnosticsExportProps {
  snapshot: DiagnosticsSnapshot | null;
}

export function DiagnosticsExport({ snapshot }: DiagnosticsExportProps) {
  const handleExport = (format: string) => {
    if (!snapshot) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(snapshot, null, 2);
        filename = `tanilama-${new Date().toISOString().slice(0, 10)}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(snapshot);
        filename = `tanilama-${new Date().toISOString().slice(0, 10)}.csv`;
        mimeType = 'text/csv';
        break;
      case 'pdf':
        content = generateReport(snapshot);
        filename = `tanilama-${new Date().toISOString().slice(0, 10)}.txt`;
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
      <p className="text-xs text-muted-foreground">Tanılama verilerini dışa aktarın</p>
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

function convertToCSV(snapshot: DiagnosticsSnapshot): string {
  const rows = [
    ['Kontrol', 'Durum', 'Süre', 'Mesaj'],
    ...snapshot.checks.map((c) => [c.name, c.status, `${c.duration}ms`, c.message]),
  ];
  return rows.map((r) => r.join(',')).join('\n');
}

function generateReport(snapshot: DiagnosticsSnapshot): string {
  return [
    '=== TANILAMA RAPORU ===',
    `Tarih: ${new Date().toLocaleString('tr-TR')}`,
    `Durum: ${snapshot.overallStatus}`,
    `Toplam Kontrol: ${snapshot.checks.length}`,
    `Toplam Süre: ${Math.round(snapshot.totalDurationMs)}ms`,
    '',
    '--- KONTROLLER ---',
    ...snapshot.checks.map((c) => `  [${c.status.toUpperCase()}] ${c.name}: ${c.message} (${c.duration}ms)`),
    '',
    `Uyarı Sayısı: ${snapshot.alerts.length}`,
    ...snapshot.alerts.map((a) => `  [${a.severity}] ${a.title}`),
  ].join('\n');
}
