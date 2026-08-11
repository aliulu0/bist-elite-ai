import { Test, TestingModule } from '@nestjs/testing';
import { EventBusController } from './event-bus.controller';
import { EventBusService } from './event-bus.service';

describe('EventBusController', () => {
  let controller: EventBusController;

  const mockService = {
    getHistory: jest.fn(),
    getEventTypes: jest.fn(),
    getEventsByType: jest.fn(),
    getStatistics: jest.fn(),
    clear: jest.fn(),
    isCategoryValid: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventBusController],
      providers: [{ provide: EventBusService, useValue: mockService }],
    }).compile();
    controller = module.get(EventBusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/events', () => {
    it('should return events with default limit/offset', async () => {
      mockService.isCategoryValid.mockReturnValue(true);
      mockService.getHistory.mockReturnValue({ events: [{ id: 'evt-1', type: 'test', category: 'system' }], total: 1 });
      const result = await controller.getEvents({});
      expect(result.success).toBe(true);
      expect(result.data.events.length).toBe(1);
      expect(result.data.total).toBe(1);
      expect(result.timestamp).toBeDefined();
      expect(mockService.getHistory).toHaveBeenCalledWith({ limit: 50, offset: 0, category: undefined, type: undefined });
    });

    it('should use provided limit and offset', async () => {
      mockService.isCategoryValid.mockReturnValue(true);
      mockService.getHistory.mockReturnValue({ events: [], total: 0 });
      await controller.getEvents({ limit: 10, offset: 5 });
      expect(mockService.getHistory).toHaveBeenCalledWith({ limit: 10, offset: 5, category: undefined, type: undefined });
    });

    it('should filter by category', async () => {
      mockService.isCategoryValid.mockReturnValue(true);
      mockService.getHistory.mockReturnValue({ events: [], total: 0 });
      await controller.getEvents({ category: 'system' });
      expect(mockService.getHistory).toHaveBeenCalledWith({ limit: 50, offset: 0, category: 'system', type: undefined });
    });

    it('should filter by type', async () => {
      mockService.isCategoryValid.mockReturnValue(true);
      mockService.getHistory.mockReturnValue({ events: [], total: 0 });
      await controller.getEvents({ type: 'workflow.created' });
      expect(mockService.getHistory).toHaveBeenCalledWith({ limit: 50, offset: 0, category: undefined, type: 'workflow.created' });
    });

    it('should return success=false for invalid category', async () => {
      mockService.isCategoryValid.mockReturnValue(false);
      const result = await controller.getEvents({ category: 'invalid_category' });
      expect(result.success).toBe(false);
      expect(result.data.events).toEqual([]);
    });

    it('should return success=false for unknown category string', async () => {
      mockService.isCategoryValid.mockReturnValue(false);
      const result = await controller.getEvents({ category: 'xyzzy' });
      expect(result.success).toBe(false);
      expect(result.data.total).toBe(0);
    });

    it('should handle large offset returning empty', async () => {
      mockService.isCategoryValid.mockReturnValue(true);
      mockService.getHistory.mockReturnValue({ events: [], total: 3 });
      const result = await controller.getEvents({ offset: 100, limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data.events).toEqual([]);
      expect(result.data.total).toBe(3);
    });
  });

  describe('GET /api/v1/events/types', () => {
    it('should return event types with counts', async () => {
      mockService.getEventTypes.mockReturnValue([
        { type: 'workflow.created', count: 5 },
        { type: 'scan.started', count: 2 },
      ]);
      const result = await controller.getEventTypes();
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].type).toBe('workflow.created');
      expect(result.data[0].count).toBe(5);
    });

    it('should return empty array when no types', async () => {
      mockService.getEventTypes.mockReturnValue([]);
      const result = await controller.getEventTypes();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle many event types', async () => {
      const types = Array.from({ length: 100 }, (_, i) => ({ type: `event.type.${i}`, count: i }));
      mockService.getEventTypes.mockReturnValue(types);
      const result = await controller.getEventTypes();
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(100);
    });
  });

  describe('GET /api/v1/events/type/:type', () => {
    it('should return events by type with filters', async () => {
      mockService.getEventsByType.mockReturnValue([
        { id: 'evt-1', type: 'workflow.created', category: 'system' },
      ]);
      const result = await controller.getEventsByType(
        { type: 'workflow.created' },
        { limit: 10, category: 'system' },
      );
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mockService.getEventsByType).toHaveBeenCalledWith('workflow.created', { limit: 10, category: 'system' });
    });

    it('should return empty for no matches', async () => {
      mockService.getEventsByType.mockReturnValue([]);
      const result = await controller.getEventsByType({ type: 'nonexistent' }, {});
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should use defaults when no query params', async () => {
      mockService.getEventsByType.mockReturnValue([]);
      await controller.getEventsByType({ type: 'test' }, {});
      expect(mockService.getEventsByType).toHaveBeenCalledWith('test', { limit: undefined, category: undefined });
    });

    it('should handle special characters in type', async () => {
      mockService.getEventsByType.mockReturnValue([]);
      await controller.getEventsByType({ type: 'workflow.step.completed' }, {});
      expect(mockService.getEventsByType).toHaveBeenCalledWith('workflow.step.completed', { limit: undefined, category: undefined });
    });

    it('should handle category filter only', async () => {
      mockService.getEventsByType.mockReturnValue([{ id: 'e1', type: 'test', category: 'scheduler' }]);
      const result = await controller.getEventsByType({ type: 'test' }, { category: 'scheduler' });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/events/statistics', () => {
    it('should return full statistics', async () => {
      mockService.getStatistics.mockReturnValue({
        totalPublished: 10,
        totalDelivered: 9,
        totalFailed: 1,
        activeSubscriptions: 2,
        historySize: 8,
        eventsByCategory: { system: 5, scheduler: 3 },
        eventsByType: { 'workflow.created': 4, 'scan.started': 6 },
      });
      const result = await controller.getStatistics();
      expect(result.success).toBe(true);
      expect(result.data.totalPublished).toBe(10);
      expect(result.data.totalDelivered).toBe(9);
      expect(result.data.totalFailed).toBe(1);
      expect(result.data.activeSubscriptions).toBe(2);
      expect(result.data.historySize).toBe(8);
      expect(result.data.eventsByCategory.system).toBe(5);
      expect(result.data.eventsByType['workflow.created']).toBe(4);
    });

    it('should return zero stats when empty', async () => {
      mockService.getStatistics.mockReturnValue({
        totalPublished: 0, totalDelivered: 0, totalFailed: 0,
        activeSubscriptions: 0, historySize: 0,
        eventsByCategory: {}, eventsByType: {},
      });
      const result = await controller.getStatistics();
      expect(result.success).toBe(true);
      expect(result.data.totalPublished).toBe(0);
    });

    it('should have timestamp in response', async () => {
      mockService.getStatistics.mockReturnValue({
        totalPublished: 0, totalDelivered: 0, totalFailed: 0,
        activeSubscriptions: 0, historySize: 0,
        eventsByCategory: {}, eventsByType: {},
      });
      const result = await controller.getStatistics();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/events/clear', () => {
    it('should clear history and return success', async () => {
      mockService.clear.mockImplementation(() => {});
      const result = await controller.clearHistory();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Event history cleared successfully');
      expect(result.timestamp).toBeDefined();
      expect(mockService.clear).toHaveBeenCalled();
    });

    it('should call clear exactly once', async () => {
      await controller.clearHistory();
      expect(mockService.clear).toHaveBeenCalledTimes(1);
    });

    it('should return valid ISO timestamp', async () => {
      const result = await controller.clearHistory();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
