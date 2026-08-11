import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { SmartMoneyModule } from '../smart-money/smart-money.module';
import { TechnicalRulesModule } from '../technical-rules/technical-rules.module';
import { TechnicalScoreModule } from '../technical-score/technical-score.module';
import { TechnicalSummaryModule } from '../technical-summary/technical-summary.module';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { TechnicalAnalysisController } from './technical-analysis.controller';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    SmartMoneyModule,
    TechnicalRulesModule,
    TechnicalScoreModule,
    TechnicalSummaryModule,
  ],
  controllers: [TechnicalAnalysisController],
  providers: [TechnicalAnalysisService],
  exports: [TechnicalAnalysisService],
})
export class TechnicalAnalysisModule {}
