import { Download } from 'lucide-react';

interface AlertsExportProps {
  onExport: (format: 'csv' | 'json') => void;
}

export function AlertsExport({ onExport }: AlertsExportProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Dışa Aktar</h3>
      <div className="space-y-2">
        <button
          onClick={() => onExport('csv')}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          CSV Olarak İndir
        </button>
        <button
          onClick={() => onExport('json')}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          JSON Olarak İndir
        </button>
      </div>
    </div>
  );
}
