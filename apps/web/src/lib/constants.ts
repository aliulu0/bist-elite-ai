export const API_BASE_URL = '/api';

export const QUERY_KEYS = {
  health: ['health'] as const,
  marketData: (symbol: string, timeframe: string) => ['marketData', symbol, timeframe] as const,
  technicalAnalysis: (symbol: string, timeframe: string) => ['technicalAnalysis', symbol, timeframe] as const,
  financialAnalysis: (symbol: string) => ['financialAnalysis', symbol] as const,
  scanner: ['scanner'] as const,
  scannerResults: ['scanner', 'results'] as const,
  topCandidates: ['scanner', 'candidates'] as const,
  watchlist: ['watchlist'] as const,
  backtest: (config: string) => ['backtest', config] as const,
  scheduler: ['scheduler'] as const,
  schedulerJobs: ['scheduler', 'jobs'] as const,
  configuration: ['configuration'] as const,
  configDomains: ['configuration', 'domains'] as const,
  performanceMonitor: ['performanceMonitor'] as const,
  providerHealth: ['providerHealth'] as const,
  eventBus: ['eventBus'] as const,
  eventBusEvents: ['eventBus', 'events'] as const,
  workflowQueue: ['workflowQueue'] as const,
  workflowJobs: ['workflowQueue', 'jobs'] as const,
  diagnostics: ['diagnostics'] as const,
  auditLog: ['auditLog'] as const,
} as const;

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const TOPBAR_HEIGHT = 56;
