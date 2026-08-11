import { Injectable, Logger, Optional } from '@nestjs/common';
import { IJob, JobContext, JobResult } from './job.interface';
import { MarketDataProviderRegistry } from '../../market-data/market-data.provider-registry';
import { ProviderHealthMonitorEngine } from '../../provider-health-monitor/provider-health-monitor.engine';
import { ProviderName } from '../../provider-health-monitor/provider-health-monitor.types';
import { PersistenceService } from '../../persistence/persistence.service';

const PROVIDER_NAME_MAP: Record<string, ProviderName> = {
  'yahoo-finance': 'yahoo_finance',
  'fintables': 'fintables',
  'finnhub': 'finnhub',
  'kap': 'kap',
  'mkk': 'mkk',
  'tcmb': 'tcmb',
};

@Injectable()
export class ProviderHealthCheckJob implements IJob {
  private readonly logger = new Logger(ProviderHealthCheckJob.name);

  constructor(
    private readonly providerRegistry: MarketDataProviderRegistry,
    private readonly healthMonitor: ProviderHealthMonitorEngine,
    @Optional() private readonly persistenceService?: PersistenceService,
  ) {}

  async execute(ctx?: JobContext): Promise<JobResult> {
    this.logger.debug('ProviderHealthCheckJob started');

    try {
      const providers = this.providerRegistry.getAll();
      let healthyCount = 0;
      let unhealthyCount = 0;
      const results: Record<string, { healthy: boolean; latencyMs: number }> = {};

      for (const provider of providers) {
        const providerMonitorName = PROVIDER_NAME_MAP[provider.name];
        const startTime = Date.now();

        try {
          const healthy = await provider.validateConnection();
          const latencyMs = Date.now() - startTime;

          results[provider.name] = { healthy, latencyMs };

          if (providerMonitorName) {
            this.healthMonitor.recordRequest(providerMonitorName, latencyMs, healthy);
          }

          if (healthy) {
            healthyCount++;
          } else {
            unhealthyCount++;
          }
        } catch (error) {
          const latencyMs = Date.now() - startTime;
          const errorMsg = error instanceof Error ? error.message : String(error);

          results[provider.name] = { healthy: false, latencyMs };

          if (providerMonitorName) {
            this.healthMonitor.recordRequest(providerMonitorName, latencyMs, false, false, errorMsg);
          }

          unhealthyCount++;
          this.logger.warn(`Health check failed for ${provider.name}: ${errorMsg}`);
        }
      }

      const totalChecked = healthyCount + unhealthyCount;

      if (this.persistenceService) {
        const snapshot = this.healthMonitor.getSnapshot();
        this.persistenceService.saveProviderHealth({ snapshot }).catch((err) => {
          this.logger.warn(`Failed to persist provider health: ${err instanceof Error ? err.message : String(err)}`);
        });
      }

      this.logger.log(
        `ProviderHealthCheck completed: ${healthyCount}/${totalChecked} healthy`,
      );

      return {
        success: true,
        message: `Provider health check completed: ${healthyCount}/${totalChecked} healthy`,
        metadata: {
          providersChecked: totalChecked,
          healthyCount,
          unhealthyCount,
          results,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Provider health check failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {},
      };
    }
  }
}
