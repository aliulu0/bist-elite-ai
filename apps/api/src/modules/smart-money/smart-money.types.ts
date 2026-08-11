import { Timeframe } from '../indicators/indicator.types';
import { TrendDirection } from '../market-structure/market-structure.types';

export interface SmartMoneySignal {
  type:
    | 'accumulation'
    | 'distribution'
    | 'volume_confirmation'
    | 'trend_confirmation'
    | 'money_flow_confirmation'
    | 'compression_breakout'
    | 'institutional_participation';
  strength: number;
  description: string;
}

export interface SmartMoneyResult {
  timeframe: Timeframe;
  accumulationScore: number;
  distributionScore: number;
  institutionalActivity: 'accumulating' | 'distributing' | 'neutral';
  smartMoneyConfidence: number;
  trendAlignment: TrendDirection;
  signals: SmartMoneySignal[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export type LiquidityLevel = 'high' | 'medium' | 'low';

export type MoneyFlowDirection = 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';

export type AccumulationLevel = 'very_strong' | 'strong' | 'moderate' | 'weak' | 'none';

export type DistributionLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'none';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface SmartMoneyScoreResult {
  ticker: string;
  timeframe: Timeframe;
  smartMoneyScore: number;
  liquidityScore: number;
  volumeScore: number;
  accumulationScore: number;
  distributionScore: number;
  relativeVolume: number;
  volumeSpike: number;
  volumeSmaTrend: number;
  moneyFlow: MoneyFlowDirection;
  moneyFlowScore: number;
  institutionalActivity: 'accumulating' | 'distributing' | 'neutral';
  confidence: number;
  risk: RiskLevel;
  riskScore: number;
  liquidity: LiquidityLevel;
  accumulationLevel: AccumulationLevel;
  distributionLevel: DistributionLevel;
  avgDailyVolume: number;
  accumulationDays: number;
  distributionDays: number;
  breakoutVolume: boolean;
  signals: SmartMoneySignal[];
  verification: string | null;
  catalystScore: number | null;
  metadata: Record<string, unknown>;
  generatedAt: string;
  isValid: boolean;
}
