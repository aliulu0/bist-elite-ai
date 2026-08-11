import type { WorkflowType, WorkflowTypeConfig, WorkflowConfig } from './workflow.types';
export type { WorkflowConfig } from './workflow.types';

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const TEN_MINUTES = 10 * ONE_MINUTE;
const THIRTY_MINUTES = 30 * ONE_MINUTE;
const ONE_HOUR = 60 * ONE_MINUTE;
const TWO_HOURS = 2 * ONE_HOUR;

const DEFAULT_RETRY_POLICY = {
  maxRetriesPerStep: 2,
  retryDelayMs: ONE_MINUTE,
  backoffMultiplier: 2,
};

const SINGLE_STOCK_ANALYSIS_STEPS: WorkflowTypeConfig = {
  steps: [
    { name: 'fetch_data', order: 1, timeoutMs: FIVE_MINUTES, retryAttempts: 2, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'normalize', order: 2, timeoutMs: ONE_MINUTE, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'indicators', order: 3, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'market_structure', order: 4, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'smart_money', order: 5, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
    { name: 'technical_rules', order: 6, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'technical_score', order: 7, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'financial_rules', order: 8, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
    { name: 'financial_score', order: 9, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
    { name: 'confluence', order: 10, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'candidate', order: 11, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'opportunity', order: 12, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'elite_score', order: 13, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
  ],
  timeoutMs: THIRTY_MINUTES,
  retryPolicy: { ...DEFAULT_RETRY_POLICY },
};

const MARKET_SCAN_STEPS: WorkflowTypeConfig = {
  steps: [
    { name: 'fetch_market_data', order: 1, timeoutMs: TEN_MINUTES, retryAttempts: 2, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'normalize', order: 2, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'screen_candidates', order: 3, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'rank', order: 4, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'generate_opportunities', order: 5, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
  ],
  timeoutMs: THIRTY_MINUTES,
  retryPolicy: { ...DEFAULT_RETRY_POLICY },
};

const BACKTEST_STEPS: WorkflowTypeConfig = {
  steps: [
    { name: 'load_data', order: 1, timeoutMs: TEN_MINUTES, retryAttempts: 2, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'validate', order: 2, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'simulate', order: 3, timeoutMs: ONE_HOUR, retryAttempts: 1, retryDelayMs: FIVE_MINUTES, optional: false },
    { name: 'calculate_metrics', order: 4, timeoutMs: TEN_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'generate_report', order: 5, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
  ],
  timeoutMs: ONE_HOUR + THIRTY_MINUTES,
  retryPolicy: { ...DEFAULT_RETRY_POLICY },
};

const OPTIMIZATION_STEPS: WorkflowTypeConfig = {
  steps: [
    { name: 'load_historical', order: 1, timeoutMs: TEN_MINUTES, retryAttempts: 2, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'validate', order: 2, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'optimize_weights', order: 3, timeoutMs: ONE_HOUR, retryAttempts: 1, retryDelayMs: FIVE_MINUTES, optional: false },
    { name: 'simulate', order: 4, timeoutMs: ONE_HOUR, retryAttempts: 1, retryDelayMs: FIVE_MINUTES, optional: false },
    { name: 'evaluate', order: 5, timeoutMs: TEN_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'generate_report', order: 6, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
  ],
  timeoutMs: TWO_HOURS,
  retryPolicy: { ...DEFAULT_RETRY_POLICY },
};

export const FULL_PIPELINE_STEPS: WorkflowTypeConfig = {
  steps: [
    { name: 'fetch_market_data', order: 1, timeoutMs: TEN_MINUTES, retryAttempts: 2, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'normalize', order: 2, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'aggregate', order: 3, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'ai_analysis', order: 4, timeoutMs: TEN_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'opportunity_detection', order: 5, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'scanner', order: 6, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'ranking', order: 7, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: false },
    { name: 'alerts', order: 8, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
    { name: 'portfolio_refresh', order: 9, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
    { name: 'macro_refresh', order: 10, timeoutMs: FIVE_MINUTES, retryAttempts: 1, retryDelayMs: ONE_MINUTE, optional: true },
  ],
  timeoutMs: ONE_HOUR,
  retryPolicy: { maxRetriesPerStep: 1, retryDelayMs: ONE_MINUTE, backoffMultiplier: 2 },
};

const DEFAULT_TYPE_CONFIGS: Record<WorkflowType, WorkflowTypeConfig> = {
  single_stock_analysis: SINGLE_STOCK_ANALYSIS_STEPS,
  market_scan: MARKET_SCAN_STEPS,
  backtest: BACKTEST_STEPS,
  optimization: OPTIMIZATION_STEPS,
  full_pipeline: FULL_PIPELINE_STEPS,
};

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  types: DEFAULT_TYPE_CONFIGS,
  maxConcurrentWorkflows: 5,
  maxHistorySize: 200,
  enableEvents: true,
  enablePerformanceTracking: true,
};
