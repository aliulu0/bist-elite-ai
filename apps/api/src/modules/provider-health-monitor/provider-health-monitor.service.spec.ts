import { ProviderHealthMonitorService } from './provider-health-monitor.service';
import { ProviderHealthMonitorEngine } from './provider-health-monitor.engine';
import { ProviderName } from './provider-health-monitor.types';

function makeEngine() {
  return new ProviderHealthMonitorEngine({
    maxRequestHistory: 100,
    rollingWindowMs: 60000,
  });
}

function makeService(engine?: ProviderHealthMonitorEngine) {
  const eng = engine ?? makeEngine();
  const service = new ProviderHealthMonitorService(eng);
  return { service, engine: eng };
}

function seedRequests(engine: ProviderHealthMonitorEngine, provider: ProviderName, count: number, success = true) {
  for (let i = 0; i < count; i++) {
    engine.recordRequest(provider, 100 + i, success);
  }
}

describe('ProviderHealthMonitorService', () => {
  it('should be defined', () => {
    const { service } = makeService();
    expect(service).toBeDefined();
  });

  describe('getSnapshot', () => {
    it('should return a snapshot with all fields', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(snapshot).toHaveProperty('providers');
      expect(snapshot).toHaveProperty('overallStatus');
      expect(snapshot).toHaveProperty('totalProviders');
      expect(snapshot).toHaveProperty('healthyCount');
      expect(snapshot).toHaveProperty('degradedCount');
      expect(snapshot).toHaveProperty('unhealthyCount');
      expect(snapshot).toHaveProperty('timestamp');
    });

    it('should return 9 providers by default', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(snapshot.totalProviders).toBe(9);
      expect(snapshot.providers).toHaveLength(9);
    });

    it('should default to healthy overall status', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(snapshot.overallStatus).toBe('healthy');
    });

    it('should return ISO timestamp', () => {
      const { service } = makeService();
      const snapshot = service.getSnapshot();
      expect(new Date(snapshot.timestamp).toISOString()).toBe(snapshot.timestamp);
    });

    it('should reflect unhealthy provider in overall status', () => {
      const { service, engine } = makeService();
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 100, false);
      }
      const snapshot = service.getSnapshot();
      expect(snapshot.overallStatus).not.toBe('healthy');
    });
  });

  describe('getProviderState', () => {
    it('should return state for a provider', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 10);
      const state = service.getProviderState('yahoo_finance');
      expect(state.provider).toBe('yahoo_finance');
      expect(state.totalRequests).toBe(10);
      expect(state.successfulRequests).toBe(10);
    });

    it('should return unknown status for provider with no data', () => {
      const { service } = makeService();
      const state = service.getProviderState('fintables');
      expect(state.status).toBe('unknown');
      expect(state.totalRequests).toBe(0);
    });

    it('should track failures', () => {
      const { service, engine } = makeService();
      engine.recordRequest('yahoo_finance', 100, false);
      engine.recordRequest('yahoo_finance', 100, false);
      const state = service.getProviderState('yahoo_finance');
      expect(state.failedRequests).toBe(2);
      expect(state.consecutiveFailures).toBe(2);
    });

    it('should include latency stats', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'investing', 5);
      const state = service.getProviderState('investing');
      expect(state.avgLatencyMs).toBeGreaterThan(0);
      expect(state.p50LatencyMs).toBeGreaterThan(0);
      expect(state.p95LatencyMs).toBeGreaterThan(0);
    });

    it('should handle all provider names', () => {
      const { service } = makeService();
      const providers: ProviderName[] = ['yahoo_finance', 'fintables', 'investing', 'google_discovery'];
      for (const p of providers) {
        const state = service.getProviderState(p);
        expect(state.provider).toBe(p);
      }
    });
  });

  describe('getRequestHistory', () => {
    it('should return requests with total', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 5);
      const result = service.getRequestHistory('yahoo_finance', 50, 0);
      expect(result.requests).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it('should support limit', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 10);
      const result = service.getRequestHistory('yahoo_finance', 3, 0);
      expect(result.requests).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('should support offset', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 10);
      const result = service.getRequestHistory('yahoo_finance', 5, 5);
      expect(result.requests).toHaveLength(5);
      expect(result.total).toBe(10);
    });

    it('should return empty for provider with no data', () => {
      const { service } = makeService();
      const result = service.getRequestHistory('fintables', 50, 0);
      expect(result.requests).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle offset beyond total', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 3);
      const result = service.getRequestHistory('yahoo_finance', 10, 100);
      expect(result.requests).toEqual([]);
      expect(result.total).toBe(3);
    });
  });

  describe('resetAll', () => {
    it('should reset all providers', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 5);
      seedRequests(engine, 'fintables', 3);
      service.resetAll();
      expect(service.getProviderState('yahoo_finance').totalRequests).toBe(0);
      expect(service.getProviderState('fintables').totalRequests).toBe(0);
    });

    it('should be safe on empty engine', () => {
      const { service } = makeService();
      service.resetAll();
      const snapshot = service.getSnapshot();
      expect(snapshot.providers.every((p) => p.totalRequests === 0)).toBe(true);
    });
  });

  describe('resetProvider', () => {
    it('should reset a single provider', () => {
      const { service, engine } = makeService();
      seedRequests(engine, 'yahoo_finance', 5);
      seedRequests(engine, 'fintables', 3);
      service.resetProvider('yahoo_finance');
      expect(service.getProviderState('yahoo_finance').totalRequests).toBe(0);
      expect(service.getProviderState('fintables').totalRequests).toBe(3);
    });

    it('should clear consecutive failures', () => {
      const { service, engine } = makeService();
      engine.recordRequest('yahoo_finance', 100, false);
      engine.recordRequest('yahoo_finance', 100, false);
      service.resetProvider('yahoo_finance');
      const state = service.getProviderState('yahoo_finance');
      expect(state.consecutiveFailures).toBe(0);
    });
  });
});
