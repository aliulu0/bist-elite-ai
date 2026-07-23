import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalAcquired: number;
  totalReleased: number;
  totalTimeouts: number;
  avgAcquireTimeMs: number;
  maxAcquireTimeMs: number;
}

interface ConnectionEntry {
  id: string;
  acquiredAt: number;
  releasedAt?: number;
  active: boolean;
}

@Injectable()
export class ConnectionPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly connections = new Map<string, ConnectionEntry>();
  private readonly acquireTimes: number[] = [];
  private readonly maxHistory = 1000;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  acquire(id: string): void {
    const entry: ConnectionEntry = {
      id,
      acquiredAt: Date.now(),
      active: true,
    };
    this.connections.set(id, entry);
  }

  release(id: string): void {
    const entry = this.connections.get(id);
    if (entry) {
      entry.releasedAt = Date.now();
      entry.active = false;

      const acquireTime = entry.releasedAt - entry.acquiredAt;
      this.acquireTimes.push(acquireTime);
      if (this.acquireTimes.length > this.maxHistory) {
        this.acquireTimes.shift();
      }
    }
  }

  getStats(): PoolStats {
    let activeConnections = 0;
    let idleConnections = 0;

    for (const entry of this.connections.values()) {
      if (entry.active) activeConnections++;
      else idleConnections++;
    }

    const avgAcquireTimeMs =
      this.acquireTimes.length > 0
        ? this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length
        : 0;
    const maxAcquireTimeMs = this.acquireTimes.length > 0 ? Math.max(...this.acquireTimes) : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections,
      waitingRequests: 0,
      totalAcquired: this.acquireTimes.length,
      totalReleased: idleConnections,
      totalTimeouts: 0,
      avgAcquireTimeMs,
      maxAcquireTimeMs,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 60_000;
    let cleaned = 0;

    for (const [id, entry] of this.connections) {
      if (!entry.active && entry.releasedAt && now - entry.releasedAt > staleThreshold) {
        this.connections.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Connection pool cleanup: removed ${cleaned} stale entries`);
    }
  }

  reset(): void {
    this.connections.clear();
    this.acquireTimes.length = 0;
  }
}

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
}

@Injectable()
export class MemoryMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private readonly history: MemoryStats[] = [];
  private readonly maxHistory = 100;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private leakThresholdMB = 100;
  private lastHeapMB = 0;

  constructor() {
    this.recordSnapshot();
    this.lastHeapMB = this.history[0]?.heapUsedMB || 0;
    this.monitorInterval = setInterval(() => this.recordSnapshot(), 30_000);
  }

  onModuleDestroy(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private recordSnapshot(): void {
    const mem = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      heapUsedMB: mem.heapUsed / (1024 * 1024),
      heapTotalMB: mem.heapTotal / (1024 * 1024),
      rssMB: mem.rss / (1024 * 1024),
    };

    this.history.push(stats);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (stats.heapUsedMB - this.lastHeapMB > this.leakThresholdMB) {
      this.logger.warn(
        `Possible memory leak: heap grew from ${this.lastHeapMB.toFixed(1)}MB to ${stats.heapUsedMB.toFixed(1)}MB`,
      );
    }
  }

  getStats(): MemoryStats {
    return this.history[this.history.length - 1] || this.getEmptyStats();
  }

  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  private getEmptyStats(): MemoryStats {
    return {
      heapUsed: 0,
      heapTotal: 0,
      rss: 0,
      external: 0,
      arrayBuffers: 0,
      heapUsedMB: 0,
      heapTotalMB: 0,
      rssMB: 0,
    };
  }
}

interface PerformanceSnapshot {
  timestamp: string;
  uptime: number;
  memory: MemoryStats;
  connections: PoolStats;
  eventLoop: { lag: number; min: number; max: number; avg: number };
  gc: { count: number; duration: number };
}

@Injectable()
export class PerformanceMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly connectionPool: ConnectionPoolService;
  private readonly memoryMonitor: MemoryMonitorService;
  private eventLoopLags: number[] = [];
  private gcStats = { count: 0, duration: 0 };
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = Date.now();

  constructor() {
    this.connectionPool = new ConnectionPoolService();
    this.memoryMonitor = new MemoryMonitorService();

    if (typeof globalThis.gc === 'function') {
      this.monitorInterval = setInterval(() => this.collectGcStats(), 10_000);
    }

    this.startEventLoopMonitor();
  }

  onModuleDestroy(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private startEventLoopMonitor(): void {
    let lastCheck = process.hrtime.bigint();
    const checkInterval = 100;

    const check = () => {
      const now = process.hrtime.bigint();
      const elapsed = Number(now - lastCheck) / 1e6;
      const lag = Math.max(0, elapsed - checkInterval);
      this.eventLoopLags.push(lag);
      if (this.eventLoopLags.length > 100) this.eventLoopLags.shift();
      lastCheck = now;
    };

    this.monitorInterval = setInterval(check, checkInterval);
  }

  private collectGcStats(): void {
    if (typeof globalThis.gc !== 'function') return;

    const start = Date.now();
    globalThis.gc();
    const duration = Date.now() - start;
    this.gcStats.count++;
    this.gcStats.duration += duration;
  }

  getConnectionPool(): ConnectionPoolService {
    return this.connectionPool;
  }

  getMemoryMonitor(): MemoryMonitorService {
    return this.memoryMonitor;
  }

  getSnapshot(): PerformanceSnapshot {
    const lags = this.eventLoopLags;
    const eventLoop = {
      lag: lags.length > 0 ? lags[lags.length - 1] : 0,
      min: lags.length > 0 ? Math.min(...lags) : 0,
      max: lags.length > 0 ? Math.max(...lags) : 0,
      avg: lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0,
    };

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: this.memoryMonitor.getStats(),
      connections: this.connectionPool.getStats(),
      eventLoop,
      gc: { ...this.gcStats },
    };
  }
}
