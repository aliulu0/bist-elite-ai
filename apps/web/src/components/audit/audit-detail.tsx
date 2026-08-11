import { Card, EmptyState } from '@/components/shared';
import type { AuditLogEntry } from './audit-types';
import { SEVERITY_LABELS, ACTION_LABELS, moduleDisplay } from './audit-types';
import { X } from 'lucide-react';

interface AuditDetailProps {
  log: AuditLogEntry | null;
  onClose: () => void;
}

export function AuditDetail({ log, onClose }: AuditDetailProps) {
  if (!log) return null;

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
          <h3 className="text-sm font-semibold">Kayıt Detayı</h3>
          <p className="text-xs text-muted-foreground">ID: {log.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Modül" value={moduleDisplay(log.module)} />
          <DetailItem label="İşlem" value={ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action} />
          <DetailItem label="Öncelik" value={SEVERITY_LABELS[log.severity]} />
          <DetailItem label="Zaman" value={new Date(log.timestamp).toLocaleString('tr-TR')} />
          {log.user && <DetailItem label="Kullanıcı" value={log.user} />}
          {log.targetType && <DetailItem label="Hedef Tip" value={log.targetType} />}
          {log.targetId && <DetailItem label="Hedef ID" value={log.targetId} />}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Açıklama</p>
          <p className="text-xs">{log.details}</p>
        </div>

        {log.oldValue && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Eski Değer</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{log.oldValue}</pre>
          </div>
        )}

        {log.newValue && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Yeni Değer</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{log.newValue}</pre>
          </div>
        )}
      </div>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xs">{value}</p>
    </div>
  );
}
