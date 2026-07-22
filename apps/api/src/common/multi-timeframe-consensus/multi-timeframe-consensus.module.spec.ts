import { MultiTimeframeConsensusModule } from './multi-timeframe-consensus.module';
import { ConsensusOrchestrator } from './consensus-orchestrator.service';
import { ConsensusCalculator } from './consensus-calculator.service';
import { ConflictDetector } from './conflict-detector.service';
import { DominantTrendService } from './dominant-trend.service';
import { EarlyAlignmentService } from './early-alignment.service';
import { ExplanationGenerator } from './explanation-generator.service';

describe('MultiTimeframeConsensusModule', () => {
  it('should be defined', () => {
    expect(MultiTimeframeConsensusModule).toBeDefined();
  });

  it('should have all providers', () => {
    const metadata = Reflect.getMetadata('providers', MultiTimeframeConsensusModule) || [];
    expect(metadata).toContain(ConsensusOrchestrator);
    expect(metadata).toContain(ConsensusCalculator);
    expect(metadata).toContain(ConflictDetector);
    expect(metadata).toContain(DominantTrendService);
    expect(metadata).toContain(EarlyAlignmentService);
    expect(metadata).toContain(ExplanationGenerator);
  });

  it('should export all providers', () => {
    const metadata = Reflect.getMetadata('exports', MultiTimeframeConsensusModule) || [];
    expect(metadata).toContain(ConsensusOrchestrator);
    expect(metadata).toContain(ConsensusCalculator);
    expect(metadata).toContain(ConflictDetector);
    expect(metadata).toContain(DominantTrendService);
    expect(metadata).toContain(EarlyAlignmentService);
    expect(metadata).toContain(ExplanationGenerator);
  });
});
