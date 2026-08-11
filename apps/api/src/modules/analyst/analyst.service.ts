import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataCacheService } from '../market-data/cache/market-data-cache.service';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorResult, OHLCV } from '../indicators/indicator.types';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { TomorrowRegistry } from '../tomorrow/tomorrow.registry';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { EntryService } from '../entry/entry.service';
import { VerificationRepository } from '../research/verification-repository.service';
import { ResearchIntelligenceService } from '../research/research-intelligence.service';
import { CatalystResultDto, VerificationResult } from '../research/interfaces/verification.types';
import {
  ANALYST_HISTORICAL_LIMIT,
  ANALYST_TIMEFRAME,
} from './analyst.config';
import { AnalystEngine } from './analyst.engine';
import { AnalystRegistry } from './analyst.registry';
import {
  AnalystInput,
  AnalystResult,
} from './analyst.types';

export interface ComputeAnalystOptions {
  company?: string | null;
  price?: number | null;
}

@Injectable()
export class AnalystService {
  private readonly logger = new Logger(AnalystService.name);

  constructor(
    private readonly engine: AnalystEngine,
    private readonly registry: AnalystRegistry,
    private readonly entryService: EntryService,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly eliteScoreRegistry: EliteScoreRegistry,
    private readonly tomorrowRegistry: TomorrowRegistry,
    private readonly decisionRegistry: DecisionRegistry,
    private readonly verificationRepository: VerificationRepository,
    private readonly researchIntelligence: ResearchIntelligenceService,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly marketDataService: MarketDataService,
    private readonly cacheService: MarketDataCacheService,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  getCached(ticker: string): AnalystResult | null {
    return this.registry.get(ticker)?.result ?? null;
  }

  allCached(): AnalystResult[] {
    return this.registry.getAll().map((e) => e.result);
  }

  async computeForTicker(
    ticker: string,
    options?: ComputeAnalystOptions,
  ): Promise<AnalystResult | null> {
    const symbol = this.symbolRegistry.getSymbol(ticker);
    const providerSymbol = symbol?.providers?.yahoo ?? ticker;

    let points: MarketDataPoint[] = [];
    try {
      const cached = await this.cacheService.getOrSet<MarketDataPoint[]>(
        'any',
        'historical',
        providerSymbol,
        () =>
          this.marketDataService.fetchData(providerSymbol, ANALYST_TIMEFRAME, {
            limit: ANALYST_HISTORICAL_LIMIT,
          }),
      );
      points = cached ?? [];
    } catch (error) {
      this.logger.debug(`Tarihsel veri yüklenemedi ${ticker}: ${String(error)}`);
      points = [];
    }

    const ohlcv = this.toOhlcv(points);
    const price =
      options?.price != null
        ? options.price
        : ohlcv.length > 0
          ? ohlcv[ohlcv.length - 1].close
          : null;

    if (price == null && !symbol) {
      return null;
    }

    const company = options?.company ?? symbol?.companyName ?? ticker;

    let indicators: IndicatorResult[] = [];
    let structure: MarketStructureResult | null = null;
    if (ohlcv.length > 0) {
      indicators = this.indicatorEngine.calculateAll(ohlcv, ANALYST_TIMEFRAME);
      structure = this.marketStructureEngine.analyze(ohlcv, ANALYST_TIMEFRAME);
    }

    const atr = this.getIndicatorValue(indicators, 'ATR');
    const relativeVolume = this.getIndicatorValue(indicators, 'RelativeVolume');

    const entryZone = this.entryService.getCached(ticker);
    const opportunity = this.opportunityRegistry.get(ticker)?.result ?? null;
    const eliteScore = this.eliteScoreRegistry.get(ticker)?.result ?? null;
    const tomorrow = this.tomorrowRegistry.get(ticker)?.result ?? null;
    const decision = this.decisionRegistry.get(ticker)?.result ?? null;

    let verification: VerificationResult | null = null;
    try {
      verification =
        (await this.verificationRepository.getVerificationResult(ticker)) ??
        null;
    } catch {
      verification = null;
    }

    let catalysts: CatalystResultDto[] = [];
    try {
      const research = await this.researchIntelligence.getCompanyResearch(ticker);
      catalysts = (research?.catalysts ?? []).map((c) => {
        const importanceScore = c.importance === 'critical' ? 95 : c.importance === 'high' ? 75 : c.importance === 'medium' ? 50 : 25;
        const verificationScore = c.verification === 'verified' ? 90 : c.verification === 'likely' ? 60 : 30;
        const direction = importanceScore >= 70 ? 'Bullish' : importanceScore <= 25 ? 'Bearish' : 'Neutral';
        return {
          id: c.id,
          ticker: c.ticker ?? ticker,
          companyName: c.title,
          type: c.type as any,
          direction: direction as any,
          strength: { score: importanceScore, officialSource: false, verificationScore, freshnessDays: 30, multipleConfirmation: false, historicalImportance: 0.5 },
          title: c.title,
          statement: c.statement,
          url: c.url,
          source: c.source,
          sourceType: c.sourceType,
          detectedAt: c.detectedAt,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'system',
        };
      });
    } catch {
      catalysts = [];
    }

    const input: AnalystInput = {
      ticker,
      company,
      price,
      atr,
      relativeVolume,
      indicators,
      structure,
      opportunity,
      eliteScore,
      tomorrow,
      decision,
      entryZone,
      verification,
      catalysts,
    };

    const result = this.engine.evaluate(input);
    this.registry.set({
      ticker,
      input,
      result,
      evaluatedAt: result.evaluatedAt,
    });
    return result;
  }

  async getByTicker(ticker: string): Promise<AnalystResult> {
    const result = await this.computeForTicker(ticker);
    if (!result) {
      throw new Error(
        `Analiz hesaplanamadı: ${ticker}. Sembol bilinmiyor veya veri yok.`,
      );
    }
    return result;
  }

  async top(limit = 10): Promise<AnalystResult[]> {
    let tickers = this.opportunityRegistry.getAll().map((e) => e.ticker);
    if (tickers.length === 0) {
      tickers = this.symbolRegistry
        .getActiveSymbols()
        .slice(0, 40)
        .map((s) => s.canonicalTicker);
    }
    for (const ticker of tickers) {
      await this.computeForTicker(ticker);
    }
    return this.registry.top(limit);
  }

  async evaluateBatch(items: { ticker: string; company?: string | null; price?: number | null }[]): Promise<AnalystResult[]> {
    const results: AnalystResult[] = [];
    for (const item of items) {
      const result = await this.computeForTicker(item.ticker, {
        company: item.company ?? null,
        price: item.price ?? null,
      });
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  private getIndicatorValue(
    indicators: IndicatorResult[],
    name: string,
  ): number | null {
    const ind = indicators.find((i) => i.indicator === name);
    if (ind?.value == null) return null;
    if (typeof ind.value === 'number') return ind.value as number;
    return null;
  }

  private toOhlcv(points: MarketDataPoint[]): OHLCV[] {
    return points
      .filter((p) => p && typeof p.close === 'number' && Number.isFinite(p.close))
      .map((p) => ({
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        timestamp: p.timestamp,
      }));
  }
}