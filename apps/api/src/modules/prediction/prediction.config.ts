import { Timeframe } from '../indicators/indicator.types';
import { HoldingUnit, PredictionTimeframe } from './prediction.types';

export interface PredictionTimeframeMeta {
  dataTimeframe: Timeframe;
  holdingValue: number;
  holdingUnit: HoldingUnit;
  holdingBars: number;
}

export interface PredictionConfig {
  historicalLimit: number;
  timeframeData: Record<PredictionTimeframe, PredictionTimeframeMeta>;
  weights: {
    trend: number;
    momentum: number;
    moneyFlow: number;
    catalyst: number;
    verification: number;
    meanReversion: number;
  };
  calibration: {
    baseWeight: number;
    historicalWeight: number;
    minTradesRequired: number;
  };
  confidence: {
    agreementBase: number;
    agreementScale: number;
    verificationBoost: number;
    verificationPenalty: number;
    catalystWeight: number;
  };
  risk: {
    highScoreThreshold: number;
    mediumScoreThreshold: number;
    volatilityWeight: number;
    distributionWeight: number;
    liquidityWeight: number;
  };
  liquidity: {
    highVolumeThreshold: number;
    lowVolumeThreshold: number;
  };
  backtest: {
    initialCapital: number;
    minTradesRequired: number;
  };
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  historicalLimit: 260,
  timeframeData: {
    '1h': { dataTimeframe: '4h', holdingValue: 4, holdingUnit: 'hours', holdingBars: 1 },
    '2h': { dataTimeframe: '4h', holdingValue: 8, holdingUnit: 'hours', holdingBars: 2 },
    '4h': { dataTimeframe: '4h', holdingValue: 16, holdingUnit: 'hours', holdingBars: 4 },
    '1d': { dataTimeframe: '1d', holdingValue: 4, holdingUnit: 'days', holdingBars: 4 },
    '1w': { dataTimeframe: '1w', holdingValue: 2, holdingUnit: 'weeks', holdingBars: 2 },
    '1m': { dataTimeframe: '1m', holdingValue: 1, holdingUnit: 'months', holdingBars: 1 },
    '3m': { dataTimeframe: '3m', holdingValue: 3, holdingUnit: 'months', holdingBars: 3 },
    '6m': { dataTimeframe: '6m', holdingValue: 6, holdingUnit: 'months', holdingBars: 6 },
  },
  weights: {
    trend: 0.3,
    momentum: 0.2,
    moneyFlow: 0.2,
    catalyst: 0.1,
    verification: 0.1,
    meanReversion: 0.1,
  },
  calibration: {
    baseWeight: 0.7,
    historicalWeight: 0.3,
    minTradesRequired: 3,
  },
  confidence: {
    agreementBase: 40,
    agreementScale: 0.5,
    verificationBoost: 5,
    verificationPenalty: 10,
    catalystWeight: 0.1,
  },
  risk: {
    highScoreThreshold: 60,
    mediumScoreThreshold: 35,
    volatilityWeight: 0.5,
    distributionWeight: 0.3,
    liquidityWeight: 0.2,
  },
  liquidity: {
    highVolumeThreshold: 3_000_000,
    lowVolumeThreshold: 300_000,
  },
  backtest: {
    initialCapital: 100_000,
    minTradesRequired: 3,
  },
};

export const PREDICTION_CACHE_NAMESPACE = 'research';
export const PREDICTION_CACHE_KEY_PREFIX = 'prediction:';
export const PREDICTION_TTL_MS = 10 * 60_000;
export const PREDICTION_MAX_REGISTRY_ENTRIES = 200;

export function toIndicatorTimeframe(timeframe: PredictionTimeframe): Timeframe {
  return DEFAULT_PREDICTION_CONFIG.timeframeData[timeframe].dataTimeframe;
}
