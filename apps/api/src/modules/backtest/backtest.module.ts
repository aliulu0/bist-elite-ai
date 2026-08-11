import { Module } from '@nestjs/common';
import { CoreBacktestEngine } from './backtest.engine';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';
import { LearningEngine } from './learning/learning-engine';
import { LearningRegistry } from './learning/learning-registry';
import { BacktestRegistry } from './registry/backtest-registry';
import { PortfolioIntegration } from './integration/portfolio-integration';
import { TomorrowLearningLink } from './integration/tomorrow-learning-link';
import { EliteScoreWeightAdapter } from './integration/elite-score-weight.adapter';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { HistoricalMarketDataModule } from '../market-data/historical/historical-market-data.module';
import { HistoricalDataModule } from '../historical-data/historical-data.module';
import { BenchmarkModule } from '../benchmark/benchmark.module';
import { BacktestValidationModule } from '../backtest-validation/backtest-validation.module';
import { WeightOptimizerModule } from '../weight-optimizer/weight-optimizer.module';

@Module({
  imports: [
    IndicatorsModule,
    MarketDataModule,
    HistoricalMarketDataModule,
    HistoricalDataModule,
    BenchmarkModule,
    BacktestValidationModule,
    WeightOptimizerModule,
  ],
  controllers: [BacktestController],
  providers: [
    CoreBacktestEngine,
    BacktestService,
    LearningEngine,
    LearningRegistry,
    BacktestRegistry,
    PortfolioIntegration,
    TomorrowLearningLink,
    EliteScoreWeightAdapter,
  ],
  exports: [BacktestService, BacktestRegistry, LearningEngine, LearningRegistry, CoreBacktestEngine],
})
export class BacktestModule {}
