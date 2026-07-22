import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationTrackerModule } from './recommendation-tracker.module';
import { RecommendationTrackerService } from './recommendation-tracker.service';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { EliteScoreAnalyzerService } from './elite-score-analyzer.service';
import { AIAnalysisReviewerService } from './ai-analysis-reviewer.service';
import { StrategyAnalyzerService } from './strategy-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { RecommendationReportGeneratorService } from './recommendation-report-generator.service';

describe('RecommendationTrackerModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [RecommendationTrackerModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide RecommendationTrackerService', () => {
    const service = module.get<RecommendationTrackerService>(RecommendationTrackerService);
    expect(service).toBeDefined();
  });

  it('should provide PerformanceEvaluationService', () => {
    const service = module.get<PerformanceEvaluationService>(PerformanceEvaluationService);
    expect(service).toBeDefined();
  });

  it('should provide EliteScoreAnalyzerService', () => {
    const service = module.get<EliteScoreAnalyzerService>(EliteScoreAnalyzerService);
    expect(service).toBeDefined();
  });

  it('should provide AIAnalysisReviewerService', () => {
    const service = module.get<AIAnalysisReviewerService>(AIAnalysisReviewerService);
    expect(service).toBeDefined();
  });

  it('should provide StrategyAnalyzerService', () => {
    const service = module.get<StrategyAnalyzerService>(StrategyAnalyzerService);
    expect(service).toBeDefined();
  });

  it('should provide FailureAnalyzerService', () => {
    const service = module.get<FailureAnalyzerService>(FailureAnalyzerService);
    expect(service).toBeDefined();
  });

  it('should provide RecommendationReportGeneratorService', () => {
    const service = module.get<RecommendationReportGeneratorService>(RecommendationReportGeneratorService);
    expect(service).toBeDefined();
  });
});
