import { Card, EmptyState, Badge } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';
import { STATUS_LABELS, STATUS_BADGE } from './workflow-types';

interface WorkflowRunningTableProps {
  workflows: WorkflowItem[];
  onSelectWorkflow: (wf: WorkflowItem) => void;
}

export function WorkflowRunningTable({ workflows, onSelectWorkflow }: WorkflowRunningTableProps) {
  if (workflows.length === 0) {
    return <EmptyState title="Çalışan iş akışı yok" description="Aktif iş akışı bulunmuyor" />;
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Çalışan İş Akışları</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">İş Akışı ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tür</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Hisse</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Durum</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">İlerleme</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Başlangıç</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Geçen Süre</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Çalışan İşlemci</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr
                key={wf.id}
                className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelectWorkflow(wf)}
              >
                <td className="px-3 py-2 font-mono text-[10px]">{wf.id.slice(0, 8)}</td>
                <td className="px-3 py-2">{wf.type}</td>
                <td className="px-3 py-2 font-medium">{wf.symbol || '—'}</td>
                <td className="px-3 py-2">
                  <Badge variant={STATUS_BADGE[wf.status]}>{STATUS_LABELS[wf.status]}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${wf.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{wf.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {wf.startedAt ? new Date(wf.startedAt).toLocaleTimeString('tr-TR') : '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {wf.durationMs ? `${(wf.durationMs / 1000).toFixed(1)}s` : '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{wf.worker || '—'}</td>
                <td className="px-3 py-2">
                  <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
