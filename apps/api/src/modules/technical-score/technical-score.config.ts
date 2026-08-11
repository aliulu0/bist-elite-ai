export interface TechnicalScoreConfig {
  weights: Record<string, number>;
  gradeThresholds: {
    aPlus: number;
    a: number;
    b: number;
    c: number;
  };
  confidenceWeights: {
    availableRules: number;
    validIndicators: number;
  };
}

export const DEFAULT_TECHNICAL_SCORE_CONFIG: TechnicalScoreConfig = {
  weights: {
    EMA_ALIGNMENT: 8,
    SMA_ALIGNMENT: 7,
    ICHIMOKU_TREND: 6,
    RSI: 7,
    STOCHASTIC_RSI: 5,
    MACD: 8,
    ROC: 5,
    RELATIVE_VOLUME: 6,
    VOLUME_SPIKE: 4,
    OBV_CONFIRMATION: 5,
    ATR: 3,
    COMPRESSION: 4,
    MFI: 6,
    CMF: 5,
    HH: 7,
    HL: 7,
    BOS: 8,
    CHOCH: 8,
    ACCUMULATION: 7,
    INSTITUTIONAL_PARTICIPATION: 6,
  },
  gradeThresholds: {
    aPlus: 85,
    a: 75,
    b: 60,
    c: 40,
  },
  confidenceWeights: {
    availableRules: 0.6,
    validIndicators: 0.4,
  },
};
