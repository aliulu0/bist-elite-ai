import { Injectable } from '@nestjs/common';
import { AiResearchSource, AIConsensus, AiConflict } from '../ai-research/ai-research.types';
import {
  VerificationClaim,
  VerificationEvidence,
  VerificationResult,
  VerificationVerdict,
} from './verification-ai.types';
import {
  isOfficialProvider,
  resolveTrustRank,
  TRUTH_FALSE_THRESHOLD,
  TRUTH_TRUE_THRESHOLD,
} from './verification-ai.config';

@Injectable()
export class VerificationRuleEngine {
  normalize(sources: AiResearchSource[]): VerificationEvidence[] {
    const seen = new Set<string>();
    const result: VerificationEvidence[] = [];

    for (const source of sources) {
      const key = source.url ?? `${source.provider}-${source.title}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const rank = resolveTrustRank(source.provider, source.source);
      result.push({
        id: `ev-${source.provider}-${this.hashId(key)}`,
        provider: source.provider,
        source: source.source,
        title: source.title,
        url: source.url,
        publishedAt: source.publishedAt,
        official: isOfficialProvider(source.provider, source.source),
        trustRank: rank.rank,
        trustWeight: rank.weight,
        confirming: true,
      });
    }

    return result;
  }

  crossCheck(
    evidence: VerificationEvidence[],
    conflicts: AiConflict[],
  ): { trusted: VerificationEvidence[]; conflicting: VerificationEvidence[]; confirming: VerificationEvidence[] } {
    const conflictProviders = new Set<string>();
    for (const conflict of conflicts) {
      for (const provider of conflict.providers) {
        conflictProviders.add(provider);
      }
    }

    const conflicting = evidence.filter((item) => conflictProviders.has(item.provider));
    const trusted = evidence.filter((item) => item.trustRank <= 5 && !conflictProviders.has(item.provider));

    const trustedSet = new Set(trusted.map((item) => `${item.provider}:${item.title}`));
    const confirming = evidence.filter((item) => {
      if (conflictProviders.has(item.provider)) return false;
      return trustedSet.has(`${item.provider}:${item.title}`) || item.trustRank <= 5;
    });

    return { trusted, conflicting, confirming };
  }

  computeEvidenceScore(evidence: VerificationEvidence[]): number {
    if (evidence.length === 0) return 0;

    const totalWeight = evidence.reduce((sum, item) => sum + item.trustWeight, 0);
    const maxPossible = evidence.length * 100;
    const weightRatio = totalWeight / maxPossible;

    const distinctProviders = new Set(evidence.map((item) => item.provider)).size;
    const corroboration = Math.min(1, distinctProviders / 3);

    const officialRatio = evidence.filter((item) => item.official).length / evidence.length;

    return Math.min(1, 0.5 * weightRatio + 0.3 * corroboration + 0.2 * officialRatio);
  }

  computeTruthScore(
    evidenceScore: number,
    consensusAgreement: number,
    conflictSeverity: number,
  ): number {
    const conflictPenalty = Math.min(0.4, conflictSeverity * 0.15);
    const raw = 0.6 * evidenceScore + 0.4 * consensusAgreement;
    return Math.max(0, Math.min(1, raw - conflictPenalty));
  }

  verdictFor(truthScore: number, evidenceCount: number, conflictCount: number): VerificationVerdict {
    if (evidenceCount === 0) return 'UNVERIFIED';
    if (truthScore >= TRUTH_TRUE_THRESHOLD && conflictCount === 0) return 'TRUE';
    if (truthScore < TRUTH_FALSE_THRESHOLD) return 'FALSE';
    return 'PARTIAL';
  }

  verifyConsensus(consensus: AIConsensus): VerificationResult {
    const evidence = this.normalize(consensus.researchSources ?? []);
    const cross = this.crossCheck(evidence, consensus.conflicts ?? []);

    const conflictSeverity = (consensus.conflicts ?? []).reduce((sum, conflict) => {
      const weight = conflict.severity === 'high' ? 2 : conflict.severity === 'medium' ? 1 : 0.5;
      return sum + weight;
    }, 0);

    const evidenceScore = this.computeEvidenceScore(cross.confirming);
    const truthScore =
      evidence.length === 0
        ? 0
        : this.computeTruthScore(evidenceScore, consensus.agreementLevel ?? 0, conflictSeverity);
    const conflictCount = (consensus.conflicts ?? []).length;
    const verdict = this.verdictFor(truthScore, evidence.length, conflictCount);

    const trustedSources = [...new Set(cross.trusted.map((item) => item.source))];
    const conflictingSources = [...new Set(cross.conflicting.map((item) => item.source))];

    const reason = this.buildReason(verdict, evidence.length, trustedSources.length, conflictingSources.length, truthScore);

    const claim = this.buildClaim(consensus, verdict, evidenceScore, truthScore, trustedSources, conflictingSources, reason);

    return {
      ticker: consensus.ticker,
      verified: verdict,
      verificationScore: Math.round(truthScore * 100),
      evidenceCount: evidence.length,
      sourceCount: new Set(evidence.map((item) => item.source)).size,
      trustedSources,
      conflictingSources,
      lastVerified: new Date().toISOString(),
      verificationReason: reason,
      claims: [claim],
      rawSources: consensus.researchSources ?? [],
    };
  }

  private buildClaim(
    consensus: AIConsensus,
    verdict: VerificationVerdict,
    evidenceScore: number,
    truthScore: number,
    trustedSources: string[],
    conflictingSources: string[],
    reason: string,
  ): VerificationClaim {
    const statement = consensus.newsSummary || `Araştırma konsensüsü (${consensus.ticker})`;
    return {
      statement,
      verdict,
      evidenceScore,
      truthScore,
      evidenceCount: consensus.totalEvidence ?? 0,
      sourceCount: new Set((consensus.researchSources ?? []).map((item) => item.source)).size,
      trustedSources,
      conflictingSources,
      reason,
    };
  }

  private buildReason(
    verdict: VerificationVerdict,
    evidenceCount: number,
    trustedCount: number,
    conflictingCount: number,
    truthScore: number,
  ): string {
    switch (verdict) {
      case 'UNVERIFIED':
        return 'Bu hisse için yeterli doğrulanabilir kaynak bulunamadı.';
      case 'TRUE':
        return `${evidenceCount} kanıt, ${trustedCount} güvenilir kaynak ile doğrulandı (güven skoru ${Math.round(truthScore * 100)}).`;
      case 'FALSE':
        return `${conflictingCount} çelişkili kaynak nedeniyle doğrulama başarısız (güven skoru ${Math.round(truthScore * 100)}).`;
      default:
        return `Kısmi doğrulama: ${trustedCount} güvenilir, ${conflictingCount} çelişkili kaynak (güven skoru ${Math.round(truthScore * 100)}).`;
    }
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
