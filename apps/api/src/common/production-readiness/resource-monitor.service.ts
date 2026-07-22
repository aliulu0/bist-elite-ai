import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import {
  ResourceSnapshot,
  ResourceValidationResult,
  ResourceBreach,
  ResourceThresholds,
  ReadinessStatus,
  Severity,
} from './types';

const DEFAULT_THRESHOLDS: ResourceThresholds = {
  memoryPercentWarn: 75,
  memoryPercentCritical: 90,
  cpuPercentWarn: 70,
  cpuPercentCritical: 90,
  diskPercentWarn: 80,
  diskPercentCritical: 95,
  eventLoopLagWarnMs: 100,
  eventLoopLagCriticalMs: 500,
};

@Injectable()
export class ResourceMonitorService {
  private readonly thresholds: ResourceThresholds;
  private eventLoopStart: number = Date.now();

  constructor(
    private readonly logger: AppLoggerService,
    thresholds?: Partial<ResourceThresholds>,
  ) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  async snapshot(): Promise<ResourceSnapshot> {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    const memoryTotalMb = mem.rss / (1024 * 1024);
    const memoryUsedMb = mem.heapUsed / (1024 * 1024);
    const memoryPercent = mem.heapTotal > 0 ? (mem.heapUsed / mem.heapTotal) * 100 : 0;

    const totalCpuMs = cpu.user + cpu.system;
    const uptimeMs = process.uptime() * 1000;
    const cpuPercent = uptimeMs > 0 ? (totalCpuMs / uptimeMs) * 100 : 0;

    const eventLoopLag = Date.now() - this.eventLoopStart;
    this.eventLoopStart = Date.now();

    return {
      timestamp: new Date().toISOString(),
      memoryUsageMb: Math.round(memoryUsedMb),
      memoryTotalMb: Math.round(memoryTotalMb),
      memoryPercent: Math.round(memoryPercent),
      cpuUsagePercent: Math.min(Math.round(cpuPercent), 100),
      diskUsageMb: 0,
      diskTotalMb: 0,
      diskPercent: 0,
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      activeHandles: (process as unknown as { _getActiveHandles?: () => unknown[] })._getActiveHandles?.()?.length ?? 0,
      activeRequests: (process as unknown as { _getActiveRequests?: () => unknown[] })._getActiveRequests?.()?.length ?? 0,
      eventLoopLagMs: eventLoopLag,
    };
  }

  async validate(): Promise<ResourceValidationResult> {
    const snapshot = await this.snapshot();
    const breaches: ResourceBreach[] = [];

    this.checkThreshold(
      breaches,
      'memory',
      snapshot.memoryPercent,
      this.thresholds.memoryPercentWarn,
      this.thresholds.memoryPercentCritical,
      '%',
    );

    this.checkThreshold(
      breaches,
      'cpu',
      snapshot.cpuUsagePercent,
      this.thresholds.cpuPercentWarn,
      this.thresholds.cpuPercentCritical,
      '%',
    );

    if (snapshot.eventLoopLagMs > this.thresholds.eventLoopLagCriticalMs) {
      breaches.push({
        resource: 'event_loop',
        current: snapshot.eventLoopLagMs,
        threshold: this.thresholds.eventLoopLagCriticalMs,
        severity: Severity.CRITICAL,
        message: `Event loop lag critical: ${snapshot.eventLoopLagMs}ms (threshold: ${this.thresholds.eventLoopLagCriticalMs}ms)`,
      });
    } else if (snapshot.eventLoopLagMs > this.thresholds.eventLoopLagWarnMs) {
      breaches.push({
        resource: 'event_loop',
        current: snapshot.eventLoopLagMs,
        threshold: this.thresholds.eventLoopLagWarnMs,
        severity: Severity.HIGH,
        message: `Event loop lag elevated: ${snapshot.eventLoopLagMs}ms (threshold: ${this.thresholds.eventLoopLagWarnMs}ms)`,
      });
    }

    const hasCritical = breaches.some((b) => b.severity === Severity.CRITICAL);
    const hasHigh = breaches.some((b) => b.severity === Severity.HIGH);

    const status = hasCritical
      ? ReadinessStatus.FAIL
      : hasHigh
        ? ReadinessStatus.WARN
        : ReadinessStatus.PASS;

    if (breaches.length > 0) {
      this.logger.warn(
        `Resource validation: ${breaches.length} breach(es) detected`,
        'ResourceMonitorService',
      );
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      snapshot,
      breaches,
    };
  }

  private checkThreshold(
    breaches: ResourceBreach[],
    resource: string,
    current: number,
    warnThreshold: number,
    criticalThreshold: number,
    unit: string,
  ): void {
    if (current >= criticalThreshold) {
      breaches.push({
        resource,
        current,
        threshold: criticalThreshold,
        severity: Severity.CRITICAL,
        message: `${resource} usage critical: ${current}${unit} (threshold: ${criticalThreshold}${unit})`,
      });
    } else if (current >= warnThreshold) {
      breaches.push({
        resource,
        current,
        threshold: warnThreshold,
        severity: Severity.HIGH,
        message: `${resource} usage elevated: ${current}${unit} (threshold: ${warnThreshold}${unit})`,
      });
    }
  }
}
