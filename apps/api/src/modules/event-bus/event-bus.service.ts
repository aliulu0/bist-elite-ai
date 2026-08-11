import { Injectable } from '@nestjs/common';
import { EventBusEngine } from './event-bus.engine';
import { EventCategory, BusEvent, EventBusStats } from './event-bus.types';
import { VALID_CATEGORIES } from './dto/event-bus-query.dto';

@Injectable()
export class EventBusService {
  constructor(private readonly engine: EventBusEngine) {}

  getHistory(options?: { limit?: number; offset?: number; category?: string; type?: string }): {
    events: BusEvent[];
    total: number;
  } {
    const allEvents = this.engine.history({
      category: options?.category as EventCategory | undefined,
      type: options?.type,
    });
    const total = allEvents.length;
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const events = allEvents.slice(offset, offset + limit);
    return { events, total };
  }

  getEventTypes(): { type: string; count: number }[] {
    const stats = this.engine.stats();
    return Object.entries(stats.eventsByType).map(([type, count]) => ({
      type,
      count,
    }));
  }

  getEventsByType(type: string, options?: { limit?: number; category?: string }): BusEvent[] {
    return this.engine.replay(type, options?.category as EventCategory | undefined, options?.limit);
  }

  getStatistics(): EventBusStats {
    return this.engine.stats();
  }

  clear(): void {
    this.engine.clear();
  }

  isCategoryValid(category: string): boolean {
    return (VALID_CATEGORIES as readonly string[]).includes(category);
  }
}
