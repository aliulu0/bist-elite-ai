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
    it('creates a memory health check', async () => {
      const check = service.createMemoryCheck();
      expect(check.name).toBe('memory');

      const result = await check.check();
      expect(result.name).toBe('memory');
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(result.status);
      expect(result.message).toContain('Heap:');
      expect(result.metadata).toBeDefined();
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
