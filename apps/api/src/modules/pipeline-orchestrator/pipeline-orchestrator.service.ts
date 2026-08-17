import { Injectable, Logger, Optional } from '@nestjs/common';
import { WorkflowEngine } from '../workflow/workflow.engine';
import { WorkflowInstance } from '../workflow/workflow.types';
import {
  PipelineContext,
  PipelineStepRecord,
  PipelineMetrics,
  PipelineOrchestratorConfig,
  DEFAULT_PIPELINE_ORCHESTRATOR_CONFIG,
} from './pipeline-orchestrator.types';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataValidationService } from '../market-data/market-data-validation.service';
import { AggregationEngine } from '../market-data/aggregation/aggregation-engine.service';
import { AggregatedResult } from '../market-data/aggregation/aggregation.types';
import { Company } from '../market-data/interfaces/unified-domain.types';
import { AnalysisService } from '../analysis-pipeline/analysis.service';
import { AnalysisResult as PipelineAnalysisResult } from '../analysis-pipeline/analysis-pipeline.types';
import { AiAnalysisPipeline } from '../ai-analysis/ai-analysis-pipeline.service';
import {
  AnalysisResult as AiAnalysisResult,
  PipelineInput as AiPipelineInput,
  ModuleResult as AiModuleResult,
  AnalysisSignal as AiAnalysisSignal,
  SupportingMetric as AiSupportingMetric,
} from '../ai-analysis/ai-analysis.types';
import { OpportunityDetectionEngine } from '../opportunity-detection/opportunity-detection-engine.service';
import { OpportunityResult } from '../opportunity-detection/opportunity-detection.types';
import { ScannerEngine } from '../scanner/scanner-engine.service';
import { ScannerResult, ScanMode } from '../scanner/scanner.types';
import { RankingEngine } from '../ranking/ranking-engine.service';
import { RankedOpportunity } from '../ranking/ranking.types';
import { AlertEngine } from '../alerts/engine/alert-engine.service';
import { AlertEvent } from '../alerts/alerts.types';
import { MacroService } from '../macro/macro.service';
import { PortfolioEngine } from '../portfolio/engine/portfolio-engine.service';
import { MarketDataPoint } from '../market-data/interfaces';
import { Timeframe } from '../indicators/indicator.types';
import { PipelineGateway } from '../websocket-gateway/websocket-gateway';

const BIST_SYMBOLS = [
  'AKBNK',
  'GARAN',
  'ISCTR',
  'YKBNK',
  'HALKB',
  'VAKBN',
  'EREGL',
  'KRDMD',
  'SISE',
  'SASA',
  'TUPRS',
  'PETKM',
  'THYAO',
  'PGSUS',
  'CLEBI',
  'BIMAS',
  'MGROS',
  'BIZIM',
  'KOZAL',
  'KOZAA',
  'ALARK',
  'DOAS',
  'TOASO',
  'FROTO',
  'TTKOM',
  'TCELL',
  'ASELS',
  'OTKAR',
  'TRAK',
  'SOKM',
  'GUBRF',
  'HEKTS',
  'AKSA',
  'BRSAN',
  'ISMEN',
  'KCHOL',
  'SAHOL',
  'TTRAK',
  'VESTL',
  'ZOREN',
  'TRCAS',
  'ENJSA',
  'ODAS',
  'TKFEN',
  'TSKB',
  'ALBRK',
  'SKBNK',
];

interface PipelineRunState {
  symbol?: string;
  timeframe: Timeframe;
  fetchedSymbols: string[];
  normalized: MarketDataPoint[];
  bySymbol: Map<string, MarketDataPoint[]>;
  aggregated: Array<{ symbol: string; company?: AggregatedResult<Company>; error?: string }>;
  analysisResults: AiAnalysisResult[];
  opportunities: OpportunityResult[];
  candidates: ScannerResult[];
  ranked: RankedOpportunity[];
  alerts: AlertEvent[];
  providerLatencies: number[];
  providerFailures: number;
  macroSnapshot: Record<string, unknown>;
}

@Injectable()
export class PipelineOrchestratorService {
  private readonly logger = new Logger(PipelineOrchestratorService.name);
  private readonly config: PipelineOrchestratorConfig;
  private readonly workflowStates = new WeakMap<WorkflowInstance, PipelineRunState>();

  private stepDurationsMs: Record<string, number> = {};
  private totalPipelineDurationMs = 0;
  private totalProviderFailures = 0;
  private macroUpdateTimestamp: string | null = null;
  private lastRanked: RankedOpportunity[] = [];
  private lastMacroData: Record<string, unknown> = {};
  private lastRunMetadata: Record<string, unknown> = {};
  private totalSteps = 0;
  private completedSteps = 0;
  private failedSteps = 0;
  private lastStepNames: string[] = [];
  private lastProviderAvgLatencyMs = 0;
  private lastSchedulerDurationMs = 0;
  private lastDashboardRefreshMs = 0;
  private lastCircuitBreakerStatus: Record<string, string> = {};
  private lastStartedAtMs = 0;

  constructor(
    @Optional() private readonly workflowEngine?: WorkflowEngine,
    @Optional() private readonly marketDataService?: MarketDataService,
    @Optional() private readonly aggregationEngine?: AggregationEngine,
    @Optional() private readonly analysisService?: AnalysisService,
    @Optional() private readonly aiAnalysisPipeline?: AiAnalysisPipeline,
    @Optional() private readonly opportunityDetectionEngine?: OpportunityDetectionEngine,
    @Optional() private readonly scannerEngine?: ScannerEngine,
    @Optional() private readonly rankingEngine?: RankingEngine,
    @Optional() private readonly alertEngine?: AlertEngine,
    @Optional() private readonly macroService?: MacroService,
    @Optional() private readonly portfolioEngine?: PortfolioEngine,
    @Optional() config?: Partial<PipelineOrchestratorConfig>,
    @Optional() private readonly marketDataValidationService?: MarketDataValidationService,
    @Optional() private readonly gateway?: PipelineGateway,
  ) {
    this.config = { ...DEFAULT_PIPELINE_ORCHESTRATOR_CONFIG, ...config };
  }

  onModuleInit(): void {
    if (this.workflowEngine) {
      this.registerStepHandlers();
      this.logger.log('Pipeline step handlers registered with WorkflowEngine');
    }
  }

  private getOrCreateWorkflowState(wf: WorkflowInstance): PipelineRunState {
    let state = this.workflowStates.get(wf);
    if (!state) {
      state = this.createRunState(wf?.metadata);
      this.workflowStates.set(wf, state);
    }
    return state;
  }

  private createRunState(metadata?: Record<string, unknown>): PipelineRunState {
    return {
      symbol: typeof metadata?.symbol === 'string' ? (metadata.symbol as string) : undefined,
      timeframe: ((metadata?.timeframe as string) || '1d') as Timeframe,
      fetchedSymbols: [],
      normalized: [],
      bySymbol: new Map(),
      aggregated: [],
      analysisResults: [],
      opportunities: [],
      candidates: [],
      ranked: [],
      alerts: [],
      providerLatencies: [],
      providerFailures: 0,
      macroSnapshot: {},
    };
  }

  private registerStepHandlers(): void {
    const stepHandlers: Record<
      string,
      (step: string, workflow: WorkflowInstance) => Promise<Record<string, unknown>>
    > = {
      fetch_market_data: async (step, wf) =>
        this.executeStep('fetch_market_data', wf, () =>
          this.fetchMarketData(wf, this.getOrCreateWorkflowState(wf)),
        ),
      normalize: async (step, wf) =>
        this.executeStep('normalize', wf, () =>
          this.normalize(wf, this.getOrCreateWorkflowState(wf)),
        ),
      aggregate: async (step, wf) =>
        this.executeStep('aggregate', wf, () =>
          this.aggregate(wf, this.getOrCreateWorkflowState(wf)),
        ),
      ai_analysis: async (step, wf) =>
        this.executeStep('ai_analysis', wf, () =>
          this.aiAnalysis(wf, this.getOrCreateWorkflowState(wf)),
        ),
      opportunity_detection: async (step, wf) =>
        this.executeStep('opportunity_detection', wf, () =>
          this.opportunityDetection(wf, this.getOrCreateWorkflowState(wf)),
        ),
      scanner: async (step, wf) =>
        this.executeStep('scanner', wf, () => this.scanner(wf, this.getOrCreateWorkflowState(wf))),
      ranking: async (step, wf) =>
        this.executeStep('ranking', wf, () => this.ranking(wf, this.getOrCreateWorkflowState(wf))),
      alerts: async (step, wf) =>
        this.executeStep('alerts', wf, () => this.alerts(wf, this.getOrCreateWorkflowState(wf))),
      portfolio_refresh: async (step, wf) =>
        this.executeStep('portfolio_refresh', wf, () =>
          this.portfolioRefresh(wf, this.getOrCreateWorkflowState(wf)),
        ),
      macro_refresh: async (step, wf) =>
        this.executeStep('macro_refresh', wf, () =>
          this.macroRefresh(wf, this.getOrCreateWorkflowState(wf)),
        ),
    };

    for (const [stepName, handler] of Object.entries(stepHandlers)) {
      this.workflowEngine!.registerHandler('full_pipeline', stepName, handler);
    }
  }

  private async executeStep(
    stepName: string,
    workflow: WorkflowInstance,
    fn: () => Promise<Record<string, unknown>>,
  ): Promise<Record<string, unknown>> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.stepDurationsMs[stepName] = duration;
      this.logger.log(`Pipeline step ${stepName} completed in ${duration}ms`);
      return { ...result, durationMs: duration, stepName };
    } catch (error) {
      const duration = Date.now() - start;
      this.stepDurationsMs[stepName] = duration;
      this.logger.warn(
        `Pipeline step ${stepName} failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private nextStartedAt(): string {
    const now = Date.now();
    const timestamp = Math.max(now, this.lastStartedAtMs + 1);
    this.lastStartedAtMs = timestamp;
    return new Date(timestamp).toISOString();
  }

  async runFullPipeline(metadata?: Record<string, unknown>): Promise<PipelineContext> {
    const state = this.createRunState(metadata);
    const context: PipelineContext = {
      startedAt: this.nextStartedAt(),
      steps: [],
      metadata: metadata || {},
    };

    const pipelineSteps = [
      'fetch_market_data',
      'normalize',
      'aggregate',
      'ai_analysis',
      'opportunity_detection',
      'scanner',
      'ranking',
      'alerts',
      'portfolio_refresh',
      'macro_refresh',
    ];

    const start = Date.now();

    for (const stepName of pipelineSteps) {
      const record: PipelineStepRecord = {
        name: stepName,
        status: 'running',
        startedAt: new Date().toISOString(),
        completedAt: null,
        durationMs: 0,
        metadata: {},
      };

      try {
        const result = await this.executeStepDirect(stepName, state);
        record.status = 'completed';
        record.completedAt = new Date().toISOString();
        record.durationMs = Date.now() - new Date(record.startedAt).getTime();
        this.stepDurationsMs[stepName] = record.durationMs;
        record.metadata = result;
        context.metadata[stepName] = result;
        this.gateway?.emitPipelineStep(stepName, { ...result, durationMs: record.durationMs });
      } catch (error) {
        record.status = 'failed';
        record.completedAt = new Date().toISOString();
        record.durationMs = Date.now() - new Date(record.startedAt).getTime();
        record.error = error instanceof Error ? error.message : String(error);
        context.metadata[stepName] = { error: record.error };
        this.gateway?.emitPipelineStep(stepName, {
          status: 'failed',
          error: record.error,
          durationMs: record.durationMs,
        });
      }

      context.steps.push(record);
    }

    this.totalPipelineDurationMs = Date.now() - start;
    this.totalSteps = context.steps.length;
    this.completedSteps = context.steps.filter((s) => s.status === 'completed').length;
    this.failedSteps = context.steps.filter((s) => s.status === 'failed').length;
    this.lastStepNames = context.steps.map((s) => s.name);
    this.lastRunMetadata = metadata || {};
    this.lastProviderAvgLatencyMs = state.providerLatencies.length
      ? Math.round(
          state.providerLatencies.reduce((sum, l) => sum + l, 0) / state.providerLatencies.length,
        )
      : 0;
    this.totalProviderFailures =
      typeof metadata?.providerFailures === 'number'
        ? metadata.providerFailures
        : state.providerFailures;
    this.lastSchedulerDurationMs =
      typeof metadata?.schedulerDurationMs === 'number' ? metadata.schedulerDurationMs : 0;
    this.lastDashboardRefreshMs =
      typeof metadata?.dashboardRefreshMs === 'number' ? metadata.dashboardRefreshMs : 0;
    this.lastCircuitBreakerStatus =
      (metadata?.circuitBreakerStatus as Record<string, string>) ?? {};

    this.gateway?.emitPipelineRun({
      status: this.failedSteps === 0 ? 'completed' : 'partial',
      steps: this.totalSteps,
      completedSteps: this.completedSteps,
      failedSteps: this.failedSteps,
      durationMs: this.totalPipelineDurationMs,
    });

    return context;
  }

  private async executeStepDirect(
    stepName: string,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    const wf = null as unknown as WorkflowInstance;
    switch (stepName) {
      case 'fetch_market_data':
        return this.fetchMarketData(wf, state);
      case 'normalize':
        return this.normalize(wf, state);
      case 'aggregate':
        return this.aggregate(wf, state);
      case 'ai_analysis':
        return this.aiAnalysis(wf, state);
      case 'opportunity_detection':
        return this.opportunityDetection(wf, state);
      case 'scanner':
        return this.scanner(wf, state);
      case 'ranking':
        return this.ranking(wf, state);
      case 'alerts':
        return this.alerts(wf, state);
      case 'portfolio_refresh':
        return this.portfolioRefresh(wf, state);
      case 'macro_refresh':
        return this.macroRefresh(wf, state);
      default:
        throw new Error(`Unknown pipeline step: ${stepName}`);
    }
  }

  private async fetchMarketData(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: fetch_market_data');
    if (!this.marketDataService) {
      return {
        status: 'fallback_no_service',
        symbolsFetched: 0,
        successCount: 0,
        failCount: 0,
        providers: ['fintables', 'yahoo'],
        timestamp: new Date().toISOString(),
      };
    }

    const symbolsToFetch = [
      ...new Set(wf?.symbol ? [wf.symbol] : state.symbol ? [state.symbol] : BIST_SYMBOLS),
    ];
    const timeframe = state.timeframe;
    const points: MarketDataPoint[] = [];
    const latencies: number[] = [];
    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(
      symbolsToFetch.map(async (symbol) => {
        const startedAt = Date.now();
        try {
          const data = await this.marketDataService!.fetchData(symbol, timeframe);
          latencies.push(Date.now() - startedAt);
          for (const point of data) {
            points.push({ ...point, symbol });
          }
          successCount++;
        } catch (err) {
          failCount++;
          this.logger.warn(
            `Failed to fetch market data for ${symbol}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );

    state.fetchedSymbols = symbolsToFetch;
    state.normalized = points;
    state.providerLatencies = latencies;
    state.providerFailures = failCount;

    this.gateway?.emitProviderStatus({
      providers: ['fintables', 'yahoo'],
      healthyProviders: successCount > 0 ? ['fintables'] : [],
      successCount,
      failCount,
    });

    return {
      symbolsFetched: symbolsToFetch.length,
      successCount,
      failCount,
      pointsFetched: points.length,
      providers: ['fintables', 'yahoo'],
      avgLatencyMs: latencies.length
        ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
        : 0,
      status: successCount > 0 ? 'completed' : failCount > 0 ? 'failed' : 'no_data',
      timestamp: new Date().toISOString(),
    };
  }

  private async normalize(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: normalize');
    const raw = state.normalized;
    if (raw.length === 0) {
      return {
        status: 'completed',
        pointsNormalized: 0,
        validCount: 0,
        invalidCount: 0,
        message: 'No market data to normalize',
      };
    }

    let validCount = 0;
    let invalidCount = 0;
    let warningCount = 0;
    const normalized = raw.map((point) => {
      const cleaned: MarketDataPoint = { ...point };
      if (this.marketDataValidationService) {
        const result = this.marketDataValidationService.validateDataPoint(cleaned);
        cleaned.validationStatus = result.isValid
          ? 'valid'
          : result.errors.length > 0
            ? 'invalid'
            : 'partial';
        if (result.isValid) validCount++;
        else invalidCount++;
        warningCount += result.warnings.length;
      } else {
        cleaned.validationStatus = cleaned.validationStatus || 'valid';
        if (cleaned.validationStatus === 'valid') validCount++;
        else invalidCount++;
      }
      return cleaned;
    });

    state.normalized = normalized;
    state.bySymbol = new Map();
    for (const point of normalized) {
      const list = state.bySymbol.get(point.symbol) ?? [];
      list.push(point);
      state.bySymbol.set(point.symbol, list);
    }

    return {
      status: 'completed',
      pointsNormalized: normalized.length,
      validCount,
      invalidCount,
      warningCount,
      timestamp: new Date().toISOString(),
    };
  }

  private async aggregate(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: aggregate');
    if (!this.aggregationEngine) {
      return { status: 'fallback_no_service', aggregatedSymbols: 0, avgQualityScore: 85 };
    }

    const targetSymbols =
      state.bySymbol.size > 0
        ? Array.from(state.bySymbol.keys())
        : ([state.symbol || wf?.symbol].filter(Boolean) as string[]);

    if (targetSymbols.length === 0) {
      return {
        status: 'completed',
        aggregatedSymbols: 0,
        message: 'No fetched symbols to aggregate',
      };
    }

    const targets = targetSymbols.slice(0, 20);
    let aggregatedCount = 0;
    let failedCount = 0;
    let qualitySum = 0;
    const providersUsed = new Set<string>();

    await Promise.allSettled(
      targets.map(async (symbol) => {
        const startedAt = Date.now();
        try {
          const company = await this.aggregationEngine!.aggregateCompany(symbol);
          state.aggregated.push({ symbol, company: company ?? undefined });
          if (company?.data) {
            aggregatedCount++;
            qualitySum += company.metadata?.qualityScore ?? 0;
            (company.metadata?.providersUsed ?? []).forEach((p) => providersUsed.add(p));
            state.providerFailures += company.metadata?.providersFailed?.length ?? 0;
            state.providerLatencies.push(Date.now() - startedAt);
          }
        } catch (err) {
          state.aggregated.push({
            symbol,
            error: err instanceof Error ? err.message : String(err),
          });
          failedCount++;
          this.logger.warn(
            `Aggregation failed for ${symbol}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );

    return {
      status: aggregatedCount > 0 ? 'completed' : failedCount > 0 ? 'failed' : 'no_data',
      aggregatedSymbols: aggregatedCount,
      failedSymbols: failedCount,
      totalRequested: targets.length,
      avgQualityScore: aggregatedCount ? Math.round(qualitySum / aggregatedCount) : 0,
      providersUsed: Array.from(providersUsed),
      timestamp: new Date().toISOString(),
    };
  }

  private buildPipelineInput(symbol: string, state: PipelineRunState): AiPipelineInput | null {
    const entry = state.aggregated.find((a) => a.symbol === symbol);
    if (!entry?.company) return null;
    return { company: entry.company };
  }

  private async aiAnalysis(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: ai_analysis');
    if (!this.aiAnalysisPipeline && !this.analysisService) {
      return { status: 'fallback_no_service', stocksAnalyzed: 0 };
    }

    const aggregatedSymbols = state.aggregated.filter((a) => a.company).map((a) => a.symbol);
    const symbolsToAnalyze =
      aggregatedSymbols.length > 0
        ? aggregatedSymbols
        : state.symbol
          ? [state.symbol]
          : BIST_SYMBOLS.slice(0, 10);

    let analyzed = 0;
    let failed = 0;
    const results: AiAnalysisResult[] = [];

    await Promise.allSettled(
      symbolsToAnalyze.map(async (symbol) => {
        try {
          const input = this.buildPipelineInput(symbol, state);
          if (input && this.aiAnalysisPipeline) {
            const result = await this.aiAnalysisPipeline!.analyze(input);
            results.push(result);
          } else if (this.analysisService) {
            const pipelineResult = await this.analysisService!.analyzeSymbol(
              symbol,
              state.timeframe,
            );
            results.push(this.buildAnalysisResultFromPipeline(symbol, pipelineResult));
          }
          analyzed++;
        } catch (err) {
          failed++;
          this.logger.warn(
            `AI analysis failed for ${symbol}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );

    state.analysisResults = results;

    return {
      status: analyzed > 0 ? 'completed' : failed > 0 ? 'failed' : 'no_data',
      stocksAnalyzed: analyzed,
      stocksFailed: failed,
      totalRequested: symbolsToAnalyze.length,
      timestamp: new Date().toISOString(),
    };
  }

  private async opportunityDetection(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: opportunity_detection');
    if (!this.opportunityDetectionEngine) {
      return { status: 'fallback_no_service', opportunitiesDetected: 0 };
    }

    const opportunities: OpportunityResult[] = [];
    for (const result of state.analysisResults) {
      try {
        const opportunity = this.opportunityDetectionEngine!.detect(result);
        if (opportunity) opportunities.push(opportunity);
      } catch (err) {
        this.logger.warn(
          `Opportunity detection failed for ${result.symbol}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    state.opportunities = opportunities;

    return {
      status: 'completed',
      opportunitiesDetected: opportunities.length,
      symbolsAnalyzed: state.analysisResults.length,
      timestamp: new Date().toISOString(),
    };
  }

  private async scanner(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: scanner');
    if (!this.scannerEngine) {
      return { status: 'fallback_no_service', candidates: 0 };
    }

    try {
      const result = this.scannerEngine.scan(state.opportunities, 'FULL' as ScanMode);
      state.candidates = result.candidates;
      return {
        status: 'completed',
        candidates: result.candidates.length,
        groups: result.groups.size,
        metrics: result.metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async ranking(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: ranking');
    if (!this.rankingEngine) {
      return { status: 'fallback_no_service', ranked: 0 };
    }

    try {
      const result = this.rankingEngine.rank(state.candidates);
      state.ranked = result.ranked;
      this.lastRanked = result.ranked;
      this.gateway?.emitRankingUpdate({
        rankedCount: result.ranked.length,
        ranked: result.ranked.map((r) => ({
          symbol: r.symbol,
          rank: r.rank,
          rankingScore: r.rankingScore,
          recommendation: r.recommendation,
          investmentGrade: r.investmentGrade,
        })),
      });
      return {
        status: 'completed',
        ranked: result.ranked.length,
        metrics: result.metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async alerts(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: alerts');
    if (!this.alertEngine) {
      return { status: 'fallback_no_service', alertsGenerated: 0 };
    }

    try {
      const alertEvents = await this.alertEngine.processRankedOpportunities(state.ranked);
      state.alerts = alertEvents;
      this.gateway?.emitAlertUpdate({
        alertCount: alertEvents.length,
        alerts: alertEvents.map((a) => ({
          id: a.id,
          symbol: a.symbol,
          type: a.type,
          priority: a.priority,
        })),
      });
      return {
        status: 'completed',
        alertsGenerated: alertEvents.length,
        alertIds: alertEvents.map((a) => a.id),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async portfolioRefresh(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: portfolio_refresh');
    if (!this.portfolioEngine) {
      return { status: 'fallback_no_service', portfoliosRefreshed: 0 };
    }

    try {
      const prices = new Map<string, number>();
      for (const [symbol, points] of state.bySymbol) {
        const last = points[points.length - 1];
        if (last) prices.set(symbol, last.close);
      }
      if (prices.size > 0) {
        this.portfolioEngine.updatePrices(prices);
      }

      const portfolios = this.portfolioEngine.getPortfolios();
      for (const portfolio of portfolios) {
        this.portfolioEngine.recordSnapshot(portfolio.id);
      }

      this.gateway?.emitPortfolioUpdate({
        portfoliosRefreshed: portfolios.length,
        pricesUpdated: prices.size,
        portfolioIds: portfolios.map((p) => p.id),
      });

      return {
        status: 'completed',
        portfoliosRefreshed: portfolios.length,
        portfolioIds: portfolios.map((p) => p.id),
        pricesUpdated: prices.size,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async macroRefresh(
    wf: WorkflowInstance,
    state: PipelineRunState,
  ): Promise<Record<string, unknown>> {
    this.logger.log('Step: macro_refresh');
    this.macroUpdateTimestamp = new Date().toISOString();

    if (!this.macroService) {
      return { status: 'fallback_no_service', timestamp: this.macroUpdateTimestamp };
    }

    try {
      const [data, score, regime] = await Promise.all([
        this.macroService.getData(),
        this.macroService.getMacroScore(),
        this.macroService.getRegime(),
      ]);

      this.lastMacroData = {
        healthyCount: data.healthyCount,
        sourceCount: data.sourceCount,
        regime: regime.regime,
        macroScore: score.macroScore,
      };
      state.macroSnapshot = this.lastMacroData;

      this.gateway?.emitMacroUpdate({
        ...this.lastMacroData,
        timestamp: this.macroUpdateTimestamp,
      });

      return {
        status: 'completed',
        ...this.lastMacroData,
        timestamp: this.macroUpdateTimestamp,
      };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        timestamp: this.macroUpdateTimestamp,
      };
    }
  }

  private ratingToSignal(rating?: string): AiAnalysisSignal {
    switch (rating) {
      case 'AAA':
      case 'AA':
        return 'STRONG_BUY';
      case 'A':
      case 'BBB':
        return 'BUY';
      case 'BB':
        return 'ACCUMULATE';
      case 'B':
        return 'NEUTRAL';
      case 'C':
        return 'REDUCE';
      case 'D':
        return 'SELL';
      default:
        return 'NEUTRAL';
    }
  }

  private buildModuleResultsFromPipeline(r: PipelineAnalysisResult): AiModuleResult[] {
    const modules: AiModuleResult[] = [];
    const pushModule = (module: string, score: number, confidence: number, summary: string) => {
      modules.push({
        module,
        score: Math.max(0, Math.min(100, score)),
        confidence,
        signals: [],
        strengths: [],
        weaknesses: [],
        risks: [],
        warnings: [],
        metrics: { [module]: score },
        explanation: summary,
        metadata: {},
      });
    };

    pushModule(
      'technical',
      r.technicalScore?.score ?? 50,
      r.technicalScore?.confidence ?? 50,
      r.technicalSummary?.summary ?? 'Technical analysis',
    );
    pushModule(
      'momentum',
      r.technicalScore?.score ?? 50,
      r.technicalScore?.confidence ?? 50,
      r.technicalSummary?.summary ?? 'Momentum analysis',
    );
    pushModule('trend', this.trendScore(r), 50, r.marketStructure?.trend ?? 'Trend analysis');
    pushModule(
      'fundamental',
      r.financialScore?.score ?? 50,
      r.financialScore?.confidence ?? 50,
      r.financialSummary?.summary ?? 'Fundamental analysis',
    );
    pushModule(
      'growth',
      r.financialScore?.score ?? 50,
      r.financialScore?.confidence ?? 50,
      r.financialSummary?.summary ?? 'Growth analysis',
    );
    pushModule('valuation', r.opportunity?.opportunityScore ?? 50, 50, 'Valuation analysis');
    pushModule(
      'liquidity',
      r.financialScore?.score ?? 50,
      r.financialScore?.confidence ?? 50,
      'Liquidity analysis',
    );
    pushModule(
      'risk',
      r.financialScore?.score ?? 50,
      r.financialScore?.confidence ?? 50,
      'Risk analysis',
    );
    pushModule('volatility', 50, 50, 'Volatility analysis');
    pushModule(
      'financialHealth',
      r.financialScore?.score ?? 50,
      r.financialScore?.confidence ?? 50,
      r.financialSummary?.summary ?? 'Financial health analysis',
    );

    return modules;
  }

  private trendScore(r: PipelineAnalysisResult): number {
    switch (r.marketStructure?.trend) {
      case 'uptrend':
        return 75;
      case 'downtrend':
        return 30;
      case 'sideways':
        return 50;
      default:
        return 50;
    }
  }

  private buildSupportingMetricsFromPipeline(r: PipelineAnalysisResult): AiSupportingMetric[] {
    const metrics: AiSupportingMetric[] = [];
    const add = (name: string, value: number | string, description: string, module: string) => {
      metrics.push({ name, value, description, module });
    };
    if (typeof r.eliteScore?.eliteScore === 'number')
      add('eliteScore', r.eliteScore.eliteScore, 'Elite composite score', 'elite');
    if (typeof r.technicalScore?.score === 'number')
      add('technicalScore', r.technicalScore.score, 'Technical score', 'technical');
    if (typeof r.financialScore?.score === 'number')
      add('financialScore', r.financialScore.score, 'Financial score', 'fundamental');
    if (typeof r.opportunity?.opportunityScore === 'number')
      add('opportunityScore', r.opportunity.opportunityScore, 'Opportunity score', 'opportunity');
    if (r.eliteScore?.rating) add('rating', r.eliteScore.rating, 'Elite rating', 'elite');
    return metrics;
  }

  private takeUnique(items: string[], limit: number): string[] {
    return Array.from(new Set(items.filter(Boolean))).slice(0, limit);
  }

  private buildAnalysisResultFromPipeline(
    symbol: string,
    r: PipelineAnalysisResult,
  ): AiAnalysisResult {
    const eliteScore =
      r.eliteScore?.eliteScore ?? r.opportunity?.opportunityScore ?? r.technicalScore?.score ?? 50;
    const confidence = r.eliteScore?.confidence ?? r.technicalScore?.confidence ?? 50;
    const signal = this.ratingToSignal(r.eliteScore?.rating);

    return {
      symbol,
      overallScore: Math.round(eliteScore * 100) / 100,
      confidenceScore: confidence,
      signal,
      recommendation: signal,
      strengths: this.takeUnique(
        [
          ...(r.technicalSummary?.strengths ?? []),
          ...(r.financialSummary?.strengths ?? []),
          ...(r.eliteScore?.summary ? [r.eliteScore.summary] : []),
        ],
        5,
      ),
      weaknesses: this.takeUnique(
        [...(r.technicalSummary?.weaknesses ?? []), ...(r.financialSummary?.weaknesses ?? [])],
        5,
      ),
      risks: this.takeUnique(
        [...(r.technicalSummary?.risks ?? []), ...(r.financialSummary?.risks ?? [])],
        5,
      ),
      warnings: [],
      explanation: [
        r.eliteScore?.summary,
        r.technicalSummary?.overallOpinion,
        r.financialSummary?.overallOpinion,
      ]
        .filter(Boolean)
        .join(' ')
        .trim(),
      supportingMetrics: this.buildSupportingMetricsFromPipeline(r),
      providerMetadata: {
        providersQueried: [],
        providersUsed: [],
        providersFailed: [],
        providerConfidence: {},
        qualityScore: (r.metadata?.aggregationQuality as number) ?? 70,
        lastUpdated: new Date().toISOString(),
        cacheStatus: 'miss',
        aggregationDurationMs: 0,
        validationWarnings: [],
        conflictCount: 0,
        conflicts: [],
      },
      moduleResults: this.buildModuleResultsFromPipeline(r),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  getMetrics(): PipelineMetrics {
    return {
      pipelineDurationMs: this.totalPipelineDurationMs,
      providerAvgLatencyMs: this.lastProviderAvgLatencyMs,
      macroRefreshDurationMs: this.stepDurationsMs['macro_refresh'] || 0,
      schedulerDurationMs: this.lastSchedulerDurationMs,
      providerFailures: this.totalProviderFailures,
      circuitBreakerStatus: this.lastCircuitBreakerStatus,
      macroUpdateTimestamp: this.macroUpdateTimestamp,
      dashboardRefreshMs: this.lastDashboardRefreshMs,
      totalSteps: this.totalSteps,
      completedSteps: this.completedSteps,
      failedSteps: this.failedSteps,
      stepNames: [...this.lastStepNames],
    };
  }

  getStepDurations(): Record<string, number> {
    return { ...this.stepDurationsMs };
  }

  getLastRanked(): RankedOpportunity[] {
    return this.lastRanked;
  }

  getLastMacroData(): Record<string, unknown> {
    return { ...this.lastMacroData };
  }

  reset(): void {
    this.stepDurationsMs = {};
    this.totalPipelineDurationMs = 0;
    this.totalProviderFailures = 0;
    this.macroUpdateTimestamp = null;
    this.lastRanked = [];
    this.lastMacroData = {};
    this.lastRunMetadata = {};
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.failedSteps = 0;
    this.lastStepNames = [];
    this.lastProviderAvgLatencyMs = 0;
    this.lastSchedulerDurationMs = 0;
    this.lastDashboardRefreshMs = 0;
    this.lastCircuitBreakerStatus = {};
  }
}
