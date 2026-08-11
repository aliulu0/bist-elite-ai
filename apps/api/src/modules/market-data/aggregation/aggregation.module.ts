import { Module, forwardRef } from '@nestjs/common';
import { AggregationEngine } from './aggregation-engine.service';
import { QualityScorer } from './quality-scorer.service';
import { ConflictResolver } from './conflict-resolver.service';
import { DataValidator } from './data-validator.service';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { CacheModule } from '../../../common/cache/cache.module';
import { MarketDataModule } from '../market-data.module';

@Module({
  imports: [CircuitBreakerModule, CacheModule, forwardRef(() => MarketDataModule)],
  providers: [QualityScorer, ConflictResolver, DataValidator, AggregationEngine],
  exports: [AggregationEngine, QualityScorer, ConflictResolver, DataValidator],
})
export class AggregationModule {}
