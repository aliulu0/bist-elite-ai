import { Module, Global } from '@nestjs/common';
import { LifecycleTrackerService } from './lifecycle-tracker.service';
import { EvolutionAnalyzerService } from './evolution-analyzer.service';
import { HealthIndexService } from './health-index.service';
import { EarlyDetectionAnalyzerService } from './early-detection-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { LifecycleReportGeneratorService } from './lifecycle-report-generator.service';

const providers = [
  LifecycleTrackerService,
  EvolutionAnalyzerService,
  HealthIndexService,
  EarlyDetectionAnalyzerService,
  FailureAnalyzerService,
  LifecycleReportGeneratorService,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class OpportunityLifecycleModule {}
