import { Card } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';

interface WorkflowExportProps {
  workflows: WorkflowItem[];
}

export function exportWorkflowCSV(workflows: WorkflowItem[]): string {
  const header = 'ID,Tür,Hisse,Durum,İlerleme,Başlangıç,Bitiş,Süre';
  const rows = workflows.map(
    (w) =>
      `${w.id},"${w.type}","${w.symbol}","${w.status}",${w.progress},"${w.startedAt || ''}","${w.completedAt || ''}","${w.durationMs ? (w.durationMs / 1000).toFixed(1) + 's' : ''}"`,
  );
  return [header, ...rows].join('\n');
}

export function exportWorkflowJSON(workflows: WorkflowItem[]): string {
  return JSON.stringify(workflows, null, 2);
}

export function downloadWorkflowExport(workflows: WorkflowItem[], format: 'csv' | 'json') {
  const content = format === 'csv' ? exportWorkflowCSV(workflows) : exportWorkflowJSON(workflows);
  const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workflows.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function WorkflowExport({ workflows }: WorkflowExportProps) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Dışa Aktarma</h3>
      <p className="mb-3 text-xs text-muted-foreground">İş akışı verilerini dışa aktarın</p>
      <div className="flex gap-2">
        <button
          onClick={() => downloadWorkflowExport(workflows, 'csv')}
          disabled={workflows.length === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          CSV
        </button>
        <button
          onClick={() => downloadWorkflowExport(workflows, 'json')}
          disabled={workflows.length === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          JSON
        </button>
      </div>
    </Card>
  );
}
