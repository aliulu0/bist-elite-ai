import { MetricsService } from '../metrics.service';
import { MetricType } from '../types';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('request recording', () => {
    it('records a request', () => {
      service.recordRequest({
        method: 'GET',
        path: '/api/health',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.total).toBe(1);
    });

    it('records multiple requests', () => {
      for (let i = 0; i < 5; i++) {
        service.recordRequest({
          method: 'GET',
          path: '/api/health',
          statusCode: 200,
          duration: 50 + i,
          timestamp: Date.now(),
        });
      }

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.total).toBe(5);
    });

    it('counts by method', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'POST', path: '/', statusCode: 201, duration: 10, timestamp: Date.now() });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.byMethod['GET']).toBe(2);
      expect(snapshot.requests.byMethod['POST']).toBe(1);
    });

    it('counts by status code', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 404, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 500, duration: 10, timestamp: Date.now() });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.byStatus['200']).toBe(1);
      expect(snapshot.requests.byStatus['404']).toBe(1);
      expect(snapshot.requests.byStatus['500']).toBe(1);
    });

    it('tracks failed requests (4xx and 5xx)', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 400, duration: 10, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 500, duration: 10, timestamp: Date.now() });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.failedRequests).toBe(2);
    });

    it('tracks slow requests (>3000ms)', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 100, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 5000, timestamp: Date.now() });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.slowRequests).toBe(1);
    });

    it('calculates average duration', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 100, timestamp: Date.now() });
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 200, timestamp: Date.now() });

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.avgDuration).toBe(150);
    });

    it('calculates p95 and p99 durations', () => {
      for (let i = 1; i <= 100; i++) {
        service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: i, timestamp: Date.now() });
      }

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.p95Duration).toBeGreaterThanOrEqual(95);
      expect(snapshot.requests.p99Duration).toBeGreaterThanOrEqual(99);
    });
  });

  describe('database metrics', () => {
    it('records slow queries', () => {
      service.recordSlowQuery('SELECT * FROM users', 2000);

      const snapshot = service.getSnapshot();
      expect(snapshot.database.totalQueries).toBe(1);
      expect(snapshot.database.slowQueries).toHaveLength(1);
      expect(snapshot.database.slowQueries[0].query).toBe('SELECT * FROM users');
      expect(snapshot.database.slowQueries[0].duration).toBe(2000);
    });

    it('does not record fast queries as slow', () => {
      service.recordSlowQuery('SELECT 1', 50);

      const snapshot = service.getSnapshot();
      expect(snapshot.database.totalQueries).toBe(1);
      expect(snapshot.database.slowQueries).toHaveLength(0);
    });

    it('records failed queries', () => {
      service.recordQueryFailed();
      service.recordQueryFailed();

      const snapshot = service.getSnapshot();
      expect(snapshot.database.failedQueries).toBe(2);
    });
  });

  describe('worker metrics', () => {
    it('tracks active jobs', () => {
      service.incrementActiveJobs();
      service.incrementActiveJobs();

      const snapshot = service.getSnapshot();
      expect(snapshot.worker.activeJobs).toBe(2);
    });

    it('decrements active jobs', () => {
      service.incrementActiveJobs();
      service.incrementActiveJobs();
      service.decrementActiveJobs();

      const snapshot = service.getSnapshot();
      expect(snapshot.worker.activeJobs).toBe(1);
    });

    it('does not go below zero', () => {
      service.decrementActiveJobs();
      service.decrementActiveJobs();

      const snapshot = service.getSnapshot();
      expect(snapshot.worker.activeJobs).toBe(0);
    });

    it('tracks completed and failed jobs', () => {
      service.recordJobCompleted();
      service.recordJobCompleted();
      service.recordJobFailed();

      const snapshot = service.getSnapshot();
      expect(snapshot.worker.completedJobs).toBe(2);
      expect(snapshot.worker.failedJobs).toBe(1);
    });

    it('tracks queue length', () => {
      service.setQueueLength(42);

      const snapshot = service.getSnapshot();
      expect(snapshot.worker.queueLength).toBe(42);
    });
  });

  describe('custom metrics', () => {
    it('sets a gauge', () => {
      service.setGauge('connections.active', 10);

      const snapshot = service.getSnapshot();
      expect(snapshot).toBeDefined();
    });

    it('increments a counter', () => {
      service.incrementCounter('events.processed');
      service.incrementCounter('events.processed');
      service.incrementCounter('events.processed');

      const snapshot = service.getSnapshot();
      expect(snapshot).toBeDefined();
    });

    it('records a histogram', () => {
      service.recordHistogram('response.time', 150);

      const snapshot = service.getSnapshot();
      expect(snapshot).toBeDefined();
    });
  });

  describe('snapshot', () => {
    it('returns system info', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.uptime).toBeGreaterThanOrEqual(0);
      expect(snapshot.system).toBeDefined();
      expect(snapshot.system.memoryUsage).toBeDefined();
      expect(snapshot.system.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('returns empty metrics initially', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.requests.total).toBe(0);
      expect(snapshot.requests.failedRequests).toBe(0);
      expect(snapshot.database.totalQueries).toBe(0);
      expect(snapshot.database.slowQueries).toHaveLength(0);
      expect(snapshot.worker.activeJobs).toBe(0);
    });
  });

  describe('reset', () => {
    it('clears all metrics', () => {
      service.recordRequest({ method: 'GET', path: '/', statusCode: 200, duration: 100, timestamp: Date.now() });
      service.recordSlowQuery('SELECT 1', 2000);
      service.incrementActiveJobs();

      service.reset();

      const snapshot = service.getSnapshot();
      expect(snapshot.requests.total).toBe(0);
      expect(snapshot.database.totalQueries).toBe(0);
      expect(snapshot.worker.activeJobs).toBe(0);
    });
  });
});
