import { EventEmitter } from 'events';
import { OpportunityRadarEvent, RadarEventKind } from './radar.types';

/**
 * R2-048 — Internal radar event model.
 *
 * This is the clean contract R2-051 (Telegram) will consume. No Telegram
 * messages are sent in this sprint — the engine only emits events in-process.
 */
export const RADAR_EVENT_EMITTED = 'radar.event';

export class RadarEventEmitter {
  private readonly emitter = new EventEmitter();
  private readonly recent: OpportunityRadarEvent[] = [];
  private readonly limit: number;

  constructor(limit = 100) {
    this.limit = limit;
    this.emitter.setMaxListeners(50);
  }

  emit(event: OpportunityRadarEvent): void {
    this.recent.push(event);
    if (this.recent.length > this.limit) this.recent.shift();
    this.emitter.emit(RADAR_EVENT_EMITTED, event);
  }

  on(handler: (event: OpportunityRadarEvent) => void): () => void {
    this.emitter.on(RADAR_EVENT_EMITTED, handler);
    return () => this.emitter.off(RADAR_EVENT_EMITTED, handler);
  }

  getRecent(limit?: number): OpportunityRadarEvent[] {
    const n = limit ?? this.limit;
    return this.recent.slice(-n);
  }

  clear(): void {
    this.recent.length = 0;
    this.emitter.removeAllListeners(RADAR_EVENT_EMITTED);
  }
}

export const RADAR_EVENT_KINDS: RadarEventKind[] = [
  'NEW_OPPORTUNITY',
  'OPPORTUNITY_STRENGTHENED',
  'OPPORTUNITY_WEAKENED',
  'OPPORTUNITY_INVALIDATED',
  'OPPORTUNITY_CONFIRMED',
];

export function stateToEventKind(state: string): RadarEventKind | null {
  switch (state) {
    case 'NEW':
      return 'NEW_OPPORTUNITY';
    case 'STRENGTHENING':
      return 'OPPORTUNITY_STRENGTHENED';
    case 'WEAKENING':
      return 'OPPORTUNITY_WEAKENED';
    case 'INVALIDATED':
      return 'OPPORTUNITY_INVALIDATED';
    case 'CONFIRMED':
      return 'OPPORTUNITY_CONFIRMED';
    default:
      return null;
  }
}
