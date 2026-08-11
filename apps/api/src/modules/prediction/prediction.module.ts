import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { SmartMoneyModule } from '../smart-money/smart-money.module';
import { CatalystModule } from '../catalyst/catalyst.module';
import { VerificationAIModule } from '../verification-ai/verification-ai.module';
import { BacktestModule } from '../backtest/backtest.module';
import { EntryModule } from '../entry/entry.module';
import { IndicatorCacheModule } from '../indicator-cache/indicator-cache.module';
import { PredictionEngine } from './prediction.engine';
import { PredictionScoreEngine } from './prediction-score.engine';
import { PredictionRegistry } from './prediction-registry';
import { PredictionService } from './prediction.service';
import { PredictionController } from './prediction.controller';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    SmartMoneyModule,
    CatalystModule,
    VerificationAIModule,
    BacktestModule,
    EntryModule,
    IndicatorCacheModule,
  ],
  controllers: [PredictionController],
  providers: [PredictionEngine, PredictionScoreEngine, PredictionRegistry, PredictionService],
  exports: [PredictionService, PredictionEngine, PredictionScoreEngine, PredictionRegistry],
})
export class PredictionModule {}
