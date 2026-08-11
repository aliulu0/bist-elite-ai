export interface ModuleWeightConfig {
  technical: number;
  fundamental: number;
  financialHealth: number;
  growth: number;
  momentum: number;
  risk: number;
  liquidity: number;
  volatility: number;
  trend: number;
  valuation: number;
}

export interface ModuleEnabledConfig {
  technical: boolean;
  fundamental: boolean;
  financialHealth: boolean;
  growth: boolean;
  momentum: boolean;
  risk: boolean;
  liquidity: boolean;
  volatility: boolean;
  trend: boolean;
  valuation: boolean;
}

export interface SignalThresholdConfig {
  strongBuy: number;
  buy: number;
  accumulate: number;
  reduce: number;
  sell: number;
}

export interface AiAnalysisConfig {
  weights: ModuleWeightConfig;
  enabled: ModuleEnabledConfig;
  signalThresholds: SignalThresholdConfig;
  minDataCompleteness: number;
  pipelineVersion: string;
}

export const DEFAULT_WEIGHTS: ModuleWeightConfig = {
  technical: 12,
  fundamental: 12,
  financialHealth: 10,
  growth: 10,
  momentum: 10,
  risk: 10,
  liquidity: 8,
  volatility: 8,
  trend: 10,
  valuation: 10,
};

export const DEFAULT_ENABLED: ModuleEnabledConfig = {
  technical: true,
  fundamental: true,
  financialHealth: true,
  growth: true,
  momentum: true,
  risk: true,
  liquidity: true,
  volatility: true,
  trend: true,
  valuation: true,
};

export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholdConfig = {
  strongBuy: 80,
  buy: 65,
  accumulate: 55,
  reduce: 45,
  sell: 35,
};

export const DEFAULT_AI_ANALYSIS_CONFIG: AiAnalysisConfig = {
  weights: DEFAULT_WEIGHTS,
  enabled: DEFAULT_ENABLED,
  signalThresholds: DEFAULT_SIGNAL_THRESHOLDS,
  minDataCompleteness: 0.3,
  pipelineVersion: '1.0.0',
};
