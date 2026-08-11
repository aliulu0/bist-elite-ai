import { Injectable } from '@nestjs/common';
import { ResearchEvidenceDto } from './verified-evidence.dto';
import {
  VerificationResult,
  VerificationDashboardDto,
  VerifiedEvidenceDto,
  VerificationEvidence,
  VerificationStatus,
  VerificationStatusEnum,
  SOURCE_PRIORITY_LIST,
} from './interfaces/verification.types';

@Injectable()
export class VerificationEngine {
  verify(evidence: ResearchEvidenceDto): VerificationResult {
    const now = new Date().toISOString();
    const sources = evidence.sources ?? [];

    const verificationEvidence: VerificationEvidence[] = sources.map((source) => ({
      id: `ev-${evidence.ticker}-${this.hashId(source.url)}`,
      source: source.title,
      sourceType: source.category,
      title: source.title,
      snippet: source.url,
      url: source.url,
      publishedAt: source.discoveredAt,
      classification: source.classification,
      priority: this.sourcePriority(source.classification),
      confidence: source.isOfficial ? 0.9 : 0.6,
      status: source.isOfficial ? VerificationStatusEnum.Verified : VerificationStatusEnum.Likely,
    }));

    const verifiedCount = verificationEvidence.filter(
      (e) => e.status === VerificationStatusEnum.Verified,
    ).length;
    const likelyCount = verificationEvidence.filter(
      (e) => e.status === VerificationStatusEnum.Likely,
    ).length;
    const status = this.overallStatus(evidence, verifiedCount, likelyCount);
    const confidence = this.computeConfidence(evidence, verifiedCount);

    const entry: VerifiedEvidenceDto = {
      id: `verified-${evidence.ticker}-${Date.now()}`,
      ticker: evidence.ticker,
      companyName: evidence.companyName,
      statement: `Evidence bundle for ${evidence.companyName} (${evidence.ticker})`,
      status,
      confidence,
      sources: verificationEvidence,
      conflictingSources: [],
      mergedEvidence: verificationEvidence,
      verifiedAt: now,
      verifiedBy: 'verification-engine',
    };

    return {
      ticker: evidence.ticker,
      companyName: evidence.companyName,
      totalEvidence: evidence.evidenceCount,
      verifiedCount,
      likelyCount,
      unverifiedCount: Math.max(0, evidence.evidenceCount - verificationEvidence.length),
      conflictingCount: 0,
      falseCount: 0,
      averageConfidence: confidence,
      conflicts: [],
      evidence: [entry],
      verifiedAt: now,
    };
  }

  buildDashboard(evidence: VerifiedEvidenceDto[]): VerificationDashboardDto {
    const verified = evidence.filter((e) => e.status === VerificationStatusEnum.Verified);
    const likely = evidence.filter((e) => e.status === VerificationStatusEnum.Likely);
    const unverified = evidence.filter((e) => e.status === VerificationStatusEnum.Unverified);
    const conflicting = evidence.filter((e) => e.status === VerificationStatusEnum.Conflicting);
    const falseEntries = evidence.filter((e) => e.status === VerificationStatusEnum.False);
    const verifiedSources = evidence.reduce(
      (sum, e) => sum + e.sources.filter((s) => s.status === VerificationStatusEnum.Verified).length,
      0,
    );
    const conflictingSources = evidence.reduce((sum, e) => sum + e.conflictingSources.length, 0);
    const averageConfidence =
      evidence.length > 0
        ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
        : 0;
    const lastVerificationDate = evidence.length > 0 ? evidence[evidence.length - 1].verifiedAt : '';

    return {
      totalVerified: verified.length,
      totalLikely: likely.length,
      totalUnverified: unverified.length,
      totalConflicting: conflicting.length,
      totalFalse: falseEntries.length,
      averageConfidence,
      verifiedSources,
      conflictingSources,
      coverage: evidence.length > 0 ? 1 : 0,
      lastVerificationDate,
      evidence,
      conflicts: [],
    };
  }

  private sourcePriority(classification: string): number {
    const priority = SOURCE_PRIORITY_LIST.find((entry) =>
      entry.label.toLowerCase().includes(classification.toLowerCase()),
    );
    return priority?.rank ?? 10;
  }

  private overallStatus(
    evidence: ResearchEvidenceDto,
    verifiedCount: number,
    likelyCount: number,
  ): VerificationStatus {
    if (evidence.evidenceCount === 0) return VerificationStatusEnum.Unverified;
    if (verifiedCount > 0 && verifiedCount >= likelyCount) return VerificationStatusEnum.Verified;
    if (verifiedCount > 0 || likelyCount > 0) return VerificationStatusEnum.Likely;
    return VerificationStatusEnum.Unverified;
  }

  private computeConfidence(evidence: ResearchEvidenceDto, verifiedCount: number): number {
    if (evidence.evidenceCount === 0) return 0;
    const ratio = verifiedCount / Math.max(1, evidence.evidenceCount);
    return Math.min(1, 0.4 + ratio * 0.6);
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
