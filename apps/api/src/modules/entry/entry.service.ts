import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { toDecisionInput, DecisionInputDto } from '../decision/decision.dto';
import {
  ENTRY_DEFAULT_TOP_LIMIT,
  ENTRY_HISTORICAL_LIMIT,
  ENTRY_TIMEFRAME,
  ENTRY_TOP_UNIVERSE_LIMIT,
} from './entry-zone.config';
import { EntryZoneEngine } from './entry-zone.engine';
import { EntryRegistry } from './entry.registry';
import {
  EntryZoneContext,
  EntryZoneInput,
  EntryZoneResult,
} from './entry-zone.types';

export interface ComputeEntryOptions {
  company?: string | null;
  price?: number | null;
  context?: EntryZoneContext | null;
}

@Injectable()
export class EntryService {
  private readonly logger = new Logger(EntryService.name);

  constructor(
    private readonly engine: EntryZoneEngine,
    private readonly registry: EntryRegistry,
    private readonly marketDataService: MarketDataService,
    private readonly cacheService: MarketDataCacheService,
    private readonly indicatorEngine: IndicatorEngine,
    private readonly marketStructureEngine: MarketStructureEngine,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly eliteScoreRegistry: EliteScoreRegistry,
    private readonly tomorrowRegistry: TomorrowRegistry,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  getCached(ticker: string): EntryZoneResult | null {
    return this.registry.get(ticker)?.result ?? null;
  }

  allCached(): EntryZoneResult[] {
    return this.registry.getAll().map((e) => e.result);
  }

  async computeForTicker(
    ticker: string,
    options?: ComputeEntryOptions,
  ): Promise<EntryZoneResult | null> {
    const symbol = this.symbolRegistry.getSymbol(ticker);
    const providerSymbol = symbol?.providers?.yahoo ?? ticker;

    let points: MarketDataPoint[] = [];
    try {
      const cached = await this.cacheService.getOrSet<MarketDataPoint[]>(
        'any',
        'historical',
        providerSymbol,
        () =>
          this.marketDataService.fetchData(providerSymbol, ENTRY_TIMEFRAME, {
            limit: ENTRY_HISTORICAL_LIMIT,
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
    const context = this.buildContext(ticker, options?.context);

    let indicators: IndicatorResult[] = [];
    let structure: MarketStructureResult | null = null;
    if (ohlcv.length > 0) {
      indicators = this.indicatorEngine.calculateAll(ohlcv, ENTRY_TIMEFRAME);
      structure = this.marketStructureEngine.analyze(ohlcv, ENTRY_TIMEFRAME);
    }

    const input = this.buildEngineInput(
      ticker,
      company,
      price,
      indicators,
      structure,
      context,
    );
    const result = this.engine.evaluate(input);
    this.registry.set({
      ticker,
      input,
      result,
      evaluatedAt: result.evaluatedAt,
    });
    return result;
  }

  async getByTicker(ticker: string): Promise<EntryZoneResult> {
    const result = await this.computeForTicker(ticker);
    if (!result) {
      throw new NotFoundException(
        `Giriş bölgesi hesaplanamadı: ${ticker}. Sembol bilinmiyor veya veri yok.`,
      );
    }
    return result;
  }

  async top(limit: number = ENTRY_DEFAULT_TOP_LIMIT): Promise<EntryZoneResult[]> {
    let tickers = this.opportunityRegistry.getAll().map((e) => e.ticker);
    if (tickers.length === 0) {
      tickers = this.symbolRegistry
        .getActiveSymbols()
        .slice(0, ENTRY_TOP_UNIVERSE_LIMIT)
        .map((s) => s.canonicalTicker);
    }
    const results: EntryZoneResult[] = [];
    for (const ticker of tickers) {
      const result = await this.computeForTicker(ticker);
      if (result) {
        results.push(result);
      }
    }
    return this.registry.top(limit);
  }

  async evaluateBatch(items: DecisionInputDto[]): Promise<EntryZoneResult[]> {
    const results: EntryZoneResult[] = [];
    for (const item of items) {
      const input = toDecisionInput(item);
      const result = await this.computeForTicker(item.ticker, {
        company: item.company,
        price: input.price,
        context: {
          aiScore: input.aiScore,
          aiConfidence: input.aiConfidence,
        },
      });
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  private buildContext(ticker: string, override?: EntryZoneContext | null): EntryZoneContext {
    const opportunity = this.opportunityRegistry.get(ticker)?.result ?? null;
    const elite = this.eliteScoreRegistry.get(ticker)?.result ?? null;
    const tomorrow = this.tomorrowRegistry.get(ticker)?.result ?? null;
    const eliteDaily =
      elite?.horizons.find((h) => h.horizon === 'GUNLUK')?.skor ?? null;
    const base: EntryZoneContext = {
      aiScore: opportunity?.aiScore,
      aiConfidence: opportunity?.aiConfidence,
      decisionScore: opportunity?.decisionScore,
      decisionConfidence: opportunity?.decisionConfidence,
      opportunityScore: opportunity?.opportunityScore,
      opportunityConfidence: opportunity?.confidence,
      eliteDaily,
      tomorrowScore: tomorrow?.tomorrowScore,
      momentum: opportunity?.momentum,
      risk: opportunity?.risk,
    };
    return { ...base, ...(override ?? {}) };
  }

  private buildEngineInput(
    ticker: string,
    company: string | null,
    price: number | null,
    indicators: IndicatorResult[],
    structure: MarketStructureResult | null,
    context: EntryZoneContext,
  ): EntryZoneInput {
    const get = (name: string): IndicatorResult | undefined =>
      indicators.find((i) => i.indicator === name);
    const num = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? v : null;

    const atr = get('ATR');
    const bb = get('BollingerBands');
    const bbValue = (bb?.value as Record<string, number> | null) ?? null;
    const sma20 = get('SMA_20');
    const sma50 = get('SMA_50');
    const sma200 = get('SMA_200');
    const ema20 = get('EMA_20');
    const ema50 = get('EMA_50');
    const ema200 = get('EMA_200');
    const rsi = get('RSI');
    const relativeVolume = get('RelativeVolume');

    return {
      ticker,
      company,
      price,
      atr: num(atr?.value),
      bollinger: {
        upper: num(bbValue?.upper),
        middle: num(bbValue?.middle),
        lower: num(bbValue?.lower),
      },
      sma: {
        sma20: num(sma20?.value),
        sma50: num(sma50?.value),
        sma200: num(sma200?.value),
      },
      ema: {
        ema20: num(ema20?.value),
        ema50: num(ema50?.value),
        ema200: num(ema200?.value),
      },
      rsi: num(rsi?.value),
      relativeVolume: num(relativeVolume?.value),
      supportZones: structure?.supportZones ?? [],
      resistanceZones: structure?.resistanceZones ?? [],
      trend: structure?.trend ?? 'sideways',
      context,
    };
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
