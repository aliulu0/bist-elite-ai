import { Injectable, Logger } from '@nestjs/common';
import { AIConsensus } from './ai-research.types';
import { ResearchBundle } from './ai-research.types';
import { AIProviderRegistry } from './ai-provider-registry';
import { AIConsensusEngine } from './consensus/ai-consensus.engine';
import { AIConsensusRegistry } from './ai-consensus.registry';
import { CONSENSUS_CACHE_NAMESPACE, CONSENSUS_TTL_MS } from './ai-research.config';
import { NewsAggregationService } from '../research/news-aggregation.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class AIResearchHubService {
  private readonly logger = new Logger(AIResearchHubService.name);

  constructor(
    private readonly providerRegistry: AIProviderRegistry,
    private readonly consensusEngine: AIConsensusEngine,
    private readonly consensusRegistry: AIConsensusRegistry,
    private readonly newsAggregation: NewsAggregationService,
    private readonly marketDataOrchestrator: MarketDataOrchestrator,
    private readonly cache: CacheService,
  ) {}

  async getConsensus(ticker: string, useCache = true): Promise<AIConsensus> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `consensus:${normalized}`;

    if (useCache) {
      const cached = this.cache.get<AIConsensus>(cacheKey, CONSENSUS_CACHE_NAMESPACE);
      if (cached) return cached;
      const registered = this.consensusRegistry.get(normalized);
      if (registered) return registered;
    }

    const consensus = await this.refreshConsensus(normalized);
    this.cache.set(cacheKey, consensus, CONSENSUS_TTL_MS, CONSENSUS_CACHE_NAMESPACE);
    return consensus;
  }

  async refreshConsensus(ticker: string): Promise<AIConsensus> {
    const normalized = ticker.toUpperCase();
    const bundle = await this.collectBundle(normalized);
    const results = await this.providerRegistry.collectAll(bundle);
    const enabledCount = this.providerRegistry.getEnabled().length;
    const consensus = this.consensusEngine.calculate(normalized, results, enabledCount);
    return this.consensusRegistry.save(consensus);
  }

  getTop(limit = 10): AIConsensus[] {
    return this.consensusRegistry.getTop(limit);
  }

  getProviderStatus() {
    return this.providerRegistry.getStatus();
  }

  private async collectBundle(ticker: string): Promise<ResearchBundle> {
    const [news, company, financials, disclosures, macro] = await Promise.all([
      this.newsAggregation.getCompanyNews(ticker),
      this.marketDataOrchestrator.fetchCompany(ticker),
      this.marketDataOrchestrator.fetchFinancials(ticker),
      this.marketDataOrchestrator.fetchDisclosures(ticker),
      this.marketDataOrchestrator.fetchMacroIndicators(),
    ]);

    return {
      ticker,
      news,
      company,
      financials,
      disclosures,
      macro,
    };
  }
}
