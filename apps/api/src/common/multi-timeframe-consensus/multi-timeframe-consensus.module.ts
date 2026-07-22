import { Module, Global } from '@nestjs/common';
import { ConsensusOrchestrator } from './consensus-orchestrator.service';
import { ConsensusCalculator } from './consensus-calculator.service';
import { ConflictDetector } from './conflict-detector.service';
import { DominantTrendService } from './dominant-trend.service';
import { EarlyAlignmentService } from './early-alignment.service';
import { ExplanationGenerator } from './explanation-generator.service';

const providers = [
  ConsensusOrchestrator,
  ConsensusCalculator,
  ConflictDetector,
  DominantTrendService,
  EarlyAlignmentService,
  ExplanationGenerator,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class MultiTimeframeConsensusModule {}
