import { Module } from '@nestjs/common';
import { RuleAnalyticsEngine } from './rule-analytics.engine';

@Module({
  providers: [RuleAnalyticsEngine],
  exports: [RuleAnalyticsEngine],
})
export class RuleAnalyticsModule {}
