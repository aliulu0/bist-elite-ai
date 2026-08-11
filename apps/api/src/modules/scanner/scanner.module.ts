import { Module } from '@nestjs/common';
import { ScannerEngine } from './scanner-engine.service';
import { FilterEngine } from './services/filter-engine.service';
import { Ranker } from './services/ranker.service';
import { SortEngine } from './services/sort-engine.service';
import { Categorizer } from './services/categorizer.service';
import { Grouper } from './services/grouper.service';
import { DuplicateMerger } from './services/duplicate-merger.service';
import { HistoryTracker } from './services/history-tracker.service';
import { WatchlistManager } from './services/watchlist-manager.service';
import { ScannerMetricsCollector } from './services/scanner-metrics-collector.service';
import { DEFAULT_SCANNER_CONFIG } from './scanner.config';
import { MarketDataModule } from '../market-data/market-data.module';
import { ScoringModule } from '../scoring/scoring.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { ResearchModule } from '../research/research.module';
import { DecisionModule } from '../decision/decision.module';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EntryModule } from '../entry/entry.module';
import { AnalystModule } from '../analyst/analyst.module';
import { ScannerRegistry } from './scanner-registry.service';
import { StrategyRegistry } from './strategy-registry.service';
import { EliteScannerEngine } from './elite-scanner-engine.service';
import { ScannerFilter } from './scanner-filter.service';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';

const config = DEFAULT_SCANNER_CONFIG;

@Module({
  imports: [MarketDataModule, ScoringModule, IndicatorsModule, ResearchModule, DecisionModule, OpportunityModule, EntryModule, AnalystModule],
  controllers: [ScannerController],
  providers: [
    {
      provide: ScannerEngine,
      useFactory: () => new ScannerEngine(config),
    },
    {
      provide: FilterEngine,
      useFactory: () => new FilterEngine(config.filters),
    },
    {
      provide: Ranker,
      useFactory: () => new Ranker(config.ranking),
    },
    {
      provide: SortEngine,
      useFactory: () => new SortEngine(),
    },
    {
      provide: Categorizer,
      useFactory: () => new Categorizer(config.categoryThresholds),
    },
    {
      provide: Grouper,
      useFactory: () => new Grouper(config.groupConfig),
    },
    {
      provide: DuplicateMerger,
      useFactory: () => new DuplicateMerger(config.duplicateMerge),
    },
    {
      provide: HistoryTracker,
      useFactory: () => new HistoryTracker(),
    },
    {
      provide: WatchlistManager,
      useFactory: () => new WatchlistManager(config.watchlists),
    },
    {
      provide: ScannerMetricsCollector,
      useFactory: () => new ScannerMetricsCollector(),
    },
    ScannerRegistry,
    StrategyRegistry,
    EliteScannerEngine,
    ScannerFilter,
    ScannerService,
  ],
  exports: [
    ScannerEngine,
    FilterEngine,
    Ranker,
    SortEngine,
    Categorizer,
    Grouper,
    DuplicateMerger,
    HistoryTracker,
    WatchlistManager,
    ScannerMetricsCollector,
    ScannerRegistry,
    StrategyRegistry,
    EliteScannerEngine,
    ScannerFilter,
    ScannerService,
  ],
})
export class ScannerModule {}
