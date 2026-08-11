export interface DimensionWeights {
  financial: number;
  technical: number;
  smartMoney: number;
  trend: number;
}

export interface AgreementThresholds {
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

export interface ConfidenceWeights {
  financialConfidence: number;
  technicalConfidence: number;
  smartMoneyConfidence: number;
  dataCompleteness: number;
}

export interface ScoreToDirection {
  bullishThreshold: number;
  bearishThreshold: number;
}

export interface ConfluenceConfig {
  dimensionWeights: DimensionWeights;
  agreementThresholds: AgreementThresholds;
  confidenceWeights: ConfidenceWeights;
  scoreToDirection: ScoreToDirection;
}

export const DEFAULT_CONFLUENCE_CONFIG: ConfluenceConfig = {
  dimensionWeights: {
    financial: 25,
    technical: 30,
    smartMoney: 25,
    trend: 20,
  },
  agreementThresholds: {
    veryHigh: 85,
    high: 70,
    medium: 50,
    low: 30,
  },
  confidenceWeights: {
    financialConfidence: 0.3,
    technicalConfidence: 0.3,
    smartMoneyConfidence: 0.2,
    dataCompleteness: 0.2,
  },
  scoreToDirection: {
    bullishThreshold: 60,
    bearishThreshold: 40,
  },
};
