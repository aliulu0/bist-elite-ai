import { Injectable, Optional } from '@nestjs/common';
import {
  BusEvent,
  EventHandler,
  Subscription,
  EventCategory,
  EventSeverity,
  EventBusStats,
  EventBusSnapshot,
  EventBusResult,
} from './event-bus.types';
import { EventBusConfig, DEFAULT_EVENT_BUS_CONFIG } from './event-bus.config';

let nextSubId = 0;
let nextEventId = 0;

@Injectable()
export class EventBusEngine {
  private readonly config: EventBusConfig;
  private readonly subscribers = new Map<string, Subscription>();
  private readonly eventHistory: BusEvent[] = [];
  private readonly eventTypeIndex = new Map<string, Set<string>>();
  private readonly categoryIndex = new Map<EventCategory, Set<string>>();
  private totalPublished = 0;
  private totalDelivered = 0;
  private totalFailed = 0;
  private readonly eventsByCategory = new Map<EventCategory, number>();
  private readonly eventsByType = new Map<string, number>();

  constructor(@Optional() config?: Partial<EventBusConfig>) {
    this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config };
    for (const cat of this.config.categories) {
      this.eventsByCategory.set(cat, 0);
      this.categoryIndex.set(cat, new Set());
    }
  }

  publish(
    type: string,
    category: EventCategory,
    payload: unknown,
    options?: {
      source?: string;
      severity?: EventSeverity;
      correlationId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): BusEvent {
    const event: BusEvent = {
      id: `evt-${Date.now()}-${(nextEventId++).toString(36)}`,
      type,
      timestamp: Date.now(),
      correlationId: options?.correlationId ?? null,
      source: options?.source ?? 'unknown',
      severity: options?.severity ?? 'info',
      category,
      payload,
      metadata: options?.metadata ?? {},
    };

    if (this.config.enableHistory) {
      this.eventHistory.push(event);
      if (this.eventHistory.length > this.config.maxHistorySize) {
        this.eventHistory.splice(0, this.eventHistory.length - this.config.maxHistorySize);
      }
    }

    if (this.config.enableStats) {
      this.totalPublished++;
      this.eventsByCategory.set(category, (this.eventsByCategory.get(category) ?? 0) + 1);
      this.eventsByType.set(type, (this.eventsByType.get(type) ?? 0) + 1);
    }

    this.deliver(event);

    return event;
  }

  subscribe(
    handler: EventHandler,
    options?: { eventType?: string; category?: EventCategory },
  ): string {
    const id = `sub-${(nextSubId++).toString(36)}`;
    const subscription: Subscription = {
      id,
      eventType: options?.eventType ?? null,
      category: options?.category ?? null,
      handler,
      once: false,
    };

    this.subscribers.set(id, subscription);
    this.indexSubscription(subscription);
    return id;
  }

  once(
    handler: EventHandler,
    options?: { eventType?: string; category?: EventCategory },
  ): string {
    const id = `sub-${(nextSubId++).toString(36)}`;
    const subscription: Subscription = {
      id,
      eventType: options?.eventType ?? null,
      category: options?.category ?? null,
      handler,
      once: true,
    };

    this.subscribers.set(id, subscription);
    this.indexSubscription(subscription);
    return id;
  }

  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscribers.get(subscriptionId);
    if (!sub) return false;

    this.removeIndex(sub);
    this.subscribers.delete(subscriptionId);
    return true;
  }

  replay(eventType?: string, category?: EventCategory, limit?: number): BusEvent[] {
    let events = [...this.eventHistory];

    if (eventType) {
      events = events.filter((e) => e.type === eventType);
    }
    if (category) {
      events = events.filter((e) => e.category === category);
    }

    if (limit && limit > 0) {
      events = events.slice(-limit);
    }

    return events;
  }

  history(options?: { category?: EventCategory; type?: string; since?: number; limit?: number }): BusEvent[] {
    let events = [...this.eventHistory];

    if (options?.category) {
      events = events.filter((e) => e.category === options.category);
    }
    if (options?.type) {
      events = events.filter((e) => e.type === options.type);
    }
    if (options?.since) {
      events = events.filter((e) => e.timestamp >= options.since!);
    }

    if (options?.limit && options.limit > 0) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  stats(): EventBusStats {
    const eventsByCategory: Record<string, number> = {};
    for (const [cat, count] of this.eventsByCategory) {
      eventsByCategory[cat] = count;
    }

    const eventsByType: Record<string, number> = {};
    for (const [type, count] of this.eventsByType) {
      eventsByType[type] = count;
    }

    return {
      totalPublished: this.totalPublished,
      totalDelivered: this.totalDelivered,
      totalFailed: this.totalFailed,
      activeSubscriptions: this.subscribers.size,
      historySize: this.eventHistory.length,
      eventsByCategory: eventsByCategory as Record<EventCategory, number>,
      eventsByType,
    };
  }

  getSnapshot(): EventBusSnapshot {
    return {
      stats: this.stats(),
      recentEvents: this.eventHistory.slice(-20),
      timestamp: new Date().toISOString(),
    };
  }

  getResult(): EventBusResult {
    return {
      snapshot: this.getSnapshot(),
      metadata: {
        config: this.config,
        subscriberCount: this.subscribers.size,
      },
    };
  }

  clear(): void {
    this.eventHistory.length = 0;
    this.totalPublished = 0;
    this.totalDelivered = 0;
    this.totalFailed = 0;
    this.eventsByCategory.clear();
    this.eventsByType.clear();
    for (const cat of this.config.categories) {
      this.eventsByCategory.set(cat, 0);
    }
  }

  clearSubscribers(): void {
    this.subscribers.clear();
    this.eventTypeIndex.clear();
    this.categoryIndex.clear();
    for (const cat of this.config.categories) {
      this.categoryIndex.set(cat, new Set());
    }
  }

  private deliver(event: BusEvent): void {
    const matching = this.getMatchingSubscribers(event);

    for (const sub of matching) {
      try {
        const result = sub.handler(event);
        if (result instanceof Promise) {
          result.catch(() => {
            this.totalFailed++;
          });
        }
        this.totalDelivered++;

        if (sub.once) {
          this.removeIndex(sub);
          this.subscribers.delete(sub.id);
        }
      } catch {
        this.totalFailed++;
        if (sub.once) {
          this.removeIndex(sub);
          this.subscribers.delete(sub.id);
        }
      }
    }
  }

  private getMatchingSubscribers(event: BusEvent): Subscription[] {
    const matches: Subscription[] = [];

    for (const sub of this.subscribers.values()) {
      const typeMatch = !sub.eventType || sub.eventType === event.type;
      const catMatch = !sub.category || sub.category === event.category;
      if (typeMatch && catMatch) {
        matches.push(sub);
      }
    }

    return matches;
  }

  private indexSubscription(sub: Subscription): void {
    if (sub.eventType) {
      let set = this.eventTypeIndex.get(sub.eventType);
      if (!set) {
        set = new Set();
        this.eventTypeIndex.set(sub.eventType, set);
      }
      set.add(sub.id);
    }

    if (sub.category) {
      let set = this.categoryIndex.get(sub.category);
      if (!set) {
        set = new Set();
        this.categoryIndex.set(sub.category, set);
      }
      set.add(sub.id);
    }
  }

  private removeIndex(sub: Subscription): void {
    if (sub.eventType) {
      const set = this.eventTypeIndex.get(sub.eventType);
      if (set) set.delete(sub.id);
    }
    if (sub.category) {
      const set = this.categoryIndex.get(sub.category);
      if (set) set.delete(sub.id);
    }
  }
}
