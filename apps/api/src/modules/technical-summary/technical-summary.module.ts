import { Module } from '@nestjs/common';
import { TechnicalSummaryGenerator } from './technical-summary.generator';

@Module({
  providers: [TechnicalSummaryGenerator],
  exports: [TechnicalSummaryGenerator],
})
export class TechnicalSummaryModule {}
