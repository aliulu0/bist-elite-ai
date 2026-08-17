import { Module } from '@nestjs/common';
import { ResearchModule } from '../research/research.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { AIProviderRegistry } from './ai-provider-registry';
import { AIConsensusEngine } from './consensus/ai-consensus.engine';
import { AIConsensusRegistry } from './ai-consensus.registry';
import { AIResearchHubService } from './ai-research-hub.service';
import { AIResearchController } from './ai-research.controller';
import { AI_RESEARCH_PROVIDERS_TOKEN } from './providers/ai-provider.interface';
import { GoogleNewsProvider } from './providers/google-news.provider';
import { SerpApiProvider } from './providers/serpapi.provider';
import { GoogleSearchProvider } from './providers/google-search.provider';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { KapProvider } from './providers/kap.provider';
import { TcmbProvider } from './providers/tcmb.provider';
import { MkkProvider } from './providers/mkk.provider';
import { ChatGPTProvider } from './providers/chatgpt.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { PerplexityProvider } from './providers/perplexity.provider';
import { GrokProvider } from './providers/grok.provider';

@Module({
  imports: [ResearchModule, MarketDataModule],
  controllers: [AIResearchController],
  providers: [
    AIProviderRegistry,
    AIConsensusEngine,
    AIConsensusRegistry,
    AIResearchHubService,
    GoogleNewsProvider,
    SerpApiProvider,
    GoogleSearchProvider,
    YahooFinanceProvider,
    KapProvider,
    TcmbProvider,
    MkkProvider,
    ChatGPTProvider,
    GeminiProvider,
    PerplexityProvider,
    GrokProvider,
    {
      provide: AI_RESEARCH_PROVIDERS_TOKEN,
      useFactory: (
        chatgpt: ChatGPTProvider,
        gemini: GeminiProvider,
        perplexity: PerplexityProvider,
        grok: GrokProvider,
        serpApi: SerpApiProvider,
        googleNews: GoogleNewsProvider,
        googleSearch: GoogleSearchProvider,
        yahooFinance: YahooFinanceProvider,
        kap: KapProvider,
        tcmb: TcmbProvider,
        mkk: MkkProvider,
      ) => [
        chatgpt,
        gemini,
        perplexity,
        grok,
        serpApi,
        googleNews,
        googleSearch,
        yahooFinance,
        kap,
        tcmb,
        mkk,
      ],
      inject: [
        ChatGPTProvider,
        GeminiProvider,
        PerplexityProvider,
        GrokProvider,
        SerpApiProvider,
        GoogleNewsProvider,
        GoogleSearchProvider,
        YahooFinanceProvider,
        KapProvider,
        TcmbProvider,
        MkkProvider,
      ],
    },
  ],
  exports: [AIResearchHubService, AIProviderRegistry, AIConsensusEngine, AIConsensusRegistry],
})
export class AIResearchHubModule {}
