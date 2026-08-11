import { Injectable, Logger } from '@nestjs/common';
import { AIConsensus } from '../ai-research/ai-research.types';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { VerificationRuleEngine } from './verification-rule-engine';
import { VerificationRegistry } from './verification-registry';
import { VerificationReport, VerificationResult } from './verification-ai.types';
import {
  VERIFICATION_CACHE_KEY_PREFIX,
  VERIFICATION_CACHE_NAMESPACE,
  VERIFICATION_TTL_MS,
} from './verification-ai.config';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class VerificationAIService {
  private readonly logger = new Logger(VerificationAIService.name);

  constructor(
    private readonly researchHub: AIResearchHubService,
    private readonly ruleEngine: VerificationRuleEngine,
    private readonly registry: VerificationRegistry,
    private readonly cache: CacheService,
  ) {}

  async getVerification(ticker: string, useCache = true): Promise<VerificationResult> {
    const normalized = ticker.toUpperCase();
    const cacheKey = `${VERIFICATION_CACHE_KEY_PREFIX}${normalized}`;

    if (useCache) {
      const cached = this.cache.get<VerificationResult>(cacheKey, VERIFICATION_CACHE_NAMESPACE);
      if (cached) return cached;
      const registered = this.registry.get(normalized);
      if (registered) return registered;
    }

    const result = await this.refreshVerification(normalized);
    this.cache.set(cacheKey, result, VERIFICATION_TTL_MS, VERIFICATION_CACHE_NAMESPACE);
    return result;
  }

  async refreshVerification(ticker: string): Promise<VerificationResult> {
    const normalized = ticker.toUpperCase();
    const consensus = await this.researchHub.getConsensus(normalized);
    const result = this.ruleEngine.verifyConsensus(consensus);
    return this.registry.save(result);
  }

  async getReport(ticker: string, useCache = true): Promise<VerificationReport> {
    const result = await this.getVerification(ticker, useCache);
    return {
      ticker: result.ticker,
      summary: {
        verified: result.verified,
        verificationScore: result.verificationScore,
        evidenceCount: result.evidenceCount,
        sourceCount: result.sourceCount,
        trustedSources: result.trustedSources,
        conflictingSources: result.conflictingSources,
      },
      claims: result.claims,
      generatedAt: new Date().toISOString(),
    };
  }

  async getDashboard(): Promise<VerificationResult[]> {
    return this.registry.getAll();
  }

  getFromRegistry(ticker: string): VerificationResult | undefined {
    return this.registry.get(ticker);
  }
}
