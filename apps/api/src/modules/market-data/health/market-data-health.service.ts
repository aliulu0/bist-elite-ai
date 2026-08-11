import { Injectable, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { getMarketDataConfig, ProviderConfig } from '../config/market-data.config';
import { ProviderErrorClassifier, FailureCategory } from '../error/error-classifier.service';
import {
  MarketDataProviderHealthEntry,
  MarketDataHealthReport,
  ProviderOverallStatus,
} from './provider-health.types';
import { ProviderDiagnostics } from '../providers/unified/base-provider.adapter';

const PUBLIC_PROVIDERS = new Set(['yahoo']);

const STATUS_MAP: Record<string, ProviderOverallStatus> = {
  healthy: 'HEALTHY',
  degraded: 'DEGRADED',
  down: 'DOWN',
  unconfigured: 'UNCONFIGURED',
};

@Injectable()
export class MarketDataHealthService {
  private readonly config = getMarketDataConfig();

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    @Optional() private readonly classifier?: ProviderErrorClassifier,
  ) {}

  getHealthReport(): MarketDataHealthReport {
    const dashboard = this.orchestrator.getProviderDashboard();
    const diagnostics = this.orchestrator.getProviderDiagnostics();

    const providers: MarketDataProviderHealthEntry[] = dashboard.map((entry) => {
      const config = this.getProviderConfig(entry.name);
      const diag = diagnostics[entry.name];
      const configured = entry.authConfigured;
      const authenticated = this.isAuthenticated(entry.name, config, configured);
      const reachable = this.computeReachable(entry, diag);
      const responseValid = this.computeResponseValid(entry, diag);
      const errorCategory = this.computeErrorCategory(entry, diag);

      return {
        provider: entry.name,
        enabled: entry.enabled,
        configured,
        authenticated,
        reachable,
        responseValid,
        latencyMs: entry.latencyMs,
        lastSuccessfulRequest: diag?.lastSuccessTime
          ? new Date(diag.lastSuccessTime).toISOString()
          : entry.lastSync,
        lastFailure: diag?.lastErrorTime
          ? new Date(diag.lastErrorTime).toISOString()
          : entry.lastSync && entry.failedRequests > 0
            ? entry.lastSync
            : null,
        errorCategory,
        status: STATUS_MAP[entry.status] ?? 'UNCONFIGURED',
        circuitState: entry.circuitState,
        priority: entry.priority,
        totalRequests: entry.totalRequests,
        successfulRequests: entry.successfulRequests,
        failedRequests: entry.failedRequests,
        failureRatePct:
          entry.totalRequests > 0
            ? Math.round((entry.failedRequests / entry.totalRequests) * 1000) / 10
            : 0,
        coverage: entry.coverage,
      };
    });

    return {
      overall: this.computeOverall(providers),
      providers,
      generatedAt: new Date().toISOString(),
    };
  }

  private getProviderConfig(name: string): ProviderConfig {
    const providers = this.config.providers as Record<string, ProviderConfig>;
    return providers[name] ?? { enabled: false, priority: 99, timeout: 15000, retries: 3, apiKey: '', baseUrl: '' };
  }

  private isAuthenticated(name: string, config: ProviderConfig, configured: boolean): boolean {
    if (!configured) return false;
    if (PUBLIC_PROVIDERS.has(name)) return true;
    return !!config.apiKey;
  }

  private computeReachable(entry: { circuitState: string; lastSync: string | null; totalRequests: number }, diag?: ProviderDiagnostics): boolean | null {
    if (entry.circuitState === 'OPEN') return false;
    if (diag?.lastSuccessTime) return true;
    if (entry.lastSync) return true;
    if (entry.totalRequests > 0 && entry.circuitState === 'HALF_OPEN') return true;
    return null;
  }

  private computeResponseValid(entry: { successfulRequests: number }, diag?: ProviderDiagnostics): boolean | null {
    if (diag?.lastSuccessTime) return true;
    if (entry.successfulRequests > 0) return true;
    return null;
  }

  private computeErrorCategory(
    entry: { failedRequests: number; totalRequests: number; circuitState: string },
    diag?: ProviderDiagnostics,
  ): FailureCategory | null {
    if (diag?.lastErrorCategory) return diag.lastErrorCategory;
    if (entry.failedRequests > 0 && entry.totalRequests > 0) {
      const rate = entry.failedRequests / entry.totalRequests;
      if (rate > 0.5 && entry.circuitState === 'OPEN') return 'PROVIDER_ERROR';
      if (rate > 0.2) return 'PROVIDER_ERROR';
    }
    return null;
  }

  private computeOverall(providers: MarketDataProviderHealthEntry[]): ProviderOverallStatus {
    if (providers.length === 0) return 'UNCONFIGURED';
    const down = providers.filter((p) => p.enabled && p.status === 'DOWN').length;
    const unconfigured = providers.filter((p) => p.enabled && p.status === 'UNCONFIGURED').length;
    const degraded = providers.filter((p) => p.enabled && p.status === 'DEGRADED').length;
    const healthy = providers.filter((p) => p.enabled && p.status === 'HEALTHY').length;

    if (down > 0) return 'DOWN';
    if (degraded > 0) return 'DEGRADED';
    if (healthy > 0) return 'HEALTHY';
    if (unconfigured > 0) return 'UNCONFIGURED';
    return 'UNCONFIGURED';
  }
}
