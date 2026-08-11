import { EventCategory } from './event-bus.types';

export interface EventBusConfig {
  maxHistorySize: number;
  maxSubscribersPerEvent: number;
  enableHistory: boolean;
  enableStats: boolean;
  categories: EventCategory[];
}

export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  maxHistorySize: 1000,
  maxSubscribersPerEvent: 100,
  enableHistory: true,
  enableStats: true,
  categories: [
    'system',
    'scheduler',
    'scanner',
    'analysis',
    'opportunity',
    'elite_score',
    'provider',
    'performance',
    'backtest',
  ],
};
