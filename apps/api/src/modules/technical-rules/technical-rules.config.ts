export interface TechnicalRulesConfig {
  rsi: {
    overbought: number;
    oversold: number;
  };
  stochasticRsi: {
    overbought: number;
    oversold: number;
  };
  macd: {
    histogramThreshold: number;
  };
  roc: {
    bullishThreshold: number;
    bearishThreshold: number;
  };
  volume: {
    relativeVolumeHigh: number;
    relativeVolumeLow: number;
  };
  atr: {
    highVolatilityMultiplier: number;
  };
  mfi: {
    overbought: number;
    oversold: number;
  };
  cmf: {
    bullishThreshold: number;
    bearishThreshold: number;
  };
  smartMoney: {
    accumulationThreshold: number;
    distributionThreshold: number;
    institutionalThreshold: number;
  };
  ema: {
    alignmentTolerance: number;
  };
  sma: {
    alignmentTolerance: number;
  };
}

export const DEFAULT_TECHNICAL_RULES_CONFIG: TechnicalRulesConfig = {
  rsi: {
    overbought: 70,
    oversold: 30,
  },
  stochasticRsi: {
    overbought: 80,
    oversold: 20,
  },
  macd: {
    histogramThreshold: 0,
  },
  roc: {
    bullishThreshold: 0,
    bearishThreshold: 0,
  },
  volume: {
    relativeVolumeHigh: 1.5,
    relativeVolumeLow: 0.5,
  },
  atr: {
    highVolatilityMultiplier: 1.5,
  },
  mfi: {
    overbought: 80,
    oversold: 20,
  },
  cmf: {
    bullishThreshold: 0,
    bearishThreshold: 0,
  },
  smartMoney: {
    accumulationThreshold: 0.5,
    distributionThreshold: 0.5,
    institutionalThreshold: 0.5,
  },
  ema: {
    alignmentTolerance: 0,
  },
  sma: {
    alignmentTolerance: 0,
  },
};
