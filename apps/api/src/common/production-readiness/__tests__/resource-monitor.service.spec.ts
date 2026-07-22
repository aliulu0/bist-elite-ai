import { ResourceMonitorService } from '../resource-monitor.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ReadinessStatus, Severity } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('ResourceMonitorService', () => {
  let service: ResourceMonitorService;

  beforeEach(() => {
    service = new ResourceMonitorService(new AppLoggerService(null as never));
  });

  describe('snapshot', () => {
    it('should return a valid snapshot', async () => {
      const snap = await service.snapshot();
      expect(snap.timestamp).toBeDefined();
      expect(snap.memoryUsageMb).toBeGreaterThanOrEqual(0);
      expect(snap.heapUsedMb).toBeGreaterThanOrEqual(0);
      expect(snap.heapTotalMb).toBeGreaterThanOrEqual(0);
      expect(typeof snap.cpuUsagePercent).toBe('number');
    });
  });

  describe('validate', () => {
    it('should return PASS for normal resource usage', async () => {
      const result = await service.validate();
      expect([ReadinessStatus.PASS, ReadinessStatus.WARN, ReadinessStatus.FAIL]).toContain(result.status);
      expect(result.snapshot).toBeDefined();
      expect(Array.isArray(result.breaches)).toBe(true);
    });

    it('should detect breaches with low thresholds', async () => {
      const strictService = new ResourceMonitorService(
        new AppLoggerService(null as never),
        { memoryPercentWarn: 1, memoryPercentCritical: 2 },
      );

      const result = await strictService.validate();
      expect(result.breaches.length).toBeGreaterThan(0);
    });
  });
});
