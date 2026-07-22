import { Module, Global } from '@nestjs/common';
import { EliteScoreOrchestrator } from './elite-score.service';
import { WeightManager } from './weight-manager.service';
import { TechnicalScorer } from './technical-scorer.service';
import { ConsensusAnalyzer } from './consensus-analyzer.service';
import { HistoricalReliabilityAnalyzer } from './historical-reliability.service';
import { EarlyOpportunityDetector } from './early-opportunity.service';
import { EvidenceMatrixService } from './evidence-matrix.service';

const providers = [
  EliteScoreOrchestrator,
  WeightManager,
  TechnicalScorer,
  ConsensusAnalyzer,
  HistoricalReliabilityAnalyzer,
  EarlyOpportunityDetector,
  EvidenceMatrixService,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class EliteScoreModule {}
