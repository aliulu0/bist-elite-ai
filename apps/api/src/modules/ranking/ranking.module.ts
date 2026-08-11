import { Module } from '@nestjs/common';
import { RankingEngine } from './ranking-engine.service';
import { Normalizer } from './services/normalizer.service';
import { RankingCalculator } from './services/ranking-calculator.service';
import { GradeAssigner } from './services/grade-assigner.service';
import { RecommendationEngine } from './services/recommendation-engine.service';
import { TieBreaker } from './services/tie-breaker.service';
import { RankingStabilizer } from './services/ranking-stabilizer.service';
import { RankingHistory } from './services/ranking-history.service';
import { RankingComparator } from './services/ranking-comparator.service';
import { RankingMetricsCollector } from './services/ranking-metrics-collector.service';
import { DEFAULT_RANKING_CONFIG } from './ranking.config';

const config = DEFAULT_RANKING_CONFIG;

@Module({
  providers: [
    {
      provide: RankingEngine,
      useFactory: () => new RankingEngine(config),
    },
    {
      provide: Normalizer,
      useFactory: () => new Normalizer(config.normalization),
    },
    {
      provide: RankingCalculator,
      useFactory: () => new RankingCalculator(config.factorWeights),
    },
    {
      provide: GradeAssigner,
      useFactory: () => new GradeAssigner(config.gradeThresholds),
    },
    {
      provide: RecommendationEngine,
      useFactory: () => new RecommendationEngine(config.recommendationThresholds),
    },
    {
      provide: TieBreaker,
      useFactory: () => new TieBreaker(),
    },
    {
      provide: RankingStabilizer,
      useFactory: () => new RankingStabilizer(config.stability),
    },
    {
      provide: RankingHistory,
      useFactory: () => new RankingHistory(config.history),
    },
    {
      provide: RankingComparator,
      useFactory: () => new RankingComparator(),
    },
    {
      provide: RankingMetricsCollector,
      useFactory: () => new RankingMetricsCollector(),
    },
  ],
  exports: [
    RankingEngine,
    Normalizer,
    RankingCalculator,
    GradeAssigner,
    RecommendationEngine,
    TieBreaker,
    RankingStabilizer,
    RankingHistory,
    RankingComparator,
    RankingMetricsCollector,
  ],
})
export class RankingModule {}
