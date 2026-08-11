import { ProviderName } from './provider-health-monitor.types';

export interface ProviderHealthConfig {
  maxRequestHistory: number;
  rollingWindowMs: number;
  thresholds: {
    degradedSuccessRate: number;
    unhealthySuccessRate: number;
    degradedLatencyP95Ms: number;
    unhealthyLatencyP95Ms: number;
    maxConsecutiveFailures: number;
  };
  providers: ProviderName[];
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const DEFAULT_PROVIDER_HEALTH_CONFIG: ProviderHealthConfig = {
  maxRequestHistory: 200,
  rollingWindowMs: FIVE_MINUTES,
  thresholds: {
    degradedSuccessRate: 90,
    unhealthySuccessRate: 70,
    degradedLatencyP95Ms: 2000,
    unhealthyLatencyP95Ms: 5000,
    maxConsecutiveFailures: 5,
  },
  providers: ['yahoo_finance', 'fintables', 'investing', 'google_discovery', 'finnhub', 'kap', 'mkk', 'tcmb', 'alpha_vantage'],
};
