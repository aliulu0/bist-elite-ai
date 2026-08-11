import { ProviderHealthMonitorEngine } from './provider-health-monitor.engine';
import { DEFAULT_PROVIDER_HEALTH_CONFIG, ProviderHealthConfig } from './provider-health-monitor.config';
import { ProviderName } from './provider-health-monitor.types';

function makeConfig(overrides?: Partial<ProviderHealthConfig>): Partial<ProviderHealthConfig> {
  return {
    maxRequestHistory: 50,
    rollingWindowMs: 60 * 1000,
    thresholds: {
      degradedSuccessRate: 90,
      unhealthySuccessRate: 70,
      degradedLatencyP95Ms: 2000,
      unhealthyLatencyP95Ms: 5000,
      maxConsecutiveFailures: 5,
    },
    providers: ['yahoo_finance', 'fintables'],
    ...overrides,
  };
}

describe('ProviderHealthMonitorEngine', () => {
  let engine: ProviderHealthMonitorEngine;

  beforeEach(() => {
    engine = new ProviderHealthMonitorEngine(makeConfig());
  });

  afterEach(() => {
    engine.resetAll();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('recordRequest', () => {
    it('should record a successful request', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      const history = engine.getRequestHistory('yahoo_finance');
      expect(history.length).toBe(1);
      expect(history[0].latencyMs).toBe(100);
      expect(history[0].success).toBe(true);
    });

    it('should record a failed request', () => {
      engine.recordRequest('yahoo_finance', 500, false, false, 'Network error');
      const history = engine.getRequestHistory('yahoo_finance');
      expect(history[0].success).toBe(false);
      expect(history[0].error).toBe('Network error');
    });

    it('should record a timeout', () => {
      engine.recordRequest('yahoo_finance', 10000, false, true, 'Timeout');
      const history = engine.getRequestHistory('yahoo_finance');
      expect(history[0].isTimeout).toBe(true);
    });

    it('should increment consecutive failures on failure', () => {
      engine.recordRequest('yahoo_finance', 500, false);
      engine.recordRequest('yahoo_finance', 500, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.consecutiveFailures).toBe(2);
    });

    it('should reset consecutive failures on success', () => {
      engine.recordRequest('yahoo_finance', 500, false);
      engine.recordRequest('yahoo_finance', 500, false);
      engine.recordRequest('yahoo_finance', 100, true);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.consecutiveFailures).toBe(0);
    });

    it('should track recovery time', () => {
      engine.recordRequest('yahoo_finance', 500, false);
      engine.recordRequest('yahoo_finance', 100, true);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.recoveryTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should enforce maxRequestHistory limit', () => {
      for (let i = 0; i < 60; i++) {
        engine.recordRequest('yahoo_finance', i, true);
      }
      const history = engine.getRequestHistory('yahoo_finance');
      expect(history.length).toBe(50);
      expect(history[0].latencyMs).toBe(10);
    });

    it('should handle unknown provider gracefully', () => {
      engine.recordRequest('unknown_provider' as ProviderName, 100, true);
      const history = engine.getRequestHistory('unknown_provider' as ProviderName);
      expect(history.length).toBe(1);
    });
  });

  describe('getProviderState', () => {
    it('should return empty state for provider with no requests', () => {
      const state = engine.getProviderState('yahoo_finance');
      expect(state.provider).toBe('yahoo_finance');
      expect(state.status).toBe('unknown');
      expect(state.totalRequests).toBe(0);
      expect(state.successRate).toBe(0);
      expect(state.reliabilityScore).toBe(100);
    });

    it('should calculate success rate', () => {
      for (let i = 0; i < 8; i++) engine.recordRequest('yahoo_finance', 100, true);
      for (let i = 0; i < 2; i++) engine.recordRequest('yahoo_finance', 100, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.successRate).toBe(80);
      expect(state.errorRate).toBe(20);
      expect(state.totalRequests).toBe(10);
    });

    it('should calculate latency percentiles', () => {
      for (let i = 1; i <= 50; i++) {
        engine.recordRequest('yahoo_finance', i, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.avgLatencyMs).toBe(25.5);
      expect(state.p50LatencyMs).toBe(25);
      expect(state.p95LatencyMs).toBe(48);
      expect(state.p99LatencyMs).toBe(50);
    });

    it('should return healthy status when metrics are good', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 100, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.status).toBe('healthy');
    });

    it('should return degraded status for low success rate', () => {
      for (let i = 0; i < 8; i++) engine.recordRequest('yahoo_finance', 100, true);
      for (let i = 0; i < 2; i++) engine.recordRequest('yahoo_finance', 100, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.status).toBe('degraded');
    });

    it('should return unhealthy status for very low success rate', () => {
      for (let i = 0; i < 5; i++) engine.recordRequest('yahoo_finance', 100, true);
      for (let i = 0; i < 5; i++) engine.recordRequest('yahoo_finance', 100, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.status).toBe('unhealthy');
    });

    it('should return unhealthy status for high latency', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 6000, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.status).toBe('unhealthy');
    });

    it('should return degraded status for moderate latency', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 3000, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.status).toBe('degraded');
    });

    it('should count timeouts', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      engine.recordRequest('yahoo_finance', 5000, false, true);
      engine.recordRequest('yahoo_finance', 5000, false, true);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.timeoutCount).toBe(2);
    });

    it('should track last request time', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.lastRequestTime).toBeGreaterThan(0);
    });

    it('should track last success time', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.lastSuccessTime).toBeGreaterThan(0);
    });

    it('should track last failure time', () => {
      engine.recordRequest('yahoo_finance', 100, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.lastFailureTime).toBeGreaterThan(0);
    });
  });

  describe('reliability score', () => {
    it('should return 100 for perfect provider', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 50, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.reliabilityScore).toBe(100);
    });

    it('should penalize for failures', () => {
      for (let i = 0; i < 7; i++) engine.recordRequest('yahoo_finance', 50, true);
      for (let i = 0; i < 3; i++) engine.recordRequest('yahoo_finance', 50, false);
      const state = engine.getProviderState('yahoo_finance');
      expect(state.reliabilityScore).toBeLessThan(100);
    });

    it('should penalize for high latency', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 3000, true);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.reliabilityScore).toBeLessThan(100);
    });

    it('should penalize for consecutive failures', () => {
      for (let i = 0; i < 3; i++) {
        engine.recordRequest('yahoo_finance', 100, false);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.reliabilityScore).toBeLessThan(100);
    });

    it('should not go below 0', () => {
      for (let i = 0; i < 20; i++) {
        engine.recordRequest('yahoo_finance', 10000, false);
      }
      const state = engine.getProviderState('yahoo_finance');
      expect(state.reliabilityScore).toBe(0);
    });
  });

  describe('getSnapshot', () => {
    it('should return snapshot with all providers', () => {
      const snap = engine.getSnapshot();
      expect(snap.providers.length).toBe(2);
      expect(snap.totalProviders).toBe(2);
      expect(snap.timestamp).toBeDefined();
    });

    it('should count healthy/degraded/unhealthy', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 50, true);
        engine.recordRequest('fintables', 50, true);
      }
      const snap = engine.getSnapshot();
      expect(snap.healthyCount).toBe(2);
      expect(snap.degradedCount).toBe(0);
      expect(snap.unhealthyCount).toBe(0);
      expect(snap.overallStatus).toBe('healthy');
    });

    it('should set overall to unhealthy if any provider is unhealthy', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 50, true);
        engine.recordRequest('fintables', 50, false);
      }
      const snap = engine.getSnapshot();
      expect(snap.overallStatus).toBe('unhealthy');
    });

    it('should set overall to degraded if any provider is degraded', () => {
      for (let i = 0; i < 10; i++) {
        engine.recordRequest('yahoo_finance', 50, true);
      }
      for (let i = 0; i < 8; i++) engine.recordRequest('fintables', 50, true);
      for (let i = 0; i < 2; i++) engine.recordRequest('fintables', 50, false);
      const snap = engine.getSnapshot();
      expect(snap.overallStatus).toBe('degraded');
    });
  });

  describe('getResult', () => {
    it('should return result with metadata', () => {
      const result = engine.getResult();
      expect(result.snapshot).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.config).toBeDefined();
      expect(result.metadata.startedAt).toBeDefined();
      expect(result.metadata.providers).toBeDefined();
    });
  });

  describe('resetProvider', () => {
    it('should clear provider data', () => {
      engine.recordRequest('yahoo_finance', 100, false);
      engine.recordRequest('yahoo_finance', 100, false);
      engine.resetProvider('yahoo_finance');
      const state = engine.getProviderState('yahoo_finance');
      expect(state.totalRequests).toBe(0);
      expect(state.consecutiveFailures).toBe(0);
    });
  });

  describe('resetAll', () => {
    it('should clear all providers', () => {
      engine.recordRequest('yahoo_finance', 100, false);
      engine.recordRequest('fintables', 100, false);
      engine.resetAll();
      expect(engine.getProviderState('yahoo_finance').totalRequests).toBe(0);
      expect(engine.getProviderState('fintables').totalRequests).toBe(0);
    });
  });

  describe('getRequestHistory', () => {
    it('should return copy of history', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      const h1 = engine.getRequestHistory('yahoo_finance');
      const h2 = engine.getRequestHistory('yahoo_finance');
      expect(h1).not.toBe(h2);
      expect(h1).toEqual(h2);
    });

    it('should return empty for unknown', () => {
      expect(engine.getRequestHistory('unknown' as ProviderName)).toEqual([]);
    });
  });

  describe('constructor defaults', () => {
    it('should use default config when none provided', () => {
      const defaultEngine = new ProviderHealthMonitorEngine();
      const result = defaultEngine.getResult();
      expect(result.metadata.config).toEqual(DEFAULT_PROVIDER_HEALTH_CONFIG);
    });

    it('should merge with default config', () => {
      const custom = new ProviderHealthMonitorEngine({ maxRequestHistory: 500 });
      const result = custom.getResult();
      expect((result.metadata.config as any).maxRequestHistory).toBe(500);
      expect((result.metadata.config as any).rollingWindowMs).toBe(DEFAULT_PROVIDER_HEALTH_CONFIG.rollingWindowMs);
    });
  });

  describe('rolling window', () => {
    it('should filter old requests from state', () => {
      const shortConfig = makeConfig({ rollingWindowMs: 1 });
      const shortEngine = new ProviderHealthMonitorEngine(shortConfig);
      shortEngine.recordRequest('yahoo_finance', 100, true);
      const state = shortEngine.getProviderState('yahoo_finance');
      expect(state.totalRequests).toBe(1);
    });
  });

  describe('multiple providers', () => {
    it('should track each provider independently', () => {
      engine.recordRequest('yahoo_finance', 100, true);
      engine.recordRequest('fintables', 200, false);
      const yf = engine.getProviderState('yahoo_finance');
      const ft = engine.getProviderState('fintables');
      expect(yf.successRate).toBe(100);
      expect(ft.successRate).toBe(0);
    });
  });
});
