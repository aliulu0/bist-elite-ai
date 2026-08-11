import { EventBusEngine } from './event-bus.engine';
import { DEFAULT_EVENT_BUS_CONFIG, EventBusConfig } from './event-bus.config';
import { BusEvent, EventCategory, EventHandler } from './event-bus.types';

function makeConfig(overrides?: Partial<EventBusConfig>): Partial<EventBusConfig> {
  return {
    maxHistorySize: 10,
    maxSubscribersPerEvent: 5,
    enableHistory: true,
    enableStats: true,
    categories: ['system', 'scheduler', 'scanner', 'analysis', 'opportunity', 'elite_score', 'provider', 'performance', 'backtest'],
    ...overrides,
  };
}

describe('EventBusEngine', () => {
  let engine: EventBusEngine;

  beforeEach(() => {
    engine = new EventBusEngine(makeConfig());
  });

  afterEach(() => {
    engine.clearSubscribers();
    engine.clear();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('publish', () => {
    it('should publish an event', () => {
      const event = engine.publish('test.event', 'system', { foo: 'bar' });
      expect(event.id).toBeDefined();
      expect(event.type).toBe('test.event');
      expect(event.category).toBe('system');
      expect(event.payload).toEqual({ foo: 'bar' });
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should use default options', () => {
      const event = engine.publish('test', 'system', null);
      expect(event.source).toBe('unknown');
      expect(event.severity).toBe('info');
      expect(event.correlationId).toBeNull();
      expect(event.metadata).toEqual({});
    });

    it('should use provided options', () => {
      const event = engine.publish('test', 'system', null, {
        source: 'scanner',
        severity: 'error',
        correlationId: 'corr-123',
        metadata: { key: 'value' },
      });
      expect(event.source).toBe('scanner');
      expect(event.severity).toBe('error');
      expect(event.correlationId).toBe('corr-123');
      expect(event.metadata).toEqual({ key: 'value' });
    });

    it('should add to history', () => {
      engine.publish('test', 'system', null);
      const events = engine.history();
      expect(events.length).toBe(1);
    });

    it('should enforce maxHistorySize', () => {
      for (let i = 0; i < 15; i++) {
        engine.publish('test', 'system', { i });
      }
      const events = engine.history();
      expect(events.length).toBe(10);
      expect((events[0].payload as any).i).toBe(5);
    });

    it('should increment totalPublished', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      const stats = engine.stats();
      expect(stats.totalPublished).toBe(2);
    });

    it('should track events by category', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      engine.publish('c', 'scheduler', null);
      const stats = engine.stats();
      expect(stats.eventsByCategory.system).toBe(2);
      expect(stats.eventsByCategory.scheduler).toBe(1);
    });

    it('should track events by type', () => {
      engine.publish('foo', 'system', null);
      engine.publish('foo', 'scheduler', null);
      engine.publish('bar', 'system', null);
      const stats = engine.stats();
      expect(stats.eventsByType.foo).toBe(2);
      expect(stats.eventsByType.bar).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to all events', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); });
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      expect(received.length).toBe(2);
    });

    it('should subscribe to specific event type', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); }, { eventType: 'target' });
      engine.publish('other', 'system', null);
      engine.publish('target', 'system', null);
      expect(received.length).toBe(1);
      expect(received[0].type).toBe('target');
    });

    it('should subscribe to specific category', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); }, { category: 'analysis' });
      engine.publish('a', 'system', null);
      engine.publish('b', 'analysis', null);
      expect(received.length).toBe(1);
      expect(received[0].category).toBe('analysis');
    });

    it('should subscribe to both type and category', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); }, { eventType: 'target', category: 'analysis' });
      engine.publish('target', 'system', null);
      engine.publish('other', 'analysis', null);
      engine.publish('target', 'analysis', null);
      expect(received.length).toBe(1);
    });

    it('should return subscription id', () => {
      const id = engine.subscribe(() => {});
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should update active subscriptions count', () => {
      engine.subscribe(() => {});
      engine.subscribe(() => {});
      const stats = engine.stats();
      expect(stats.activeSubscriptions).toBe(2);
    });

    it('should deliver events to subscriber', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); });
      engine.publish('test', 'system', { data: 1 });
      expect(received[0].payload).toEqual({ data: 1 });
    });
  });

  describe('once', () => {
    it('should receive only first event', () => {
      const received: BusEvent[] = [];
      engine.once((e) => { received.push(e); });
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      expect(received.length).toBe(1);
    });

    it('should remove subscription after first event', () => {
      engine.once(() => {});
      engine.publish('a', 'system', null);
      const stats = engine.stats();
      expect(stats.activeSubscriptions).toBe(0);
    });

    it('should support event type filter', () => {
      const received: BusEvent[] = [];
      engine.once((e) => { received.push(e); }, { eventType: 'target' });
      engine.publish('other', 'system', null);
      engine.publish('target', 'system', null);
      engine.publish('target', 'system', null);
      expect(received.length).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully', () => {
      const id = engine.subscribe(() => {});
      const result = engine.unsubscribe(id);
      expect(result).toBe(true);
      expect(engine.stats().activeSubscriptions).toBe(0);
    });

    it('should return false for unknown id', () => {
      const result = engine.unsubscribe('nonexistent');
      expect(result).toBe(false);
    });

    it('should stop receiving events after unsubscribe', () => {
      const received: BusEvent[] = [];
      const id = engine.subscribe((e) => { received.push(e); });
      engine.publish('a', 'system', null);
      engine.unsubscribe(id);
      engine.publish('b', 'system', null);
      expect(received.length).toBe(1);
    });
  });

  describe('replay', () => {
    it('should replay all history', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      engine.publish('c', 'system', null);
      const events = engine.replay();
      expect(events.length).toBe(3);
    });

    it('should filter by event type', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      engine.publish('c', 'scheduler', null);
      const events = engine.replay('a');
      expect(events.length).toBe(1);
    });

    it('should filter by category', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      engine.publish('c', 'system', null);
      const events = engine.replay(undefined, 'scheduler');
      expect(events.length).toBe(1);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        engine.publish('test', 'system', { i });
      }
      const events = engine.replay(undefined, undefined, 3);
      expect(events.length).toBe(3);
      expect((events[0].payload as any).i).toBe(7);
    });
  });

  describe('history', () => {
    it('should return all history', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      expect(engine.history().length).toBe(2);
    });

    it('should filter by category', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      expect(engine.history({ category: 'system' }).length).toBe(1);
    });

    it('should filter by type', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      expect(engine.history({ type: 'a' }).length).toBe(1);
    });

    it('should filter by since', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      const future = Date.now() + 60000;
      const events = engine.history({ since: future });
      expect(events.length).toBe(0);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 5; i++) {
        engine.publish('test', 'system', { i });
      }
      expect(engine.history({ limit: 2 }).length).toBe(2);
    });
  });

  describe('stats', () => {
    it('should return stats', () => {
      const stats = engine.stats();
      expect(stats.totalPublished).toBe(0);
      expect(stats.totalDelivered).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.activeSubscriptions).toBe(0);
      expect(stats.historySize).toBe(0);
    });

    it('should track delivery count', () => {
      engine.subscribe(() => {});
      engine.publish('a', 'system', null);
      const stats = engine.stats();
      expect(stats.totalDelivered).toBe(1);
    });

    it('should track failed deliveries', () => {
      engine.subscribe(() => { throw new Error('fail'); });
      engine.publish('a', 'system', null);
      const stats = engine.stats();
      expect(stats.totalFailed).toBe(1);
    });

    it('should track async failures', async () => {
      engine.subscribe(async () => { throw new Error('async fail'); });
      engine.publish('a', 'system', null);
      await new Promise((r) => setTimeout(r, 10));
      const stats = engine.stats();
      expect(stats.totalFailed).toBe(1);
    });
  });

  describe('getSnapshot', () => {
    it('should return snapshot', () => {
      engine.publish('test', 'system', null);
      const snap = engine.getSnapshot();
      expect(snap.stats).toBeDefined();
      expect(snap.recentEvents.length).toBe(1);
      expect(snap.timestamp).toBeDefined();
    });

    it('should limit recent events to 20', () => {
      const bigEngine = new EventBusEngine(makeConfig({ maxHistorySize: 50 }));
      for (let i = 0; i < 25; i++) {
        bigEngine.publish('test', 'system', { i });
      }
      const snap = bigEngine.getSnapshot();
      expect(snap.recentEvents.length).toBe(20);
      bigEngine.clear();
      bigEngine.clearSubscribers();
    });
  });

  describe('getResult', () => {
    it('should return result with metadata', () => {
      const result = engine.getResult();
      expect(result.snapshot).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.config).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear history and stats', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      engine.clear();
      expect(engine.history().length).toBe(0);
      expect(engine.stats().totalPublished).toBe(0);
    });

    it('should preserve subscribers', () => {
      let called = false;
      engine.subscribe(() => { called = true; });
      engine.clear();
      engine.publish('a', 'system', null);
      expect(called).toBe(true);
    });
  });

  describe('clearSubscribers', () => {
    it('should remove all subscribers', () => {
      engine.subscribe(() => {});
      engine.subscribe(() => {});
      engine.clearSubscribers();
      expect(engine.stats().activeSubscriptions).toBe(0);
    });

    it('should stop receiving events', () => {
      const received: BusEvent[] = [];
      engine.subscribe((e) => { received.push(e); });
      engine.clearSubscribers();
      engine.publish('a', 'system', null);
      expect(received.length).toBe(0);
    });
  });

  describe('error isolation', () => {
    it('should not affect other subscribers when one throws', () => {
      const received: BusEvent[] = [];
      engine.subscribe(() => { throw new Error('fail'); });
      engine.subscribe((e) => { received.push(e); });
      engine.publish('test', 'system', null);
      expect(received.length).toBe(1);
    });

    it('should not affect other subscribers when async handler rejects', async () => {
      const received: BusEvent[] = [];
      engine.subscribe(async () => { throw new Error('async fail'); });
      engine.subscribe((e) => { received.push(e); });
      engine.publish('test', 'system', null);
      await new Promise((r) => setTimeout(r, 10));
      expect(received.length).toBe(1);
    });
  });

  describe('constructor defaults', () => {
    it('should use default config when none provided', () => {
      const defaultEngine = new EventBusEngine();
      const result = defaultEngine.getResult();
      expect(result.metadata.config).toEqual(DEFAULT_EVENT_BUS_CONFIG);
    });

    it('should merge with default config', () => {
      const custom = new EventBusEngine({ maxHistorySize: 500 });
      const result = custom.getResult();
      expect((result.metadata.config as any).maxHistorySize).toBe(500);
    });
  });

  describe('disabled history', () => {
    it('should not store history when disabled', () => {
      const noHist = new EventBusEngine({ enableHistory: false });
      noHist.publish('a', 'system', null);
      expect(noHist.history().length).toBe(0);
      noHist.clear();
    });
  });

  describe('disabled stats', () => {
    it('should not track stats when disabled', () => {
      const noStats = new EventBusEngine({ enableStats: false });
      noStats.publish('a', 'system', null);
      expect(noStats.stats().totalPublished).toBe(0);
      noStats.clear();
    });
  });
});
