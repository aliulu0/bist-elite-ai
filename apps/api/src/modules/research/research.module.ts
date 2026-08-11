import { Module } from '@nestjs/common';
import { CircuitBreakerModule } from '../market-data/circuit-breaker/circuit-breaker.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { ResearchCacheService } from './research-cache.service';
import { ResearchRepository } from './research-repository.service';
import { VerificationRepository } from './verification-repository.service';
import { VerificationEngine } from './verification-engine.service';
import { GoogleNewsProvider } from './providers/google-news.provider';
import { SerpApiResearchProvider } from './providers/serp-api.research-provider';
import { AgentReachProvider } from './providers/agent-reach.provider';
import { NewsAggregationService } from './news-aggregation.service';
import { ResearchAggregatorService } from './research-aggregator.service';
import { ResearchScoreService } from './research-score.service';
import { ResearchVerificationService } from './research-verification.service';
import { CatalystDetectionService } from './catalyst-detection.service';
import { ResearchIntelligenceService } from './research-intelligence.service';
import { ResearchController } from './research.controller';
import { ResearchIntelligenceController } from './research-intelligence.controller';

export const RESEARCH_PROVIDERS = 'RESEARCH_PROVIDERS';

@Module({
  imports: [CircuitBreakerModule, MarketDataModule],
  controllers: [ResearchController, ResearchIntelligenceController],
  providers: [
    ResearchCacheService,
    ResearchRepository,
    VerificationRepository,
    VerificationEngine,
    NewsAggregationService,
    GoogleNewsProvider,
    SerpApiResearchProvider,
    AgentReachProvider,
    ResearchAggregatorService,
    ResearchScoreService,
    ResearchVerificationService,
    CatalystDetectionService,
    ResearchIntelligenceService,
    {
      provide: RESEARCH_PROVIDERS,
      useFactory: (googleNews: GoogleNewsProvider, agentReach: AgentReachProvider) => [googleNews, agentReach],
      inject: [GoogleNewsProvider, AgentReachProvider],
    },
  ],
  exports: [
    NewsAggregationService,
    RESEARCH_PROVIDERS,
    GoogleNewsProvider,
    AgentReachProvider,
    ResearchRepository,
    VerificationRepository,
    VerificationEngine,
    ResearchIntelligenceService,
    CatalystDetectionService,
  ],
})
export class ResearchModule {}
