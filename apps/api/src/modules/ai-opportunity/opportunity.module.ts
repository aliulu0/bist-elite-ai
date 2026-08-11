import { Module } from '@nestjs/common';
import { DecisionModule } from '../decision/decision.module';
import { OpportunityEngine } from './opportunity-engine.service';
import { OpportunityRegistry } from './opportunity-registry.service';
import { OpportunityRankingService } from './opportunity-ranking.service';
import { OpportunityExplanationService } from './opportunity-explanation.service';
import { OpportunityController } from './opportunity.controller';

@Module({
  imports: [DecisionModule],
  controllers: [OpportunityController],
  providers: [
    OpportunityEngine,
    OpportunityRegistry,
    OpportunityRankingService,
    OpportunityExplanationService,
  ],
  exports: [OpportunityEngine, OpportunityRegistry, OpportunityRankingService],
})
export class OpportunityModule {}
