import { PerformanceValidatorService } from '../performance-validator.service';
import { MetricsService } from '../../monitoring/metrics.service';
import { ReadinessStatus } from '../types';

jest.mock('../../monitoring/metrics.service', () => ({
  MetricsService: jest.fn().mockImplementation(() => ({
    getSnapshot: jest.fn().mockReturnValue({
      uptime: 1000,
      requests: {
        total: 100,
        byMethod: { GET: 80, POST: 20 },
        byStatus: { '200': 95, '500': 5 },
        avgDuration: 150,
        p95Duration: 500,
        p99Duration: 1200,
        failedRequests: 5,
        slowRequests: 3,
      },
      system: {
        cpuUsage: { user: 1000, system: 500 },
        memoryUsage: process.memoryUsage(),
        uptime: 1000,
        activeHandles: 10,
        activeRequests: 2,
      },
      database: { slowQueries: [], totalQueries: 50, failedQueries: 0 },
      worker: { activeJobs: 0, completedJobs: 10, failedJobs: 0, queueLength: 0 },
      timestamp: new Date().toISOString(),
    }),
    incrementCounter: jest.fn(),
    setGauge: jest.fn(),
  })),
}));

describe('PerformanceValidatorService', () => {
  let service: PerformanceValidatorService;
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
    service = new PerformanceValidatorService(metricsService);
  });

  describe('validate', () => {
    it('should return PASS for good performance', () => {
      const result = service.validate();
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(result.benchmarks.length).toBeGreaterThan(0);
      expect(result.overallScore).toBe(100);
    });

    it('should return WARN for poor performance', () => {
      const mockMetrics = {
        getSnapshot: jest.fn().mockReturnValue({
          uptime: 1000,
          requests: {
            total: 100,
            byMethod: {},
            byStatus: {},
            avgDuration: 5000,
            p95Duration: 10000,
            p99Duration: 20000,
            failedRequests: 5,
            slowRequests: 50,
          },
          system: {
            cpuUsage: { user: 1000, system: 500 },
            memoryUsage: process.memoryUsage(),
            uptime: 1000,
            activeHandles: 10,
            activeRequests: 2,
          },
          database: {
            slowQueries: [{ query: 'test', duration: 2000, timestamp: Date.now() }],
            totalQueries: 50,
            failedQueries: 0,
          },
          worker: { activeJobs: 0, completedJobs: 10, failedJobs: 0, queueLength: 0 },
          timestamp: new Date().toISOString(),
        }),
        incrementCounter: jest.fn(),
        setGauge: jest.fn(),
      };

      const svc = new PerformanceValidatorService(mockMetrics as never);
      const result = svc.validate();
      expect(result.status).toBe(ReadinessStatus.WARN);
    });

    it('should include timestamps', () => {
      const result = service.validate();
      expect(result.timestamp).toBeDefined();
    });

    it('should respect custom thresholds', () => {
      const mockMetrics = {
        getSnapshot: jest.fn().mockReturnValue({
          uptime: 1000,
          requests: {
            total: 100,
            byMethod: {},
            byStatus: {},
            avgDuration: 50,
            p95Duration: 100,
            p99Duration: 150,
            failedRequests: 0,
            slowRequests: 0,
          },
          system: {
            cpuUsage: { user: 1000, system: 500 },
            memoryUsage: process.memoryUsage(),
            uptime: 1000,
            activeHandles: 10,
            activeRequests: 2,
          },
          database: { slowQueries: [], totalQueries: 50, failedQueries: 0 },
          worker: { activeJobs: 0, completedJobs: 10, failedJobs: 0, queueLength: 0 },
          timestamp: new Date().toISOString(),
        }),
        incrementCounter: jest.fn(),
        setGauge: jest.fn(),
      };

      const svc = new PerformanceValidatorService(
        mockMetrics as never,
        { 'api.avg': 10, 'api.p95': 20, 'api.p99': 30, 'db_query.slow': 1 },
      );
      const result = svc.validate();
      expect(result.status).toBe(ReadinessStatus.WARN);
    });
  });
});
