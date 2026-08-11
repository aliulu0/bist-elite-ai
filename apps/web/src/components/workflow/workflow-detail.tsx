import { Card, Badge, EmptyState } from '@/components/shared';
import type { WorkflowItem } from './workflow-types';
import { STATUS_LABELS, STATUS_BADGE, TYPE_LABELS } from './workflow-types';
import { X } from 'lucide-react';

interface WorkflowDetailProps {
  workflow: WorkflowItem | null;
  onClose: () => void;
}

export function WorkflowDetail({ workflow, onClose }: WorkflowDetailProps) {
  if (!workflow) return null;

  const fields = [
    { label: 'İş Akışı ID', value: workflow.id },
    { label: 'İş Akışı Türü', value: TYPE_LABELS[workflow.type as keyof typeof TYPE_LABELS] || workflow.type },
    { label: 'Durum', value: STATUS_LABELS[workflow.status] },
    { label: 'Öncelik', value: workflow.priority || 'NORMAL' },
    { label: 'Yeniden Deneme Sayısı', value: String(workflow.retryCount || 0) },
    { label: 'Oluşturulma', value: workflow.createdAt ? new Date(workflow.createdAt).toLocaleString('tr-TR') : '—' },
    { label: 'Başlangıç', value: workflow.startedAt ? new Date(workflow.startedAt).toLocaleString('tr-TR') : '—' },
    { label: 'Tamamlanma', value: workflow.completedAt ? new Date(workflow.completedAt).toLocaleString('tr-TR') : '—' },
    { label: 'İşçi', value: workflow.worker || '—' },
    { label: 'Mevcut Adım', value: workflow.currentStep || '—' },
    { label: 'İlerleme', value: `%${workflow.progress}` },
  ];

  return (
    <Card className="relative">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">İş Akışı Detayı</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              {f.label === 'Durum' ? (
                <Badge variant={STATUS_BADGE[workflow.status]}>{f.value}</Badge>
              ) : (
                <p className="text-xs">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
