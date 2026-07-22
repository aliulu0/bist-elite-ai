import { ConnectionPoolService, MemoryMonitorService, PerformanceMonitorService } from '../performance.service';

describe('ConnectionPoolService', () => {
  let service: ConnectionPoolService;

  beforeEach(() => {
    service = new ConnectionPoolService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('tracks connections', () => {
    service.acquire('conn-1');
    const stats = service.getStats();
    expect(stats.activeConnections).toBe(1);
    expect(stats.totalConnections).toBe(1);
  });

  it('releases connections', () => {
    service.acquire('conn-1');
    service.release('conn-1');
    const stats = service.getStats();
    expect(stats.activeConnections).toBe(0);
    expect(stats.idleConnections).toBe(1);
    expect(stats.totalAcquired).toBe(1);
  });

  it('resets', () => {
    service.acquire('conn-1');
    service.release('conn-1');
    service.reset();
    const stats = service.getStats();
    expect(stats.totalConnections).toBe(0);
  });
});

describe('MemoryMonitorService', () => {
  let service: MemoryMonitorService;

  beforeEach(() => {
    service = new MemoryMonitorService({ monitorIntervalMs: 0 });
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('reports memory stats', () => {
    const stats = service.getStats();
    expect(stats.heapUsedMB).toBeGreaterThan(0);
    expect(stats.heapTotalMB).toBeGreaterThan(0);
    expect(stats.rssMB).toBeGreaterThan(0);
  });

  it('maintains history', () => {
    const history = service.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PerformanceMonitorService', () => {
  let service: PerformanceMonitorService;

  beforeEach(() => {
    service = new PerformanceMonitorService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('returns snapshot', () => {
    const snapshot = service.getSnapshot();
    expect(snapshot.timestamp).toBeDefined();
    expect(snapshot.uptime).toBeGreaterThanOrEqual(0);
    expect(snapshot.memory.heapUsedMB).toBeGreaterThan(0);
    expect(snapshot.connections).toBeDefined();
    expect(snapshot.eventLoop).toBeDefined();
    expect(snapshot.gc).toBeDefined();
  });

  it('provides connection pool', () => {
    expect(service.getConnectionPool()).toBeInstanceOf(ConnectionPoolService);
  });

  it('provides memory monitor', () => {
    expect(service.getMemoryMonitor()).toBeInstanceOf(MemoryMonitorService);
  });
});
