import { Card, LoadingCard, Badge } from '@/components/shared';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventBusEvent {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

interface NotificationPanelProps {
  events: EventBusEvent[];
  loading?: boolean;
  error?: string;
}

function getEventBadge(type: string) {
  if (type.includes('error') || type.includes('fail')) return { variant: 'danger' as const };
  if (type.includes('warn')) return { variant: 'warning' as const };
  if (type.includes('scan') || type.includes('analyze')) return { variant: 'info' as const };
  return { variant: 'outline' as const };
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NotificationPanel({ events, loading, error }: NotificationPanelProps) {
  return (
    <Card
      title="Son Olaylar"
      description={`${events.length} olay`}
      action={<Radio className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Olay bulunamadı</p>
      ) : (
        <div className="space-y-1.5">
          {events.slice(0, 8).map((evt) => {
            const badge = getEventBadge(evt.type);
            return (
              <div key={evt.id} className="flex items-center justify-between rounded bg-muted/40 px-2.5 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant={badge.variant}>{formatEventType(evt.type)}</Badge>
                  <span className="truncate text-xs text-muted-foreground">
                    {typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data)}
                  </span>
                </div>
                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
