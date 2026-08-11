import { Injectable } from '@nestjs/common';
import { AIConsensus, AiResearchSource, ResearchImportance } from '../ai-research/ai-research.types';
import { VerificationResult } from '../verification-ai/verification-ai.types';
import {
  CatalystCategory,
  CatalystEvent,
  ExpectedImpact,
  TimeHorizon,
} from './catalyst.types';
import {
  categorizeTitle,
  getCategoryConfig,
} from './catalyst.config';

export interface CatalystInput {
  consensus: AIConsensus;
  verification: VerificationResult | null;
}

@Injectable()
export class CatalystEngine {
  normalize(sources: AiResearchSource[]): { title: string; description: string; source: string; provider: string; url?: string; publishedAt?: string }[] {
    const seen = new Set<string>();
    const result: { title: string; description: string; source: string; provider: string; url?: string; publishedAt?: string }[] = [];

    for (const source of sources) {
      const key = source.url ?? `${source.provider}-${source.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        title: source.title,
        description: source.title,
        source: source.source,
        provider: source.provider,
        url: source.url,
        publishedAt: source.publishedAt,
      });
    }

    return result;
  }

  categorize(title: string): { category: CatalystCategory; keywords: string[] } {
    return categorizeTitle(title);
  }

  impactFor(category: CatalystCategory): ExpectedImpact {
    return getCategoryConfig(category).impact;
  }

  timeHorizonFor(category: CatalystCategory): TimeHorizon {
    return getCategoryConfig(category).timeHorizon;
  }

  detect(input: CatalystInput): CatalystEvent[] {
    const { consensus, verification } = input;
    const sources = this.normalize(consensus.researchSources ?? []);
    const verified = verification?.verified === 'TRUE';
    const verificationScore = verification?.verificationScore ?? 0;

    const trustedProviders = new Set(verification?.trustedSources ?? []);
    const conflictingProviders = new Set(verification?.conflictingSources ?? []);

    return sources.map((source, index) => {
      const { category, keywords } = this.categorize(source.title);
      const importance = this.importanceFor(category, verified);

      const isTrusted = trustedProviders.size === 0 || trustedProviders.has(source.source) || source.provider === 'kap' || source.provider === 'tcmb';
      const isConflicting = conflictingProviders.has(source.source);

      return {
        id: `cat-${consensus.ticker}-${index}-${this.hashId(source.title)}`,
        ticker: consensus.ticker,
        category,
        title: source.title,
        description: source.description,
        importance,
        verified,
        verificationScore,
        date: source.publishedAt ?? new Date().toISOString(),
        source: source.source,
        provider: source.provider,
        url: source.url,
        expectedImpact: this.impactFor(category),
        timeHorizon: this.timeHorizonFor(category),
        confidence: this.confidenceFor(verified, verificationScore, isTrusted, isConflicting, importance),
        catalystScore: 0,
        keywords,
      };
    });
  }

  private importanceFor(category: CatalystCategory, verified: boolean): ResearchImportance {
    const impact = this.impactFor(category);
    if (impact === 'very_bullish') return verified ? ResearchImportance.CRITICAL : ResearchImportance.HIGH;
    if (impact === 'bullish') return verified ? ResearchImportance.HIGH : ResearchImportance.MEDIUM;
    if (impact === 'very_bearish') return ResearchImportance.CRITICAL;
    return ResearchImportance.MEDIUM;
  }

  private confidenceFor(
    verified: boolean,
    verificationScore: number,
    isTrusted: boolean,
    isConflicting: boolean,
    importance: ResearchImportance,
  ): number {
    let confidence = 0.4;
    if (verified) confidence += 0.35;
    if (isTrusted) confidence += 0.15;
    if (isConflicting) confidence -= 0.25;
    if (importance === ResearchImportance.CRITICAL) confidence += 0.05;
    if (importance === ResearchImportance.HIGH) confidence += 0.05;

    const verificationFactor = verified ? 1 : 0.7;
    return Math.max(0, Math.min(0.98, confidence * verificationFactor));
  }

  private hashId(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
