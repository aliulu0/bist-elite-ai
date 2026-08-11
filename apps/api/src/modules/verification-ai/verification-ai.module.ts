import { Module } from '@nestjs/common';
import { AIResearchHubModule } from '../ai-research/ai-research.module';
import { VerificationRuleEngine } from './verification-rule-engine';
import { VerificationRegistry } from './verification-registry';
import { VerificationAIService } from './verification-ai.service';
import { VerificationController } from './verification-ai.controller';

@Module({
  imports: [AIResearchHubModule],
  controllers: [VerificationController],
  providers: [VerificationRuleEngine, VerificationRegistry, VerificationAIService],
  exports: [VerificationAIService, VerificationRuleEngine, VerificationRegistry],
})
export class VerificationAIModule {}
