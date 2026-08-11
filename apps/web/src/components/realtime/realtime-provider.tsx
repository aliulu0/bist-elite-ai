import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEventsStore, type EventItem } from '@/stores/events-store';
import { useNotificationStore } from '@/stores/notification-store';

function addWsEvent(addEvent: (e: EventItem) => void, type: string, category: string, data: Record<string, unknown>): void {
  addEvent({ id: crypto.randomUUID(), type, category, timestamp: (data.timestamp as string) ?? new Date().toISOString(), data: JSON.stringify(data) });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, subscribe } = useWebSocket();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const addEvent = useEventsStore((s) => s.addEvent);

  useEffect(() => {
    if (!isConnected) return;

    const unsubs: (() => void)[] = [];
    const sub = (event: string, category: string, title: string, getMsg?: (d: Record<string, unknown>) => string) => {
      unsubs.push(
        subscribe(event, (raw: unknown) => {
          const d = raw as Record<string, unknown>;
          const msg = getMsg ? getMsg(d) : `${event} update received`;
          addNotification({ type: category === 'alerts' ? 'warning' : 'info', title, message: msg });
          addWsEvent(addEvent, event, category, d);
        }),
      );
    };

    sub('pipeline:run', 'pipeline', 'Pipeline Completed', () => 'Full pipeline run finished');
    sub('pipeline:step', 'pipeline', 'Pipeline Step', (d) => `Step ${d.step as string} completed`);
    sub('ranking:update', 'scanner', 'Rankings Updated', () => 'Rankings refreshed');
    sub('macro:update', 'macro', 'Macro Data Updated', () => 'Macro indicators refreshed');
    sub('alert:update', 'alerts', 'Alert Triggered', (d) => (d.message as string) ?? 'Alert update received');
    sub('portfolio:update', 'portfolio', 'Portfolio Updated', () => 'Portfolio data refreshed');
    sub('scheduler:event', 'scheduler', 'Scheduler Event', (d) => `Job ${d.jobName as string} ${(d.status as string) ?? 'completed'}`);
    sub('provider:status', 'providers', 'Provider Status Update', () => 'Provider health status changed');

    return () => unsubs.forEach((u) => u());
  }, [isConnected, subscribe, addNotification, addEvent]);

  return children;
}
