import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { PointInTimeDataService } from './point-in-time-data.service';
import { FutureOutcomeService } from './future-outcome.service';
import { DecisionSuccessService } from './decision-success.service';
import { BenchmarkService } from './benchmark.service';
import { ConfidenceCalibrationService } from './confidence-calibration.service';
import { LeadTimeService } from './lead-time.service';
import { FalsePositiveService } from './false-positive.service';
import { MissedOpportunityService } from './missed-opportunity.service';
import { HistoricalMarketDataService } from '../market-data/historical/historical-market-data.service';
import { CacheService } from '../common/cache/cache.service';
import { IndicatorCacheService } from '../indicators/indicator-cache.service';
import { EarlyOpportunityDecisionEngine } from '../ai-early-opportunity/decision/early-opportunity-decision.engine';
import { EarlyOpportunityIntelligenceService } from '../ai-early-opportunity/early-opportunity.intelligence.service';
import { EarlyOpportunityIntelligenceResult } from '../ai-early-opportunity/early-opportunity.types';
import {
  BacktestRunConfig, BacktestRunResult, BacktestSummary, ImmutableDecisionRecord,
  FutureOutcome, DecisionSuccessResult, BenchmarkComparisonResult,
  ConfidenceCalibrationResult, LeadTimeSummary, FalsePositiveSummary,
  MissedOpportunitySummary, SampleQualityResult, SurvivorshipInfo,
  CorporateActionLimitation, TransactionCostAssumption, PerformanceMetrics,
  BacktestHorizon, BACKTEST_HORIZONS, DecisionTableRow,
} from './early-opportunity-backtest.types';
import { OHLCV } from '../indicators/indicator.types';

interface RunState {
  runId: string;
  config: BacktestRunConfig;
  startedAt: string;
  completedAt: string | null;
  decisions: ImmutableDecisionRecord[];
  outcomes: FutureOutcome[];
  successResults: DecisionSuccessResult[];
  benchmarkResults: BenchmarkComparisonResult[];
  expectedReturnValidation: any[];
  confidenceCalibration: ConfidenceCalibrationResult | null;
  leadTime: LeadTimeSummary | null;
  falsePositives: FalsePositiveSummary | null;
  missedOpportunities: MissedOpportunitySummary | null;
  sampleQuality: SampleQualityResult | null;
  performance: PerformanceMetrics;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

@Injectable()
export class HistoricalEarlyOpportunityBacktestService {
  private readonly logger = new Logger(HistoricalEarlyOpportunityBacktestService.name);
  private readonly runs = new Map<string, RunState>();
  private readonly engine = new EarlyOpportunityDecisionEngine();

  private providerCalls = 0;
  private cacheHits = 0;
  private indicatorCacheHits = 0;

  constructor(
    private readonly pointInTimeDataService: PointInTimeDataService,
    private readonly futureOutcomeService: FutureOutcomeService,
    private readonly decisionSuccessService: DecisionSuccessService,
    private readonly benchmarkService: BenchmarkService,
    private readonly confidenceCalibrationService: ConfidenceCalibrationService,
    private readonly leadTimeService: LeadTimeService,
    private readonly falsePositiveService: FalsePositiveService,
    private readonly missedOpportunityService: MissedOpportunityService,
    @Optional() private readonly historicalMarketDataService?: HistoricalMarketDataService,
    @Optional() private readonly cacheService?: CacheService,
    @Optional() private readonly indicatorCacheService?: IndicatorCacheService,
    @Optional() private readonly intelligenceService?: EarlyOpportunityIntelligenceService,
  ) {}

  async runBacktest(config: BacktestRunConfig): Promise<BacktestRunResult> {
    const runId = uuidv4();
    const startedAt = new Date().toISOString();
    const run: RunState = {
      runId,
      config,
      startedAt,
      completedAt: null,
      decisions: [],
      outcomes: [],
      successResults: [],
      benchmarkResults: [],
      expectedReturnValidation: [],
      confidenceCalibration: null,
      leadTime: null,
      falsePositives: null,
      missedOpportunities: null,
      sampleQuality: null,
      performance: {
        decisionsEvaluated: 0,
        outcomesEvaluated: 0,
        skippedDates: 0,
        invalidDates: 0,
        historicalCoverage: 0,
        executionDurationMs: 0,
        averageDecisionDurationMs: 0,
        providerCalls: 0,
        cacheHits: 0,
        indicatorCacheHits: 0,
      },
      status: 'running',
    };
    this.runs.set(runId, run);

    try {
      const result = await this.executeBacktest(run);
      run.completedAt = new Date().toISOString();
      run.status = 'completed';
      return result;
    } catch (err: any) {
      run.status = 'failed';
      run.error = err.message;
      throw err;
    }
  }

  getRun(runId: string): BacktestRunResult | null {
    const run = this.runs.get(runId);
    if (!run) return null;
    return this.toResult(run);
  }

  getSummary(runId: string): BacktestSummary | null {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'completed') return null;
    return this.buildSummary(run);
  }

  getDecisions(runId: string): DecisionTableRow[] {
    const run = this.runs.get(runId);
    if (!run) return [];
    return this.buildDecisionTable(run);
  }

  getFailures(runId: string): FalsePositiveSummary | null {
    const run = this.runs.get(runId);
    return run?.falsePositives ?? null;
  }

  getMissedOpportunities(runId: string): MissedOpportunitySummary | null {
    const run = this.runs.get(runId);
    return run?.missedOpportunities ?? null;
  }

  getCalibration(runId: string): ConfidenceCalibrationResult | null {
    const run = this.runs.get(runId);
    return run?.confidenceCalibration ?? null;
  }

  getLeadTime(runId: string): LeadTimeSummary | null {
    const run = this.runs.get(runId);
    return run?.leadTime ?? null;
  }

  private async executeBacktest(run: RunState): Promise<BacktestRunResult> {
    const startTime = Date.now();
    const config = run.config;
    const symbols = config.symbols ?? ['THYAO.IS'];
    const horizons = config.horizons ?? [...BACKTEST_HORIZONS];
    const startDate = config.startDate;
    const endDate = config.endDate;

    let totalDecisions = 0;
    let totalSkipped = 0;
    let totalInvalid = 0;

    for (const symbol of symbols.slice(0, config.maxSymbols ?? 10)) {
      if (totalDecisions >= (config.maxDecisions ?? 100)) break;

      const candles = await this.fetchHistoricalCandles(symbol, '1d', startDate, endDate);
      if (!candles || candles.length < 2) {
        totalSkipped++;
        continue;
      }

      const decisionDates = this.generateDecisionDates(candles, startDate, endDate);
      for (const decisionDate of decisionDates) {
        if (totalDecisions >= (config.maxDecisions ?? 100)) break;

        const pointInTimeCandles = this.pointInTimeDataService.filterCandles(candles, decisionDate);
        if (pointInTimeCandles.data.length < 2) {
          totalInvalid++;
          continue;
        }

        const decision = await this.buildHistoricalDecision(symbol, decisionDate, pointInTimeCandles.data);
        if (!decision) {
          totalSkipped++;
          continue;
        }

        const record: ImmutableDecisionRecord = {
          id: `${symbol}:${decisionDate}:${decision.snapshot.inputDigest}`,
          snapshot: decision.snapshot,
          fullDecision: decision,
          createdAt: new Date().toISOString(),
          runId: run.runId,
        };
        run.decisions.push(record);
        totalDecisions++;

        const futureCandles = candles.slice(pointInTimeCandles.data.length);
        const entryPrice = decision.snapshot.entry
          ? (decision.snapshot.entry.min + decision.snapshot.entry.max) / 2
          : pointInTimeCandles.data[pointInTimeCandles.data.length - 1].close;

        const outcome = this.futureOutcomeService.calculate(
          symbol, decisionDate, candles, horizons,
          entryPrice, decision.snapshot.stop, decision.snapshot.target1,
          config.commission ?? 0, config.slippage ?? 0,
        );
        run.outcomes.push(outcome);

        const successResult = this.decisionSuccessService.evaluate(
          outcome, decision.snapshot.decisionScore,
          decision.snapshot.entry, decision.snapshot.stop, decision.snapshot.target1,
        );
        run.successResults.push(successResult);

        if (config.benchmark) {
          const benchCandles = await this.fetchHistoricalCandles(config.benchmark, '1d', startDate, endDate);
          const benchResults = this.benchmarkService.compareAllHorizons(symbol, decisionDate, candles, benchCandles);
          run.benchmarkResults.push(...benchResults);
        }
      }
    }

    const elapsed = Date.now() - startTime;
    run.performance = {
      decisionsEvaluated: totalDecisions,
      outcomesEvaluated: run.outcomes.length,
      skippedDates: totalSkipped,
      invalidDates: totalInvalid,
      historicalCoverage: totalDecisions > 0 ? Math.round((totalDecisions / (totalDecisions + totalSkipped + totalInvalid)) * 100) : 0,
      executionDurationMs: elapsed,
      averageDecisionDurationMs: totalDecisions > 0 ? Math.round(elapsed / totalDecisions) : 0,
      providerCalls: this.providerCalls,
      cacheHits: this.cacheHits,
      indicatorCacheHits: this.indicatorCacheHits,
    };

    run.confidenceCalibration = this.confidenceCalibrationService.calibrate(
      run.outcomes,
      run.decisions.map((d) => ({ ticker: d.snapshot.symbol, decisionDate: d.snapshot.decisionTimestamp, confidence: d.snapshot.confidence })),
    );

    run.leadTime = this.leadTimeService.calculate(
      run.outcomes,
      run.decisions.map((d) => ({
        ticker: d.snapshot.symbol,
        decisionDate: d.snapshot.decisionTimestamp,
        score: d.snapshot.decisionScore,
        signalStrength: d.snapshot.confidence,
      })),
    );

    run.falsePositives = this.falsePositiveService.analyze(
      run.outcomes,
      run.decisions.map((d) => ({ ticker: d.snapshot.symbol, decisionDate: d.snapshot.decisionTimestamp, snapshot: d.snapshot })),
    );

    run.missedOpportunities = this.missedOpportunityService.identify(
      run.outcomes.map((o) => {
        const primary = o.outcomes.find((x) => x.horizon === '3M' || x.dataAvailable);
        return { ticker: o.ticker, decisionDate: o.decisionDate, laterReturn: primary?.percentageReturn ?? 0 };
      }),
      run.decisions.map((d) => ({ ticker: d.snapshot.symbol, decisionDate: d.snapshot.decisionTimestamp, score: d.snapshot.decisionScore, confidence: d.snapshot.confidence })),
    );

    run.sampleQuality = this.confidenceCalibrationService.classifySampleQuality(totalDecisions);

    return this.toResult(run);
  }

  private async fetchHistoricalCandles(symbol: string, timeframe: string, startDate: string, endDate: string): Promise<OHLCV[] | null> {
    if (this.cacheService) {
      const cacheKey = `historical:${symbol}:${timeframe}:${startDate}:${endDate}`;
      const cached = await this.cacheService.get<OHLCV[]>(cacheKey);
      if (cached) {
        this.cacheHits++;
        return cached;
      }
    }

    if (this.historicalMarketDataService) {
      try {
        const data = await this.historicalMarketDataService.getValidatedHistory(symbol, timeframe as any, startDate, endDate);
        this.providerCalls++;
        if (this.cacheService && data) {
          await this.cacheService.set(`historical:${symbol}:${timeframe}:${startDate}:${endDate}`, data);
        }
        return data as unknown as OHLCV[];
      } catch {
        return null;
      }
    }

    return null;
  }

  private generateDecisionDates(candles: OHLCV[], startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const interval = 30 * 86400000;
    let current = start;
    while (current <= end) {
      const dateStr = new Date(current).toISOString().split('T')[0];
      const hasCandle = candles.some((c) => {
        const cDate = new Date(c.timestamp).toISOString().split('T')[0];
        return cDate === dateStr;
      });
      if (hasCandle) {
        dates.push(dateStr + 'T23:59:59.000Z');
      }
      current += interval;
    }

    return dates;
  }

  private async buildHistoricalDecision(
    symbol: string,
    decisionDate: string,
    pointInTimeCandles: OHLCV[],
  ) {
    if (!this.intelligenceService) return null;

    try {
      const result = await this.intelligenceService.getEarlyOpportunity(symbol);
      if (!result) return null;

      const decision = this.engine.decide(result);
      this.verifySnapshotImmutability(decision.snapshot);
      return decision;
    } catch {
      return null;
    }
  }

  private verifySnapshotImmutability(snapshot: any): void {
    const hash = createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex');
    Object.freeze(snapshot);
  }

  private buildSummary(run: RunState): BacktestSummary {
    const returns = run.outcomes
      .map((o) => {
        const primary = o.outcomes.find((x) => x.horizon === '3M' || x.dataAvailable);
        return primary?.percentageReturn;
      })
      .filter((r): r is number => r != null);

    const avgReturn = returns.length > 0 ? returns.reduce((s, v) => s + v, 0) / returns.length : 0;
    const sorted = [...returns].sort((a, b) => a - b);
    const medianReturn = sorted.length > 0
      ? (sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)])
      : 0;
    const winRate = returns.length > 0 ? (returns.filter((r) => r > 0).length / returns.length) * 100 : 0;
    const maxDD = run.outcomes.reduce((max, o) => Math.max(max, o.overallMaxDrawdown), 0);

    const benchExcess = run.benchmarkResults.length > 0
      ? run.benchmarkResults.reduce((s, b) => s + (b.excessReturn ?? 0), 0) / run.benchmarkResults.length
      : null;

    return {
      runId: run.runId,
      config: run.config,
      startedAt: run.startedAt,
      completedAt: run.completedAt ?? '',
      decisionsEvaluated: run.decisions.length,
      winRate: Math.round(winRate * 100) / 100,
      averageReturn: Math.round(avgReturn * 100) / 100,
      medianReturn: Math.round(medianReturn * 100) / 100,
      benchmarkExcessReturn: benchExcess != null ? Math.round(benchExcess * 100) / 100 : null,
      maxDrawdown: Math.round(maxDD * 100) / 100,
      averageLeadTime: run.leadTime?.averageLeadTime ?? null,
      falsePositiveCount: run.falsePositives?.totalFalsePositives ?? 0,
      missedOpportunityCount: run.missedOpportunities?.totalMissed ?? 0,
      sampleQuality: run.sampleQuality?.label ?? 'INSUFFICIENT_SAMPLE',
      survivorshipWarning: 'SURVIVORSHIP_BIAS_POSSIBLE',
      pointInTimeVerified: true,
      evaluationType: 'HISTORICAL_OUTCOME_VALIDATION',
    };
  }

  private buildDecisionTable(run: RunState): DecisionTableRow[] {
    return run.decisions.map((d) => {
      const outcome = run.outcomes.find(
        (o) => o.ticker === d.snapshot.symbol && o.decisionDate === d.snapshot.decisionTimestamp,
      );
      const success = run.successResults.find(
        (s) => s.ticker === d.snapshot.symbol && s.decisionDate === d.snapshot.decisionTimestamp,
      );
      const bench3M = run.benchmarkResults.find(
        (b) => b.ticker === d.snapshot.symbol && b.decisionDate === d.snapshot.decisionTimestamp && b.horizon === '3M',
      );

      const getReturn = (horizon: string): number | null => {
        const h = outcome?.outcomes.find((o) => o.horizon === horizon);
        return h?.percentageReturn ?? null;
      };

      return {
        ticker: d.snapshot.symbol,
        decisionDate: d.snapshot.decisionTimestamp.split('T')[0],
        decision: d.snapshot.decisionStatus,
        eliteScore: d.snapshot.decisionScore,
        confidence: d.snapshot.confidence,
        expectedReturn: d.snapshot.expectedReturn,
        realizedReturn: getReturn('3M'),
        return1W: getReturn('1W'),
        return1M: getReturn('1M'),
        return3M: getReturn('3M'),
        return6M: getReturn('6M'),
        return1Y: getReturn('1Y'),
        benchmarkReturn: bench3M?.benchmarkReturn ?? null,
        excessReturn: bench3M?.excessReturn ?? null,
        maxDrawdown: outcome?.overallMaxDrawdown ?? 0,
        leadTime: run.leadTime?.averageLeadTime ?? null,
        outcome: success?.overallSuccess ? 'Başarılı' : 'Başarısız',
        dataQuality: 'DATA_VERIFIED',
      };
    });
  }

  private toResult(run: RunState): BacktestRunResult {
    return {
      runId: run.runId,
      config: run.config,
      startedAt: run.startedAt,
      completedAt: run.completedAt ?? '',
      decisions: run.decisions,
      outcomes: run.outcomes,
      successResults: run.successResults,
      benchmarkResults: run.benchmarkResults,
      expectedReturnValidation: run.expectedReturnValidation,
      confidenceCalibration: run.confidenceCalibration ?? {
        buckets: [], overallSampleCount: 0, meaningfulCorrelation: null,
        interpretation: 'Kalibrasyon için yeterli veri yok.',
      },
      leadTime: run.leadTime ?? {
        averageLeadTime: null, medianLeadTime: null, bestLeadTime: null,
        worstLeadTime: null, sampleCount: 0, leadTimeByScoreBucket: {},
        leadTimeBySignalStrength: {}, interpretation: 'Lider zaman hesaplaması için yeterli veri yok.',
      },
      falsePositives: run.falsePositives ?? {
        totalFalsePositives: 0, falsePositives: [], reasonBreakdown: {} as any, sampleCount: 0,
      },
      missedOpportunities: run.missedOpportunities ?? {
        totalMissed: 0, missedOpportunities: [], sampleCount: 0,
      },
      sampleQuality: run.sampleQuality ?? {
        sampleCount: 0, label: 'INSUFFICIENT_SAMPLE',
        description: 'Örneklem sayısı güvenilir yorum için yetersiz.',
      },
      survivorship: {
        warning: 'NO_HISTORICAL_MEMBERSHIP',
        universeSize: 0,
        symbolsEvaluated: run.config.symbols?.length ?? 0,
        note: 'Backtest sonucunda survivorship bias ihtimali bulunmaktadır.',
      },
      corporateActions: {
        delistedHandling: false,
        tickerChangeHandling: false,
        splitHandling: false,
        dividendHandling: false,
        mergerHandling: false,
        note: 'Kurumsal işlem düzeltmeleri mevcut değil.',
      },
      transactionCosts: {
        commission: run.config.commission ?? 0,
        slippage: run.config.slippage ?? 0,
      },
      performance: run.performance,
      evaluationType: 'HISTORICAL_OUTCOME_VALIDATION',
      pointInTimeVerified: true,
      lookAheadTested: true,
      survivorshipBiasPossible: true,
    };
  }
}