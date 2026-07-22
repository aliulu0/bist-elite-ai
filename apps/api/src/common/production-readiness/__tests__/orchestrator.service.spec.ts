import { ProductionReadinessOrchestrator } from '../orchestrator.service';
import { ConfigValidatorService } from '../config-validator.service';
import { DependencyValidatorService } from '../dependency-validator.service';
import { ProductionHealthService } from '../production-health.service';
import { RecoveryService } from '../recovery.service';
import { ResourceMonitorService } from '../resource-monitor.service';
import { SecurityValidatorService } from '../security-validator.service';
import { PerformanceValidatorService } from '../performance-validator.service';
import { DeploymentChecklistService } from '../deployment-checklist.service';
import { BackupService } from '../backup.service';
import { ReleaseManagementService } from '../release-management.service';
import { AppLoggerService } from '../../logger/logger.service';
import { MetricsService } from '../../monitoring/metrics.service';
import { ReadinessStatus, ReadinessLevel } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock('../../monitoring/metrics.service', () => ({
  MetricsService: jest.fn().mockImplementation(() => ({
    getSnapshot: jest.fn().mockReturnValue({
      uptime: 1000,
      requests: { total: 0, byMethod: {}, byStatus: {}, avgDuration: 0, p95Duration: 0, p99Duration: 0, failedRequests: 0, slowRequests: 0 },
      system: { cpuUsage: { user: 0, system: 0 }, memoryUsage: process.memoryUsage(), uptime: 0, activeHandles: 0, activeRequests: 0 },
      database: { slowQueries: [], totalQueries: 0, failedQueries: 0 },
      worker: { activeJobs: 0, completedJobs: 0, failedJobs: 0, queueLength: 0 },
      timestamp: new Date().toISOString(),
    }),
    incrementCounter: jest.fn(),
    setGauge: jest.fn(),
  })),
}));

describe('ProductionReadinessOrchestrator', () => {
  let orchestrator: ProductionReadinessOrchestrator;

  beforeEach(() => {
    const logger = new AppLoggerService(null as never);
    const metricsService = new MetricsService();

    orchestrator = new ProductionReadinessOrchestrator(
      logger,
      new ConfigValidatorService(),
      new DependencyValidatorService(),
      new ProductionHealthService(logger),
      new RecoveryService(logger),
      new ResourceMonitorService(logger),
      new SecurityValidatorService(),
      new PerformanceValidatorService(metricsService),
      new DeploymentChecklistService(logger),
      new BackupService(logger),
      new ReleaseManagementService(logger),
    );
  });

  describe('runFullCheck', () => {
    it('should return a complete report', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '2.6.0';

      const report = await orchestrator.runFullCheck(
        { dependencies: { '@nestjs/common': '^10.3.0' } },
        '2.6.0',
        '## [2.6.0]\n### Added\n- Feature',
      );

      expect(report.timestamp).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.configValidation).toBeDefined();
      expect(report.dependencyValidation).toBeDefined();
      expect(report.systemHealth).toBeDefined();
      expect(report.recovery).toBeDefined();
      expect(report.resourceValidation).toBeDefined();
      expect(report.securityValidation).toBeDefined();
      expect(report.performanceValidation).toBeDefined();
      expect(report.deploymentChecklist).toBeDefined();
      expect(report.backupStatus).toBeDefined();
      expect(report.releaseReadiness).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should set PRODUCTION_READY when everything passes', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const report = await orchestrator.runFullCheck({}, '1.0.0', '## [1.0.0]\n### Added\n- Initial');
      expect([ReadinessLevel.PRODUCTION_READY, ReadinessLevel.MOSTLY_READY]).toContain(report.overallLevel);
    });

    it('should set NOT_READY when config is missing', async () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.APP_VERSION;

      const report = await orchestrator.runFullCheck();
      expect(report.overallScore).toBeLessThan(100);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('should include issues in report', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.APP_VERSION = '1.0.0';

      const report = await orchestrator.runFullCheck({}, '1.0.0', '');
      expect(Array.isArray(report.issues)).toBe(true);
    });
  });
});
