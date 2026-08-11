import { Injectable, Logger } from '@nestjs/common';
import {
  EliteScannerStrategy,
  EliteScannerContext,
  EliteScannerResult,
  ScannerInstrument,
  ScannerMarketData,
  EliteScanResponse,
  ScanSummary,
  EliteScannerConfig,
} from './elite-scanner.types';
import { DEFAULT_ELITE_SCANNER_CONFIG } from './elite-scanner.config';
import { ScoreEngine } from '../scoring/score-engine.service';
import { ScoreEngineInput, ScorePipelineInput, HistoricalPricePoint, FinancialSnapshot, VerificationSnapshot, CatalystSnapshot, IndicatorSnapshot } from '../scoring/scoring-types';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataCacheService } from '../market-data/cache/market-data-cache.service';
import { MarketDataPoint } from '../market-data/interfaces';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { OHLCV } from '../indicators/indicator.types';
import { VerificationRepository } from '../research/verification-repository.service';
import { ResearchIntelligenceService } from '../research/research-intelligence.service';

@Injectable()
export class EliteScannerEngine {
  private readonly logger = new Logger(EliteScannerEngine.name);
  private readonly config: EliteScannerConfig;

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly marketDataService: MarketDataService,
    private readonly cacheService: MarketDataCacheService,
    private readonly scoreEngine: ScoreEngine,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly verificationRepository: VerificationRepository,
    private readonly researchIntelligence: ResearchIntelligenceService,
  ) {
    this.config = DEFAULT_ELITE_SCANNER_CONFIG;
  }

  async scan(
    instruments: ScannerInstrument[],
    strategy: EliteScannerStrategy,
  ): Promise<EliteScanResponse> {
    const startTime = Date.now();
    const results: EliteScannerResult[] = [];
    let errorCount = 0;
    let index = 0;

    const worker = async () => {
      while (index < instruments.length) {
        const i = index++;
        const instrument = instruments[i];
        try {
          const marketData = await this.loadMarketData(instrument);
          const scoringResult = await this.scoreInstrument(instrument, marketData, strategy);
          if (scoringResult) {
            results.push(scoringResult);
          }
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `Tarama hatası ${instrument.ticker}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(this.config.concurrency, instruments.length || 1) },
      () => worker(),
    );
    await Promise.all(workers);

    results.sort((a, b) => {
      const scoreDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const strategyDiff = (b.strategyScore ?? 0) - (a.strategyScore ?? 0);
      if (strategyDiff !== 0) return strategyDiff;
      return (b.aiConfidence ?? 0) - (a.aiConfidence ?? 0);
    });

    const durationMs = Date.now() - startTime;
    const summary: ScanSummary = {
      strategyId: strategy.id,
      strategyName: strategy.name,
      scannedCount: instruments.length,
      resultCount: results.length,
      errorCount,
      durationMs,
      completedAt: new Date().toISOString(),
    };

    this.logger.log(
      `Tarama tamamlandı [${strategy.id}]: ${results.length}/${instruments.length} sonuç, ${durationMs}ms`,
    );
    return { results, summary };
  }

  private async loadMarketData(instrument: ScannerInstrument): Promise<ScannerMarketData> {
    const symbol = instrument.yahooTicker || instrument.ticker;

    const [companyResult, pricePoint] = await Promise.all([
      this.withTimeout(
        Promise.resolve(
          this.cacheService.getOrSet('any', 'company', symbol, () => this.orchestrator.fetchCompany(symbol), this.config.cacheLatestTtlMs),
        ),
        this.config.timeoutMs,
      ),
      this.withTimeout(
        Promise.resolve(
          this.cacheService.getOrSet('any', 'latest', symbol, () => this.marketDataService.fetchLatest(symbol), this.config.cacheLatestTtlMs),
        ),
        this.config.timeoutMs,
      ),
    ]);

    const company = companyResult?.data;
    return {
      price: pricePoint?.close ?? null,
      volume: pricePoint?.volume ?? null,
      marketCap: company && company.marketCap > 0 ? company.marketCap : null,
      provider: companyResult?.provider ?? 'yahoo',
      lastUpdate: pricePoint?.timestamp ?? company?.lastUpdated ?? null,
    };
  }

  private async loadHistoricalPrices(symbol: string): Promise<MarketDataPoint[]> {
    try {
      const points = await this.withTimeout(
        Promise.resolve(
          this.cacheService.getOrSet('any', 'historical', symbol, () => this.marketDataService.fetchData(symbol, '1d', { limit: 260 }), this.config.cacheLatestTtlMs),
        ),
        this.config.timeoutMs,
      );
      return points ?? [];
    } catch (error) {
      this.logger.debug(`Tarihsel veri yüklenemedi ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async buildFinancialSnapshot(symbol: string, marketCap: number | null): Promise<FinancialSnapshot | undefined> {
    try {
      const [company, financials, balanceSheet, incomeStatement, cashFlow] = await Promise.all([
        this.withTimeout(this.orchestrator.fetchCompany(symbol), this.config.timeoutMs),
        this.withTimeout(this.orchestrator.fetchFinancials(symbol), this.config.timeoutMs),
        this.withTimeout(this.orchestrator.fetchBalanceSheet(symbol), this.config.timeoutMs),
        this.withTimeout(this.orchestrator.fetchIncomeStatement(symbol), this.config.timeoutMs),
        this.withTimeout(this.orchestrator.fetchCashFlow(symbol), this.config.timeoutMs),
      ]);

      const companyData = company?.data;
      const fin = financials?.data;
      const bal = balanceSheet?.data;
      const inc = incomeStatement?.data;
      const csh = cashFlow?.data;

      const equity = bal?.equity ?? null;
      const totalDebt = bal?.totalDebt ?? null;
      const totalAssets = bal?.totalAssets ?? null;
      const revenue = fin?.revenue ?? inc?.revenue ?? null;
      const netIncome = fin?.netIncome ?? inc?.netProfit ?? null;
      const ebitda = fin?.ebitda ?? inc?.ebitda ?? null;
      const cap = marketCap ?? companyData?.marketCap ?? null;

      return {
        peRatio: cap != null && netIncome != null && netIncome > 0 ? cap / netIncome : null,
        pbRatio: cap != null && equity != null && equity > 0 ? cap / equity : null,
        debtToEquity: totalDebt != null && equity != null && equity > 0 ? totalDebt / equity : null,
        revenueGrowth: null,
        netMargin: revenue != null && revenue > 0 && netIncome != null ? netIncome / revenue : null,
        roe: netIncome != null && equity != null && equity > 0 ? netIncome / equity : null,
        dividendYield: null,
        revenue,
        netIncome,
        totalAssets,
        totalDebt,
        ebitda,
        freeCashFlow: csh?.freeCashFlow ?? null,
      };
    } catch (error) {
      this.logger.debug(`Finansal veri yüklenemedi ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private buildIndicatorSnapshot(points: MarketDataPoint[]): IndicatorSnapshot | undefined {
    if (!points || points.length === 0) return undefined;
    const ohlcv: OHLCV[] = points.map((p) => ({
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
      timestamp: p.timestamp,
    }));
    const results = this.indicatorEngine.calculateAll(ohlcv, '1d');

    const get = (name: string): number | null => {
      const r = results.find((x) => x.indicator === name);
      if (!r || !r.isValid) return null;
      return typeof r.value === 'number' ? r.value : null;
    };
    const getObj = (name: string): Record<string, number> | null => {
      const r = results.find((x) => x.indicator === name);
      if (!r || !r.isValid || typeof r.value !== 'object' || r.value === null) return null;
      return r.value as Record<string, number>;
    };

    const macd = getObj('MACD');
    const bb = getObj('BollingerBands');
    const adx = getObj('ADX');
    const stoch = getObj('StochasticRSI');

    return {
      rsi: get('RSI'),
      macd: macd?.macd ?? null,
      macdSignal: macd?.signal ?? null,
      macdHistogram: macd?.histogram ?? null,
      sma20: get('SMA_20'),
      sma50: get('SMA_50'),
      sma200: get('SMA_200'),
      ema12: get('EMA_12'),
      ema26: get('EMA_26'),
      adx: adx?.adx ?? null,
      atr: get('ATR'),
      bollingerUpper: bb?.upper ?? null,
      bollingerLower: bb?.lower ?? null,
      bollingerMiddle: bb?.middle ?? null,
      stochasticK: stoch?.k ?? null,
      stochasticD: stoch?.d ?? null,
      obv: get('OBV'),
      mfi: get('MFI'),
      roc: get('ROC'),
      cci: null,
      williamsR: null,
      vwap: null,
      ichimokuA: null,
      ichimokuB: null,
    };
  }

  private async buildVerificationSnapshot(ticker: string): Promise<VerificationSnapshot | undefined> {
    try {
      const result = await this.verificationRepository.getVerificationResult(ticker);
      if (!result) return undefined;
      return {
        sourceCount: result.totalEvidence,
        verifiedCount: result.verifiedCount,
        likelyCount: result.likelyCount,
        confidence: result.averageConfidence,
        evidenceCount: result.evidence?.length ?? result.totalEvidence,
      };
    } catch (error) {
      this.logger.debug(`Doğrulama verisi alınamadı ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private async buildCatalystSnapshot(ticker: string): Promise<CatalystSnapshot | undefined> {
    try {
      const research = await this.withTimeout(this.researchIntelligence.getCompanyResearch(ticker), this.config.timeoutMs);
      const catalysts = research?.catalysts ?? [];
      if (catalysts.length === 0) {
        return { count: 0, bullishCount: 0, bearishCount: 0, neutralCount: 0, strongestType: null, strongestDirection: null };
      }
      const bullishCount = catalysts.filter((c) => c.verification === 'verified' || c.verification === 'likely').length;
      const bearishCount = catalysts.filter((c) => c.verification === 'unknown').length;
      const neutralCount = Math.max(0, catalysts.length - bullishCount - bearishCount);
      const directionMap: Record<string, number> = { bullish: bullishCount, bearish: bearishCount, neutral: neutralCount };
      const strongestDirection = Object.keys(directionMap).sort((a, b) => directionMap[b] - directionMap[a])[0] ?? null;
      return {
        count: catalysts.length,
        bullishCount,
        bearishCount,
        neutralCount,
        strongestType: catalysts[0]?.type ?? null,
        strongestDirection,
      };
    } catch (error) {
      this.logger.debug(`Katalizör verisi alınamadı ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private async scoreInstrument(
    instrument: ScannerInstrument,
    marketData: ScannerMarketData,
    strategy: EliteScannerStrategy,
  ): Promise<EliteScannerResult | null> {
    const symbol = instrument.yahooTicker || instrument.ticker;

    const [historicalPoints, financials, verificationData, catalystData] = await Promise.all([
      this.loadHistoricalPrices(symbol),
      this.buildFinancialSnapshot(symbol, marketData.marketCap),
      this.buildVerificationSnapshot(instrument.ticker),
      this.buildCatalystSnapshot(instrument.ticker),
    ]);

    const historicalPrices: HistoricalPricePoint[] | undefined =
      historicalPoints.length > 0
        ? historicalPoints.map((p) => ({
            date: p.timestamp,
            close: p.close,
            volume: p.volume,
            high: p.high,
            low: p.low,
            open: p.open,
          }))
        : undefined;

    const indicators = this.buildIndicatorSnapshot(historicalPoints);

    const context: EliteScannerContext = {
      instrument,
      marketData,
      historicalPrices,
      financials,
      indicators,
      verificationData,
      catalystData,
    };

    const evaluation = strategy.evaluate(context);

    const pipelineInput: ScorePipelineInput = {
      ticker: instrument.ticker,
      company: instrument.company,
      sector: instrument.sector,
      price: marketData.price,
      volume: marketData.volume,
      marketCap: marketData.marketCap,
      provider: marketData.provider,
      lastUpdate: marketData.lastUpdate,
      historicalPrices,
      financials,
      verificationData,
      catalystData,
      indicators,
    };

    const scoreInput: ScoreEngineInput = {
      ticker: instrument.ticker,
      strategyId: strategy.id,
      pipelineInput,
    };

    const scoreOutput = await this.scoreEngine.score(scoreInput);
    const pipelineOutput = scoreOutput.pipeline;
    const allScores = pipelineOutput.scores;

    return {
      ticker: instrument.ticker,
      company: instrument.company,
      sector: instrument.sector,
      price: marketData.price,
      volume: marketData.volume,
      marketCap: marketData.marketCap,
      strategyId: strategy.id,
      strategyName: scoreOutput.strategyName,
      strategyScore: evaluation.score,
      strategyConfidence: evaluation.confidence,
      passedRules: evaluation.passed,
      failedRules: evaluation.failedReasons,
      signals: evaluation.signals,
      technicalScore: allScores.find((s) => s.dimension === 'technical')?.score ?? null,
      fundamentalScore: allScores.find((s) => s.dimension === 'fundamental')?.score ?? null,
      momentumScore: allScores.find((s) => s.dimension === 'momentum')?.score ?? null,
      trendScore: allScores.find((s) => s.dimension === 'trend')?.score ?? null,
      liquidityScore: allScores.find((s) => s.dimension === 'liquidity')?.score ?? null,
      riskScore: allScores.find((s) => s.dimension === 'risk')?.score ?? null,
      volumeScore: allScores.find((s) => s.dimension === 'volume')?.score ?? null,
      qualityScore: allScores.find((s) => s.dimension === 'quality')?.score ?? null,
      verificationScore: allScores.find((s) => s.dimension === 'verification')?.score ?? null,
      catalystScore: allScores.find((s) => s.dimension === 'catalyst')?.score ?? null,
      aiScore: pipelineOutput.aiResult.aiScore,
      aiConfidence: pipelineOutput.aiResult.aiConfidence,
      provider: marketData.provider,
      lastUpdate: marketData.lastUpdate,
      reasons: evaluation.reasons,
      scannedAt: new Date().toISOString(),
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`Zaman aşımı (${timeoutMs}ms)`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
}
