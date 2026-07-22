import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import { ConfigValidatorService } from './config-validator.service';
import { DependencyValidatorService } from './dependency-validator.service';
import { ProductionHealthService } from './production-health.service';
import { RecoveryService } from './recovery.service';
import { ResourceMonitorService } from './resource-monitor.service';
import { SecurityValidatorService } from './security-validator.service';
import { PerformanceValidatorService } from './performance-validator.service';
import { DeploymentChecklistService } from './deployment-checklist.service';
import { BackupService } from './backup.service';
import { ReleaseManagementService } from './release-management.service';
import {
  ProductionReadinessReport,
  ProductionReadinessConfig,
  ReadinessStatus,
  ReadinessLevel,
  ValidationIssue,
  Severity,
  ChecklistPhase,
} from './types';

const DEFAULT_CONFIG: ProductionReadinessConfig = {
  requiredEnvVars: ['NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL', 'APP_VERSION'],
  optionalEnvVars: ['LOG_LEVEL', 'LOG_CONSOLE', 'CACHE_ENABLED', 'FEATURE_FLAGS'],
  resourceThresholds: {
    memoryPercentWarn: 75,
    memoryPercentCritical: 90,
    cpuPercentWarn: 70,
    cpuPercentCritical: 90,
    diskPercentWarn: 80,
    diskPercentCritical: 95,
    eventLoopLagWarnMs: 100,
    eventLoopLagCriticalMs: 500,
  },
  retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2, maxBackoffMs: 30000 },
  healthCheckTimeoutMs: 5000,
  performanceThresholds: { 'api.p50': 200, 'api.p95': 1000, 'api.p99': 3000 },
};

@Injectable()
export class ProductionReadinessOrchestrator {
  private readonly config: ProductionReadinessConfig;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly configValidator: ConfigValidatorService,
    private readonly dependencyValidator: DependencyValidatorService,
    private readonly healthService: ProductionHealthService,
    private readonly recoveryService: RecoveryService,
    private readonly resourceMonitor: ResourceMonitorService,
    private readonly securityValidator: SecurityValidatorService,
    private readonly performanceValidator: PerformanceValidatorService,
    private readonly deploymentChecklist: DeploymentChecklistService,
    private readonly backupService: BackupService,
    private readonly releaseManagement: ReleaseManagementService,
  ) {
    this.config = DEFAULT_CONFIG;
  }

  async runFullCheck(
    packageJson: Record<string, unknown> = {},
    version: string = process.env.APP_VERSION || '1.0.0',
    changelogContent: string = '',
    healthChecks: Array<() => Promise<import('./types').ComponentHealthDetail>> = [],
  ): Promise<ProductionReadinessReport> {
    this.logger.log('Starting full production readiness check', 'ProductionReadinessOrchestrator');
    const start = Date.now();

    const configValidation = this.configValidator.validate(
      this.config.requiredEnvVars,
      this.config.optionalEnvVars,
    );

    const dependencyValidation = this.dependencyValidator.validate(
      packageJson as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
    );

    const systemHealth = await this.healthService.checkAll(healthChecks);

    const recovery = {
      status: ReadinessStatus.PASS as ReadinessStatus,
      timestamp: new Date().toISOString(),
      actions: [] as import('./types').RecoveryAction[],
      circuitBreakers: [] as import('./types').CircuitBreakerState[],
    };

    const resourceValidation = await this.resourceMonitor.validate();

    const securityValidation = this.securityValidator.validate();

    const performanceValidation = this.performanceValidator.validate();

    const deploymentChecklist = this.deploymentChecklist.generate(ChecklistPhase.PRE_DEPLOYMENT);

    const backupStatus = this.backupService.listBackups();

    const releaseReadiness = await this.releaseManagement.checkReleaseReadiness(
      version,
      changelogContent,
    );

    const allIssues: ValidationIssue[] = [
      ...configValidation.issues,
      ...dependencyValidation.issues,
      ...resourceValidation.breaches.map((b) => ({
        severity: b.severity,
        category: 'resource',
        message: b.message,
        recommendation: `Address ${b.resource} resource usage`,
        impact: b.severity === Severity.CRITICAL ? 'System may become unresponsive' : 'Performance may degrade',
      })),
    ];

    const recommendations = this.generateRecommendations(
      configValidation.status,
      dependencyValidation.status,
      systemHealth.status,
      resourceValidation.status,
      securityValidation.status,
      performanceValidation.status,
    );

    const overallScore = this.calculateScore(
      configValidation.status,
      dependencyValidation.status,
      systemHealth.status,
      securityValidation.status,
      performanceValidation.status,
      resourceValidation.status,
    );

    const overallLevel = overallScore >= 90
      ? ReadinessLevel.PRODUCTION_READY
      : overallScore >= 70
        ? ReadinessLevel.MOSTLY_READY
        : overallScore >= 50
          ? ReadinessLevel.NEEDS_WORK
          : ReadinessLevel.NOT_READY;

    const overallStatus = allIssues.some((i) => i.severity === Severity.CRITICAL)
      ? ReadinessStatus.FAIL
      : overallScore >= 70
        ? ReadinessStatus.PASS
        : ReadinessStatus.WARN;

    const elapsed = Date.now() - start;
    this.logger.log(
      `Production readiness check completed in ${elapsed}ms: ${overallStatus} (${overallScore}/100)`,
      'ProductionReadinessOrchestrator',
    );

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      overallLevel,
      overallScore,
      configValidation,
      dependencyValidation,
      systemHealth,
      recovery,
      resourceValidation,
      securityValidation,
      performanceValidation,
      deploymentChecklist,
      backupStatus,
      releaseReadiness,
      issues: allIssues,
      recommendations,
    };
  }

  private calculateScore(
    config: ReadinessStatus,
    deps: ReadinessStatus,
    health: ReadinessStatus,
    security: ReadinessStatus,
    performance: ReadinessStatus,
    resources: ReadinessStatus,
  ): number {
    const weights = { config: 20, deps: 10, health: 25, security: 20, performance: 15, resources: 10 };
    const scoreMap = (s: ReadinessStatus) =>
      s === ReadinessStatus.PASS ? 100 : s === ReadinessStatus.WARN ? 60 : 0;

    return Math.round(
      weights.config * scoreMap(config) / 100 +
      weights.deps * scoreMap(deps) / 100 +
      weights.health * scoreMap(health) / 100 +
      weights.security * scoreMap(security) / 100 +
      weights.performance * scoreMap(performance) / 100 +
      weights.resources * scoreMap(resources) / 100,
    );
  }

  private generateRecommendations(
    config: ReadinessStatus,
    deps: ReadinessStatus,
    health: ReadinessStatus,
    resources: ReadinessStatus,
    security: ReadinessStatus,
    performance: ReadinessStatus,
  ): string[] {
    const recs: string[] = [];

    if (config !== ReadinessStatus.PASS) recs.push('Configure all required environment variables');
    if (deps !== ReadinessStatus.PASS) recs.push('Update or remove deprecated dependencies');
    if (health !== ReadinessStatus.PASS) recs.push('Resolve failing health checks before deployment');
    if (resources !== ReadinessStatus.PASS) recs.push('Investigate resource usage breaches');
    if (security !== ReadinessStatus.PASS) recs.push('Address security validation issues');
    if (performance !== ReadinessStatus.PASS) recs.push('Optimize API response times');

    recs.push('Run full test suite before deployment');
    recs.push('Verify database migrations are up to date');
    recs.push('Create a backup before deploying');

    return recs;
  }
}
