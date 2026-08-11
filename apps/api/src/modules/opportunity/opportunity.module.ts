import { Module } from '@nestjs/common';
import { OpportunityEngine } from './opportunity.engine';

@Module({
  providers: [OpportunityEngine],
  exports: [OpportunityEngine],
})
export class OpportunityModule {}
