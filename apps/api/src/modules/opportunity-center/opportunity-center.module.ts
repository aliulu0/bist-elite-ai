import { Module } from '@nestjs/common';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { EntryModule } from '../entry/entry.module';
import { AnalystModule } from '../analyst/analyst.module';
import { OpportunityCenterService } from './opportunity-center.service';
import { OpportunityCenterRegistry } from './opportunity-center.registry';
import { OpportunityCenterController } from './opportunity-center.controller';

@Module({
  imports: [OpportunityModule, EliteScoreModule, EntryModule, AnalystModule],
  controllers: [OpportunityCenterController],
  providers: [OpportunityCenterService, OpportunityCenterRegistry],
  exports: [OpportunityCenterService, OpportunityCenterRegistry],
})
export class OpportunityCenterModule {}
