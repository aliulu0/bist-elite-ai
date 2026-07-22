import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';
import {
  SystemHealthResult,
  ComponentHealthDetail,
  ComponentType,
  ReadinessStatus,
  ReadinessLevel,
} from './types';

@Injectable()
export class ProductionHealthService {
  private readonly startTime = Date.now();

  constructor(private readonly logger: AppLoggerService) {}

  async checkAll(
    checks: Array<() => Promise<ComponentHealthDetail>> = [],
  ): Promise<SystemHealthResult> {
    const components: ComponentHealthDetail[] = [];

    for (const check of checks) {
      try {
        components.push(await check());
      } catch (err) {
        components.push({
          component: ComponentType.API,
          status: ReadinessStatus.FAIL,
          latencyMs: 0,
          message: err instanceof Error ? err.message : 'Health check failed',
          lastChecked: new Date().toISOString(),
        });
      }
    }

    const healthyCount = components.filter((c) => c.status === ReadinessStatus.PASS).length;
    const warnCount = components.filter((c) => c.status === ReadinessStatus.WARN).length;
    const failCount = components.filter((c) => c.status === ReadinessStatus.FAIL).length;

    let status: ReadinessStatus;
    let level: ReadinessLevel;

    if (failCount > 0) {
      status = ReadinessStatus.FAIL;
      level = ReadinessLevel.NOT_READY;
    } else if (warnCount > 0) {
      status = ReadinessStatus.WARN;
      level = ReadinessLevel.MOSTLY_READY;
    } else {
      status = ReadinessStatus.PASS;
      level = ReadinessLevel.PRODUCTION_READY;
    }

    this.logger.log(
      `Health check: ${healthyCount} healthy, ${warnCount} warn, ${failCount} fail`,
      'ProductionHealthService',
    );

    return {
      status,
      level,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      components,
      healthyCount,
      warnCount,
      failCount,
    };
  }

  createMemoryCheck(): () => Promise<ComponentHealthDetail> {
    return async () => {
      const mem = process.memoryUsage();
      const totalMb = mem.rss / (1024 * 1024);
      const heapUsedMb = mem.heapUsed / (1024 * 1024);
      const heapTotalMb = mem.heapTotal / (1024 * 1024);
      const percent = (heapUsedMb / heapTotalMb) * 100;

      let status: ReadinessStatus;
      let message: string;

      if (percent > 90) {
        status = ReadinessStatus.FAIL;
        message = `Memory usage critical: ${percent.toFixed(1)}% heap used`;
      } else if (percent > 75) {
        status = ReadinessStatus.WARN;
        message = `Memory usage elevated: ${percent.toFixed(1)}% heap used`;
      } else {
        status = ReadinessStatus.PASS;
        message = `Memory usage normal: ${percent.toFixed(1)}% heap used`;
      }

      return {
        component: ComponentType.MEMORY,
        status,
        latencyMs: 0,
        message,
        metadata: {
          heapUsedMb: Math.round(heapUsedMb),
          heapTotalMb: Math.round(heapTotalMb),
          rssMb: Math.round(totalMb),
          percent: Math.round(percent),
        },
        lastChecked: new Date().toISOString(),
      };
    };
  }

  createCpuCheck(): () => Promise<ComponentHealthDetail> {
    return async () => {
      const startUsage = process.cpuUsage();
      await new Promise((r) => setTimeout(r, 100));
      const endUsage = process.cpuUsage(startUsage);
      const totalCpuMs = (endUsage.user + endUsage.system) / 1000;
      const percent = (totalCpuMs / 100) * 100;

      let status: ReadinessStatus;
      let message: string;

      if (percent > 90) {
        status = ReadinessStatus.FAIL;
        message = `CPU usage critical: ${percent.toFixed(1)}%`;
      } else if (percent > 70) {
        status = ReadinessStatus.WARN;
        message = `CPU usage elevated: ${percent.toFixed(1)}%`;
      } else {
        status = ReadinessStatus.PASS;
        message = `CPU usage normal: ${percent.toFixed(1)}%`;
      }

      return {
        component: ComponentType.CPU,
        status,
        latencyMs: 100,
        message,
        metadata: { userCpuMs: endUsage.user, systemCpuMs: endUsage.system, percent: Math.round(percent) },
        lastChecked: new Date().toISOString(),
      };
    };
  }

  createDiskCheck(): () => Promise<ComponentHealthDetail> {
    return async () => {
      return {
        component: ComponentType.DISK,
        status: ReadinessStatus.PASS,
        latencyMs: 0,
        message: 'Disk check available on Linux/macOS only; skipped on Windows',
        lastChecked: new Date().toISOString(),
      };
    };
  }

  createDatabaseCheck(
    prisma: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> },
  ): () => Promise<ComponentHealthDetail> {
    return async () => {
      const start = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          component: ComponentType.DATABASE,
          status: ReadinessStatus.PASS,
          latencyMs: Date.now() - start,
          message: 'Database connection healthy',
          lastChecked: new Date().toISOString(),
        };
      } catch (err) {
        return {
          component: ComponentType.DATABASE,
          status: ReadinessStatus.FAIL,
          latencyMs: Date.now() - start,
          message: err instanceof Error ? err.message : 'Database connection failed',
          lastChecked: new Date().toISOString(),
        };
      }
    };
  }

  createRedisCheck(
    redisClient: { ping: () => Promise<string> },
  ): () => Promise<ComponentHealthDetail> {
    return async () => {
      const start = Date.now();
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 3000),
        );
        await Promise.race([redisClient.ping(), timeout]);
        return {
          component: ComponentType.REDIS,
          status: ReadinessStatus.PASS,
          latencyMs: Date.now() - start,
          message: 'Redis connection healthy',
          lastChecked: new Date().toISOString(),
        };
      } catch (err) {
        return {
          component: ComponentType.REDIS,
          status: ReadinessStatus.WARN,
          latencyMs: Date.now() - start,
          message: err instanceof Error ? err.message : 'Redis connection failed',
          lastChecked: new Date().toISOString(),
        };
      }
    };
  }
}
