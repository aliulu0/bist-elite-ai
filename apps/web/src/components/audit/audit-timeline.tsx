import { Card } from '@/components/shared';
import type { AuditLogEntry } from './audit-types';
import { SEVERITY_LABELS, SEVERITY_COLORS, ACTION_LABELS, moduleDisplay } from './audit-types';
import { cn } from '@/lib/utils';

interface AuditTimelineProps {
  logs: AuditLogEntry[];
  onSelectLog?: (id: string) => void;
}

export function AuditTimeline({ logs, onSelectLog }: AuditTimelineProps) {
  if (logs.length === 0) return null;

  const sorted = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Zaman Çizelgesi</h3>
      <div className="relative ml-3 border-l-2 border-border pl-6 space-y-4">
        {sorted.map((log) => (
          <div key={log.id} className="relative">
            <div
              className={cn(
                'absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background',
                log.severity === 'CRITICAL'
                  ? 'bg-destructive'
                  : log.severity === 'ERROR'
                  ? 'bg-destructive'
                  : log.severity === 'WARNING'
                  ? 'bg-warning'
                  : 'bg-success',
              )}
            />
            <div
              className="cursor-pointer hover:bg-muted/50 rounded p-2 -ml-2"
              onClick={() => onSelectLog?.(log.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{moduleDisplay(log.module)}</span>
                <span className={cn('text-xs', SEVERITY_COLORS[log.severity])}>
                  {SEVERITY_LABELS[log.severity]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(log.timestamp).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
