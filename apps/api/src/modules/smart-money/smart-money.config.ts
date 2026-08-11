export interface SmartMoneyConfig {
  rsi: {
    accumulationLow: number;
    accumulationHigh: number;
    distributionLow: number;
    distributionHigh: number;
  };
  obv: {
    trendThreshold: number;
  };
  volumeSpike: {
    threshold: number;
  };
  moneyFlow: {
    mfiAccumulation: number;
    mfiDistribution: number;
    cmfAccumulation: number;
    cmfDistribution: number;
  };
  compression: {
    squeezeThreshold: number;
  };
  adx: {
    strongTrend: number;
  };
  score: {
    accumulationWeight: number;
    distributionWeight: number;
    volumeWeight: number;
    trendWeight: number;
    moneyFlowWeight: number;
    compressionWeight: number;
    institutionalWeight: number;
  };
}

export const DEFAULT_SMART_MONEY_CONFIG: SmartMoneyConfig = {
  rsi: {
    accumulationLow: 30,
    accumulationHigh: 45,
    distributionLow: 55,
    distributionHigh: 70,
  },
  obv: {
    trendThreshold: 0,
  },
  volumeSpike: {
    threshold: 2,
  },
  moneyFlow: {
    mfiAccumulation: 20,
    mfiDistribution: 80,
    cmfAccumulation: 0.05,
    cmfDistribution: -0.05,
  },
  compression: {
    squeezeThreshold: 0.02,
  },
  adx: {
    strongTrend: 25,
  },
  score: {
    accumulationWeight: 0.2,
    distributionWeight: 0.2,
    volumeWeight: 0.15,
    trendWeight: 0.15,
    moneyFlowWeight: 0.15,
    compressionWeight: 0.1,
    institutionalWeight: 0.1,
  },
};

export interface SmartMoneyScoreConfig {
  liquidity: {
    highVolumeThreshold: number;
    lowVolumeThreshold: number;
    consistencyWindow: number;
  };
  relativeVolume: {
    high: number;
    strong: number;
  };
  volumeSpike: {
    high: number;
    strong: number;
  };
  score: {
    accumulationWeight: number;
    distributionWeight: number;
    volumeWeight: number;
    liquidityWeight: number;
    moneyFlowWeight: number;
    confidenceWeight: number;
  };
  risk: {
    highScoreThreshold: number;
    mediumScoreThreshold: number;
    distributionRiskWeight: number;
    liquidityRiskWeight: number;
  };
  moneyFlow: {
    strongPositive: number;
    positive: number;
    negative: number;
    strongNegative: number;
  };
}

export const DEFAULT_SMART_MONEY_SCORE_CONFIG: SmartMoneyScoreConfig = {
  liquidity: {
    highVolumeThreshold: 3_000_000,
    lowVolumeThreshold: 300_000,
    consistencyWindow: 20,
  },
  relativeVolume: {
    high: 1.5,
    strong: 2.0,
  },
  volumeSpike: {
    high: 2.0,
    strong: 3.0,
  },
  score: {
    accumulationWeight: 0.25,
    distributionWeight: 0.25,
    volumeWeight: 0.2,
    liquidityWeight: 0.1,
    moneyFlowWeight: 0.1,
    confidenceWeight: 0.1,
  },
  risk: {
    highScoreThreshold: 60,
    mediumScoreThreshold: 35,
    distributionRiskWeight: 0.7,
    liquidityRiskWeight: 0.3,
  },
  moneyFlow: {
    strongPositive: 75,
    positive: 55,
    negative: 45,
    strongNegative: 25,
  },
};

export const SMART_MONEY_CACHE_NAMESPACE = 'research';
export const SMART_MONEY_CACHE_KEY_PREFIX = 'smart-money:';
export const SMART_MONEY_TTL_MS = 10 * 60_000;
