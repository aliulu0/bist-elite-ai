import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceMonitorController } from './performance-monitor.controller';
import { PerformanceMonitorService } from './performance-monitor.service';
import { PerformanceMonitorEngine } from './performance-monitor.engine';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MetricCategory } from './performance-monitor.types';

function makeEngine() {
  return new PerformanceMonitorEngine({ retentionWindowMs: 60000, maxEntriesPerName: 100 });
}

function seedMetric(engine: PerformanceMonitorEngine, category: MetricCategory, name: string, value: number) {
  engine.record(category, name, value);
}

const mockService = {
  getSnapshot: jest.fn(),
  getHealth: jest.fn(),
  getCacheMetrics: jest.fn(),
  getSystemMetrics: jest.fn(),
  getAllMetrics: jest.fn(),
  getMetricsByCategory: jest.fn(),
  getMetricStats: jest.fn(),
  resetAllMetrics: jest.fn(),
  resetMetric: jest.fn(),
};

describe('PerformanceMonitorController', () => {
  let controller: PerformanceMonitorController;
  let engine: PerformanceMonitorEngine;

  beforeEach(async () => {
    jest.clearAllMocks();
    engine = makeEngine();

    mockService.getSnapshot.mockReturnValue(engine.getSnapshot());
    mockService.getHealth.mockReturnValue(engine.getHealth());
    mockService.getCacheMetrics.mockReturnValue(engine.getCacheMetrics());
    mockService.getSystemMetrics.mockReturnValue(engine.getSystemMetrics());
    mockService.getAllMetrics.mockReturnValue([]);
    mockService.getMetricsByCategory.mockReturnValue([]);
    mockService.getMetricStats.mockReturnValue(null);
    mockService.resetAllMetrics.mockReturnValue(undefined);
    mockService.resetMetric.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceMonitorController],
      providers: [
        { provide: PerformanceMonitorService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PerformanceMonitorController>(PerformanceMonitorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /performance', () => {
    it('should return full snapshot', () => {
      const result = controller.getSnapshot();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.getSnapshot', () => {
      controller.getSnapshot();
      expect(mockService.getSnapshot).toHaveBeenCalledTimes(1);
    });

    it('should include system metrics in snapshot', () => {
      const result = controller.getSnapshot();
      expect(result.data).toHaveProperty('system');
      expect(result.data).toHaveProperty('cache');
      expect(result.data).toHaveProperty('health');
      expect(result.data).toHaveProperty('metrics');
    });

    it('should return ISO timestamp', () => {
      const result = controller.getSnapshot();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('GET /performance/health', () => {
    it('should return health check', () => {
      const result = controller.getHealth();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('status');
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.getHealth', () => {
      controller.getHealth();
      expect(mockService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should include status field', () => {
      mockService.getHealth.mockReturnValue({
        status: 'HEALTHY',
        metrics: [],
        system: {},
        cache: {},
        timestamp: new Date().toISOString(),
      });
      const result = controller.getHealth();
      expect(result.data.status).toBe('HEALTHY');
    });
  });

  describe('GET /performance/cache', () => {
    it('should return cache metrics', () => {
      mockService.getCacheMetrics.mockReturnValue({
        hits: 100,
        misses: 10,
        hitRate: 90.9,
        totalOperations: 110,
      });
      const result = controller.getCache();
      expect(result.success).toBe(true);
      expect(result.data.hits).toBe(100);
      expect(result.data.misses).toBe(10);
      expect(result.data.hitRate).toBe(90.9);
      expect(result.data.totalOperations).toBe(110);
    });

    it('should call service.getCacheMetrics', () => {
      controller.getCache();
      expect(mockService.getCacheMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /performance/system', () => {
    it('should return system metrics', () => {
      mockService.getSystemMetrics.mockReturnValue({
        memoryUsageBytes: 52428800,
        heapUsedBytes: 35651584,
        heapTotalBytes: 67108864,
        externalBytes: 2097152,
        uptimeMs: 3600000,
        cpuUsagePercent: 12.5,
        rssBytes: 73400320,
      });
      const result = controller.getSystem();
      expect(result.success).toBe(true);
      expect(result.data.memoryUsageBytes).toBe(52428800);
      expect(result.data.uptimeMs).toBe(3600000);
      expect(result.data.cpuUsagePercent).toBe(12.5);
    });

    it('should call service.getSystemMetrics', () => {
      controller.getSystem();
      expect(mockService.getSystemMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /performance/metrics', () => {
    it('should return all metrics', () => {
      mockService.getAllMetrics.mockReturnValue([
        { name: 'metric_a', category: 'api_response', count: 5, min: 1, max: 10, avg: 5, p50: 5, p95: 10, p99: 10, lastValue: 10, lastTimestamp: Date.now(), rollingAvg: 5 },
      ]);
      const result = controller.getMetrics();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('metric_a');
    });

    it('should return empty array when no metrics', () => {
      mockService.getAllMetrics.mockReturnValue([]);
      const result = controller.getMetrics();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should call service.getAllMetrics', () => {
      controller.getMetrics();
      expect(mockService.getAllMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /performance/category/:category', () => {
    it('should return metrics for valid category', () => {
      mockService.getMetricsByCategory.mockReturnValue([
        { name: 'resp_time', category: 'api_response', count: 10, min: 1, max: 100, avg: 50, p50: 50, p95: 95, p99: 100, lastValue: 100, lastTimestamp: Date.now(), rollingAvg: 50 },
      ]);
      const result = controller.getCategory({ category: 'api_response' });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockService.getMetricsByCategory).toHaveBeenCalledWith('api_response');
    });

    it('should throw for invalid category', () => {
      expect(() => controller.getCategory({ category: 'invalid_cat' })).toThrow(BadRequestException);
    });

    it('should accept all valid categories', () => {
      const validCategories = [
        'engine_execution', 'pipeline', 'scheduler',
        'provider_latency', 'cache', 'system', 'api_response',
      ];
      for (const cat of validCategories) {
        mockService.getMetricsByCategory.mockReturnValue([]);
        const result = controller.getCategory({ category: cat });
        expect(result.success).toBe(true);
      }
    });

    it('should return empty array for category with no data', () => {
      mockService.getMetricsByCategory.mockReturnValue([]);
      const result = controller.getCategory({ category: 'scheduler' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('GET /performance/metric/:name', () => {
    it('should return metric stats when found', () => {
      mockService.getMetricStats.mockReturnValue({
        name: 'api_response_time',
        category: 'api_response',
        count: 50,
        min: 10,
        max: 500,
        avg: 100,
        p50: 80,
        p95: 400,
        p99: 480,
        lastValue: 120,
        lastTimestamp: Date.now(),
        rollingAvg: 95,
      });
      const result = controller.getMetric({ name: 'api_response_time' });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('api_response_time');
      expect(result.data.count).toBe(50);
      expect(mockService.getMetricStats).toHaveBeenCalledWith('api_response_time');
    });

    it('should throw NotFoundException when metric not found', () => {
      mockService.getMetricStats.mockReturnValue(null);
      expect(() => controller.getMetric({ name: 'nonexistent' })).toThrow(NotFoundException);
    });

    it('should include all stat fields in response', () => {
      const stats = {
        name: 'test',
        category: 'cache' as MetricCategory,
        count: 1,
        min: 1,
        max: 1,
        avg: 1,
        p50: 1,
        p95: 1,
        p99: 1,
        lastValue: 1,
        lastTimestamp: 1,
        rollingAvg: 1,
      };
      mockService.getMetricStats.mockReturnValue(stats);
      const result = controller.getMetric({ name: 'test' });
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('count');
      expect(result.data).toHaveProperty('min');
      expect(result.data).toHaveProperty('max');
      expect(result.data).toHaveProperty('avg');
      expect(result.data).toHaveProperty('p50');
      expect(result.data).toHaveProperty('p95');
      expect(result.data).toHaveProperty('p99');
      expect(result.data).toHaveProperty('lastValue');
      expect(result.data).toHaveProperty('lastTimestamp');
      expect(result.data).toHaveProperty('rollingAvg');
    });
  });

  describe('POST /performance/reset', () => {
    it('should reset all metrics', () => {
      const result = controller.resetAll();
      expect(result.success).toBe(true);
      expect(result.message).toBe('All metrics have been reset');
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.resetAllMetrics', () => {
      controller.resetAll();
      expect(mockService.resetAllMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return ISO timestamp', () => {
      const result = controller.resetAll();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('POST /performance/metric/:name/reset', () => {
    it('should reset a specific metric', () => {
      mockService.resetMetric.mockReturnValue(true);
      const result = controller.resetMetric({ name: 'api_response_time' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('api_response_time');
      expect(mockService.resetMetric).toHaveBeenCalledWith('api_response_time');
    });

    it('should throw NotFoundException when metric not found', () => {
      mockService.resetMetric.mockReturnValue(false);
      expect(() => controller.resetMetric({ name: 'nonexistent' })).toThrow(NotFoundException);
    });

    it('should return success message', () => {
      mockService.resetMetric.mockReturnValue(true);
      const result = controller.resetMetric({ name: 'my_metric' });
      expect(result.message).toBe("Metric 'my_metric' has been reset");
    });
  });
});
