import { MarketDataHealthService } from './market-data-health.service';
import { ProviderErrorClassifier } from '../error/error-classifier.service';
import { ProviderDashboardEntry } from '../orchestrator/market-data-orchestrator';
import { ProviderDiagnostics } from '../providers/unified/base-provider.adapter';

function dashboardEntry(partial: Partial<ProviderDashboardEntry>): ProviderDashboardEntry {
  return {
    name: 'yahoo',
    enabled: true,
    priority: 4,
    status: 'healthy',
    circuitState: 'CLOSED',
    latencyMs: 10,
    totalRequests: 1,
    successfulRequests: 1,
    failedRequests: 0,
    lastSync: null,
    authConfigured: true,
    cacheEntries: 0,
    coverage: 95,
    ...partial,
  };
}

describe('MarketDataHealthService', () => {
  function setup(dashboard: ProviderDashboardEntry[], diagnostics: Record<string, ProviderDiagnostics> = {}) {
    const orchestrator = {
      getProviderDashboard: jest.fn().mockReturnValue(dashboard),
      getProviderDiagnostics: jest.fn().mockReturnValue(diagnostics),
      isProviderConfigured: jest.fn().mockReturnValue(true),
      isProviderAuthenticated: jest.fn().mockReturnValue(true),
      getProviderPriority: jest.fn().mockReturnValue(4),
    };
    const service = new MarketDataHealthService(
      orchestrator as never,
      new ProviderErrorClassifier(),
    );
    return { service, orchestrator };
  }

  it('maps a healthy provider', () => {
    const { service } = setup([
      dashboardEntry({
        name: 'yahoo',
        status: 'healthy',
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
      }),
    ]);

    const report = service.getHealthReport();
    expect(report.overall).toBe('HEALTHY');
    expect(report.providers).toHaveLength(1);
    expect(report.providers[0]).toMatchObject({
      provider: 'yahoo',
      status: 'HEALTHY',
      configured: true,
      authenticated: true,
      totalRequests: 10,
      successfulRequests: 9,
      failedRequests: 1,
      failureRatePct: 10,
    });
  });

  it('maps a degraded provider via dashboard status', () => {
    const { service } = setup([dashboardEntry({ status: 'degraded' })]);
    const report = service.getHealthReport();
    expect(report.providers[0].status).toBe('DEGRADED');
    expect(report.overall).toBe('DEGRADED');
  });

  it('maps a down provider when circuit is open', () => {
    const { service } = setup([
      dashboardEntry({ status: 'down', circuitState: 'OPEN', totalRequests: 10, failedRequests: 8 }),
    ]);
    const report = service.getHealthReport();
    const entry = report.providers[0];
    expect(entry.status).toBe('DOWN');
    expect(entry.reachable).toBe(false);
    expect(entry.errorCategory).toBe('PROVIDER_ERROR');
    expect(report.overall).toBe('DOWN');
  });

  it('uses diagnostics for last success and error category', () => {
    const { service } = setup(
      [dashboardEntry({ status: 'degraded', failedRequests: 3, totalRequests: 5 })],
      {
        yahoo: {
          lastErrorCategory: 'RATE_LIMIT',
          lastErrorMessage: 'rate limited',
          lastErrorTime: Date.parse('2026-01-01T00:00:00.000Z'),
          lastSuccessTime: Date.parse('2026-01-01T01:00:00.000Z'),
        },
      },
    );
    const report = service.getHealthReport();
    const entry = report.providers[0];
    expect(entry.lastSuccessfulRequest).toBe('2026-01-01T01:00:00.000Z');
    expect(entry.lastFailure).toBe('2026-01-01T00:00:00.000Z');
    expect(entry.errorCategory).toBe('RATE_LIMIT');
  });

  it('reports UNCONFIGURED when dashboard says unconfigured', () => {
    const orchestrator = {
      getProviderDashboard: jest.fn().mockReturnValue([
        dashboardEntry({ status: 'unconfigured', authConfigured: false }),
      ]),
      getProviderDiagnostics: jest.fn().mockReturnValue({}),
      isProviderConfigured: jest.fn().mockReturnValue(false),
      isProviderAuthenticated: jest.fn().mockReturnValue(false),
      getProviderPriority: jest.fn().mockReturnValue(1),
    };
    const service = new MarketDataHealthService(orchestrator as never, new ProviderErrorClassifier());
    const report = service.getHealthReport();
    expect(report.providers[0].status).toBe('UNCONFIGURED');
    expect(report.overall).toBe('UNCONFIGURED');
  });

  it('returns UNCONFIGURED when there are no providers', () => {
    const { service } = setup([]);
    const report = service.getHealthReport();
    expect(report.overall).toBe('UNCONFIGURED');
    expect(report.providers).toEqual([]);
  });
});
