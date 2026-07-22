import { Module, Global } from '@nestjs/common';
import { ScoringDiagnosticsService } from './scoring-diagnostics.service';
import { PerformanceEvaluatorService } from './performance-evaluator.service';
import { TrendAnalyzerService } from './trend-analyzer.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { CalibrationReportGeneratorService } from './calibration-report-generator.service';
import { CalibrationOrchestrator } from './calibration-orchestrator.service';

const services = [
  ScoringDiagnosticsService,
  PerformanceEvaluatorService,
  TrendAnalyzerService,
  RecommendationEngineService,
  CalibrationReportGeneratorService,
  CalibrationOrchestrator,
];

@Global()
@Module({
  providers: services,
  exports: services,
})
export class AdaptiveCalibrationModule {}
