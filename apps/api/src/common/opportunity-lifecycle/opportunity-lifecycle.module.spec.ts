import { Test, TestingModule } from '@nestjs/testing';
import { OpportunityLifecycleModule } from './opportunity-lifecycle.module';
import { LifecycleTrackerService } from './lifecycle-tracker.service';
import { EvolutionAnalyzerService } from './evolution-analyzer.service';
import { HealthIndexService } from './health-index.service';
import { EarlyDetectionAnalyzerService } from './early-detection-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { LifecycleReportGeneratorService } from './lifecycle-report-generator.service';

describe('OpportunityLifecycleModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [OpportunityLifecycleModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide LifecycleTrackerService', () => {
    expect(module.get(LifecycleTrackerService)).toBeInstanceOf(LifecycleTrackerService);
  });

  it('should provide EvolutionAnalyzerService', () => {
    expect(module.get(EvolutionAnalyzerService)).toBeInstanceOf(EvolutionAnalyzerService);
  });

  it('should provide HealthIndexService', () => {
    expect(module.get(HealthIndexService)).toBeInstanceOf(HealthIndexService);
  });

  it('should provide EarlyDetectionAnalyzerService', () => {
    expect(module.get(EarlyDetectionAnalyzerService)).toBeInstanceOf(EarlyDetectionAnalyzerService);
  });

  it('should provide FailureAnalyzerService', () => {
    expect(module.get(FailureAnalyzerService)).toBeInstanceOf(FailureAnalyzerService);
  });
});
