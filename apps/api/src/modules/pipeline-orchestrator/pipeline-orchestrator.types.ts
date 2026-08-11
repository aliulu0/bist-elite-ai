export interface PipelineContext {
  startedAt: string;
  steps: PipelineStepRecord[];
  metadata: Record<string, unknown>;
  error?: string;
}

export interface PipelineStepRecord {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface PipelineMetrics {
  pipelineDurationMs: number;
  providerAvgLatencyMs: number;
  macroRefreshDurationMs: number;
  schedulerDurationMs: number;
  providerFailures: number;
  circuitBreakerStatus: Record<string, string>;
  macroUpdateTimestamp: string | null;
  dashboardRefreshMs: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  stepNames: string[];
}

export interface PipelineOrchestratorConfig {
  trackMetrics: boolean;
  failOnMissingHandler: boolean;
  stepTimeouts: Record<string, number>;
}

export const DEFAULT_PIPELINE_ORCHESTRATOR_CONFIG: PipelineOrchestratorConfig = {
  trackMetrics: true,
  failOnMissingHandler: false,
  stepTimeouts: {
    fetch_market_data: 600000,
    normalize: 300000,
    aggregate: 300000,
    ai_analysis: 600000,
    opportunity_detection: 300000,
    scanner: 300000,
    ranking: 300000,
    alerts: 300000,
    portfolio_refresh: 300000,
    macro_refresh: 300000,
  },
};
