import type {
  EndpointModule,
  EndpointDefinition,
  DtoDefinition,
  EnumDefinition,
  PropertyDefinition,
} from './openapi.types';

export interface OpenAPIEngineConfig {
  apiTitle: string;
  apiDescription: string;
  apiVersion: string;
  serverUrl: string;
  serverDescription: string;
  cacheEnabled: boolean;
  cacheMaxAgeMs: number;
  enableEvents: boolean;
  maxHistorySize: number;
}

export const DEFAULT_OPENAPI_CONFIG: OpenAPIEngineConfig = {
  apiTitle: 'BIST Elite AI API',
  apiDescription: 'AI-Powered Early Opportunity Detection Platform for Borsa Istanbul',
  apiVersion: '1.0.0',
  serverUrl: 'http://localhost:3001',
  serverDescription: 'Local development server',
  cacheEnabled: true,
  cacheMaxAgeMs: 300_000,
  enableEvents: true,
  maxHistorySize: 100,
};

const TIMEFRAME_ENUM = ['4h', '1d', '1w', '1m', '3m', '6m'];
const WORKFLOW_TYPES = ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'];
const WORKFLOW_STATUSES = ['pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'];
const JOB_NAMES = ['marketOpenScan', 'incrementalScan', 'nightlyBacktest', 'benchmark', 'ruleAnalytics', 'weightOptimization', 'cacheRefresh', 'providerHealthCheck', 'macroRefresh', 'portfolioRefresh', 'alertRefresh', 'retryFailedJobs'];
const QUEUE_PRIORITIES = ['CRITICAL', 'VERY_HIGH', 'HIGH', 'NORMAL', 'LOW'];
const QUEUE_STATES = ['WAITING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER', 'CANCELLED', 'PAUSED'];
const CONFIG_DOMAINS = ['technical', 'financial', 'smart_money', 'opportunity', 'candidate', 'confluence', 'elite_score', 'workflow', 'scheduler', 'providers', 'scanner', 'backtest', 'benchmark', 'performance_monitor'];
const METRIC_CATEGORIES = ['engine_execution', 'pipeline', 'scheduler', 'provider_latency', 'cache', 'system', 'api_response'];
const PROVIDER_NAMES = ['yahoo_finance', 'fintables', 'investing', 'google_discovery'];
const EVENT_CATEGORIES = ['system', 'scheduler', 'scanner', 'analysis', 'opportunity', 'elite_score', 'provider', 'performance', 'backtest'];
const CHECKLIST_PHASES = ['pre_deployment', 'deployment', 'post_deployment', 'rollback'];
const SCANNER_SORT_FIELDS = ['compositeScore', 'eliteScore', 'candidateScore', 'rank', 'symbol'];

const stringSchema = (example?: string) => ({ type: 'string' as const, ...(example !== undefined ? { example } : {}) });
const numberSchema = (example?: number) => ({ type: 'number' as const, ...(example !== undefined ? { example } : {}) });
const integerSchema = (example?: number) => ({ type: 'integer' as const, ...(example !== undefined ? { example } : {}) });
const booleanSchema = (example?: boolean) => ({ type: 'boolean' as const, ...(example !== undefined ? { example } : {}) });
const arraySchema = (items: Record<string, unknown>) => ({ type: 'array' as const, items });
const refSchema = ($ref: string) => ({ $ref: `#/components/schemas/${$ref}` });
const nullableSchema = (base: Record<string, unknown>) => ({ ...base, nullable: true });
const enumSchema = (values: string[], example?: string) => ({ type: 'string' as const, enum: values, ...(example !== undefined ? { example } : {}) });

const ts = () => stringSchema('2025-01-15T12:00:00.000Z');
const successField = (example = true) => booleanSchema(example);

const errorResponseSchema = (name: string): Record<string, unknown> => ({
  type: 'object',
  properties: {
    success: booleanSchema(false),
    error: stringSchema('Error message'),
    timestamp: ts(),
  },
  required: ['success', 'error', 'timestamp'],
});

const HEALTH_ENDPOINTS: EndpointDefinition[] = [
  { path: '/health', method: 'GET', operationId: 'healthCheck', summary: 'Full health check with dependency status', tags: ['Health'], parameters: [], responses: [{ statusCode: 200, description: 'Health status' }] },
  { path: '/health/ready', method: 'GET', operationId: 'readinessCheck', summary: 'Readiness check', tags: ['Health'], parameters: [], responses: [{ statusCode: 200, description: 'Readiness status' }] },
  { path: '/health/live', method: 'GET', operationId: 'livenessCheck', summary: 'Liveness check', tags: ['Health'], parameters: [], responses: [{ statusCode: 200, description: 'Liveness status' }] },
  { path: '/api/auth/status', method: 'GET', operationId: 'authStatus', summary: 'Authentication status', tags: ['Health'], parameters: [], responses: [{ statusCode: 200, description: 'Auth status' }] },
  { path: '/api/metrics', method: 'GET', operationId: 'applicationMetrics', summary: 'Application metrics', tags: ['Health'], parameters: [], responses: [{ statusCode: 200, description: 'Metrics snapshot' }] },
];

const MARKET_DATA_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/market-data/{symbol}/latest', method: 'GET', operationId: 'getLatestPrice', summary: 'Get latest price for a symbol', tags: ['Market Data'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol (e.g. THYAO)', schema: stringSchema('THYAO') }], responses: [{ statusCode: 200, description: 'Latest price returned' }, { statusCode: 400, description: 'Invalid symbol' }, { statusCode: 404, description: 'No data found' }, { statusCode: 503, description: 'No provider available' }] },
  { path: '/api/market-data/{symbol}/history', method: 'GET', operationId: 'getHistory', summary: 'Get historical price data for a symbol', tags: ['Market Data'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: true, description: 'Data timeframe', schema: enumSchema(TIMEFRAME_ENUM, '1d') }, { name: 'from', in: 'query', required: false, description: 'Start date (YYYY-MM-DD)', schema: stringSchema('2025-01-01') }, { name: 'to', in: 'query', required: false, description: 'End date (YYYY-MM-DD)', schema: stringSchema('2025-06-01') }], responses: [{ statusCode: 200, description: 'Historical data returned' }, { statusCode: 400, description: 'Invalid parameters' }, { statusCode: 503, description: 'No provider available' }] },
  { path: '/api/market-data/timeframes', method: 'GET', operationId: 'getTimeframes', summary: 'Get supported timeframes', tags: ['Market Data'], parameters: [], responses: [{ statusCode: 200, description: 'Supported timeframes' }] },
  { path: '/api/market-data/providers', method: 'GET', operationId: 'getProviders', summary: 'Get available providers and their status', tags: ['Market Data'], parameters: [], responses: [{ statusCode: 200, description: 'Provider statuses' }] },
];

const FINANCIAL_ANALYSIS_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/financial-analysis/{symbol}', method: 'GET', operationId: 'financialAnalysis', summary: 'Get financial analysis for a symbol', tags: ['Financial Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }], requestBody: { required: true, contentType: 'application/json', schema: refSchema('FinancialAnalysisInputDto') }, responses: [{ statusCode: 200, description: 'Financial analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
];

const TECHNICAL_ANALYSIS_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/technical-analysis/{symbol}', method: 'GET', operationId: 'technicalAnalysis', summary: 'Get technical analysis for a symbol', tags: ['Technical Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, description: 'Timeframe for analysis', schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Technical analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
];

const ANALYSIS_PIPELINE_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/analysis/{symbol}', method: 'GET', operationId: 'fullAnalysis', summary: 'Run full analysis pipeline for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, description: 'Analysis timeframe', schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Full analysis returned' }, { statusCode: 400, description: 'Invalid input' }, { statusCode: 404, description: 'No data found' }] },
  { path: '/api/analysis/{symbol}/technical', method: 'GET', operationId: 'technicalAnalysisPipeline', summary: 'Run technical analysis for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Technical analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
  { path: '/api/analysis/{symbol}/financial', method: 'GET', operationId: 'financialAnalysisPipeline', summary: 'Run financial analysis for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Financial analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
  { path: '/api/analysis/{symbol}/smart-money', method: 'GET', operationId: 'smartMoneyAnalysis', summary: 'Run smart money analysis for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Smart money analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
  { path: '/api/analysis/{symbol}/opportunity', method: 'GET', operationId: 'opportunityAnalysis', summary: 'Run opportunity analysis for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Opportunity analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
  { path: '/api/analysis/{symbol}/elite-score', method: 'GET', operationId: 'eliteScoreAnalysis', summary: 'Run elite score analysis for a symbol', tags: ['Analysis'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }, { name: 'timeframe', in: 'query', required: false, schema: enumSchema(TIMEFRAME_ENUM, '1d') }], responses: [{ statusCode: 200, description: 'Elite score analysis returned' }, { statusCode: 400, description: 'Invalid input' }] },
];

const SCANNER_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/scanner', method: 'GET', operationId: 'getFullScan', summary: 'Get full scanner results', tags: ['Scanner'], parameters: [], responses: [{ statusCode: 200, description: 'Full scan results' }, { statusCode: 404, description: 'No scan data' }] },
  { path: '/api/scanner/top', method: 'GET', operationId: 'getTopCandidates', summary: 'Get top candidates with pagination', tags: ['Scanner'], parameters: [{ name: 'offset', in: 'query', required: false, description: 'Items to skip', schema: integerSchema(0) }, { name: 'limit', in: 'query', required: false, description: 'Max items to return', schema: integerSchema(10) }, { name: 'sortBy', in: 'query', required: false, description: 'Sort field', schema: enumSchema(SCANNER_SORT_FIELDS, 'compositeScore') }, { name: 'sortDir', in: 'query', required: false, description: 'Sort direction', schema: enumSchema(['asc', 'desc'], 'desc') }], responses: [{ statusCode: 200, description: 'Top candidates' }, { statusCode: 404, description: 'No scan data' }] },
  { path: '/api/scanner/watchlist', method: 'GET', operationId: 'getWatchlist', summary: 'Get watchlist with pagination', tags: ['Scanner'], parameters: [{ name: 'offset', in: 'query', required: false, schema: integerSchema(0) }, { name: 'limit', in: 'query', required: false, schema: integerSchema(20) }, { name: 'sortBy', in: 'query', required: false, schema: enumSchema(SCANNER_SORT_FIELDS, 'compositeScore') }, { name: 'sortDir', in: 'query', required: false, schema: enumSchema(['asc', 'desc'], 'desc') }], responses: [{ statusCode: 200, description: 'Watchlist' }, { statusCode: 404, description: 'No scan data' }] },
  { path: '/api/scanner/rejected', method: 'GET', operationId: 'getRejected', summary: 'Get rejected symbols with pagination', tags: ['Scanner'], parameters: [{ name: 'offset', in: 'query', required: false, schema: integerSchema(0) }, { name: 'limit', in: 'query', required: false, schema: integerSchema(50) }, { name: 'sortBy', in: 'query', required: false, schema: enumSchema(SCANNER_SORT_FIELDS, 'compositeScore') }, { name: 'sortDir', in: 'query', required: false, schema: enumSchema(['asc', 'desc'], 'desc') }], responses: [{ statusCode: 200, description: 'Rejected symbols' }, { statusCode: 404, description: 'No scan data' }] },
  { path: '/api/scanner/statistics', method: 'GET', operationId: 'getScanStatistics', summary: 'Get scan statistics', tags: ['Scanner'], parameters: [], responses: [{ statusCode: 200, description: 'Scan statistics' }, { statusCode: 404, description: 'No scan data' }] },
];

const SCHEDULER_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/scheduler', method: 'GET', operationId: 'getSchedulerStatus', summary: 'Get full scheduler status', tags: ['Scheduler'], parameters: [], responses: [{ statusCode: 200, description: 'Scheduler status' }] },
  { path: '/api/scheduler/{jobName}', method: 'GET', operationId: 'getJobState', summary: 'Get specific job state', tags: ['Scheduler'], parameters: [{ name: 'jobName', in: 'path', required: true, description: 'Job name', schema: enumSchema(JOB_NAMES, 'marketOpenScan') }], responses: [{ statusCode: 200, description: 'Job state' }, { statusCode: 404, description: 'Job not found' }] },
  { path: '/api/scheduler/{jobName}/execute', method: 'POST', operationId: 'executeJob', summary: 'Manually execute a job', tags: ['Scheduler'], parameters: [{ name: 'jobName', in: 'path', required: true, schema: enumSchema(JOB_NAMES, 'marketOpenScan') }], responses: [{ statusCode: 200, description: 'Execution result' }, { statusCode: 400, description: 'Invalid job name' }] },
  { path: '/api/scheduler/start', method: 'POST', operationId: 'startScheduler', summary: 'Start the scheduler', tags: ['Scheduler'], parameters: [], responses: [{ statusCode: 200, description: 'Scheduler started' }] },
  { path: '/api/scheduler/stop', method: 'POST', operationId: 'stopScheduler', summary: 'Stop the scheduler', tags: ['Scheduler'], parameters: [], responses: [{ statusCode: 200, description: 'Scheduler stopped' }] },
  { path: '/api/scheduler/{jobName}/enable', method: 'POST', operationId: 'enableJob', summary: 'Enable a job', tags: ['Scheduler'], parameters: [{ name: 'jobName', in: 'path', required: true, schema: enumSchema(JOB_NAMES, 'marketOpenScan') }], responses: [{ statusCode: 200, description: 'Job enabled' }, { statusCode: 400, description: 'Invalid job name' }] },
  { path: '/api/scheduler/{jobName}/disable', method: 'POST', operationId: 'disableJob', summary: 'Disable a job', tags: ['Scheduler'], parameters: [{ name: 'jobName', in: 'path', required: true, schema: enumSchema(JOB_NAMES, 'marketOpenScan') }], responses: [{ statusCode: 200, description: 'Job disabled' }, { statusCode: 400, description: 'Invalid job name' }] },
  { path: '/api/scheduler/{jobName}/history', method: 'GET', operationId: 'getJobHistory', summary: 'Get job execution history', tags: ['Scheduler'], parameters: [{ name: 'jobName', in: 'path', required: true, schema: enumSchema(JOB_NAMES, 'marketOpenScan') }, { name: 'limit', in: 'query', required: false, description: 'Max history entries', schema: integerSchema(50) }], responses: [{ statusCode: 200, description: 'Job history' }, { statusCode: 400, description: 'Invalid job name' }] },
];

const WORKFLOW_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/workflows', method: 'GET', operationId: 'listWorkflows', summary: 'List all workflows with optional filters', tags: ['Workflows'], parameters: [{ name: 'status', in: 'query', required: false, description: 'Filter by status', schema: enumSchema(WORKFLOW_STATUSES) }, { name: 'type', in: 'query', required: false, description: 'Filter by type', schema: enumSchema(WORKFLOW_TYPES) }], responses: [{ statusCode: 200, description: 'List of workflows' }] },
  { path: '/api/workflows/active', method: 'GET', operationId: 'getActiveWorkflows', summary: 'Get all active (pending/queued/running) workflows', tags: ['Workflows'], parameters: [], responses: [{ statusCode: 200, description: 'Active workflows' }] },
  { path: '/api/workflows/history', method: 'GET', operationId: 'getWorkflowHistory', summary: 'Get completed workflow history', tags: ['Workflows'], parameters: [{ name: 'type', in: 'query', required: false, schema: enumSchema(WORKFLOW_TYPES) }, { name: 'status', in: 'query', required: false, schema: enumSchema(WORKFLOW_STATUSES) }, { name: 'limit', in: 'query', required: false, description: 'Max entries', schema: integerSchema(50) }], responses: [{ statusCode: 200, description: 'Workflow history' }] },
  { path: '/api/workflows/statistics', method: 'GET', operationId: 'getWorkflowStatistics', summary: 'Get workflow execution statistics', tags: ['Workflows'], parameters: [], responses: [{ statusCode: 200, description: 'Workflow statistics' }] },
  { path: '/api/workflows/{id}', method: 'GET', operationId: 'getWorkflow', summary: 'Get a specific workflow by ID', tags: ['Workflows'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Workflow ID', schema: stringSchema('wf-1700000000000-0a1b') }], responses: [{ statusCode: 200, description: 'Workflow details' }, { statusCode: 404, description: 'Workflow not found' }] },
  { path: '/api/workflows', method: 'POST', operationId: 'createWorkflow', summary: 'Create a new workflow', tags: ['Workflows'], parameters: [], requestBody: { required: true, contentType: 'application/json', schema: refSchema('CreateWorkflowDto') }, responses: [{ statusCode: 201, description: 'Workflow created' }, { statusCode: 400, description: 'Invalid input' }] },
  { path: '/api/workflows/{id}/start', method: 'POST', operationId: 'startWorkflow', summary: 'Start a workflow', tags: ['Workflows'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Workflow ID', schema: stringSchema('wf-1700000000000-0a1b') }], responses: [{ statusCode: 200, description: 'Workflow started' }, { statusCode: 404, description: 'Workflow not found' }, { statusCode: 409, description: 'Workflow cannot be started' }] },
  { path: '/api/workflows/{id}/cancel', method: 'POST', operationId: 'cancelWorkflow', summary: 'Cancel a workflow', tags: ['Workflows'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Workflow ID', schema: stringSchema('wf-1700000000000-0a1b') }], responses: [{ statusCode: 200, description: 'Workflow cancelled' }, { statusCode: 404, description: 'Workflow not found' }, { statusCode: 409, description: 'Workflow cannot be cancelled' }] },
  { path: '/api/workflows/{id}/retry', method: 'POST', operationId: 'retryWorkflow', summary: 'Retry a failed/completed workflow', tags: ['Workflows'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Workflow ID', schema: stringSchema('wf-1700000000000-0a1b') }], responses: [{ statusCode: 200, description: 'New workflow started' }, { statusCode: 404, description: 'Workflow not found' }, { statusCode: 409, description: 'Workflow cannot be retried' }] },
];

const WORKFLOW_QUEUE_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/v1/queue', method: 'GET', operationId: 'getQueueSnapshot', summary: 'Get queue snapshot', tags: ['Workflow Queue'], parameters: [], responses: [{ statusCode: 200, description: 'Queue snapshot' }] },
  { path: '/api/v1/queue/statistics', method: 'GET', operationId: 'getQueueStatistics', summary: 'Get queue statistics', tags: ['Workflow Queue'], parameters: [], responses: [{ statusCode: 200, description: 'Queue statistics' }] },
  { path: '/api/v1/queue/jobs', method: 'GET', operationId: 'getQueueJobs', summary: 'Get all jobs with filtering and pagination', tags: ['Workflow Queue'], parameters: [{ name: 'limit', in: 'query', required: false, schema: integerSchema(50) }, { name: 'offset', in: 'query', required: false, schema: integerSchema(0) }, { name: 'state', in: 'query', required: false, schema: enumSchema(QUEUE_STATES) }, { name: 'priority', in: 'query', required: false, schema: enumSchema(QUEUE_PRIORITIES) }], responses: [{ statusCode: 200, description: 'Job list' }] },
  { path: '/api/v1/queue/job/{id}', method: 'GET', operationId: 'getQueueJob', summary: 'Get single job by ID', tags: ['Workflow Queue'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Job ID', schema: stringSchema('jq-1700000000000-abc') }], responses: [{ statusCode: 200, description: 'Job details' }, { statusCode: 404, description: 'Job not found' }] },
  { path: '/api/v1/queue/start', method: 'POST', operationId: 'startQueue', summary: 'Start the queue', tags: ['Workflow Queue'], parameters: [], responses: [{ statusCode: 200, description: 'Queue started' }] },
  { path: '/api/v1/queue/stop', method: 'POST', operationId: 'stopQueue', summary: 'Stop the queue', tags: ['Workflow Queue'], parameters: [], responses: [{ statusCode: 200, description: 'Queue stopped' }] },
  { path: '/api/v1/queue/job/{id}/retry', method: 'POST', operationId: 'retryQueueJob', summary: 'Retry a failed or dead-lettered job', tags: ['Workflow Queue'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Job ID', schema: stringSchema('jq-1700000000000-abc') }], responses: [{ statusCode: 200, description: 'Job queued for retry' }, { statusCode: 404, description: 'Job not found' }, { statusCode: 400, description: 'Job cannot be retried' }] },
  { path: '/api/v1/queue/job/{id}/cancel', method: 'POST', operationId: 'cancelQueueJob', summary: 'Cancel a job', tags: ['Workflow Queue'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Job ID', schema: stringSchema('jq-1700000000000-abc') }], responses: [{ statusCode: 200, description: 'Job cancelled' }, { statusCode: 404, description: 'Job not found' }, { statusCode: 400, description: 'Job cannot be cancelled' }] },
  { path: '/api/v1/queue/clear', method: 'POST', operationId: 'clearQueue', summary: 'Clear the entire queue', tags: ['Workflow Queue'], parameters: [], responses: [{ statusCode: 200, description: 'Queue cleared' }] },
];

const PERFORMANCE_MONITOR_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/performance', method: 'GET', operationId: 'getPerformanceSnapshot', summary: 'Get full performance snapshot', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'Full performance snapshot' }] },
  { path: '/api/performance/health', method: 'GET', operationId: 'getPerformanceHealth', summary: 'Get system health', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'System health check' }] },
  { path: '/api/performance/cache', method: 'GET', operationId: 'getCacheMetrics', summary: 'Get cache metrics', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'Cache performance metrics' }] },
  { path: '/api/performance/system', method: 'GET', operationId: 'getSystemMetrics', summary: 'Get system metrics', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'System resource metrics' }] },
  { path: '/api/performance/metrics', method: 'GET', operationId: 'getAllMetrics', summary: 'Get all metrics', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'All metric statistics' }] },
  { path: '/api/performance/category/{category}', method: 'GET', operationId: 'getMetricsByCategory', summary: 'Get metrics by category', tags: ['Performance Monitor'], parameters: [{ name: 'category', in: 'path', required: true, description: 'Metric category', schema: enumSchema(METRIC_CATEGORIES, 'engine_execution') }], responses: [{ statusCode: 200, description: 'Metrics for category' }, { statusCode: 400, description: 'Invalid category' }] },
  { path: '/api/performance/metric/{name}', method: 'GET', operationId: 'getMetricStats', summary: 'Get single metric statistics', tags: ['Performance Monitor'], parameters: [{ name: 'name', in: 'path', required: true, description: 'Metric name', schema: stringSchema('api_response_time') }], responses: [{ statusCode: 200, description: 'Metric statistics' }, { statusCode: 404, description: 'Metric not found' }] },
  { path: '/api/performance/reset', method: 'POST', operationId: 'resetAllMetrics', summary: 'Reset all metrics', tags: ['Performance Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'All metrics reset' }] },
  { path: '/api/performance/metric/{name}/reset', method: 'POST', operationId: 'resetMetric', summary: 'Reset a single metric', tags: ['Performance Monitor'], parameters: [{ name: 'name', in: 'path', required: true, description: 'Metric name', schema: stringSchema('api_response_time') }], responses: [{ statusCode: 200, description: 'Metric reset' }, { statusCode: 404, description: 'Metric not found' }] },
];

const PROVIDER_HEALTH_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/providers/health', method: 'GET', operationId: 'getProviderHealthSnapshot', summary: 'Get overall provider health snapshot', tags: ['Provider Health Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'Provider health snapshot' }] },
  { path: '/api/providers/health/{provider}', method: 'GET', operationId: 'getProviderHealth', summary: 'Get single provider health', tags: ['Provider Health Monitor'], parameters: [{ name: 'provider', in: 'path', required: true, description: 'Provider name', schema: enumSchema(PROVIDER_NAMES, 'yahoo_finance') }], responses: [{ statusCode: 200, description: 'Provider health state' }, { statusCode: 400, description: 'Invalid provider' }] },
  { path: '/api/providers/history/{provider}', method: 'GET', operationId: 'getProviderHistory', summary: 'Get provider request history', tags: ['Provider Health Monitor'], parameters: [{ name: 'provider', in: 'path', required: true, schema: enumSchema(PROVIDER_NAMES, 'yahoo_finance') }, { name: 'limit', in: 'query', required: false, description: 'Max history entries', schema: integerSchema(50) }, { name: 'offset', in: 'query', required: false, description: 'Offset for pagination', schema: integerSchema(0) }], responses: [{ statusCode: 200, description: 'Provider request history' }, { statusCode: 400, description: 'Invalid provider' }] },
  { path: '/api/providers/reset', method: 'POST', operationId: 'resetAllProviders', summary: 'Reset all provider statistics', tags: ['Provider Health Monitor'], parameters: [], responses: [{ statusCode: 200, description: 'All providers reset' }] },
  { path: '/api/providers/reset/{provider}', method: 'POST', operationId: 'resetProvider', summary: 'Reset single provider statistics', tags: ['Provider Health Monitor'], parameters: [{ name: 'provider', in: 'path', required: true, schema: enumSchema(PROVIDER_NAMES, 'yahoo_finance') }], responses: [{ statusCode: 200, description: 'Provider reset' }, { statusCode: 400, description: 'Invalid provider' }] },
];

const EVENT_BUS_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/v1/events', method: 'GET', operationId: 'getEvents', summary: 'Get recent events with pagination', tags: ['Events'], parameters: [{ name: 'limit', in: 'query', required: false, schema: integerSchema(50) }, { name: 'offset', in: 'query', required: false, schema: integerSchema(0) }, { name: 'category', in: 'query', required: false, schema: enumSchema(EVENT_CATEGORIES) }, { name: 'type', in: 'query', required: false, description: 'Event type filter', schema: stringSchema() }], responses: [{ statusCode: 200, description: 'Event list' }] },
  { path: '/api/v1/events/types', method: 'GET', operationId: 'getEventTypes', summary: 'Get registered event types', tags: ['Events'], parameters: [], responses: [{ statusCode: 200, description: 'Event types' }] },
  { path: '/api/v1/events/type/{type}', method: 'GET', operationId: 'getEventsByType', summary: 'Get events by type', tags: ['Events'], parameters: [{ name: 'type', in: 'path', required: true, description: 'Event type', schema: stringSchema('scheduler.started') }, { name: 'limit', in: 'query', required: false, schema: integerSchema(50) }, { name: 'category', in: 'query', required: false, schema: enumSchema(EVENT_CATEGORIES) }], responses: [{ statusCode: 200, description: 'Events by type' }] },
  { path: '/api/v1/events/statistics', method: 'GET', operationId: 'getEventStatistics', summary: 'Get event bus statistics', tags: ['Events'], parameters: [], responses: [{ statusCode: 200, description: 'Event statistics' }] },
  { path: '/api/v1/events/clear', method: 'POST', operationId: 'clearEventHistory', summary: 'Clear event history', tags: ['Events'], parameters: [], responses: [{ statusCode: 200, description: 'Event history cleared' }] },
];

const CONFIGURATION_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/configuration', method: 'GET', operationId: 'getAllConfig', summary: 'Get all configuration domains', tags: ['Configuration'], parameters: [], responses: [{ statusCode: 200, description: 'All configurations' }] },
  { path: '/api/configuration/profiles', method: 'GET', operationId: 'getProfiles', summary: 'Get all configuration profiles', tags: ['Configuration'], parameters: [], responses: [{ statusCode: 200, description: 'Configuration profiles' }] },
  { path: '/api/configuration/snapshots', method: 'GET', operationId: 'getSnapshots', summary: 'Get all configuration snapshots', tags: ['Configuration'], parameters: [], responses: [{ statusCode: 200, description: 'Configuration snapshots' }] },
  { path: '/api/configuration/history', method: 'GET', operationId: 'getConfigHistory', summary: 'Get configuration change history', tags: ['Configuration'], parameters: [{ name: 'limit', in: 'query', required: false, schema: integerSchema(50) }, { name: 'offset', in: 'query', required: false, schema: integerSchema(0) }], responses: [{ statusCode: 200, description: 'Configuration history' }] },
  { path: '/api/configuration/statistics', method: 'GET', operationId: 'getConfigStatistics', summary: 'Get configuration statistics', tags: ['Configuration'], parameters: [], responses: [{ statusCode: 200, description: 'Configuration statistics' }] },
  { path: '/api/configuration/{domain}', method: 'GET', operationId: 'getDomainConfig', summary: 'Get single domain configuration', tags: ['Configuration'], parameters: [{ name: 'domain', in: 'path', required: true, description: 'Configuration domain', schema: enumSchema(CONFIG_DOMAINS, 'technical') }], responses: [{ statusCode: 200, description: 'Domain configuration' }, { statusCode: 400, description: 'Invalid domain' }] },
  { path: '/api/configuration/{domain}/value', method: 'POST', operationId: 'setConfigValue', summary: 'Update a single configuration value', tags: ['Configuration'], parameters: [{ name: 'domain', in: 'path', required: true, schema: enumSchema(CONFIG_DOMAINS, 'technical') }], requestBody: { required: true, contentType: 'application/json', schema: refSchema('SetValueDto') }, responses: [{ statusCode: 200, description: 'Value updated' }, { statusCode: 400, description: 'Invalid domain' }] },
  { path: '/api/configuration/reset', method: 'POST', operationId: 'resetAllConfig', summary: 'Reset all configuration to defaults', tags: ['Configuration'], parameters: [], responses: [{ statusCode: 200, description: 'All configuration reset' }] },
  { path: '/api/configuration/reset/{domain}', method: 'POST', operationId: 'resetDomainConfig', summary: 'Reset single domain to defaults', tags: ['Configuration'], parameters: [{ name: 'domain', in: 'path', required: true, schema: enumSchema(CONFIG_DOMAINS, 'technical') }], responses: [{ statusCode: 200, description: 'Domain reset' }, { statusCode: 400, description: 'Invalid domain' }] },
  { path: '/api/configuration/profile/load/{id}', method: 'POST', operationId: 'loadProfile', summary: 'Load a configuration profile', tags: ['Configuration'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Profile ID', schema: stringSchema('profile-default') }], responses: [{ statusCode: 200, description: 'Profile loaded' }, { statusCode: 404, description: 'Profile not found' }] },
  { path: '/api/configuration/profile/create', method: 'POST', operationId: 'createProfile', summary: 'Create a new configuration profile', tags: ['Configuration'], parameters: [], requestBody: { required: true, contentType: 'application/json', schema: refSchema('CreateProfileDto') }, responses: [{ statusCode: 200, description: 'Profile created' }] },
  { path: '/api/configuration/profile/duplicate/{id}', method: 'POST', operationId: 'duplicateProfile', summary: 'Duplicate a configuration profile', tags: ['Configuration'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Source profile ID', schema: stringSchema('profile-default') }], requestBody: { required: true, contentType: 'application/json', schema: refSchema('DuplicateProfileDto') }, responses: [{ statusCode: 200, description: 'Profile duplicated' }, { statusCode: 404, description: 'Source profile not found' }] },
  { path: '/api/configuration/profile/{id}', method: 'DELETE', operationId: 'deleteProfile', summary: 'Delete a configuration profile', tags: ['Configuration'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Profile ID', schema: stringSchema('profile-custom-1') }], responses: [{ statusCode: 200, description: 'Profile deleted' }, { statusCode: 404, description: 'Profile not found or is system profile' }] },
  { path: '/api/configuration/snapshot/create', method: 'POST', operationId: 'createSnapshot', summary: 'Create a configuration snapshot', tags: ['Configuration'], parameters: [], requestBody: { required: true, contentType: 'application/json', schema: refSchema('CreateSnapshotDto') }, responses: [{ statusCode: 200, description: 'Snapshot created' }] },
  { path: '/api/configuration/snapshot/rollback/{id}', method: 'POST', operationId: 'rollbackSnapshot', summary: 'Rollback to a configuration snapshot', tags: ['Configuration'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Snapshot ID', schema: stringSchema('snap-1700000000000') }], responses: [{ statusCode: 200, description: 'Snapshot rolled back' }, { statusCode: 404, description: 'Snapshot not found' }] },
];

const DASHBOARD_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/dashboard/config', method: 'GET', operationId: 'getDashboardConfig', summary: 'Get dashboard configuration', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Dashboard configuration' }] },
  { path: '/api/dashboard/config', method: 'POST', operationId: 'updateDashboardConfig', summary: 'Update dashboard configuration', tags: ['Dashboard'], parameters: [], requestBody: { required: true, contentType: 'application/json', schema: { type: 'object' } }, responses: [{ statusCode: 200, description: 'Configuration updated' }] },
  { path: '/api/dashboard/filters', method: 'GET', operationId: 'getFilterOptions', summary: 'Get available filter options', tags: ['Dashboard'], parameters: [{ name: 'symbols', in: 'query', required: false, description: 'Comma-separated symbols', schema: stringSchema('THYAO,GARAN') }, { name: 'sectors', in: 'query', required: false, description: 'Comma-separated sectors', schema: stringSchema('Bankacilik') }, { name: 'strategies', in: 'query', required: false, description: 'Comma-separated strategies', schema: stringSchema('value') }], responses: [{ statusCode: 200, description: 'Filter options' }] },
  { path: '/api/dashboard/filters/active', method: 'GET', operationId: 'getActiveFilters', summary: 'Get active filters', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Active filters' }] },
  { path: '/api/dashboard/filters', method: 'POST', operationId: 'addFilter', summary: 'Add a filter', tags: ['Dashboard'], parameters: [], requestBody: { required: true, contentType: 'application/json', schema: { type: 'object' } }, responses: [{ statusCode: 200, description: 'Filter added' }] },
  { path: '/api/dashboard/filters/{type}/{value}', method: 'DELETE', operationId: 'removeFilter', summary: 'Remove a filter', tags: ['Dashboard'], parameters: [{ name: 'type', in: 'path', required: true, description: 'Filter type', schema: stringSchema('sector') }, { name: 'value', in: 'path', required: true, description: 'Filter value', schema: stringSchema('Bankacilik') }], responses: [{ statusCode: 200, description: 'Filter removed' }] },
  { path: '/api/dashboard/filters', method: 'DELETE', operationId: 'clearFilters', summary: 'Clear all filters', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Filters cleared' }] },
  { path: '/api/dashboard/notifications', method: 'GET', operationId: 'getNotifications', summary: 'Get notification center data', tags: ['Dashboard'], parameters: [{ name: 'category', in: 'query', required: false, schema: stringSchema() }, { name: 'priority', in: 'query', required: false, schema: stringSchema() }, { name: 'unreadOnly', in: 'query', required: false, schema: stringSchema('true') }], responses: [{ statusCode: 200, description: 'Notification data' }] },
  { path: '/api/dashboard/notifications/{id}/read', method: 'POST', operationId: 'markNotificationRead', summary: 'Mark notification as read', tags: ['Dashboard'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Notification ID', schema: stringSchema('notif-1') }], responses: [{ statusCode: 200, description: 'Notification marked as read' }] },
  { path: '/api/dashboard/notifications/read-all', method: 'POST', operationId: 'markAllNotificationsRead', summary: 'Mark all notifications as read', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'All notifications marked as read' }] },
  { path: '/api/dashboard/notifications/{id}', method: 'DELETE', operationId: 'deleteNotification', summary: 'Delete a notification', tags: ['Dashboard'], parameters: [{ name: 'id', in: 'path', required: true, description: 'Notification ID', schema: stringSchema('notif-1') }], responses: [{ statusCode: 200, description: 'Notification deleted' }] },
  { path: '/api/dashboard/timeline', method: 'GET', operationId: 'getTimeline', summary: 'Get dashboard timeline', tags: ['Dashboard'], parameters: [{ name: 'limit', in: 'query', required: false, schema: integerSchema(20) }], responses: [{ statusCode: 200, description: 'Timeline data' }] },
  { path: '/api/dashboard/timeline/symbol/{symbol}', method: 'GET', operationId: 'getTimelineBySymbol', summary: 'Get timeline events for a symbol', tags: ['Dashboard'], parameters: [{ name: 'symbol', in: 'path', required: true, description: 'Stock symbol', schema: stringSchema('THYAO') }], responses: [{ statusCode: 200, description: 'Timeline events for symbol' }] },
  { path: '/api/dashboard/report/portfolio', method: 'GET', operationId: 'getPortfolioReport', summary: 'Generate portfolio report in Turkish', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Portfolio report' }] },
  { path: '/api/dashboard/report/risk', method: 'GET', operationId: 'getRiskReport', summary: 'Generate risk report in Turkish', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Risk report' }] },
  { path: '/api/dashboard/report/intelligence', method: 'GET', operationId: 'getIntelligenceReport', summary: 'Generate intelligence report in Turkish', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Intelligence report' }] },
  { path: '/api/dashboard/report/performance', method: 'GET', operationId: 'getPerformanceReport', summary: 'Generate performance report in Turkish', tags: ['Dashboard'], parameters: [], responses: [{ statusCode: 200, description: 'Performance report' }] },
];

const PRODUCTION_READINESS_ENDPOINTS: EndpointDefinition[] = [
  { path: '/api/production-readiness/report', method: 'GET', operationId: 'getProductionReport', summary: 'Full production readiness report', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Complete production readiness assessment' }] },
  { path: '/api/production-readiness/config', method: 'GET', operationId: 'getConfigValidation', summary: 'Validate configuration', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Configuration validation result' }] },
  { path: '/api/production-readiness/health', method: 'GET', operationId: 'getProductionHealth', summary: 'System health check', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'System health status' }] },
  { path: '/api/production-readiness/resources', method: 'GET', operationId: 'getResourceValidation', summary: 'Resource usage validation', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Resource usage snapshot and validation' }] },
  { path: '/api/production-readiness/security', method: 'GET', operationId: 'getSecurityValidation', summary: 'Security validation', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Security validation result' }] },
  { path: '/api/production-readiness/performance', method: 'GET', operationId: 'getPerformanceValidation', summary: 'Performance validation', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Performance benchmarks' }] },
  { path: '/api/production-readiness/checklist/{phase}', method: 'GET', operationId: 'getChecklist', summary: 'Deployment checklist for a specific phase', tags: ['Production Readiness'], parameters: [{ name: 'phase', in: 'path', required: true, description: 'Checklist phase', schema: enumSchema(CHECKLIST_PHASES, 'pre_deployment') }], responses: [{ statusCode: 200, description: 'Deployment checklist items' }] },
  { path: '/api/production-readiness/checklist', method: 'GET', operationId: 'getAllChecklists', summary: 'All deployment checklists', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'All deployment checklists' }] },
  { path: '/api/production-readiness/backups', method: 'GET', operationId: 'getBackups', summary: 'List all backups', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Backup list and status' }] },
  { path: '/api/production-readiness/backup/full', method: 'POST', operationId: 'createFullBackup', summary: 'Create a full backup', tags: ['Production Readiness'], parameters: [], responses: [{ statusCode: 200, description: 'Full backup created' }] },
  { path: '/api/production-readiness/release/{version}', method: 'GET', operationId: 'getReleaseReadiness', summary: 'Check release readiness for a version', tags: ['Production Readiness'], parameters: [{ name: 'version', in: 'path', required: true, description: 'Release version', schema: stringSchema('1.0.0') }], responses: [{ statusCode: 200, description: 'Release readiness result' }] },
];

export const ALL_ENDPOINT_MODULES: EndpointModule[] = [
  { name: 'Health', tag: 'Health', basePath: '', endpoints: HEALTH_ENDPOINTS },
  { name: 'Market Data', tag: 'Market Data', basePath: '/api/market-data', endpoints: MARKET_DATA_ENDPOINTS },
  { name: 'Financial Analysis', tag: 'Financial Analysis', basePath: '/api/financial-analysis', endpoints: FINANCIAL_ANALYSIS_ENDPOINTS },
  { name: 'Technical Analysis', tag: 'Technical Analysis', basePath: '/api/technical-analysis', endpoints: TECHNICAL_ANALYSIS_ENDPOINTS },
  { name: 'Analysis Pipeline', tag: 'Analysis', basePath: '/api/analysis', endpoints: ANALYSIS_PIPELINE_ENDPOINTS },
  { name: 'Scanner', tag: 'Scanner', basePath: '/api/scanner', endpoints: SCANNER_ENDPOINTS },
  { name: 'Scheduler', tag: 'Scheduler', basePath: '/api/scheduler', endpoints: SCHEDULER_ENDPOINTS },
  { name: 'Workflows', tag: 'Workflows', basePath: '/api/workflows', endpoints: WORKFLOW_ENDPOINTS },
  { name: 'Workflow Queue', tag: 'Workflow Queue', basePath: '/api/v1/queue', endpoints: WORKFLOW_QUEUE_ENDPOINTS },
  { name: 'Performance Monitor', tag: 'Performance Monitor', basePath: '/api/performance', endpoints: PERFORMANCE_MONITOR_ENDPOINTS },
  { name: 'Provider Health Monitor', tag: 'Provider Health Monitor', basePath: '/api/providers', endpoints: PROVIDER_HEALTH_ENDPOINTS },
  { name: 'Event Bus', tag: 'Events', basePath: '/api/v1/events', endpoints: EVENT_BUS_ENDPOINTS },
  { name: 'Configuration', tag: 'Configuration', basePath: '/api/configuration', endpoints: CONFIGURATION_ENDPOINTS },
  { name: 'Dashboard', tag: 'Dashboard', basePath: '/api/dashboard', endpoints: DASHBOARD_ENDPOINTS },
  { name: 'Production Readiness', tag: 'Production Readiness', basePath: '/api/production-readiness', endpoints: PRODUCTION_READINESS_ENDPOINTS },
];

const baseProperty = (name: string, type: string, required: boolean, example?: unknown, nullable = false): PropertyDefinition => ({
  name, type, required, example, nullable,
});

export const BUILT_IN_DTOS: DtoDefinition[] = [
  {
    name: 'HealthCheckResult',
    description: 'Health check result with dependency status',
    properties: [
      baseProperty('status', 'string', true, 'ok'),
      baseProperty('timestamp', 'string', true, '2025-01-15T12:00:00.000Z'),
      baseProperty('checks', 'object', true),
    ],
  },
  {
    name: 'CreateWorkflowDto',
    description: 'Request body for creating a new workflow',
    properties: [
      baseProperty('type', 'string', true, 'single_stock_analysis'),
      baseProperty('symbol', 'string', false, 'THYAO', true),
      baseProperty('metadata', 'object', false, { source: 'manual' }, true),
    ],
  },
  {
    name: 'WorkflowListQueryDto',
    description: 'Query parameters for listing workflows',
    properties: [
      baseProperty('status', 'string', false, 'running'),
      baseProperty('type', 'string', false, 'single_stock_analysis'),
    ],
  },
  {
    name: 'WorkflowHistoryQueryDto',
    description: 'Query parameters for workflow history',
    properties: [
      baseProperty('type', 'string', false, 'single_stock_analysis'),
      baseProperty('status', 'string', false, 'completed'),
      baseProperty('limit', 'integer', false, 50),
    ],
  },
  {
    name: 'SetValueDto',
    description: 'Request body for setting a configuration value',
    properties: [
      baseProperty('key', 'string', true, 'rsiPeriod'),
      baseProperty('value', 'string', true, 14),
      baseProperty('user', 'string', false, 'admin', true),
      baseProperty('comment', 'string', false, 'Updated RSI period', true),
    ],
  },
  {
    name: 'CreateProfileDto',
    description: 'Request body for creating a configuration profile',
    properties: [
      baseProperty('name', 'string', true, 'custom'),
      baseProperty('label', 'string', true, 'My Custom Profile'),
      baseProperty('description', 'string', false, 'Custom configuration', true),
    ],
  },
  {
    name: 'DuplicateProfileDto',
    description: 'Request body for duplicating a configuration profile',
    properties: [
      baseProperty('newName', 'string', true, 'custom-v2'),
      baseProperty('newLabel', 'string', false, 'My Custom Profile v2', true),
    ],
  },
  {
    name: 'CreateSnapshotDto',
    description: 'Request body for creating a configuration snapshot',
    properties: [
      baseProperty('comment', 'string', false, 'Before changes', true),
      baseProperty('user', 'string', false, 'admin', true),
    ],
  },
  {
    name: 'FinancialAnalysisInputDto',
    description: 'Financial data input for analysis',
    properties: [
      baseProperty('priceToBook', 'number', true, 1.2, true),
      baseProperty('enterpriseValueToEBITDA', 'number', true, 8, true),
      baseProperty('netProfit', 'number', true, 32000000000, true),
      baseProperty('netProfitPrevious', 'number', true, 25000000000, true),
      baseProperty('equity', 'number', true, 180000000000, true),
      baseProperty('equityPrevious', 'number', true, 160000000000, true),
      baseProperty('totalDebt', 'number', true, 95000000000, true),
      baseProperty('totalAssets', 'number', true, 275000000000, true),
      baseProperty('sector', 'string', false, 'Ulaştırma', true),
      baseProperty('sectorAverages', 'object', false, { priceToBook: 1.5 }, true),
    ],
  },
  {
    name: 'HistoryQueryDto',
    description: 'Query parameters for historical market data',
    properties: [
      baseProperty('timeframe', 'string', true, '1d'),
      baseProperty('from', 'string', false, '2025-01-01'),
      baseProperty('to', 'string', false, '2025-06-01'),
    ],
  },
  {
    name: 'TechnicalAnalysisInputDto',
    description: 'Query parameters for technical analysis',
    properties: [
      baseProperty('timeframe', 'string', false, '1d'),
    ],
  },
  {
    name: 'AnalysisQueryDto',
    description: 'Query parameters for analysis pipeline',
    properties: [
      baseProperty('timeframe', 'string', false, '1d'),
    ],
  },
  {
    name: 'ScannerQueryDto',
    description: 'Query parameters for scanner endpoints',
    properties: [
      baseProperty('offset', 'integer', false, 0),
      baseProperty('limit', 'integer', false, 10),
      baseProperty('sortBy', 'string', false, 'compositeScore'),
      baseProperty('sortDir', 'string', false, 'desc'),
    ],
  },
  {
    name: 'JobsQueryDto',
    description: 'Query parameters for queue jobs',
    properties: [
      baseProperty('limit', 'integer', false, 50),
      baseProperty('offset', 'integer', false, 0),
      baseProperty('state', 'string', false, 'WAITING'),
      baseProperty('priority', 'string', false, 'NORMAL'),
    ],
  },
  {
    name: 'HistoryQueryDto2',
    description: 'Query parameters for event history',
    properties: [
      baseProperty('limit', 'integer', false, 50),
      baseProperty('offset', 'integer', false, 0),
      baseProperty('category', 'string', false, 'system'),
      baseProperty('type', 'string', false, 'scheduler.started'),
    ],
  },
  {
    name: 'ProviderHistoryQueryDto',
    description: 'Query parameters for provider history',
    properties: [
      baseProperty('limit', 'integer', false, 50),
      baseProperty('offset', 'integer', false, 0),
    ],
  },
  {
    name: 'HistoryQueryDto3',
    description: 'Query parameters for configuration history',
    properties: [
      baseProperty('limit', 'integer', false, 50),
      baseProperty('offset', 'integer', false, 0),
    ],
  },
];

export const BUILT_IN_ENUMS: EnumDefinition[] = [
  { name: 'Timeframe', values: TIMEFRAME_ENUM, description: 'Data timeframe options' },
  { name: 'WorkflowType', values: WORKFLOW_TYPES, description: 'Available workflow types' },
  { name: 'WorkflowStatus', values: WORKFLOW_STATUSES, description: 'Workflow execution statuses' },
  { name: 'JobName', values: JOB_NAMES, description: 'Scheduled job names' },
  { name: 'QueuePriority', values: QUEUE_PRIORITIES, description: 'Queue job priority levels' },
  { name: 'QueueState', values: QUEUE_STATES, description: 'Queue job states' },
  { name: 'ConfigDomain', values: CONFIG_DOMAINS, description: 'Configuration domains' },
  { name: 'MetricCategory', values: METRIC_CATEGORIES, description: 'Performance metric categories' },
  { name: 'ProviderName', values: PROVIDER_NAMES, description: 'Market data provider names' },
  { name: 'EventCategory', values: EVENT_CATEGORIES, description: 'Event bus categories' },
  { name: 'ChecklistPhase', values: CHECKLIST_PHASES, description: 'Deployment checklist phases' },
  { name: 'ScannerSortField', values: SCANNER_SORT_FIELDS, description: 'Scanner sort fields' },
  { name: 'SortDirection', values: ['asc', 'desc'], description: 'Sort direction' },
  { name: 'HealthStatus', values: ['ok', 'error', 'degraded'], description: 'Health check status' },
  { name: 'RuleStatus', values: ['PASS', 'WARNING', 'FAIL', 'NOT_AVAILABLE'], description: 'Rule evaluation status' },
  { name: 'FinancialGrade', values: ['A+', 'A', 'B', 'C', 'D'], description: 'Financial analysis grade' },
  { name: 'TechnicalGrade', values: ['A+', 'A', 'B', 'C', 'D'], description: 'Technical analysis grade' },
  { name: 'EliteRating', values: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'], description: 'Elite score rating' },
  { name: 'OpportunityLevel', values: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'NONE'], description: 'Opportunity level' },
  { name: 'ScannerStatus', values: ['TOP_CANDIDATE', 'WATCHLIST', 'REJECTED'], description: 'Scanner classification status' },
  { name: 'TrendDirection', values: ['uptrend', 'downtrend', 'sideways'], description: 'Market trend direction' },
  { name: 'SmartMoneyActivity', values: ['accumulating', 'distributing', 'neutral'], description: 'Smart money activity type' },
  { name: 'SwingPointType', values: ['high', 'low'], description: 'Swing point type' },
  { name: 'ValidationStatus', values: ['valid', 'partial', 'invalid'], description: 'Data validation status' },
  { name: 'JobStatus', values: ['idle', 'running', 'completed', 'failed', 'disabled'], description: 'Scheduler job status' },
];

export const TAG_DESCRIPTIONS: Record<string, string> = {
  'Health': 'System health, readiness, liveness, and application metrics',
  'Market Data': 'Market data retrieval, historical prices, provider management',
  'Financial Analysis': 'Financial rule evaluation, scoring, and analysis',
  'Technical Analysis': 'Technical indicator calculation, rules, scoring, and market structure',
  'Analysis': 'Full analysis pipeline orchestrating technical, financial, smart money, and opportunity analysis',
  'Scanner': 'Market scanning, candidate ranking, watchlist, and statistics',
  'Scheduler': 'Scheduled job management, execution, and monitoring',
  'Workflows': 'Workflow lifecycle management — creation, execution, cancellation, and retry',
  'Workflow Queue': 'Priority queue for workflow job scheduling, workers, and dead-letter management',
  'Performance Monitor': 'System performance metrics, cache statistics, and health monitoring',
  'Provider Health Monitor': 'Market data provider health tracking, reliability scoring, and request history',
  'Events': 'Event bus history, statistics, filtering, and management',
  'Configuration': 'System configuration management, profiles, snapshots, and history',
  'Dashboard': 'Dashboard configuration, filters, notifications, timeline, and reports',
  'Production Readiness': 'Production readiness checks, deployment checklists, backups, and release management',
};
