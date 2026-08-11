import { EventBusService } from './event-bus.service';
import { EventBusEngine } from './event-bus.engine';

describe('EventBusService', () => {
  let service: EventBusService;
  let engine: EventBusEngine;

  beforeEach(() => {
    engine = new EventBusEngine({ maxHistorySize: 100, enableHistory: true, enableStats: true });
    service = new EventBusService(engine);
  });

  afterEach(() => {
    engine.clearSubscribers();
    engine.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHistory', () => {
    it('should return empty when no events', () => {
      const result = service.getHistory();
      expect(result.events).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return events with default limit/offset', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      const result = service.getHistory();
      expect(result.events.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should paginate with limit', () => {
      for (let i = 0; i < 10; i++) engine.publish('evt', 'system', { i });
      const result = service.getHistory({ limit: 3 });
      expect(result.events.length).toBe(3);
      expect(result.total).toBe(10);
    });

    it('should paginate with offset', () => {
      for (let i = 0; i < 5; i++) engine.publish(`evt-${i}`, 'system', { i });
      const result = service.getHistory({ offset: 2 });
      expect(result.events.length).toBe(3);
      expect(result.total).toBe(5);
    });

    it('should paginate with limit and offset', () => {
      for (let i = 0; i < 10; i++) engine.publish(`evt-${i}`, 'system', { i });
      const result = service.getHistory({ limit: 2, offset: 3 });
      expect(result.events.length).toBe(2);
      expect(result.total).toBe(10);
    });

    it('should filter by category', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      engine.publish('c', 'system', null);
      const result = service.getHistory({ category: 'system' });
      expect(result.events.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter by type', () => {
      engine.publish('foo', 'system', null);
      engine.publish('bar', 'system', null);
      engine.publish('foo', 'scheduler', null);
      const result = service.getHistory({ type: 'foo' });
      expect(result.events.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter by category and type combined', () => {
      engine.publish('foo', 'system', null);
      engine.publish('foo', 'scheduler', null);
      engine.publish('bar', 'system', null);
      const result = service.getHistory({ category: 'system', type: 'foo' });
      expect(result.events.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle offset beyond total', () => {
      engine.publish('a', 'system', null);
      const result = service.getHistory({ offset: 100 });
      expect(result.events).toEqual([]);
      expect(result.total).toBe(1);
    });

    it('should handle limit=1', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'system', null);
      const result = service.getHistory({ limit: 1 });
      expect(result.events.length).toBe(1);
    });
  });

  describe('getEventTypes', () => {
    it('should return empty when no events', () => {
      expect(service.getEventTypes()).toEqual([]);
    });

    it('should return types with counts', () => {
      engine.publish('workflow.created', 'system', null);
      engine.publish('workflow.created', 'scheduler', null);
      engine.publish('scan.started', 'scanner', null);
      const result = service.getEventTypes();
      expect(result.length).toBe(2);
      expect(result.find((t) => t.type === 'workflow.created')?.count).toBe(2);
      expect(result.find((t) => t.type === 'scan.started')?.count).toBe(1);
    });

    it('should track all 9 categories', () => {
      const cats: Array<{ type: string; cat: string }> = [
        { type: 'sys', cat: 'system' }, { type: 'sch', cat: 'scanner' },
        { type: 'an', cat: 'analysis' }, { type: 'op', cat: 'opportunity' },
        { type: 'el', cat: 'elite_score' }, { type: 'pr', cat: 'provider' },
        { type: 'pe', cat: 'performance' }, { type: 'ba', cat: 'backtest' },
        { type: 'sc', cat: 'scheduler' },
      ];
      cats.forEach(({ type, cat }) => engine.publish(type, cat as any, null));
      const types = service.getEventTypes();
      expect(types.length).toBe(9);
    });
  });

  describe('getEventsByType', () => {
    it('should return matching events', () => {
      engine.publish('target', 'system', null);
      engine.publish('other', 'system', null);
      engine.publish('target', 'scheduler', null);
      const events = service.getEventsByType('target');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.type === 'target')).toBe(true);
    });

    it('should return empty for no matches', () => {
      engine.publish('a', 'system', null);
      expect(service.getEventsByType('nonexistent')).toEqual([]);
    });

    it('should filter by category', () => {
      engine.publish('target', 'system', null);
      engine.publish('target', 'scheduler', null);
      const events = service.getEventsByType('target', { category: 'scheduler' });
      expect(events.length).toBe(1);
      expect(events[0].category).toBe('scheduler');
    });

    it('should respect limit', () => {
      for (let i = 0; i < 5; i++) engine.publish('target', 'system', { i });
      expect(service.getEventsByType('target', { limit: 2 }).length).toBe(2);
    });

    it('should handle empty type string', () => {
      engine.publish('', 'system', null);
      expect(service.getEventsByType('').length).toBe(1);
    });
  });

  describe('getStatistics', () => {
    it('should return stats', () => {
      engine.publish('a', 'system', null);
      engine.subscribe(() => {});
      const stats = service.getStatistics();
      expect(stats.totalPublished).toBe(1);
      expect(stats.activeSubscriptions).toBe(1);
    });

    it('should track delivery counts', () => {
      engine.subscribe(() => {});
      engine.publish('a', 'system', null);
      const stats = service.getStatistics();
      expect(stats.totalDelivered).toBe(1);
    });

    it('should track failed deliveries', () => {
      engine.subscribe(() => { throw new Error('fail'); });
      engine.publish('a', 'system', null);
      const stats = service.getStatistics();
      expect(stats.totalFailed).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear history and stats', () => {
      engine.publish('a', 'system', null);
      engine.publish('b', 'scheduler', null);
      service.clear();
      expect(service.getHistory().events).toEqual([]);
      expect(service.getStatistics().totalPublished).toBe(0);
    });

    it('should preserve subscribers after clear', () => {
      let called = false;
      engine.subscribe(() => { called = true; });
      service.clear();
      engine.publish('new', 'system', null);
      expect(called).toBe(true);
    });
  });

  describe('isCategoryValid', () => {
    it('should return true for all valid categories', () => {
      const valid = ['system', 'scheduler', 'scanner', 'analysis', 'opportunity', 'elite_score', 'provider', 'performance', 'backtest'];
      valid.forEach((cat) => expect(service.isCategoryValid(cat)).toBe(true));
    });

    it('should return false for invalid categories', () => {
      expect(service.isCategoryValid('invalid')).toBe(false);
      expect(service.isCategoryValid('')).toBe(false);
      expect(service.isCategoryValid('SYSTEM')).toBe(false);
      expect(service.isCategoryValid('system ')).toBe(false);
    });
  });
});
