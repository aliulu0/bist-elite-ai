import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { CatalystModule } from '../catalyst/catalyst.module';
import { VerificationAIModule } from '../verification-ai/verification-ai.module';
import { IndicatorCacheModule } from '../indicator-cache/indicator-cache.module';
import { SmartMoneyEngine } from './smart-money.engine';
import { SmartMoneyScoreEngine } from './smart-money-score.engine';
import { SmartMoneyRegistry } from './smart-money-registry';
import { SmartMoneyService } from './smart-money.service';
import { SmartMoneyController } from './smart-money.controller';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    CatalystModule,
    VerificationAIModule,
    IndicatorCacheModule,
  ],
  controllers: [SmartMoneyController],
  providers: [SmartMoneyEngine, SmartMoneyScoreEngine, SmartMoneyRegistry, SmartMoneyService],
  exports: [SmartMoneyService, SmartMoneyEngine, SmartMoneyScoreEngine, SmartMoneyRegistry],
})
export class SmartMoneyModule {}
