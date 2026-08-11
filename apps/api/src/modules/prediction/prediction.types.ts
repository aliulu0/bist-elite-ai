import { Timeframe } from '../indicators/indicator.types';
import { TrendDirection } from '../market-structure/market-structure.types';

export const PREDICTION_ENGINE_VERSION = '1.0.0';

export type PredictionTimeframe = '1h' | '2h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m';

export const PREDICTION_TIMEFRAMES: readonly PredictionTimeframe[] = [
  '1h',
  '2h',
  '4h',
  '1d',
  '1w',
  '1m',
  '3m',
  '6m',
];

export type TrendStrengthLabel = 'strong' | 'moderate' | 'weak';

export type TrendDirectionLabel = 'up' | 'down' | 'sideways';

export type MomentumLabel =
  | 'strong_bullish'
  | 'bullish'
  | 'neutral'
  | 'bearish'
  | 'strong_bearish';

export type RiskLevel = 'low' | 'medium' | 'high';

export type LiquidityQuality = 'high' | 'medium' | 'low';

export type ScenarioBias = 'bullish' | 'neutral' | 'bearish';

export type HoldingUnit = 'hours' | 'days' | 'weeks' | 'months';

export interface PredictionScenario {
  bias: ScenarioBias;
  title: string;
  description: string;
  probability: number;
  trigger: string;
  expectedReturn: number;
}

export interface PredictionSignal {
  type: string;
  strength: number;
  description: string;
}

export interface PredictionFeatures {
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  trendStrength: TrendStrengthLabel;
  trendDirection: TrendDirectionLabel;
  momentum: MomentumLabel;
  expectedVolatility: number;
  expectedReturn: number;
  liquidityQuality: LiquidityQuality;
  risk: RiskLevel;
  riskScore: number;
  signals: PredictionSignal[];
  metadata: Record<string, unknown>;
  isValid: boolean;
}

export interface BacktestAccuracy {
  winRate: number;
  totalTrades: number;
  sharpeRatio: number;
  isValid: boolean;
}

export interface PredictionHoldingPeriod {
  value: number;
  unit: HoldingUnit;
}

export interface PredictionResult {
  ticker: string;
  timeframe: PredictionTimeframe;
  dataTimeframe: Timeframe;
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  confidence: number;
  trendStrength: TrendStrengthLabel;
  trendDirection: TrendDirectionLabel;
  momentum: MomentumLabel;
  expectedReturn: number;
  expectedVolatility: number;
  risk: RiskLevel;
  riskScore: number;
  liquidityQuality: LiquidityQuality;
  expectedHoldingPeriod: PredictionHoldingPeriod;
  entryZone: { min: number; max: number } | null;
  stopZone: number | null;
  target1: number | null;
  target2: number | null;
  riskRewardRatio: number | null;
  scenarios: PredictionScenario[];
  signals: PredictionSignal[];
  backtestAccuracy: BacktestAccuracy;
  verification: string | null;
  catalystScore: number | null;
  smartMoneyScore: number;
  metadata: Record<string, unknown>;
  generatedAt: string;
  isValid: boolean;
}
