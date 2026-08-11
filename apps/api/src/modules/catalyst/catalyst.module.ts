import { Module } from '@nestjs/common';
import { AIResearchHubModule } from '../ai-research/ai-research.module';
import { VerificationAIModule } from '../verification-ai/verification-ai.module';
import { CatalystEngine } from './catalyst-engine';
import { CatalystScoreEngine } from './catalyst-score-engine';
import { CatalystRegistry } from './catalyst-registry';
import { CatalystService } from './catalyst.service';
import { CatalystController } from './catalyst.controller';

@Module({
  imports: [AIResearchHubModule, VerificationAIModule],
  controllers: [CatalystController],
  providers: [CatalystEngine, CatalystScoreEngine, CatalystRegistry, CatalystService],
  exports: [CatalystService, CatalystEngine, CatalystScoreEngine, CatalystRegistry],
})
export class CatalystModule {}
