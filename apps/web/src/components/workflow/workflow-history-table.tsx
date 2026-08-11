import { Card, EmptyState, Badge } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';
import { STATUS_LABELS, STATUS_BADGE } from './workflow-types';

interface WorkflowHistoryTableProps {
  workflows: WorkflowItem[];
  onSelectWorkflow: (wf: WorkflowItem) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalCount: number;
}

export function WorkflowHistoryTable({ workflows, onSelectWorkflow, page, pageSize, onPageChange, totalCount }: WorkflowHistoryTableProps) {
  if (workflows.length === 0) {
    return <EmptyState title="Geçmiş bulunamadı" description="Tamamlanmış iş akışı bulunmuyor" />;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">İş Akışı Geçmişi</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">İş Akışı ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tür</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Hisse</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sonuç</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Toplam Süre</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Yeniden Deneme</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Bitiş</th>
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
                <td className="px-3 py-2 text-muted-foreground">
                  {wf.durationMs ? `${(wf.durationMs / 1000).toFixed(1)}s` : '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{wf.retryCount || 0}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {wf.completedAt ? new Date(wf.completedAt).toLocaleString('tr-TR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} / {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
