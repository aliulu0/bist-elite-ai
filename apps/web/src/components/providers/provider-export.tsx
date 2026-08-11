import { FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import type { ProviderHealthSnapshot } from './provider-types';

interface ProviderExportProps {
  snapshot: ProviderHealthSnapshot | null;
}

export function ProviderExport({ snapshot }: ProviderExportProps) {
  const handleExport = (format: string) => {
    if (!snapshot) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(snapshot, null, 2);
        filename = `saglayici-sagligi-${new Date().toISOString().slice(0, 10)}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(snapshot);
        filename = `saglayici-sagligi-${new Date().toISOString().slice(0, 10)}.csv`;
        mimeType = 'text/csv';
        break;
      case 'pdf':
        content = generateReport(snapshot);
        filename = `saglayici-sagligi-${new Date().toISOString().slice(0, 10)}.txt`;
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
      <p className="text-xs text-muted-foreground">Sağlayıcı verilerini dışa aktarın</p>
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

function convertToCSV(snapshot: ProviderHealthSnapshot): string {
  const rows = [
    ['Sağlayıcı', 'Durum', 'Gecikme', 'Başarı Oranı', 'Hata Oranı', 'Güvenilirlik', 'Arka Arkaya Hata'],
    ...snapshot.providers.map((p) => [
      p.name,
      p.status,
      `${Math.round(p.latencyMs)}ms`,
      `${p.successRate.toFixed(1)}%`,
      `${p.errorRate.toFixed(1)}%`,
      `${p.reliabilityScore.toFixed(1)}%`,
      String(p.consecutiveFailures),
    ]),
  ];
  return rows.map((r) => r.join(',')).join('\n');
}

function generateReport(snapshot: ProviderHealthSnapshot): string {
  return [
    '=== SAĞLAYICI SAĞLIK RAPORU ===',
    `Tarih: ${new Date().toLocaleString('tr-TR')}`,
    '',
    '--- SAĞLAYICILAR ---',
    ...snapshot.providers.map((p) => [
      `  ${p.name}: ${p.status}`,
      `    Gecikme: ${Math.round(p.latencyMs)}ms`,
      `    Güvenilirlik: %${p.reliabilityScore.toFixed(1)}`,
      `    Başarı: %${p.successRate.toFixed(1)}`,
    ].join('\n')),
    '',
    '--- UYARILAR ---',
    ...snapshot.alerts.map((a) => `  [${a.severity}] ${a.title} (${a.provider})`),
    '',
    `Toplam Uyarı: ${snapshot.alerts.length}`,
  ].join('\n');
}
