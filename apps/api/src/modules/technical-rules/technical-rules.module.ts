import { Module } from '@nestjs/common';
import { TechnicalRulesEngine } from './technical-rules.engine';

@Module({
  providers: [TechnicalRulesEngine],
  exports: [TechnicalRulesEngine],
})
export class TechnicalRulesModule {}
