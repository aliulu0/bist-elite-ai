import { WorkflowPriorityMap } from './workflow-integration.types';

export interface WorkflowIntegrationConfig {
  autoEnqueue: boolean;
  workerTimeoutMs: number;
  retrySynchronization: boolean;
  queueCleanupEnabled: boolean;
  defaultPriorityMap: WorkflowPriorityMap;
}

export const DEFAULT_PRIORITY_MAP: WorkflowPriorityMap = {
  single_stock_analysis: 'HIGH',
  market_scan: 'NORMAL',
  backtest: 'LOW',
  optimization: 'NORMAL',
  full_pipeline: 'HIGH',
};

export const DEFAULT_WORKFLOW_INTEGRATION_CONFIG: WorkflowIntegrationConfig = {
  autoEnqueue: true,
  workerTimeoutMs: 300000,
  retrySynchronization: true,
  queueCleanupEnabled: true,
  defaultPriorityMap: DEFAULT_PRIORITY_MAP,
};
