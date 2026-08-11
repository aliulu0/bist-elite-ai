import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { HealthService, HealthStatus, HealthCheckResult } from '../common/monitoring/health.service';
import { AuthService } from '../common/auth/auth.service';
import { FeatureFlags } from '../common/auth/feature-flags';
import { MetricsService } from '../common/monitoring/metrics.service';
import { AppLoggerService } from '../common/logger/logger.service';
import { MetricsSnapshot } from '../common/monitoring/types';

const healthyResult: HealthCheckResult = {
  status: HealthStatus.HEALTHY,
  version: '1.0.0',
  uptime: 100,
  timestamp: new Date().toISOString(),
  components: [
    { name: 'database', status: HealthStatus.HEALTHY, message: 'OK', duration: 5 },
    { name: 'redis', status: HealthStatus.HEALTHY, message: 'OK', duration: 2 },
    { name: 'memory', status: HealthStatus.HEALTHY, message: 'Heap: 50/100MB', duration: 0 },
  ],
};

const unhealthyResult: HealthCheckResult = {
  ...healthyResult,
  status: HealthStatus.UNHEALTHY,
  components: [
    { name: 'database', status: HealthStatus.UNHEALTHY, message: 'Connection refused', duration: 100 },
  ],
};

const degradedResult: HealthCheckResult = {
  ...healthyResult,
  status: HealthStatus.DEGRADED,
  components: [
    { name: 'memory', status: HealthStatus.DEGRADED, message: 'High heap usage', duration: 0 },
  ],
};

const mockSnapshot: MetricsSnapshot = {
  uptime: 100,
  requests: {
    total: 10,
    byMethod: { GET: 8, POST: 2 },
    byStatus: { '200': 10 },
    avgDuration: 12,
    p95Duration: 45,
    p99Duration: 89,
    failedRequests: 0,
    slowRequests: 0,
  },
  system: {
    cpuUsage: { user: 100000, system: 50000 },
    memoryUsage: process.memoryUsage(),
    uptime: 100,
    activeHandles: 5,
    activeRequests: 2,
  },
  database: { slowQueries: [], totalQueries: 50, failedQueries: 0 },
  worker: { activeJobs: 1, completedJobs: 10, failedJobs: 0, queueLength: 0 },
  timestamp: new Date().toISOString(),
};

describe('Health Endpoints (Integration)', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    healthService = {
      checkHealth: jest.fn().mockResolvedValue(healthyResult),
      checkReadiness: jest.fn().mockResolvedValue(true),
      checkLiveness: jest.fn().mockResolvedValue(true),
      registerCheck: jest.fn(),
      createDatabaseCheck: jest.fn(),
      createRedisCheck: jest.fn(),
      createMemoryCheck: jest.fn(),
    } as any;

    metricsService = {
      getSnapshot: jest.fn().mockReturnValue(mockSnapshot),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: AuthService, useValue: { isAuthEnabled: false, isAllowAnonymous: true, getAuthConfigSummary: jest.fn().mockReturnValue({ enabled: false, allowAnonymous: true, jwtConfigured: false, apiKeyConfigured: false }) } },
        { provide: FeatureFlags, useValue: { getEnabled: () => [] } },
        { provide: HealthService, useValue: healthService },
        { provide: MetricsService, useValue: metricsService },
        { provide: AppLoggerService, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /health', () => {
    it('should return full health check result', async () => {
      const result = await controller.check();

      expect(result).toEqual(healthyResult);
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(typeof result.uptime).toBe('number');
      expect(result).toHaveProperty('timestamp');
      expect(Array.isArray(result.components)).toBe(true);
      expect(result.components).toHaveLength(3);
    });

    it('should propagate unhealthy component status', async () => {
      healthService.checkHealth.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result.status).toBe('unhealthy');
      expect(result.components[0].status).toBe('unhealthy');
      expect(result.components[0].message).toContain('Connection refused');
    });

    it('should propagate degraded component status', async () => {
      healthService.checkHealth.mockResolvedValue(degradedResult);

      const result = await controller.check();

      expect(result.status).toBe('degraded');
    });

    it('should call healthService.checkHealth()', async () => {
      await controller.check();
      expect(healthService.checkHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready when healthy', async () => {
      healthService.checkReadiness.mockResolvedValue(true);
      const result = await controller.readiness();

      expect(result.status).toBe('ready');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return not_ready when unhealthy', async () => {
      healthService.checkReadiness.mockResolvedValue(false);
      const result = await controller.readiness();

      expect(result.status).toBe('not_ready');
    });

    it('should call healthService.checkReadiness()', async () => {
      await controller.readiness();
      expect(healthService.checkReadiness).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /health/live', () => {
    it('should return alive', async () => {
      const result = await controller.liveness();

      expect(result.status).toBe('alive');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return dead when liveness check fails', async () => {
      healthService.checkLiveness.mockResolvedValue(false);
      const result = await controller.liveness();

      expect(result.status).toBe('dead');
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return auth configuration', () => {
      const result = controller.authStatus();

      expect(result).toHaveProperty('authEnabled', false);
      expect(result).toHaveProperty('allowAnonymous', true);
      expect(result).toHaveProperty('featureFlags');
      expect(Array.isArray(result.featureFlags)).toBe(true);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return metrics snapshot', () => {
      const result = controller.metrics();

      expect(result).toEqual(mockSnapshot);
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('worker');
    });
  });
  describe('Response shape validation', () => {
    it('health result has all required fields', async () => {
      const result = await controller.check();

      expect(result).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        components: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
            message: expect.any(String),
            duration: expect.any(Number),
          }),
        ]),
      });
    });

    it('readiness result has correct shape', async () => {
      const result = await controller.readiness();

      expect(result).toMatchObject({
        status: expect.stringMatching(/^(ready|not_ready)$/),
        timestamp: expect.any(String),
      });
    });

    it('liveness result has correct shape', async () => {
      const result = await controller.liveness();

      expect(result).toMatchObject({
        status: expect.stringMatching(/^(alive|dead)$/),
        timestamp: expect.any(String),
      });
    });
  });
});
