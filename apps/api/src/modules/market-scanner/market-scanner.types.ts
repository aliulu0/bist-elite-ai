import { EliteScoreRating, EliteScorePriority } from '../elite-score/elite-score.types';
import { OpportunityLevel } from '../opportunity/opportunity.types';
import { CandidatePriority } from '../candidate/candidate.types';

export type SymbolStatus = 'TOP_CANDIDATE' | 'WATCHLIST' | 'REJECTED';

export interface SymbolAnalysis {
  symbol: string;
  eliteScore: number;
  eliteRating: EliteScoreRating;
  elitePriority: EliteScorePriority;
  opportunityLevel: OpportunityLevel;
  opportunityScore: number;
  candidate: boolean;
  candidateScore: number;
  candidatePriority: CandidatePriority;
  financialScore: number;
  technicalScore: number;
  smartMoneyScore: number;
  confluenceScore: number;
  marketStructureScore: number;
  confidence: number;
  earlyOpportunity: boolean;
  reasons: string[];
  riskFactors: string[];
}

export interface RankedSymbol {
  symbol: string;
  status: SymbolStatus;
  eliteScore: number;
  eliteRating: EliteScoreRating;
  opportunityLevel: OpportunityLevel;
  candidateScore: number;
  compositeScore: number;
  rank: number;
  reasons: string[];
}

export interface ScannerStatistics {
  totalSymbols: number;
  topCandidateCount: number;
  watchlistCount: number;
  rejectedCount: number;
  avgEliteScore: number;
  avgOpportunityScore: number;
  avgCandidateScore: number;
  scoreDistribution: Record<string, number>;
}

export interface MarketScannerResult {
  topCandidates: RankedSymbol[];
  watchlist: RankedSymbol[];
  rejected: RankedSymbol[];
  statistics: ScannerStatistics;
  metadata: Record<string, unknown>;
}
