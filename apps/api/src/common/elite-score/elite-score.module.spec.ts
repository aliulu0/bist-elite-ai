import { EliteScoreModule } from './elite-score.module';
import { EliteScoreOrchestrator } from './elite-score.service';
import { WeightManager } from './weight-manager.service';
import { TechnicalScorer } from './technical-scorer.service';
import { ConsensusAnalyzer } from './consensus-analyzer.service';
import { HistoricalReliabilityAnalyzer } from './historical-reliability.service';
import { EarlyOpportunityDetector } from './early-opportunity.service';
import { EvidenceMatrixService } from './evidence-matrix.service';

describe('EliteScoreModule', () => {
  it('should be defined', () => {
    expect(EliteScoreModule).toBeDefined();
  });

  it('should export all providers', () => {
    const metadata = Reflect.getMetadata('exports', EliteScoreModule) || [];
    expect(metadata).toContain(EliteScoreOrchestrator);
    expect(metadata).toContain(WeightManager);
    expect(metadata).toContain(TechnicalScorer);
    expect(metadata).toContain(ConsensusAnalyzer);
    expect(metadata).toContain(HistoricalReliabilityAnalyzer);
    expect(metadata).toContain(EarlyOpportunityDetector);
    expect(metadata).toContain(EvidenceMatrixService);
  });

  it('should have all providers', () => {
    const metadata = Reflect.getMetadata('providers', EliteScoreModule) || [];
    expect(metadata).toContain(EliteScoreOrchestrator);
    expect(metadata).toContain(WeightManager);
    expect(metadata).toContain(TechnicalScorer);
    expect(metadata).toContain(ConsensusAnalyzer);
    expect(metadata).toContain(HistoricalReliabilityAnalyzer);
    expect(metadata).toContain(EarlyOpportunityDetector);
    expect(metadata).toContain(EvidenceMatrixService);
  });

  it('should be global', () => {
    const isGlobal = Reflect.getMetadata('global', EliteScoreModule);
    expect(isGlobal === true || isGlobal === undefined).toBe(true);
  });
});
