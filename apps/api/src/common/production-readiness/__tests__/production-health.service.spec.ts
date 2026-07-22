import { ProductionHealthService } from '../production-health.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ReadinessStatus, ReadinessLevel, ComponentType } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('ProductionHealthService', () => {
  let service: ProductionHealthService;
  let logger: AppLoggerService;

  beforeEach(() => {
    logger = new AppLoggerService(null as never);
    service = new ProductionHealthService(logger);
  });

  describe('checkAll', () => {
    it('should return PASS when all checks pass', async () => {
      const check = jest.fn().mockResolvedValue({
        component: ComponentType.API,
        status: ReadinessStatus.PASS,
        latencyMs: 10,
        message: 'OK',
        lastChecked: new Date().toISOString(),
      });

      const result = await service.checkAll([check]);
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(result.level).toBe(ReadinessLevel.PRODUCTION_READY);
      expect(result.healthyCount).toBe(1);
      expect(result.failCount).toBe(0);
    });

    it('should return FAIL when any check fails', async () => {
      const failCheck = jest.fn().mockResolvedValue({
        component: ComponentType.DATABASE,
        status: ReadinessStatus.FAIL,
        latencyMs: 100,
        message: 'Connection refused',
        lastChecked: new Date().toISOString(),
      });

      const result = await service.checkAll([failCheck]);
      expect(result.status).toBe(ReadinessStatus.FAIL);
      expect(result.level).toBe(ReadinessLevel.NOT_READY);
      expect(result.failCount).toBe(1);
    });

    it('should return WARN when checks are degraded', async () => {
      const warnCheck = jest.fn().mockResolvedValue({
        component: ComponentType.MEMORY,
        status: ReadinessStatus.WARN,
        latencyMs: 5,
        message: 'Memory elevated',
        lastChecked: new Date().toISOString(),
      });

      const result = await service.checkAll([warnCheck]);
      expect(result.status).toBe(ReadinessStatus.WARN);
      expect(result.level).toBe(ReadinessLevel.MOSTLY_READY);
      expect(result.warnCount).toBe(1);
    });

    it('should handle check exceptions gracefully', async () => {
      const throwingCheck = jest.fn().mockRejectedValue(new Error('Boom'));

      const result = await service.checkAll([throwingCheck]);
      expect(result.status).toBe(ReadinessStatus.FAIL);
      expect(result.components[0].status).toBe(ReadinessStatus.FAIL);
    });

    it('should run multiple checks', async () => {
      const check1 = jest.fn().mockResolvedValue({
        component: ComponentType.API,
        status: ReadinessStatus.PASS,
        latencyMs: 5,
        message: 'OK',
        lastChecked: new Date().toISOString(),
      });
      const check2 = jest.fn().mockResolvedValue({
        component: ComponentType.DATABASE,
        status: ReadinessStatus.PASS,
        latencyMs: 10,
        message: 'OK',
        lastChecked: new Date().toISOString(),
      });

      const result = await service.checkAll([check1, check2]);
      expect(result.components.length).toBe(2);
      expect(result.healthyCount).toBe(2);
    });
  });

  describe('createMemoryCheck', () => {
    it('should return a PASS check for normal memory', async () => {
      const check = service.createMemoryCheck();
      const result = await check();
      expect(result.component).toBe(ComponentType.MEMORY);
      expect([ReadinessStatus.PASS, ReadinessStatus.WARN, ReadinessStatus.FAIL]).toContain(result.status);
      expect(result.message).toContain('heap used');
    });
  });

  describe('createCpuCheck', () => {
    it('should return a CPU check', async () => {
      const check = service.createCpuCheck();
      const result = await check();
      expect(result.component).toBe(ComponentType.CPU);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createDatabaseCheck', () => {
    it('should return PASS when query succeeds', async () => {
      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      };
      const check = service.createDatabaseCheck(prisma);
      const result = await check();
      expect(result.component).toBe(ComponentType.DATABASE);
      expect(result.status).toBe(ReadinessStatus.PASS);
    });

    it('should return FAIL when query throws', async () => {
      const prisma = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };
      const check = service.createDatabaseCheck(prisma);
      const result = await check();
      expect(result.status).toBe(ReadinessStatus.FAIL);
      expect(result.message).toContain('ECONNREFUSED');
    });
  });

  describe('createRedisCheck', () => {
    it('should return PASS when ping succeeds', async () => {
      const redis = { ping: jest.fn().mockResolvedValue('PONG') };
      const check = service.createRedisCheck(redis);
      const result = await check();
      expect(result.component).toBe(ComponentType.REDIS);
      expect(result.status).toBe(ReadinessStatus.PASS);
    });

    it('should return WARN when ping times out', async () => {
      const redis = {
        ping: jest.fn().mockImplementation(
          () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)),
        ),
      };
      const check = service.createRedisCheck(redis);
      const result = await check();
      expect(result.status).toBe(ReadinessStatus.WARN);
    });
  });
});
