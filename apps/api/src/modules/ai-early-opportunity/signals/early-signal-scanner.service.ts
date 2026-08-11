import { Injectable, Logger, Optional } from '@nestjs/common';
import { PredictionService } from '../../prediction/prediction.service';
import { SmartMoneyService } from '../../smart-money/smart-money.service';
import { CatalystService } from '../../catalyst/catalyst.service';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService, latestPriceStateToDataPoint } from '../../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { MultiTimeframeOpportunityService } from '../multi-timeframe/multi-timeframe.service';
import { FundamentalIntegrationService } from '../../financial-rules/fundamental-integration.service';
import { FinancialDataQualityService } from '../../financial-rules/financial-data-quality.service';
import { EarlySignalScannerEngine } from './early-signal-scanner.engine';
import {
  EarlySignalFilters,
  EarlySignalScannerInput,
  EarlySignalScannerResult,
  EarlySignalScanContext,
  resultMatchesSignalFilters,
} from './early-signal.types';
import { DataQualityContext } from '../../financial-rules/financial-data-quality.types';
import { CacheService } from '../../../common/cache/cache.service';

const SIGNAL_CACHE_NAMESPACE = 'earlySignals';
const SIGNAL_CACHE_TTL_MS = 5 * 60_000;
const TOP_SCAN_CONCURRENCY = 12;

@Injectable()
export class EarlySignalScannerService {
  private readonly logger = new Logger(EarlySignalScannerService.name);

  constructor(
    private readonly predictionService: PredictionService,
    private readonly smartMoneyService: SmartMoneyService,
    private readonly catalystService: CatalystService,
    private readonly multiTimeframeService: MultiTimeframeOpportunityService,
    private readonly marketData: MarketDataOrchestrator,
    private readonly latestPrice: LatestPriceIncrementalService,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly cache: CacheService,
    private readonly engine: EarlySignalScannerEngine,
    @Optional() private readonly fundamental?: FundamentalIntegrationService,
    @Optional() private readonly dataQuality?: FinancialDataQualityService,
  ) {}

  async scan(ticker: string, context: EarlySignalScanContext = {}): Promise<EarlySignalScannerResult | null> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `early-signals:${normalized}`;
    const cached = this.cache.get<EarlySignalScannerResult>(cacheKey, SIGNAL_CACHE_NAMESPACE);
    if (cached) return cached;

    try {
      const symbol = this.symbolRegistry.getSymbol(normalized);
      const company = symbol?.companyName ?? normalized;
      const sector = symbol?.sector ?? '';

      const [prediction, smartMoney, catalyst, multiTimeframe, fundamentals, financialDataQuality] = await Promise.all([
        context.prediction ??
          this.predictionService.getPrediction(normalized, '1d').catch(() => null),
        context.smartMoney ??
          this.smartMoneyService.getSmartMoney(normalized, '1d').catch(() => null),
        context.catalyst ??
          this.catalystService.getCatalyst(normalized).catch(() => null),
        context.multiTimeframe ??
          this.multiTimeframeService.analyze(normalized).catch(() => null),
        context.fundamentals ?? this.fetchFundamentals(normalized, sector),
        context.financialDataQuality ?? this.assessDataQuality(normalized, sector),
      ]);

      if (!prediction && !smartMoney && !catalyst && !multiTimeframe) {
        return null;
      }

      const input: EarlySignalScannerInput = {
        ticker: normalized,
        company,
        sector,
        prediction,
        smartMoney,
        catalyst,
        multiTimeframe,
        fundamentals,
        financialDataQuality,
      };

      const result = this.engine.scan(input);
      this.cache.set(cacheKey, result, SIGNAL_CACHE_TTL_MS, SIGNAL_CACHE_NAMESPACE);
      return result;
    } catch (error) {
      this.logger.debug(
        `Signal scan skipped for ${normalized}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async scanTop(
    limit = 10,
    filters: EarlySignalFilters = {},
    context: EarlySignalScanContext = {},
  ): Promise<EarlySignalScannerResult[]> {
    const active = this.symbolRegistry.getActiveSymbols();
    const results = await this.mapWithConcurrency(active, TOP_SCAN_CONCURRENCY, (symbol) =>
      this.scan(symbol.canonicalTicker, context),
    );

    return results
      .filter((r): r is EarlySignalScannerResult => r !== null && r.signals.length > 0)
      .filter((r) => resultMatchesSignalFilters(r, filters))
      .sort(
        (a, b) =>
          b.convergence.convergenceScore - a.convergence.convergenceScore ||
          b.convergence.avgStrength - a.convergence.avgStrength,
      )
      .slice(0, Math.max(1, limit));
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

  private async fetchFundamentals(ticker: string, sector: string) {
    if (!this.fundamental) return null;
    const bundle = await this.fundamental.getReportAndMarketCap(ticker, sector).catch(() => null);
    return bundle?.report ?? null;
  }

  private async assessDataQuality(ticker: string, sector: string) {
    const [state, historyResult] = await Promise.all([
      this.latestPrice.getLatestPriceIncremental(ticker, '1d').catch(() => null),
      this.marketData.fetchHistoricalData(ticker, '1d', { limit: 30 }).catch(() => null),
    ]);

    const context: DataQualityContext = {
      price: state ? latestPriceStateToDataPoint(state) : null,
      priceProvider: state?.provider,
      priceFallbackUsed: state?.dataFreshness === 'stale',
      priceTimestamp: state?.timestamp,
      history: historyResult?.data ?? [],
      fundamental: null,
      consensus: null,
      providers: this.marketData.getAvailableProviders(),
      now: Date.now(),
    };

    if (!this.dataQuality) return null;
    return this.dataQuality.assess(context).catch(() => null);
  }
}
