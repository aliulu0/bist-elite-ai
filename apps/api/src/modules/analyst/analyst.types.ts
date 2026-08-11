import {
  EntryZoneResult,
  EntryTrendDirection,
  EntryQuality,
} from '../entry/entry-zone.types';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { TomorrowCandidateResult } from '../tomorrow/tomorrow.types';
import { DecisionResult } from '../decision/decision.types';
import { VerificationResult } from '../research/interfaces/verification.types';
import { CatalystResultDto } from '../research/interfaces/verification.types';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';

export const ANALYST_ENGINE_VERSION = '1.0.0';

export interface AnalystInput {
  ticker: string;
  company: string | null;
  price: number | null;
  atr: number | null;
  relativeVolume: number | null;
  indicators: IndicatorResult[];
  structure: MarketStructureResult | null;
  opportunity: OpportunityResult | null;
  eliteScore: EliteScoreResult | null;
  tomorrow: TomorrowCandidateResult | null;
  decision: DecisionResult | null;
  entryZone: EntryZoneResult | null;
  verification: VerificationResult | null;
  catalysts: CatalystResultDto[];
}

export interface AnalystResult {
  ticker: string;
  company: string | null;
  genelAnaliz: string;
  teknikAnaliz: string;
  temelAnaliz: string;
  riskAnalizi: string;
  momentumAnalizi: string;
  trendAnalizi: string;
  likiditeAnalizi: string;
  verificationAnalizi: string;
  catalystAnalizi: string;
  entryYorumu: string;
  stopYorumu: string;
  targetYorumu: string;
  strengths: string[];
  weaknesses: string[];
  warnings: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  evaluatedAt: string;
}

export interface AnalystRegistryEntry {
  ticker: string;
  input: AnalystInput;
  result: AnalystResult;
  evaluatedAt: string;
}