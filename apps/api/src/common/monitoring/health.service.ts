import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/logger.service';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface HealthCheckResult {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
}

export interface HealthCheck {
  name: string;
  check: () => Promise<ComponentHealth>;
}

@Injectable()
export class HealthService {
  private readonly checks: HealthCheck[] = [];
  private readonly startTime = Date.now();
  private readonly version: string;

  constructor(private readonly logger: AppLoggerService) {
    this.version = process.env.APP_VERSION || '1.0.0';
  }

  registerCheck(check: HealthCheck): void {
    this.checks.push(check);
    this.logger.log(`Health check registered: ${check.name}`, 'HealthService');
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const results: ComponentHealth[] = [];

    for (const check of this.checks) {
      try {
        const result = await check.check();
        results.push(result);
      } catch (error) {
        results.push({
          name: check.name,
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        });
      }
    }

    const hasUnhealthy = results.some((r) => r.status === HealthStatus.UNHEALTHY);
    const hasDegraded = results.some((r) => r.status === HealthStatus.DEGRADED);

    let overallStatus: HealthStatus;
    if (hasUnhealthy) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (hasDegraded) {
      overallStatus = HealthStatus.DEGRADED;
    } else {
      overallStatus = HealthStatus.HEALTHY;
    }

    return {
      status: overallStatus,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      components: results,
    };
  }

  async checkReadiness(): Promise<boolean> {
    const result = await this.checkHealth();
    return result.status !== HealthStatus.UNHEALTHY;
  }

  async checkLiveness(): Promise<boolean> {
    return true;
  }

  createDatabaseCheck(prisma: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }): HealthCheck {
    return {
      name: 'database',
      check: async (): Promise<ComponentHealth> => {
        const start = Date.now();
        try {
          await prisma.$queryRaw`SELECT 1`;
          return {
            name: 'database',
            status: HealthStatus.HEALTHY,
            message: 'Database connection OK',
            duration: Date.now() - start,
          };
        } catch (error) {
          return {
            name: 'database',
            status: HealthStatus.UNHEALTHY,
            message: error instanceof Error ? error.message : 'Database connection failed',
            duration: Date.now() - start,
          };
        }
      },
    };
  }

  createRedisCheck(redisClient: { ping: () => Promise<string> }): HealthCheck {
    return {
      name: 'redis',
      check: async (): Promise<ComponentHealth> => {
        const start = Date.now();
        try {
          await Promise.race([
            redisClient.ping(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Redis ping timeout')), 3000),
            ),
          ]);
          return {
            name: 'redis',
            status: HealthStatus.HEALTHY,
            message: 'Redis connection OK',
            duration: Date.now() - start,
          };
        } catch (error) {
          return {
            name: 'redis',
            status: HealthStatus.DEGRADED,
            message: error instanceof Error ? error.message : 'Redis connection failed',
            duration: Date.now() - start,
          };
        }
      },
    };
  }

  createPipelineHealthCheck(pipelines?: { name: string; lastRun: Date | null; status: string }[]): HealthCheck {
    return {
      name: 'pipeline',
      check: async (): Promise<ComponentHealth> => {
        const start = Date.now();
        const list = pipelines || [];
        const failed = list.filter((p) => p.status === 'failed').length;
        const running = list.filter((p) => p.status === 'running').length;
        return {
          name: 'pipeline',
          status: failed > 0 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
          message: `${list.length} pipelines, ${running} running, ${failed} failed`,
          duration: Date.now() - start,
          metadata: { total: list.length, running, failed },
        };
      },
    };
  }

  createSchedulerHealthCheck(
    jobs?: { name: string; enabled: boolean; lastExecution: Date | null; status: string }[],
  ): HealthCheck {
    return {
      name: 'scheduler',
      check: async (): Promise<ComponentHealth> => {
        const start = Date.now();
        const list = jobs || [];
        const failed = list.filter((j) => j.status === 'failed').length;
        const running = list.filter((j) => j.status === 'running').length;
        const disabled = list.filter((j) => !j.enabled).length;
        return {
          name: 'scheduler',
          status: failed > 0 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
          message: `${list.length} jobs, ${running} running, ${failed} failed, ${disabled} disabled`,
          duration: Date.now() - start,
          metadata: { total: list.length, running, failed, disabled },
        };
      },
    };
  }

  createWebSocketHealthCheck(
    connectedClients?: number,
    gatewayStatus?: string,
  ): HealthCheck {
    return {
      name: 'websocket',
      check: async (): Promise<ComponentHealth> => {
        const start = Date.now();
        return {
          name: 'websocket',
          status: HealthStatus.HEALTHY,
          message: `Connected clients: ${connectedClients ?? 0}, status: ${gatewayStatus ?? 'running'}`,
          duration: Date.now() - start,
          metadata: { connectedClients: connectedClients ?? 0, gatewayStatus: gatewayStatus ?? 'running' },
        };
      },
    };
  }

  createMemoryCheck(): HealthCheck {
    const MAX_HISTORY = 10;
    const heapHistory: number[] = [];
    let prevHeapUsed = 0;

    const readInt = (path: string): number | null => {
      try {
        const fs = require('fs') as typeof import('fs');
        const raw = fs.readFileSync(path, 'utf8').trim();
        if (raw === 'max') return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
      } catch {
        return null;
      }
    };

    const detectContainerMemoryLimit = (): number => {
      const cgroupV2 = readInt('/sys/fs/cgroup/memory.max');
      if (cgroupV2 !== null) return cgroupV2;

      const cgroupV1 = readInt('/sys/fs/cgroup/memory.limit_in_bytes');
      if (cgroupV1 !== null && cgroupV1 < Number.MAX_SAFE_INTEGER) return cgroupV1;

      const os = require('os') as typeof import('os');
      return os.totalmem();
    };

    const containerLimit = detectContainerMemoryLimit();

    return {
      name: 'memory',
      check: async (): Promise<ComponentHealth> => {
        const mem = process.memoryUsage();

        const heapUsedMB = +(mem.heapUsed / 1024 / 1024).toFixed(1);
        const heapTotalMB = +(mem.heapTotal / 1024 / 1024).toFixed(1);
        const rssMB = +(mem.rss / 1024 / 1024).toFixed(1);
        const externalMB = +(mem.external / 1024 / 1024).toFixed(1);
        const heapLimitMB = +(containerLimit / 1024 / 1024).toFixed(1);

        const heapPercent = heapTotalMB > 0 ? (heapUsedMB / heapTotalMB) * 100 : 0;
        const rssPercent = containerLimit > 0 ? (mem.rss / containerLimit) * 100 : 0;

        heapHistory.push(heapPercent);
        if (heapHistory.length > MAX_HISTORY) heapHistory.shift();
        const avgHeap = heapHistory.length > 0
          ? heapHistory.reduce((a, b) => a + b, 0) / heapHistory.length
          : heapPercent;

        const heapProximity = Math.min(1, heapPercent / 100);
        const growthRate = prevHeapUsed > 0
          ? Math.min(1, Math.max(0, (mem.heapUsed - prevHeapUsed) / mem.heapUsed))
          : 0;
        const externalRatio = Math.min(1, mem.external / (mem.heapTotal || 1));
        const gcPressure = Math.min(1, heapProximity * 0.5 + growthRate * 3 + externalRatio * 0.5);
        prevHeapUsed = mem.heapUsed;

        const sustainedHighHeap = avgHeap > 98 && heapHistory.length >= 3;

        let status: HealthStatus;
        if (sustainedHighHeap || rssPercent > 95) {
          status = HealthStatus.UNHEALTHY;
        } else if (avgHeap > 95 || rssPercent > 85) {
          status = HealthStatus.DEGRADED;
        } else {
          status = HealthStatus.HEALTHY;
        }

        const pressureLabel = gcPressure < 0.3 ? 'low' : gcPressure < 0.7 ? 'moderate' : 'high';

        return {
          name: 'memory',
          status,
          message: `Heap: ${heapUsedMB}/${heapTotalMB}MB (${Math.round(heapPercent)}%), RSS: ${rssMB}MB`,
          duration: 0,
          metadata: {
            heapUsedMB,
            heapTotalMB,
            rssMB,
            externalMB,
            heapLimitMB,
            gcPressure: +gcPressure.toFixed(2),
            gcPressureLabel: pressureLabel,
            heapPercent: +heapPercent.toFixed(1),
            rssPercent: +rssPercent.toFixed(1),
            avgHeapPercent: +avgHeap.toFixed(1),
            rollingWindowSize: heapHistory.length,
          },
        };
      },
    };
  }
}
