import { Module } from '@nestjs/common';
import { HistoricalEarlyOpportunityBacktestService } from './historical-early-opportunity-backtest.service';
import { HistoricalEarlyOpportunityBacktestController } from './historical-early-opportunity-backtest.controller';
import { PointInTimeDataService } from './point-in-time-data.service';
import { FutureOutcomeService } from './future-outcome.service';
import { DecisionSuccessService } from './decision-success.service';
import { BenchmarkService } from './benchmark.service';
import { ConfidenceCalibrationService } from './confidence-calibration.service';
import { LeadTimeService } from './lead-time.service';
import { FalsePositiveService } from './false-positive.service';
import { MissedOpportunityService } from './missed-opportunity.service';
import { HistoricalMarketDataModule } from '../market-data/historical/historical-market-data.module';
import { CacheModule } from '../../common/cache/cache.module';
import { IndicatorCacheModule } from '../indicator-cache/indicator-cache.module';
import { EarlyOpportunityModule } from '../ai-early-opportunity/early-opportunity.module';

@Module({
  imports: [
    HistoricalMarketDataModule,
    CacheModule,
    IndicatorCacheModule,
    EarlyOpportunityModule,
  ],
  controllers: [HistoricalEarlyOpportunityBacktestController],
  providers: [
    HistoricalEarlyOpportunityBacktestService,
    PointInTimeDataService,
    FutureOutcomeService,
    DecisionSuccessService,
    BenchmarkService,
    ConfidenceCalibrationService,
    LeadTimeService,
    FalsePositiveService,
    MissedOpportunityService,
  ],
  exports: [
    HistoricalEarlyOpportunityBacktestService,
    PointInTimeDataService,
    FutureOutcomeService,
  ],
})
export class EarlyOpportunityBacktestModule {}