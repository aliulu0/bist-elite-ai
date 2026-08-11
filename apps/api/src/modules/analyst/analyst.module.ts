import { Module } from '@nestjs/common';
import { AnalystEngine } from './analyst.engine';
import { AnalystExplanationEngine } from './analyst-explanation.engine';
import { AnalystRegistry } from './analyst.registry';
import { AnalystService } from './analyst.service';
import { AnalystController } from './analyst.controller';
import { EntryModule } from '../entry/entry.module';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { TomorrowModule } from '../tomorrow/tomorrow.module';
import { DecisionModule } from '../decision/decision.module';
import { ResearchModule } from '../research/research.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    EntryModule,
    OpportunityModule,
    EliteScoreModule,
    TomorrowModule,
    DecisionModule,
    ResearchModule,
  ],
  controllers: [AnalystController],
  providers: [
    AnalystExplanationEngine,
    AnalystEngine,
    AnalystRegistry,
    AnalystService,
  ],
  exports: [AnalystEngine, AnalystRegistry, AnalystService],
})
export class AnalystModule {}