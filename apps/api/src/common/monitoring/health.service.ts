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

  createMemoryCheck(): HealthCheck {
    return {
      name: 'memory',
      check: async (): Promise<ComponentHealth> => {
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        const usagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);

        let status: HealthStatus;
        if (usagePercent > 90) {
          status = HealthStatus.UNHEALTHY;
        } else if (usagePercent > 75) {
          status = HealthStatus.DEGRADED;
        } else {
          status = HealthStatus.HEALTHY;
        }

        return {
          name: 'memory',
          status,
          message: `Heap: ${heapUsedMB}/${heapTotalMB}MB (${usagePercent}%)`,
          duration: 0,
          metadata: {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            rss: mem.rss,
            external: mem.external,
            usagePercent,
          },
        };
      },
    };
  }
}
