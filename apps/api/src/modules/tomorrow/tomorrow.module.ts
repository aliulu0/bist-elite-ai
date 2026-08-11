import { Module } from '@nestjs/common';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { TomorrowOpportunityEngine } from './tomorrow.engine';
import { TomorrowRegistry } from './tomorrow.registry';
import { TomorrowService } from './tomorrow.service';
import { TomorrowController } from './tomorrow.controller';

@Module({
  imports: [OpportunityModule, EliteScoreModule],
  controllers: [TomorrowController],
  providers: [TomorrowOpportunityEngine, TomorrowRegistry, TomorrowService],
  exports: [TomorrowOpportunityEngine, TomorrowRegistry, TomorrowService],
})
export class TomorrowModule {}
