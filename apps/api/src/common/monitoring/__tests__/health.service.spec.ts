import { HealthService, HealthStatus } from '../health.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ConfigService } from '@nestjs/config';

class MockLoggerService {
  log() {}
  debug() {}
  warn() {}
  error() {}
  trace() {}
  fatal() {}
  logRequest() {}
  logResponse() {}
  logEvent() {}
  getConfig() {
    return { level: 'info', maskSensitiveFields: [] };
  }
}

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('returns healthy when no checks registered', async () => {
      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.components).toHaveLength(0);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.version).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('returns healthy when all checks pass', async () => {
      service.registerCheck({
        name: 'test-pass',
        check: async () => ({
          name: 'test-pass',
          status: HealthStatus.HEALTHY,
          message: 'OK',
          duration: 10,
        }),
      });

      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.components).toHaveLength(1);
      expect(result.components[0].status).toBe(HealthStatus.HEALTHY);
    });

    it('returns unhealthy when a check fails', async () => {
      service.registerCheck({
        name: 'test-fail',
        check: async () => ({
          name: 'test-fail',
          status: HealthStatus.UNHEALTHY,
          message: 'Connection failed',
          duration: 100,
        }),
      });

      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('returns degraded when a check is degraded', async () => {
      service.registerCheck({
        name: 'test-degraded',
        check: async () => ({
          name: 'test-degraded',
          status: HealthStatus.DEGRADED,
          message: 'High memory usage',
          duration: 5,
        }),
      });

      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('handles check exceptions', async () => {
      service.registerCheck({
        name: 'test-error',
        check: async () => {
          throw new Error('Unexpected error');
        },
      });

      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.components[0].message).toBe('Unexpected error');
    });

    it('evaluates unhealthy before degraded', async () => {
      service.registerCheck({
        name: 'degraded',
        check: async () => ({
          name: 'degraded',
          status: HealthStatus.DEGRADED,
          message: 'slow',
          duration: 5,
        }),
      });
      service.registerCheck({
        name: 'unhealthy',
        check: async () => ({
          name: 'unhealthy',
          status: HealthStatus.UNHEALTHY,
          message: 'down',
          duration: 50,
        }),
      });

      const result = await service.checkHealth();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('checkReadiness', () => {
    it('returns true when healthy', async () => {
      service.registerCheck({
        name: 'ok',
        check: async () => ({
          name: 'ok',
          status: HealthStatus.HEALTHY,
          message: 'OK',
          duration: 1,
        }),
      });

      expect(await service.checkReadiness()).toBe(true);
    });

    it('returns true when degraded', async () => {
      service.registerCheck({
        name: 'slow',
        check: async () => ({
          name: 'slow',
          status: HealthStatus.DEGRADED,
          message: 'slow',
          duration: 1,
        }),
      });

      expect(await service.checkReadiness()).toBe(true);
    });

    it('returns false when unhealthy', async () => {
      service.registerCheck({
        name: 'down',
        check: async () => ({
          name: 'down',
          status: HealthStatus.UNHEALTHY,
          message: 'down',
          duration: 1,
        }),
      });

      expect(await service.checkReadiness()).toBe(false);
    });
  });

  describe('checkLiveness', () => {
    it('always returns true', async () => {
      expect(await service.checkLiveness()).toBe(true);
    });
  });

  describe('createMemoryCheck', () => {
    const originalMemoryUsage = process.memoryUsage;

    afterEach(() => {
      process.memoryUsage = originalMemoryUsage;
    });

    const mockMemory = (overrides: Partial<{ heapUsed: number; heapTotal: number; rss: number; external: number; arrayBuffers: number }> = {}) => {
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 30 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        rss: 80 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
        ...overrides,
      }) as unknown as typeof process.memoryUsage;
    };

    it('creates a memory health check with required fields', async () => {
      mockMemory();

      const check = service.createMemoryCheck();
      expect(check.name).toBe('memory');

      const result = await check.check();
      expect(result.name).toBe('memory');
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(result.status);
      expect(result.message).toContain('Heap:');
      expect(result.message).toContain('RSS:');
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('heapUsedMB');
      expect(result.metadata).toHaveProperty('heapTotalMB');
      expect(result.metadata).toHaveProperty('rssMB');
      expect(result.metadata).toHaveProperty('externalMB');
      expect(result.metadata).toHaveProperty('heapLimitMB');
      expect(result.metadata).toHaveProperty('gcPressure');
    });

    it('reports HEALTHY when heap usage is well below threshold', async () => {
      mockMemory();

      const check = service.createMemoryCheck();
      const result = await check.check();
      expect(result.status).toBe(HealthStatus.HEALTHY);
    });

    it('reports HEALTHY when heap usage is 93 percent (Node.js normal)', async () => {
      const svc = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
      const check = svc.createMemoryCheck();

      mockMemory({ heapUsed: 46.5 * 1024 * 1024, heapTotal: 50 * 1024 * 1024 });

      const result = await check.check();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.metadata?.heapPercent).toBeGreaterThan(90);
    });

    it('reports DEGRADED when rolling average heap is between 95 and 98 percent', async () => {
      const svc = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
      const check = svc.createMemoryCheck();

      mockMemory({ heapUsed: 48 * 1024 * 1024, heapTotal: 50 * 1024 * 1024 });

      const result = await check.check();
      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('reports UNHEALTHY only when sustained high heap across multiple checks', async () => {
      const svc = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
      const check = svc.createMemoryCheck();

      mockMemory({ heapUsed: 49.2 * 1024 * 1024, heapTotal: 50 * 1024 * 1024 });

      const r1 = await check.check();
      expect(r1.status).not.toBe(HealthStatus.UNHEALTHY);

      await check.check();
      await check.check();

      const r4 = await check.check();
      expect(r4.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('reports DEGRADED for high RSS usage', async () => {
      const fs = require('fs');
      const origReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockImplementation((path: string) => {
        if (path === '/sys/fs/cgroup/memory.max') return '104857600';
        return origReadFileSync(path);
      });

      const svc = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
      const check = svc.createMemoryCheck();

      mockMemory({ rss: 87 * 1024 * 1024 });

      const result = await check.check();
      fs.readFileSync = origReadFileSync;
      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('exposes all required metadata fields', async () => {
      mockMemory();

      const check = service.createMemoryCheck();
      const result = await check.check();
      const m = result.metadata as Record<string, unknown>;

      expect(typeof m.heapUsedMB).toBe('number');
      expect(typeof m.heapTotalMB).toBe('number');
      expect(typeof m.rssMB).toBe('number');
      expect(typeof m.externalMB).toBe('number');
      expect(typeof m.heapLimitMB).toBe('number');
      expect(typeof m.gcPressure).toBe('number');
      expect(typeof m.gcPressureLabel).toBe('string');
      expect(typeof m.heapPercent).toBe('number');
      expect(typeof m.rssPercent).toBe('number');
      expect(typeof m.avgHeapPercent).toBe('number');
      expect(typeof m.rollingWindowSize).toBe('number');
      expect(m.gcPressureLabel).toMatch(/^(low|moderate|high)$/);
    });

    it('rolling window does not exceed 10 entries', async () => {
      const svc = new HealthService(new MockLoggerService() as unknown as AppLoggerService);
      const check = svc.createMemoryCheck();

      mockMemory();

      for (let i = 0; i < 15; i++) {
        await check.check();
      }

      const result = await check.check();
      expect((result.metadata as Record<string, unknown>).rollingWindowSize).toBe(10);
    });
  });

  describe('createDatabaseCheck', () => {
    it('creates a database health check that passes', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      };

      const check = service.createDatabaseCheck(mockPrisma as any);
      expect(check.name).toBe('database');

      const result = await check.check();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('OK');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('creates a database health check that fails', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('Connection refused')),
      };

      const check = service.createDatabaseCheck(mockPrisma as any);
      const result = await check.check();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('createRedisCheck', () => {
    it('creates a redis health check that passes', async () => {
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      };

      const check = service.createRedisCheck(mockRedis as any);
      expect(check.name).toBe('redis');

      const result = await check.check();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('OK');
    });

    it('creates a redis health check that times out', async () => {
      const mockRedis = {
        ping: jest.fn().mockImplementation(
          () => new Promise<string>((resolve) => setTimeout(() => resolve('PONG'), 10000)),
        ),
      };

      const check = service.createRedisCheck(mockRedis as any);
      const result = await check.check();
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.message).toContain('timeout');
    });

    it('creates a redis health check that fails', async () => {
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };

      const check = service.createRedisCheck(mockRedis as any);
      const result = await check.check();
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.message).toContain('ECONNREFUSED');
    });
  });
});
