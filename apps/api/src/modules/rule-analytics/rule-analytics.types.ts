import { Timeframe } from '../indicators/indicator.types';
import { RuleStatus } from '../technical-rules/technical-rules.types';
import { EliteScoreRating } from '../elite-score/elite-score.types';
import { OpportunityLevel } from '../opportunity/opportunity.types';

export type GroupKey = string;

export interface RuleStat {
  rule: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  medianReturn: number;
  totalReturn: number;
  bestTrade: number;
  worstTrade: number;
  sharpe: number;
}

export interface PairStat {
  ruleA: string;
  ruleB: string;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface TripleStat {
  ruleA: string;
  ruleB: string;
  ruleC: string;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface TimeframeStat {
  timeframe: Timeframe;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface SectorStat {
  sector: string;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface EliteStat {
  rating: EliteScoreRating;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface OpportunityStat {
  level: OpportunityLevel;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
}

export interface RuleAnalyticsResult {
  ruleStatistics: RuleStat[];
  pairStatistics: PairStat[];
  tripleStatistics: TripleStat[];
  timeframeStatistics: TimeframeStat[];
  sectorStatistics: SectorStat[];
  eliteStatistics: EliteStat[];
  opportunityStatistics: OpportunityStat[];
  metadata: Record<string, unknown>;
}
