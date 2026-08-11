import { Module } from '@nestjs/common';
import { ScoreCalculator } from './score-calculator.service';
import { ScorePipeline } from './score-pipeline.service';
import { ScoreEngine } from './score-engine.service';
import { ScoreRegistry } from './score-registry.service';
import { HistoricalDataModule } from '../historical-data/historical-data.module';
import { AggregationModule } from '../market-data/aggregation/aggregation.module';
import { ResearchModule } from '../research/research.module';
import { IndicatorsModule } from '../indicators/indicators.module';

@Module({
  imports: [HistoricalDataModule, AggregationModule, ResearchModule, IndicatorsModule],
  providers: [ScoreCalculator, ScorePipeline, ScoreEngine, ScoreRegistry],
  exports: [ScoreCalculator, ScorePipeline, ScoreEngine, ScoreRegistry],
})
export class ScoringModule {}