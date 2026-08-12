import { API_BASE_URL } from './constants';
import { getAuthHeaders } from './auth';
import type {
  HistoricalAllSymbolsReport,
  HistoricalBackfillAllResult,
  HistoricalBackfillInfo,
  HistoricalBackfillResult,
  HistoricalGapReport,
  HistoricalQuality,
  SymbolHistoricalStatus,
} from '@/components/history/history-types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  return rawRequest<T>(url, options);
}

async function rawRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'Bilinmeyen hata');
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const sdkClient = {
  health: () => sdk.health.check(),
  healthStatus: () => sdk.health.authStatus(),
  healthMetrics: () => sdk.health.metrics(),
  technicalAnalysis: (symbol: string, timeframe: string = '1d') => sdk.technicalAnalysis.analyze(symbol, timeframe),
  financialRules: (symbol: string) => sdk.financialRules.analyze(symbol),
  scanner: () => sdk.scanner.getResult(),
  scannerCandidates: (offset = 0, limit = 10) => sdk.scanner.getTopCandidates(offset, limit),
  configuration: () => sdk.configuration.getDomains(),
  configurationGetDomain: (domain: string) => sdk.configuration.getDomain(domain),
  configurationUpdateValue: (domain: string, key: string, value: unknown) => sdk.configuration.updateValue(domain, key, value),
  performanceMonitor: () => sdk.performanceMonitor.getSnapshot(),
  providerHealth: () => sdk.providerHealth.getStatus(),
  providerHistory: (provider: string) => sdk.providerHealth.getHistory(provider),
  analysis: (symbol: string, timeframe: string = '1d') => sdk.analysis.analyze(symbol, timeframe),
  analysisFinancial: (symbol: string, timeframe: string = '1d') => sdk.analysis.financial(symbol, timeframe),
  analysisTechnical: (symbol: string, timeframe: string = '1d') => sdk.analysis.technical(symbol, timeframe),
  analysisSmartMoney: (symbol: string, timeframe: string = '1d') => sdk.analysis.smartMoney(symbol, timeframe),
  analysisOpportunity: (symbol: string, timeframe: string = '1d') => sdk.analysis.opportunity(symbol, timeframe),
  analysisEliteScore: (symbol: string, timeframe: string = '1d') => sdk.analysis.eliteScore(symbol, timeframe),
  workflows: () => sdk.workflow.list(),
  workflowsHistory: () => sdk.workflow.history(),
  workflowsStats: () => sdk.workflow.statistics(),
  workflowsCreate: (type: string, symbol: string) => sdk.workflow.create(type, symbol),
  eventBus: (limit?: number) => sdk.eventBus.getEvents(limit),
  eventBusStats: () => sdk.eventBus.getStats(),
  workflowQueue: (limit?: number) => sdk.workflowQueue.getJobs(limit),
  workflowQueueStatus: () => sdk.workflowQueue.getStatus(),
  workflowQueueStats: () => sdk.workflowQueue.getStatistics(),
  diagnostics: () => sdk.health.check(),
  auditLog: () => Promise.reject(new Error('Audit log endpoint is not available on the backend yet')),
  schedulerStatus: () => sdk.scheduler.getStatus(),
  schedulerJobs: () => sdk.scheduler.getJobs(),
  schedulerTrigger: (name: string) => sdk.scheduler.triggerJob(name),
  backtestCreate: (symbol: string) => sdk.workflow.create('backtest', symbol),
  backtestWorkflows: () => sdk.workflow.list(),
  backtestHistory: () => sdk.workflow.history(),
  backtestStats: () => sdk.workflow.statistics(),
  marketData: (symbol: string) => sdk.marketData.getLatestPrice(symbol),
  marketDataHistorical: (symbol: string, timeframe: string) => sdk.marketData.getHistoricalData(symbol, timeframe),
  marketDataTimeframes: () => sdk.marketData.getTimeframes(),
  marketDataProviders: () => sdk.marketData.getProviders(),
  aiChat: (message: string) => sdk.ai.chat(message),
  aiReport: (symbol: string, timeframe?: string) => sdk.ai.report(symbol, timeframe),
  aiReportMarkdown: (symbol: string, timeframe?: string) => sdk.ai.reportMarkdown(symbol, timeframe),
  aiAdvisor: (portfolioId?: string) => sdk.ai.advisor(portfolioId),
  aiSuggestions: () => sdk.ai.suggestions(),
  historyStatus: (timeframe?: string) => sdk.marketDataHistory.statusAll(timeframe),
  historySymbolStatus: (symbol: string, timeframe?: string) => sdk.marketDataHistory.status(symbol, timeframe),
  historyGaps: (symbol: string, timeframe?: string, from?: string, to?: string) => sdk.marketDataHistory.gaps(symbol, timeframe, from, to),
  historyQuality: (symbol: string, timeframe?: string) => sdk.marketDataHistory.quality(symbol, timeframe),
  historyBackfill: (symbol: string, body: Record<string, unknown>) => sdk.marketDataHistory.backfill(symbol, body),
  historyBackfillBulk: (body: Record<string, unknown>) => sdk.marketDataHistory.backfillBulk(body),
  historyBackfillStatus: (symbol: string, timeframe?: string) => sdk.marketDataHistory.backfillStatus(symbol, timeframe),
  multiMarket: () => sdk.multiMarket.getMetadata(),
  multiMarketExchanges: () => sdk.multiMarket.getExchanges(),
  multiMarketSectors: (exchange?: string) => sdk.multiMarket.getSectors(exchange),
  macro: () => sdk.macro.getDashboard(),
  macroEliteScore: () => sdk.macro.getEliteScore(),
  macroTrend: () => sdk.macro.getTrend(),
  macroRecommendation: () => sdk.macro.getRecommendation(),
  macroAlerts: () => sdk.macro.getAlerts(),
  pipelineStatus: () => sdk.pipeline.getStatus(),
  pipelineMetrics: () => sdk.pipeline.getMetrics(),
  pipelineRun: () => sdk.pipeline.run(),
  productionReadiness: () => sdk.productionReadiness.getReport(),
  portfolio: () => sdk.portfolio.list(),
  portfolioMetrics: () => sdk.portfolio.metrics(),
  portfolioGet: (id: string) => sdk.portfolio.get(id),
  portfolioSummary: (id: string) => sdk.portfolio.summary(id),
  portfolioPositions: (id: string) => sdk.portfolio.positions(id),
  portfolioTransactions: (id: string) => sdk.portfolio.transactions(id),
  portfolioRisk: (id: string) => sdk.portfolio.risk(id),
  portfolioAllocation: (id: string) => sdk.portfolio.allocation(id),
  portfolioPerformance: (id: string, period?: string) => sdk.portfolio.performance(id, period),
  portfolioReport: (id: string) => sdk.portfolio.report(id),
  portfolioCreate: (input: Record<string, unknown>) => sdk.portfolio.create(input),
  portfolioExecuteTransaction: (id: string, input: Record<string, unknown>) => sdk.portfolio.executeTransaction(id, input),
  portfolioIntelligenceAnalysis: () => sdk.portfolioIntelligence.analysis(),
  portfolioIntelligencePositions: () => sdk.portfolioIntelligence.positions(),
  portfolioIntelligenceOpportunities: () => sdk.portfolioIntelligence.opportunities(),
  portfolioIntelligenceRisk: () => sdk.portfolioIntelligence.risk(),
  portfolioIntelligenceRebalance: () => sdk.portfolioIntelligence.rebalance(),
  portfolioIntelligenceScenarios: () => sdk.portfolioIntelligence.scenarios(),
  portfolioIntelligenceHistory: () => sdk.portfolioIntelligence.history(),
  portfolioIntelligenceLearning: () => sdk.portfolioIntelligence.learning(),
  portfolioIntelligenceAddPosition: (input: Record<string, unknown>) => sdk.portfolioIntelligence.addPosition(input),
  portfolioIntelligenceUpdatePosition: (ticker: string, input: Record<string, unknown>) => sdk.portfolioIntelligence.updatePosition(ticker, input),
  portfolioIntelligenceRemovePosition: (ticker: string) => sdk.portfolioIntelligence.removePosition(ticker),
  portfolioIntelligenceRefresh: () => sdk.portfolioIntelligence.refresh(),
  watchlist: () => sdk.watchlist.list(),
  watchlistSymbols: () => sdk.watchlist.symbols(),
  watchlistGet: (name: string) => sdk.watchlist.get(name),
  watchlistAdd: (name: string, symbol: string) => sdk.watchlist.add(name, symbol),
  watchlistRemove: (name: string, symbol: string) => sdk.watchlist.remove(name, symbol),
  alerts: (limit?: number, offset?: number) => sdk.alerts.getHistory(limit, offset),
  alertsMetrics: () => sdk.alerts.getMetrics(),
  alertsAcknowledge: (id: string) => sdk.alerts.acknowledge(id),
  alertsDismiss: (id: string) => sdk.alerts.dismiss(id),
  researchIntelligence: () => sdk.researchIntelligence.getDashboard(),
  researchIntelligenceCompany: (ticker: string) => sdk.researchIntelligence.getCompany(ticker),
  researchIntelligenceProviders: () => sdk.researchIntelligence.getProviders(),
  researchIntelligenceRefresh: () => sdk.researchIntelligence.refresh(),
  earlyOpportunities: (limit = 10) => sdk.earlyOpportunities.list(limit),
};

export const sdk = {
  health: {
    check: () =>
      rawRequest<{
        status: string;
        version: string;
        uptime: number;
        timestamp: string;
        components: Array<{ name: string; status: string; message: string; duration: number }>;
      }>('/health'),
    authStatus: () =>
      request<{ authEnabled: boolean; allowAnonymous: boolean; featureFlags: string[]; timestamp: string }>('/auth/status'),
    metrics: () => request<Record<string, unknown>>('/metrics'),
  },

  earlyOpportunities: {
    list: (limit = 10) =>
      request<{
        results: Array<{
          ticker: string;
          company: string;
          sector: string;
          earlyOpportunityScore: number;
          confidence: number;
          expectedReturn: number;
          trendStage: string | null;
          decision: {
            decisionScore: number;
            decisionStatus: string;
            statusLabel: string;
            earlyOpportunity: boolean;
            convergence: number;
            confidence: number;
            trendStage: string | null;
            timeframeAgreement: number;
            explanation: string;
          } | null;
        }>;
        total: number;
        generatedAt: string;
      }>(`/early-opportunities?limit=${limit}&earlyOpportunityOnly=true`),
  },

  marketData: {
    getLatestPrice: (symbol: string) =>
      request<{ symbol: string; price: number; change: number; changePercent: number; volume: number; timestamp: string }>(
        `/market-data/${symbol}/latest`,
      ),
    getHistoricalData: (symbol: string, timeframe: string) =>
      request<{ success: boolean; data: Array<{ timestamp: string; open: number; high: number; low: number; close: number; volume: number }>; total: number; timestamp: string }>(
        `/market-data/${symbol}/history?timeframe=${timeframe}`,
      ),
    getTimeframes: () => request<{ success: boolean; data: string[]; timestamp: string }>('/market-data/timeframes'),
    getProviders: () => request<{ success: boolean; data: Array<{ name: string; healthy: boolean }>; timestamp: string }>('/market-data/providers'),
  },

  marketDataHistory: {
    statusAll: (timeframe?: string) =>
      request<HistoricalAllSymbolsReport>(`/market-data/history/status${timeframe ? `?timeframe=${timeframe}` : ''}`),
    status: (symbol: string, timeframe?: string) =>
      request<SymbolHistoricalStatus>(`/market-data/history/${encodeURIComponent(symbol)}/status${timeframe ? `?timeframe=${timeframe}` : ''}`),
    gaps: (symbol: string, timeframe?: string, from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (timeframe) params.set('timeframe', timeframe);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return request<HistoricalGapReport>(`/market-data/history/${encodeURIComponent(symbol)}/gaps${qs ? `?${qs}` : ''}`);
    },
    quality: (symbol: string, timeframe?: string) =>
      request<HistoricalQuality>(`/market-data/history/${encodeURIComponent(symbol)}/quality${timeframe ? `?timeframe=${timeframe}` : ''}`),
    backfill: (symbol: string, body: Record<string, unknown>) =>
      request<HistoricalBackfillResult>(`/market-data/history/${encodeURIComponent(symbol)}/backfill`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    backfillBulk: (body: Record<string, unknown>) =>
      request<HistoricalBackfillAllResult>('/market-data/history/backfill', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    backfillStatus: (symbol: string, timeframe?: string) =>
      request<HistoricalBackfillInfo>(`/market-data/history/${encodeURIComponent(symbol)}/backfill/status${timeframe ? `?timeframe=${timeframe}` : ''}`),
  },

  technicalAnalysis: {
    analyze: (symbol: string, timeframe: string = '1d') =>
      request<{
        symbol: string;
        timeframe: string;
        indicators: Record<string, unknown>;
        rules: Array<{ name: string; category: string; status: string; message: string }>;
        score: number;
        summary: string;
        success: boolean;
        timestamp: string;
      }>(`/technical-analysis/${symbol}?timeframe=${timeframe}`),
  },

  financialRules: {
    analyze: (symbol: string) =>
      request<{
        symbol: string;
        score: number;
        grade: string;
        confidence: number;
        rules: Array<{ name: string; status: string; message: string }>;
        strengths: string[];
        weaknesses: string[];
        risks: string[];
        summary: string;
        overallOpinion: string;
        timestamp: string;
      }>(`/financial-analysis/${symbol}`),
  },

  scanner: {
    getResult: () =>
      request<{
        success: boolean;
        topCandidates: Array<{
          symbol: string;
          status: string;
          eliteScore: number;
          compositeScore: number;
          rank: number;
          reasons: string[];
        }>;
        watchlist: Array<{ symbol: string; status: string; eliteScore: number; compositeScore: number; rank: number; reasons: string[] }>;
        rejected: Array<{ symbol: string; status: string; eliteScore: number; compositeScore: number; rank: number; reasons: string[] }>;
        statistics: {
          totalSymbols: number;
          topCandidateCount: number;
          watchlistCount: number;
          rejectedCount: number;
          avgEliteScore: number;
          avgOpportunityScore: number;
          avgCandidateScore: number;
          scoreDistribution: Record<string, number>;
        };
        metadata: Record<string, unknown>;
        timestamp: string;
      }>('/scanner'),
    getTopCandidates: (offset = 0, limit = 10) =>
      request<{
        success: boolean;
        data: {
          items: Array<{ symbol: string; status: string; eliteScore: number; compositeScore: number; rank: number; reasons: string[] }>;
          total: number;
          offset: number;
          limit: number;
        };
        timestamp: string;
      }>(`/scanner/top?offset=${offset}&limit=${limit}`),
    getWatchlist: (offset = 0, limit = 20) =>
      request<{ success: boolean; data: { items: Array<{ symbol: string; eliteScore: number; rank: number }>; total: number } }>(
        `/scanner/watchlist?offset=${offset}&limit=${limit}`,
      ),
    getRejected: (offset = 0, limit = 50) =>
      request<{ success: boolean; data: { items: Array<{ symbol: string; eliteScore: number; rank: number }>; total: number } }>(
        `/scanner/rejected?offset=${offset}&limit=${limit}`,
      ),
    getStatistics: () =>
      request<{ totalSymbols: number; topCandidateCount: number; watchlistCount: number; rejectedCount: number }>('/scanner/statistics'),
  },

  scheduler: {
    getStatus: () =>
      request<{
        success: boolean;
        running: boolean;
        jobs: Array<{
          jobName: string;
          status: string;
          enabled: boolean;
          intervalMs: number;
          lastExecution: { jobName: string; startedAt: string; completedAt: string | null; durationMs: number; success: boolean; error: string | null; metadata: Record<string, unknown> } | null;
          totalExecutions: number;
          consecutiveFailures: number;
        }>;
        uptime: number;
        totalExecutions: number;
        timestamp: string;
      }>('/scheduler'),
    getJobs: () => sdk.scheduler.getStatus(),
    getJobState: (jobName: string) =>
      request<{ jobName: string; status: string; enabled: boolean; intervalMs: number; lastExecution: unknown | null; totalExecutions: number; consecutiveFailures: number }>(
        `/scheduler/${jobName}`,
      ),
    triggerJob: (name: string) =>
      request<{ success: boolean; jobName: string; executionSuccess: boolean; durationMs: number; error: string | null; timestamp: string }>(
        `/scheduler/${name}/execute`,
        { method: 'POST' },
      ),
    start: () => request<{ success: boolean; timestamp: string }>('/scheduler/start', { method: 'POST' }),
    stop: () => request<{ success: boolean; timestamp: string }>('/scheduler/stop', { method: 'POST' }),
    enable: (jobName: string) => request<{ jobName: string; status: string; enabled: boolean }>(`/scheduler/${jobName}/enable`, { method: 'POST' }),
    disable: (jobName: string) => request<{ jobName: string; status: string; enabled: boolean }>(`/scheduler/${jobName}/disable`, { method: 'POST' }),
    getJobHistory: (jobName: string, limit = 50) =>
      request<Array<{ jobName: string; startedAt: string; completedAt: string | null; durationMs: number; success: boolean; error: string | null }>>(
        `/scheduler/${jobName}/history?limit=${limit}`,
      ),
  },

  configuration: {
    getDomains: () =>
      request<{
        success: boolean;
        data: { totalDomains: number; domains: Record<string, Record<string, unknown>>; version: number };
        timestamp: string;
      }>('/configuration'),
    getDomain: (domain: string) =>
      request<{ success: boolean; data: { domain: string; config: Record<string, unknown> }; timestamp: string }>(`/configuration/${domain}`),
    updateValue: (domain: string, key: string, value: unknown) =>
      request<{ success: boolean; message: string; version: number; timestamp: string }>(`/configuration/${domain}/value`, {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      }),
  },

  performanceMonitor: {
    getSnapshot: () =>
      request<{
        success: boolean;
        data: {
          metrics: Array<{
            name: string;
            category: string;
            count: number;
            min: number;
            max: number;
            avg: number;
            p50: number;
            p95: number;
            p99: number;
            lastValue: number;
            lastTimestamp: number;
            rollingAvg: number;
          }>;
          system: {
            memoryUsageBytes: number;
            heapUsedBytes: number;
            heapTotalBytes: number;
            externalBytes: number;
            uptimeMs: number;
            cpuUsagePercent: number;
            rssBytes: number;
          };
          cache: { hits: number; misses: number; hitRate: number; totalOperations: number };
          health: { status: string; timestamp: string };
          totalRecorded: number;
          timestamp: string;
        };
        timestamp: string;
      }>('/performance'),
    getStats: () => sdk.performanceMonitor.getSnapshot(),
  },

  providerHealth: {
    getStatus: () =>
      request<{
        success: boolean;
        data: {
          providers: Array<{
            provider: string;
            status: string;
            totalRequests: number;
            successfulRequests: number;
            failedRequests: number;
            timeoutCount: number;
            consecutiveFailures: number;
            lastFailureTime: number | null;
            lastSuccessTime: number | null;
            lastRequestTime: number | null;
            recoveryTimeMs: number | null;
            avgLatencyMs: number;
            reliabilityScore: number;
            successRate: number;
            errorRate: number;
            uptime: number;
          }>;
          overallStatus: string;
          totalProviders: number;
          healthyCount: number;
          degradedCount: number;
          unhealthyCount: number;
          timestamp: string;
        };
        timestamp: string;
      }>('/providers/health'),
    getHistory: (provider: string) =>
      request<{ success: boolean; data: { requests: Array<{ timestamp: number; latencyMs: number; success: boolean; isTimeout: boolean; error?: string }>; total: number }; timestamp: string }>(
        `/providers/history/${provider}`,
      ),
    getProvider: (provider: string) => request<Record<string, unknown>>(`/providers/health/${provider}`),
    resetAll: () => request<{ success: boolean; message: string; timestamp: string }>('/providers/reset', { method: 'POST' }),
  },

  eventBus: {
    getEvents: (limit?: number) =>
      request<{
        success: boolean;
        data: { events: Array<{ id: string; type: string; timestamp: number; correlationId: string | null; source: string; severity: string; category: string; payload: unknown; metadata: Record<string, unknown> }>; total: number; limit: number; offset: number };
        timestamp: string;
      }>(`/v1/events${limit ? `?limit=${limit}` : ''}`),
    getStats: () =>
      request<{ success: boolean; data: Record<string, number | Record<string, number>>; timestamp: string }>('/v1/events/statistics'),
    getTypes: () => request<{ success: boolean; data: Array<{ type: string; count: number }>; timestamp: string }>('/v1/events/types'),
  },

  workflowQueue: {
    getJobs: (limit?: number, offset = 0) =>
      request<{
        success: boolean;
        data: { jobs: Array<{ id: string; workflowId: string; state: string; priority: string; createdAt: string }>; total: number; limit: number; offset: number };
        timestamp: string;
      }>(`/v1/queue/jobs?limit=${limit ?? 50}&offset=${offset}`),
    getStatus: () =>
      request<{ success: boolean; data: { statistics: Record<string, number>; waitingJobs: unknown[]; runningJobs: unknown[]; deadLetterJobs: unknown[]; workers: Array<{ id: number; busy: boolean; jobId: string | null; startedAt: string | null }>; timestamp: string }; timestamp: string }>(
        '/v1/queue',
      ),
    getStatistics: () => request<{ success: boolean; data: Record<string, number>; timestamp: string }>('/v1/queue/statistics'),
  },

  diagnostics: {
    run: () => sdk.health.check(),
    getModules: () => Promise.resolve({ modules: [] }),
  },

  auditLog: {
    getLogs: () => Promise.resolve({ logs: [] }),
  },

  analysis: {
    analyze: (symbol: string, timeframe: string = '1d') =>
      request<{
        success: boolean;
        symbol: string;
        timeframe: string;
        indicators: Record<string, unknown>;
        marketStructure: Record<string, unknown>;
        smartMoney: Record<string, unknown>;
        technicalRules: Record<string, unknown>;
        technicalScore: Record<string, unknown>;
        technicalSummary: Record<string, unknown>;
        financialRules: { rules: Array<{ name: string; status: string; message: string }> };
        financialScore: Record<string, unknown>;
        financialSummary: Record<string, unknown>;
        confluence: Record<string, unknown>;
        opportunity: Record<string, unknown>;
        eliteScore: Record<string, unknown>;
        pipelineSteps: Array<{ step: string; durationMs: number; success: boolean }>;
        metadata: { totalDurationMs: number; stepsCompleted: number; stepsSuccessful: number };
        timestamp: string;
      }>(`/analysis/${symbol}?timeframe=${timeframe}`),

    financial: (symbol: string, timeframe: string = '1d') =>
      request<{ success: boolean; symbol: string; score: number; rules: Array<{ name: string; status: string; message: string }>; summary: string }>(
        `/analysis/${symbol}/financial?timeframe=${timeframe}`,
      ),
    technical: (symbol: string, timeframe: string = '1d') =>
      request<{ success: boolean; symbol: string; score: number; rules: Array<{ name: string; category: string; status: string; message: string }>; summary: string }>(
        `/analysis/${symbol}/technical?timeframe=${timeframe}`,
      ),
    smartMoney: (symbol: string, timeframe: string = '1d') =>
      request<{ success: boolean; symbol: string; smartMoney: Record<string, unknown> }>(
        `/analysis/${symbol}/smart-money?timeframe=${timeframe}`,
      ),
    opportunity: (symbol: string, timeframe: string = '1d') =>
      request<{ success: boolean; symbol: string; opportunity: Record<string, unknown> }>(
        `/analysis/${symbol}/opportunity?timeframe=${timeframe}`,
      ),
    eliteScore: (symbol: string, timeframe: string = '1d') =>
      request<{ success: boolean; symbol: string; eliteScore: Record<string, unknown> }>(
        `/analysis/${symbol}/elite-score?timeframe=${timeframe}`,
      ),
  },

  ai: {
    chat: (message: string) =>
      request<{ answer: string; sources: Array<{ name: string; type: string; confidence: number }>; suggestions: string[]; context: Record<string, unknown> }>(
        '/ai/chat', { method: 'POST', body: JSON.stringify({ message }) },
      ),
    report: (symbol: string, timeframe: string = '1d') =>
      request<{ report: Record<string, unknown> }>(`/ai/report?symbol=${symbol}&timeframe=${timeframe}`),
    reportMarkdown: (symbol: string, timeframe: string = '1d') =>
      request<{ markdown: string }>(`/ai/report/markdown?symbol=${symbol}&timeframe=${timeframe}`),
    advisor: (portfolioId?: string) =>
      request<Array<Record<string, unknown>>>(`/ai/advisor${portfolioId ? `?portfolioId=${portfolioId}` : ''}`, { method: 'POST' }),
    suggestions: () =>
      request<Record<string, string[]>>('/ai/suggestions'),
  },

  auth: {
    login: (email: string, password: string) =>
      request<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        user: { userId: string; email: string; roles: string[] };
      }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request<Record<string, unknown>>('/auth/me'),
  },

  multiMarket: {
    getMetadata: () => request<Record<string, unknown>>('/markets'),
    getExchanges: () => request<Array<Record<string, unknown>>>('/markets/exchanges'),
    getExchange: (code: string) => request<Record<string, unknown>>(`/markets/exchanges/${code}`),
    getCurrencies: () => request<Array<Record<string, unknown>>>('/markets/currencies'),
    getSectors: (exchange?: string) =>
      request<Record<string, string[]>>(`/markets/sectors${exchange ? `/${exchange}` : ''}`),
  },

  workflow: {
    list: () => request<{ data: Array<{ id: string; type: string; status: string; symbol: string; steps: Array<{ step: string; status: string; startedAt?: string; completedAt?: string; durationMs?: number; error?: string | null }>; currentStep: string; progress: number; startedAt?: string; completedAt?: string; durationMs?: number; createdAt: string }>; total: number; timestamp: string }>('/workflows'),
    history: () => request<{ data: Array<{ id: string; type: string; status: string; symbol: string; durationMs?: number; createdAt: string }>; total: number; timestamp: string }>('/workflows/history'),
    statistics: () => request<{ success: boolean; totalCreated: number; totalCompleted: number; totalFailed: number; totalCancelled: number; totalTimedOut: number; activeWorkflows: number; avgDurationMs: number; byType: Record<string, { created: number; completed: number; failed: number }>; timestamp: string }>('/workflows/statistics'),
    create: (type: string, symbol: string) =>
      request<{ success: boolean; data: { id: string; type: string; status: string; symbol: string; createdAt: string }; timestamp: string }>('/workflows', {
        method: 'POST',
        body: JSON.stringify({ type, symbol }),
      }),
  },

  macro: {
    getDashboard: () => request<Record<string, unknown>>('/macro/dashboard'),
    getEliteScore: () => request<Record<string, unknown>>('/macro/elite-score'),
    getTrend: () => request<Record<string, unknown>>('/macro/trend'),
    getRecommendation: () => request<Record<string, unknown>>('/macro/recommendation'),
    getAlerts: () => request<Record<string, unknown>>('/macro/alerts'),
    getOpportunities: (eliteScore = 75) => request<Record<string, unknown>>(`/macro/opportunities?eliteScore=${eliteScore}`),
    getRisk: () => request<Record<string, unknown>>('/macro/risk'),
  },

  pipeline: {
    getStatus: () => request<{ metrics: Record<string, unknown>; stepDurations: Record<string, number> }>('/pipeline/status'),
    getMetrics: () => request<Record<string, unknown>>('/pipeline/metrics'),
    run: () => request<Record<string, unknown>>('/pipeline/run', { method: 'POST' }),
    reset: () => request<{ status: string }>('/pipeline/reset', { method: 'POST' }),
  },

  productionReadiness: {
    getReport: () => request<Record<string, unknown>>('/production-readiness/report'),
    getHealth: () => request<Record<string, unknown>>('/production-readiness/health'),
    getConfig: () => request<Record<string, unknown>>('/production-readiness/config'),
  },

  portfolio: {
    list: () => request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>('/portfolio'),
    metrics: () => request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/metrics'),
    get: (id: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/${id}`),
    summary: (id: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/${id}/summary`),
    positions: (id: string) =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>(`/portfolio/${id}/positions`),
    transactions: (id: string) =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>(`/portfolio/${id}/transactions`),
    risk: (id: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/${id}/risk`),
    allocation: (id: string) =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>(`/portfolio/${id}/allocation`),
    performance: (id: string, period = 'MONTHLY') =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(
        `/portfolio/${id}/performance?period=${period}`,
      ),
    report: (id: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/${id}/report`),
    create: (input: Record<string, unknown>) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    executeTransaction: (id: string, input: Record<string, unknown>) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/${id}/transactions`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },

  portfolioIntelligence: {
    analysis: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/analysis'),
    positions: () =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>('/portfolio/positions'),
    opportunities: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/opportunities'),
    risk: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/risk'),
    rebalance: () =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>('/portfolio/rebalance'),
    scenarios: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/scenarios'),
    history: () =>
      request<{ success: boolean; data: Array<Record<string, unknown>>; timestamp: string }>('/portfolio/history'),
    learning: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/learning'),
    addPosition: (input: Record<string, unknown>) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/position', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    updatePosition: (ticker: string, input: Record<string, unknown>) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/position/${ticker}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    removePosition: (ticker: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/portfolio/position/${ticker}`, {
        method: 'DELETE',
      }),
    refresh: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/portfolio/refresh', {
        method: 'POST',
      }),
  },

  watchlist: {
    list: () => request<{ success: boolean; data: { lists: Array<Record<string, unknown>> }; timestamp: string }>('/watchlist'),
    symbols: () => request<{ success: boolean; data: string[]; timestamp: string }>('/watchlist/symbols'),
    get: (name: string) =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>(`/watchlist/${name}`),
    add: (name: string, symbol: string) =>
      request<{ success: boolean; message: string; timestamp: string }>(`/watchlist/${name}/${symbol}`, {
        method: 'POST',
      }),
    remove: (name: string, symbol: string) =>
      request<{ success: boolean; message: string; timestamp: string }>(`/watchlist/${name}/${symbol}`, {
        method: 'DELETE',
      }),
  },

  alerts: {
    getHistory: (limit = 50, offset = 0) =>
      request<{
        success: boolean;
        data: {
          alerts: Array<{
            id: string;
            type: string;
            priority: string;
            title: string;
            message: string;
            symbol: string | null;
            channels: string[];
            status: string;
            createdAt: string;
            deliveredChannels: string[];
            failedChannels: string[];
            durationMs: number;
            timestamp: string;
          }>;
          total: number;
          limit: number;
          offset: number;
        };
        timestamp: string;
      }>(`/alerts?limit=${limit}&offset=${offset}`),
    getMetrics: () =>
      request<{ success: boolean; data: Record<string, unknown>; timestamp: string }>('/alerts/metrics'),
    acknowledge: (id: string) =>
      request<{ success: boolean; message: string; timestamp: string }>(`/alerts/${id}/acknowledge`, {
        method: 'POST',
      }),
    dismiss: (id: string) =>
      request<{ success: boolean; message: string; timestamp: string }>(`/alerts/${id}/dismiss`, {
        method: 'POST',
      }),
  },

  researchIntelligence: {
    getDashboard: () =>
      request<{
        researchScore: { score: number; grade: string; factors: Record<string, number> } | null;
        verifiedSources: number;
        latestResearch: Array<{
          id: string;
          source: string;
          sourceType: string;
          title: string;
          snippet?: string;
          url?: string;
          publishedAt?: string;
          ticker?: string;
          sector?: string;
          importance?: number;
          official: boolean;
        }>;
        catalysts: Array<{
          id: string;
          type: string;
          ticker?: string;
          sector?: string;
          title: string;
          statement: string;
          url?: string;
          source: string;
          importance: number;
          verification: string;
          detectedAt: string;
        }>;
        aiSummary: { summary: string; confidence: number; generatedAt: string; engine: string; sources: Array<{ title: string; url: string }> } | null;
        googleFinanceSummary: Record<string, unknown> | null;
        generatedAt: string;
        timestamp?: string;
      }>('/research/intelligence'),
    getCompany: (ticker: string) =>
      request<{
        ticker: string;
        companyName?: string;
        sector?: string;
        aggregator: { items: Array<Record<string, unknown>>; total: number; unique: number; duplicatesRemoved: number; bySourceType: Record<string, number> };
        score: { score: number; grade: string; factors: Record<string, number> } | null;
        verification: Array<Record<string, unknown>>;
        catalysts: Array<Record<string, unknown>>;
        aiSummary: Record<string, unknown> | null;
        googleFinance: Record<string, unknown> | null;
        generatedAt: string;
        timestamp?: string;
      }>(`/research/intelligence/${ticker}`),
    getProviders: () =>
      request<
        Array<{
          name: string;
          engine: string;
          connected: boolean;
          circuitState: string;
          latency: number;
          requests: number;
          errors: number;
          quota: { used: number; limit: number | null } | null;
          lastSync: string | null;
          cacheStatus: string;
        }>
      >('/research/intelligence/providers'),
    refresh: () =>
      request<{
        researchScore: Record<string, unknown> | null;
        catalysts: Array<Record<string, unknown>>;
        latestResearch: Array<Record<string, unknown>>;
        generatedAt: string;
        timestamp: string;
      }>('/research/intelligence/refresh', { method: 'POST' }),
  },
};
