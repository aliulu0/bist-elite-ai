import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService, latestPriceStateToDataPoint } from '../market-data/incremental/latest-price-incremental.service';
import { EarlyOpportunityService } from './early-opportunity.service';
import { EarlyOpportunityIntelligenceEngine } from './early-opportunity.intelligence-engine';
import { SelfLearningService } from './self-learning/self-learning.service';
import { MultiTimeframeOpportunityService } from './multi-timeframe/multi-timeframe.service';
import { FundamentalIntegrationService } from '../financial-rules/fundamental-integration.service';
import { FinancialDataQualityService } from '../financial-rules/financial-data-quality.service';
import {
  EarlyOpportunityFilters,
  EarlyOpportunityIntelligenceResult,
  DataQualityContext,
} from './early-opportunity.types';
import { FundamentalBundle } from '../financial-rules/fundamental-integration.service';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { AIConsensus } from '../ai-research/ai-research.types';
import { EarlySignalScannerService } from './signals/early-signal-scanner.service';
import { EarlySignalScannerResult } from './signals/early-signal.types';
import {
  EarlyOpportunityAnalysisContext,
  EarlyOpportunityPipelineOptions,
  EarlyOpportunityPipelineResult,
} from './early-opportunity-pipeline.context';

const INTELLIGENCE_CONCURRENCY = 12;

export interface EarlyOpportunityQueryOptions {
  limit?: number;
  runLearning?: boolean;
}

@Injectable()
export class EarlyOpportunityIntelligenceService {
  private readonly logger = new Logger(EarlyOpportunityIntelligenceService.name);

  constructor(
    private readonly earlyOpportunityService: EarlyOpportunityService,
    private readonly intelligenceEngine: EarlyOpportunityIntelligenceEngine,
    private readonly selfLearningService: SelfLearningService,
    private readonly marketData: MarketDataOrchestrator,
    private readonly latestPrice: LatestPriceIncrementalService,
    private readonly multiTimeframeService: MultiTimeframeOpportunityService,
    @Optional() private readonly fundamental?: FundamentalIntegrationService,
    @Optional() private readonly signalScanner?: EarlySignalScannerService,
    @Optional() private readonly dataQuality?: FinancialDataQualityService,
  ) {}

async getEarlyOpportunities(
    filters: EarlyOpportunityFilters = {},
    options: EarlyOpportunityQueryOptions = {},
  ): Promise<EarlyOpportunityIntelligenceResult[]> {
    const limit = Math.max(1, options.limit ?? 10);

    if (options.runLearning !== false) {
      await this.selfLearningService.runLearningCycle().catch((error) => {
        this.logger.warn(`Self-learning cycle failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }

    const detailed = await this.earlyOpportunityService.scanAllDetailed({
      limit: 100,
    });

    const withCap = await this.mapWithConcurrency(
      detailed,
      INTELLIGENCE_CONCURRENCY,
      async (d) => {
        const bundle = this.fundamental
          ? await this.fundamental.getReportAndMarketCap(d.input.ticker, d.input.sector).catch(() => null)
          : null;
        const marketCap = bundle?.marketCap ?? (await this.fetchMarketCap(d.input.ticker).catch(() => null));
        const result = this.intelligenceEngine.buildIntelligenceResult(
          d.input,
          d.result,
          marketCap,
          undefined,
          bundle?.report ?? null,
        );
        // First pass ignores signal filters: signals are attached later as enrichment.
        const passes = this.intelligenceEngine.matchesFilters(result, this.withoutSignalFilters(filters));
        return { result, passes, input: d.input, bundle };
      },
    );

    // First pass: apply basic filters
    const filtered = withCap.filter((w) => w.passes).map((w) => w.result);

    // Compute data quality for filtered results
    const dataQuality = this.dataQuality;
    await this.enrichWithDataQuality(filtered, withCap, dataQuality);

    // Attach signals before applying signal filters (signals are evidence/enrichment)
    if (this.signalScanner && this.hasSignalFilters(filters)) {
      await this.enrichWithSignals(filtered);
    }

    // Apply data quality + signal filters after enrichment
    const qualityFiltered = filtered.filter((r) => this.intelligenceEngine.matchesFilters(r, filters));

    const modifiers = new Map(
      this.selfLearningService.getAllModifiers().map((e) => [e.ticker, e.modifier]),
    );
    const ranked = this.intelligenceEngine.rankByAdjusted(qualityFiltered, modifiers).slice(0, limit);

    if (this.signalScanner && !this.hasSignalFilters(filters)) {
      await this.enrichWithSignals(ranked);
    }

    return ranked;
  }

  private hasSignalFilters(filters: EarlyOpportunityFilters): boolean {
    return (
      filters.minSignalStrength != null ||
      filters.minSignalConvergence != null ||
      filters.signalCategory != null ||
      filters.signalType != null ||
      filters.earlyOnly === true ||
      filters.confirmedOnly === true
    );
  }

  private withoutSignalFilters(filters: EarlyOpportunityFilters): EarlyOpportunityFilters {
    const {
      minSignalStrength: _mss,
      minSignalConvergence: _msc,
      signalCategory: _sc,
      signalType: _st,
      earlyOnly: _eo,
      confirmedOnly: _co,
      ...rest
    } = filters;
    return rest;
  }

  private async enrichWithSignals(
    results: EarlyOpportunityIntelligenceResult[],
  ): Promise<void> {
    if (!this.signalScanner) return;
    const scans = await this.mapWithConcurrency(
      results,
      INTELLIGENCE_CONCURRENCY,
      (r) => this.signalScanner!.scan(r.ticker).catch(() => null),
    );
    for (let i = 0; i < results.length; i += 1) {
      this.attachSignals(results[i], scans[i]);
    }
  }

  private attachSignals(
    result: EarlyOpportunityIntelligenceResult,
    scan: EarlySignalScannerResult | null,
  ): void {
    if (!scan) return;
    result.signals = scan.signals;
    result.signalConvergenceScore = scan.convergence.convergenceScore;
    result.earlySignalCount = scan.convergence.earlyCount;
    result.confirmedSignalCount = scan.convergence.confirmedCount;
    result.topSignals = scan.convergence.strongestSignals;
  }

  private async fetchPriceContext(
    ticker: string,
    fundamental: FundamentalBundle | null,
    consensus: AIConsensus | null | undefined,
  ): Promise<DataQualityContext> {
    const [state, historyResult] = await Promise.all([
      this.latestPrice.getLatestPriceIncremental(ticker, '1d').catch(() => null),
      this.marketData.fetchHistoricalData(ticker, '1d', { limit: 30 }).catch(() => null),
    ]);

    return {
      price: state ? latestPriceStateToDataPoint(state) : null,
      priceProvider: state?.provider,
      priceFallbackUsed: state?.dataFreshness === 'stale',
      priceTimestamp: state?.timestamp,
      history: historyResult?.data ?? [],
      fundamental,
      consensus: consensus ?? null,
      providers: this.marketData.getAvailableProviders(),
      now: Date.now(),
    };
  }

  private async enrichWithDataQuality(
    results: EarlyOpportunityIntelligenceResult[],
    original: Array<{ result: EarlyOpportunityIntelligenceResult; passes: boolean; input: any; bundle: FundamentalBundle | null }>,
    dataQuality: any,
  ): Promise<void> {
    for (const result of results) {
      const orig = original.find((o) => o.result.ticker === result.ticker);
      if (!orig) continue;

      const context = await this.fetchPriceContext(result.ticker, orig.bundle, orig.input.consensus);

      const qualityReport = await dataQuality.assess(context);
      result.financialDataQuality = qualityReport;
    }
  }

  async getEarlyOpportunity(ticker: string): Promise<EarlyOpportunityIntelligenceResult | null> {
    const context = await this.buildAnalysisContext(ticker);
    if (!context) return null;

    const result = this.intelligenceEngine.buildIntelligenceResult(
      context.detailedInput,
      context.detailedResult,
      context.marketCap,
      context.multiTimeframe,
      context.fundamentalReport,
    );

    // Enrich with data quality using shared context
    if (this.dataQuality) {
      const qualityContext = this.buildDataQualityContext(context);
      const qualityReport = await this.dataQuality.assess(qualityContext).catch(() => null);
      result.financialDataQuality = qualityReport;
    }

    if (this.signalScanner) {
      const predictionResult = context.detailed.result.predictions?.[0] ?? null;
      const scan = await this.signalScanner.scan(ticker, { 
        prediction: predictionResult, 
        multiTimeframe: context.multiTimeframe,
        financialDataQuality: result.financialDataQuality ?? undefined 
      }).catch(() => null);
      this.attachSignals(result, scan);
    }

    return result;
  }

  async explain(ticker: string): Promise<string | null> {
    const result = await this.getEarlyOpportunity(ticker);
    if (!result) return null;
    return this.intelligenceEngine.explain(result);
  }

async explainDataQuality(ticker: string): Promise<string | null> {
    const result = await this.getEarlyOpportunity(ticker);
    if (!result?.financialDataQuality) return null;
    if (!this.dataQuality) return null;
    return this.dataQuality.explain(result.financialDataQuality);
  }

  private async buildAnalysisContext(ticker: string): Promise<{
    detailedInput: any;
    detailedResult: any;
    marketCap: number | null;
    multiTimeframe: any;
    fundamentalReport: any;
    detailed: any;
    bundle: any;
  } | null> {
    const detailed = await this.earlyOpportunityService.scanTickerDetailed(ticker);
    if (!detailed) return null;
    const bundle = this.fundamental
      ? await this.fundamental.getReportAndMarketCap(ticker, detailed.input.sector).catch(() => null)
      : null;
    const marketCap = bundle?.marketCap ?? (await this.fetchMarketCap(ticker).catch(() => null));
    const multiTimeframe = await this.multiTimeframeService.analyze(ticker).catch(() => null);
    
    return {
      detailedInput: detailed.input,
      detailedResult: detailed.result,
      marketCap,
      multiTimeframe,
      fundamentalReport: bundle?.report ?? null,
      detailed,
      bundle,
    };
  }

  private buildDataQualityContext(context: {
    detailedInput: any;
    detailedResult: any;
    marketCap: number | null;
    multiTimeframe: any;
    fundamentalReport: any;
    detailed: any;
    bundle: any;
  }): any {
    const { detailedInput, detailed, bundle } = context;
    // Use the shared context pattern - fetch price and history once
    return this.fetchPriceContext(detailedInput.ticker, bundle, detailedInput.consensus);
  }

  async runLearningCycle(): Promise<ReturnType<SelfLearningService['runLearningCycle']>> {
    return this.selfLearningService.runLearningCycle();
  }

  private async fetchMarketCap(ticker: string): Promise<number | null> {
    const normalized = ticker.toUpperCase();
    const res = await this.marketData.fetchCompany(normalized);
    const cap = res?.data?.marketCap;
    return typeof cap === 'number' ? cap : null;
  }

  private async mapWithConcurrency<TItem, TResult>(
    items: TItem[],
    concurrency: number,
    fn: (item: TItem, index: number) => Promise<TResult>,
  ): Promise<TResult[]> {
    const results: TResult[] = new Array(items.length);
    let i = 0;
    const worker = async () => {
      while (true) {
        const index = i;
        i += 1;
        if (index >= items.length) return;
        results[index] = await fn(items[index], index);
      }
    };
    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    );
    await Promise.all(workers);
    return results;
  }
}
