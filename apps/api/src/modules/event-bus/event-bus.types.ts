export type EventCategory =
  | 'system'
  | 'scheduler'
  | 'scanner'
  | 'analysis'
  | 'opportunity'
  | 'elite_score'
  | 'provider'
  | 'performance'
  | 'backtest';

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface BusEvent {
  id: string;
  type: string;
  timestamp: number;
  correlationId: string | null;
  source: string;
  severity: EventSeverity;
  category: EventCategory;
  payload: unknown;
  metadata: Record<string, unknown>;
}

export type EventHandler = (event: BusEvent) => void | Promise<void>;

export interface Subscription {
  id: string;
  eventType: string | null;
  category: EventCategory | null;
  handler: EventHandler;
  once: boolean;
}

export interface EventBusStats {
  totalPublished: number;
  totalDelivered: number;
  totalFailed: number;
  activeSubscriptions: number;
  historySize: number;
  eventsByCategory: Record<EventCategory, number>;
  eventsByType: Record<string, number>;
}

export interface EventBusSnapshot {
  stats: EventBusStats;
  recentEvents: BusEvent[];
  timestamp: string;
}

export interface EventBusResult {
  snapshot: EventBusSnapshot;
  metadata: Record<string, unknown>;
}
