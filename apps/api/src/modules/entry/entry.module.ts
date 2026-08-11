import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { TomorrowModule } from '../tomorrow/tomorrow.module';
import { EntryZoneEngine } from './entry-zone.engine';
import { EntryRegistry } from './entry.registry';
import { EntryService } from './entry.service';
import { EntryController } from './entry.controller';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    OpportunityModule,
    EliteScoreModule,
    TomorrowModule,
  ],
  controllers: [EntryController],
  providers: [EntryZoneEngine, EntryRegistry, EntryService],
  exports: [EntryZoneEngine, EntryRegistry, EntryService],
})
export class EntryModule {}
