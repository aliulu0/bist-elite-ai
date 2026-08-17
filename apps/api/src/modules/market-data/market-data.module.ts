import { Module, forwardRef } from '@nestjs/common';
import { MarketDataService, DATA_PROVIDER } from './market-data.service';
import { MarketDataValidationService } from './market-data-validation.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';
import { MarketDataController } from './market-data.controller';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { FintablesProvider } from './providers/fintables.provider';
import { ProviderHealthMonitorModule } from '../provider-health-monitor/provider-health-monitor.module';
import { CacheModule } from '../../common/cache/cache.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { MarketDataCacheService } from './cache/market-data-cache.service';
import { MarketDataOrchestrator } from './orchestrator/market-data-orchestrator';
import { FintablesUnifiedAdapter } from './providers/unified/fintables-unified.adapter';
import { SerpApiAdapter } from './providers/unified/serpapi.adapter';
import { KAPAdapter } from './providers/unified/kap.adapter';
import { MKKAdapter } from './providers/unified/mkk.adapter';
import { TCMBAdapter } from './providers/unified/tcmb.adapter';
import { YahooUnifiedAdapter } from './providers/unified/yahoo-unified.adapter';
import { AggregationModule } from './aggregation/aggregation.module';
import { AggregationEngine } from './aggregation/aggregation-engine.service';
import { QualityScorer } from './aggregation/quality-scorer.service';
import { ConflictResolver } from './aggregation/conflict-resolver.service';
import { DataValidator } from './aggregation/data-validator.service';
import { SymbolRegistryService } from './symbol-registry/symbol-registry.service';
import { ProviderErrorClassifier } from './error/error-classifier.service';
import { SymbolNormalizerService } from './symbol-normalizer/symbol-normalizer.service';
import { RequestDeduplicatorService } from './dedup/request-deduplicator.service';
import { MarketDataHealthService } from './health/market-data-health.service';
import { CoverageReportService } from './coverage/coverage-report.service';
import { CacheService } from '../../common/cache/cache.service';
import { IncrementalMarketDataService } from './incremental/incremental-market-data.service';
import { LatestPriceIncrementalService } from './incremental/latest-price-incremental.service';

export const FUNDAMENTAL_PROVIDER = 'FUNDAMENTAL_PROVIDER';
export const UNIFIED_ORCHESTRATOR = 'UNIFIED_ORCHESTRATOR';

const legacyProviders = [
  MarketDataValidationService,
  MarketDataProviderRegistry,
  YahooFinanceProvider,
  FintablesProvider,
  {
    provide: DATA_PROVIDER,
    useFactory: (registry: MarketDataProviderRegistry, yahoo: YahooFinanceProvider) => {
      registry.register(yahoo);
      return yahoo;
    },
    inject: [MarketDataProviderRegistry, YahooFinanceProvider],
  },
  {
    provide: FUNDAMENTAL_PROVIDER,
    useExisting: FintablesProvider,
  },
  MarketDataService,
];

const unifiedProviders = [
  MarketDataCacheService,
  SymbolNormalizerService,
  RequestDeduplicatorService,
  ProviderErrorClassifier,
  MarketDataHealthService,
  CoverageReportService,
  {
    provide: UNIFIED_ORCHESTRATOR,
    useFactory: (
      circuitBreaker: CircuitBreakerService,
      cacheService: MarketDataCacheService,
      yahoo: YahooFinanceProvider,
      symbolRegistry: SymbolRegistryService,
      normalizer: SymbolNormalizerService,
      deduplicator: RequestDeduplicatorService,
      cache: CacheService,
      validationService: MarketDataValidationService,
    ) => {
      const fintables = new FintablesUnifiedAdapter(circuitBreaker);
      const serpApi = new SerpApiAdapter(circuitBreaker);
      const yahooUnified = new YahooUnifiedAdapter(circuitBreaker, yahoo);
      const kap = new KAPAdapter(circuitBreaker);
      const tcmb = new TCMBAdapter(circuitBreaker);
      const mkk = new MKKAdapter(circuitBreaker);

      const orchestrator = new MarketDataOrchestrator(
        circuitBreaker,
        cacheService,
        [fintables, serpApi, yahooUnified, kap, tcmb, mkk],
        undefined,
        symbolRegistry,
        normalizer,
        deduplicator,
        validationService,
      );

      return orchestrator;
    },
    inject: [
      CircuitBreakerService,
      MarketDataCacheService,
      YahooFinanceProvider,
      SymbolRegistryService,
      SymbolNormalizerService,
      RequestDeduplicatorService,
      CacheService,
      MarketDataValidationService,
    ],
  },
];

@Module({
  imports: [
    ProviderHealthMonitorModule,
    CacheModule,
    CircuitBreakerModule,
    forwardRef(() => AggregationModule),
  ],
  controllers: [MarketDataController],
  providers: [
    ...legacyProviders,
    ...unifiedProviders,
    IncrementalMarketDataService,
    LatestPriceIncrementalService,
    {
      provide: MarketDataOrchestrator,
      useExisting: UNIFIED_ORCHESTRATOR,
    },
  ],
  exports: [
    ...legacyProviders,
    ...unifiedProviders,
    IncrementalMarketDataService,
    LatestPriceIncrementalService,
    MarketDataOrchestrator,
    AggregationModule,
  ],
})
export class MarketDataModule {}
