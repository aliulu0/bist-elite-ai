export type VerificationStatus = 'Verified' | 'Likely' | 'Unverified' | 'Conflicting' | 'False';

export enum VerificationStatusEnum {
  Verified = 'Verified',
  Likely = 'Likely',
  Unverified = 'Unverified',
  Conflicting = 'Conflicting',
  False = 'False',
}

export type CatalystType =
  | 'new_investment'
  | 'government_tender'
  | 'export_contract'
  | 'import_contract'
  | 'capacity_increase'
  | 'factory_opening'
  | 'patent'
  | 'rnd'
  | 'strategic_partnership'
  | 'acquisition'
  | 'merger'
  | 'ceo_change'
  | 'board_change'
  | 'dividend'
  | 'bonus_issue'
  | 'capital_increase'
  | 'share_buyback'
  | 'spk_decision'
  | 'credit_rating'
  | 'foreign_investment'
  | 'legal_decision'
  | 'tax_incentive'
  | 'sector_incentive'
  | 'government_support'
  | 'large_customer'
  | 'major_order'
  | 'cancellation'
  | 'production_start'
  | 'production_stop'
  | 'raw_material_risk'
  | 'currency_risk';

export type CatalystDirection = 'Bullish' | 'Bearish' | 'Neutral' | 'Unknown';

export interface SourcePriority {
  rank: number;
  label: string;
  weight: number;
}

export const SOURCE_PRIORITY_LIST: SourcePriority[] = [
  { rank: 1, label: 'Official Company Website', weight: 100 },
  { rank: 2, label: 'KAP', weight: 95 },
  { rank: 3, label: 'Investor Relations', weight: 90 },
  { rank: 4, label: 'TCMB', weight: 85 },
  { rank: 5, label: 'MKK', weight: 80 },
  { rank: 6, label: 'Google Finance', weight: 70 },
  { rank: 7, label: 'Google Search', weight: 60 },
  { rank: 8, label: 'Google News', weight: 50 },
  { rank: 9, label: 'RSS', weight: 40 },
  { rank: 10, label: 'Other', weight: 20 },
];

export interface SourceConfidenceFactors {
  officialSource: boolean;
  freshnessDays: number;
  multipleSources: boolean;
  duplicateConfirmation: boolean;
  authority: number;
}

export interface SourceConfidenceResult {
  score: number;
  factors: SourceConfidenceFactors;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface VerificationEvidence {
  id: string;
  source: string;
  sourceType: string;
  title: string;
  snippet?: string;
  url?: string;
  publishedAt?: string;
  classification: string;
  priority: number;
  confidence: number;
  status: VerificationStatus;
  sources?: VerificationEvidence[];
}

export interface VerifiedEvidenceDto {
  id: string;
  ticker: string;
  companyName: string;
  statement: string;
  status: VerificationStatus;
  confidence: number;
  sources: VerificationEvidence[];
  conflictingSources: VerificationEvidence[];
  mergedEvidence: VerificationEvidence[];
  verifiedAt: string;
  verifiedBy: string;
}

export interface ConflictPair {
  statement: string;
  sourceA: VerificationEvidence;
  sourceB: VerificationEvidence;
  detectedAt: string;
}

export interface VerificationResult {
  ticker: string;
  companyName: string;
  totalEvidence: number;
  verifiedCount: number;
  likelyCount: number;
  unverifiedCount: number;
  conflictingCount: number;
  falseCount: number;
  averageConfidence: number;
  conflicts: ConflictPair[];
  evidence: VerifiedEvidenceDto[];
  verifiedAt: string;
}

export interface VerificationDashboardDto {
  totalVerified: number;
  totalLikely: number;
  totalUnverified: number;
  totalConflicting: number;
  totalFalse: number;
  averageConfidence: number;
  verifiedSources: number;
  conflictingSources: number;
  coverage: number;
  lastVerificationDate: string;
  evidence: VerifiedEvidenceDto[];
  conflicts: ConflictPair[];
}

export interface CatalystStrength {
  score: number;
  officialSource: boolean;
  verificationScore: number;
  freshnessDays: number;
  multipleConfirmation: boolean;
  historicalImportance: number;
}

export interface CatalystResultDto {
  id: string;
  ticker: string;
  companyName: string;
  type: CatalystType;
  direction: CatalystDirection;
  strength: CatalystStrength;
  title: string;
  statement: string;
  url?: string;
  source: string;
  sourceType: string;
  detectedAt: string;
  verifiedAt: string;
  verifiedBy: string;
}

export interface CatalystDashboardDto {
  totalCatalysts: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  unknownCount: number;
  averageStrength: number;
  verifiedCatalysts: number;
  unverifiedCatalysts: number;
  coverage: number;
  lastDetectionDate: string;
  catalysts: CatalystResultDto[];
}