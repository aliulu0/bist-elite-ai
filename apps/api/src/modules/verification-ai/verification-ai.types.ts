import { AiResearchSource } from '../ai-research/ai-research.types';

export type VerificationVerdict = 'TRUE' | 'FALSE' | 'PARTIAL' | 'UNVERIFIED';

export interface TrustedSourceRank {
  provider: string;
  rank: number;
  weight: number;
  label: string;
}

export interface VerificationEvidence {
  id: string;
  provider: string;
  source: string;
  title: string;
  url?: string;
  publishedAt?: string;
  official: boolean;
  trustRank: number;
  trustWeight: number;
  confirming: boolean;
}

export interface VerificationClaim {
  statement: string;
  verdict: VerificationVerdict;
  evidenceScore: number;
  truthScore: number;
  evidenceCount: number;
  sourceCount: number;
  trustedSources: string[];
  conflictingSources: string[];
  reason: string;
}

export interface VerificationResult {
  ticker: string;
  verified: VerificationVerdict;
  verificationScore: number;
  evidenceCount: number;
  sourceCount: number;
  trustedSources: string[];
  conflictingSources: string[];
  lastVerified: string;
  verificationReason: string;
  claims: VerificationClaim[];
  rawSources: AiResearchSource[];
}

export interface VerificationReport {
  ticker: string;
  summary: {
    verified: VerificationVerdict;
    verificationScore: number;
    evidenceCount: number;
    sourceCount: number;
    trustedSources: string[];
    conflictingSources: string[];
  };
  claims: VerificationClaim[];
  generatedAt: string;
}
