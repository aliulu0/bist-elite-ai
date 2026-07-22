import { Module, Global } from '@nestjs/common';
import { PerformanceMetricsService } from './performance-metrics.service';
import { SignalQualityService } from './signal-quality.service';
import { MarketConditionAnalyzer } from './market-condition.service';
import { MultiTimeframeValidator } from './multi-timeframe-validator.service';
import { EliteScoreValidator } from './elite-score-validator.service';
import { ReportGenerator } from './report-generator.service';
import { ValidationOrchestrator } from './validation-orchestrator.service';

const services = [
  PerformanceMetricsService,
  SignalQualityService,
  MarketConditionAnalyzer,
  MultiTimeframeValidator,
  EliteScoreValidator,
  ReportGenerator,
  ValidationOrchestrator,
];

@Global()
@Module({
  providers: services,
  exports: services,
})
export class StrategyValidationModule {}
