import { Module, Global } from '@nestjs/common';
import { RecommendationTrackerService } from './recommendation-tracker.service';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { EliteScoreAnalyzerService } from './elite-score-analyzer.service';
import { AIAnalysisReviewerService } from './ai-analysis-reviewer.service';
import { StrategyAnalyzerService } from './strategy-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { RecommendationReportGeneratorService } from './recommendation-report-generator.service';

const providers = [
  RecommendationTrackerService,
  PerformanceEvaluationService,
  EliteScoreAnalyzerService,
  AIAnalysisReviewerService,
  StrategyAnalyzerService,
  FailureAnalyzerService,
  RecommendationReportGeneratorService,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class RecommendationTrackerModule {}
