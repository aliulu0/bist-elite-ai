import { Module } from '@nestjs/common';
import { DecisionEngine } from './decision-engine.service';
import { DecisionRegistry } from './decision-registry.service';
import { DecisionExplanationService } from './decision-explanation.service';
import { DecisionController } from './decision.controller';

@Module({
  controllers: [DecisionController],
  providers: [DecisionEngine, DecisionRegistry, DecisionExplanationService],
  exports: [DecisionEngine, DecisionRegistry],
})
export class DecisionModule {}
