import { Injectable, Logger } from '@nestjs/common';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { CatalystEngine } from './catalyst-engine';
import { CatalystScoreEngine } from './catalyst-score-engine';
import { CatalystRegistry } from './catalyst-registry';
import { CatalystDashboard, CatalystResult } from './catalyst.types';
import {
  CATALYST_CACHE_KEY_PREFIX,
  CATALYST_CACHE_NAMESPACE,
  CATALYST_TTL_MS,
} from './catalyst.config';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class CatalystService {
  private readonly logger = new Logger(CatalystService.name);

  constructor(
    private readonly researchHub: AIResearchHubService,
    private readonly verificationAI: VerificationAIService,
    private readonly engine: CatalystEngine,
    private readonly scoreEngine: CatalystScoreEngine,
    private readonly registry: CatalystRegistry,
    private readonly cache: CacheService,
  ) {}

  async getCatalyst(ticker: string, useCache = true): Promise<CatalystResult> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `${CATALYST_CACHE_KEY_PREFIX}${normalized}`;

    if (useCache) {
      const cached = this.cache.get<CatalystResult>(cacheKey, CATALYST_CACHE_NAMESPACE);
      if (cached) return cached;
      const registered = this.registry.get(normalized);
      if (registered) return registered;
    }

    const result = await this.refreshCatalyst(normalized);
    this.cache.set(cacheKey, result, CATALYST_TTL_MS, CATALYST_CACHE_NAMESPACE);
    return result;
  }

  async refreshCatalyst(ticker: string): Promise<CatalystResult> {
    const normalized = ticker.toUpperCase();

    const [consensus, verification] = await Promise.all([
      this.researchHub.getConsensus(normalized),
      this.verificationAI.getVerification(normalized),
    ]);

    const events = this.engine.detect({ consensus, verification });
    const result = this.scoreEngine.resultFor(normalized, events, consensus.researchSources ?? []);
    return this.registry.save(result);
  }

  getTop(limit = 10): CatalystResult[] {
    return this.registry.getTop(limit);
  }

  getDashboard(ticker: string, useCache = true): Promise<CatalystDashboard> {
    return this.getCatalyst(ticker, useCache).then((result) => ({
      ticker: result.ticker,
      catalystScore: result.catalystScore,
      confidence: result.confidence,
      expectedImpact: result.expectedImpact,
      eventCount: result.totalCount,
      verifiedCount: result.verifiedCount,
      topEvents: result.events.slice(0, 5),
      generatedAt: result.generatedAt,
    }));
  }
}
