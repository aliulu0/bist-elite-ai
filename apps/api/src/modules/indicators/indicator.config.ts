export interface IndicatorConfig {
  sma: { periods: number[] };
  ema: { periods: number[] };
  ichimoku: {
    tenkanPeriod: number;
    kijunPeriod: number;
    senkouBPeriod: number;
    displacement: number;
  };
  rsi: { period: number };
  stochasticRsi: { period: number; kPeriod: number; dPeriod: number };
  macd: { fastPeriod: number; slowPeriod: number; signalPeriod: number };
  roc: { period: number };
  momentumOscillator: { period: number };
  volumeSma: { period: number };
  atr: { period: number };
  bollingerBands: { period: number; stdDev: number };
  adx: { period: number };
  mfi: { period: number };
  cmf: { period: number };
}

export const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  sma: { periods: [9, 20, 50, 100, 200] },
  ema: { periods: [9, 20, 50, 100, 200] },
  ichimoku: {
    tenkanPeriod: 9,
    kijunPeriod: 26,
    senkouBPeriod: 52,
    displacement: 26,
  },
  rsi: { period: 14 },
  stochasticRsi: { period: 14, kPeriod: 3, dPeriod: 3 },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  roc: { period: 12 },
  momentumOscillator: { period: 10 },
  volumeSma: { period: 20 },
  atr: { period: 14 },
  bollingerBands: { period: 20, stdDev: 2 },
  adx: { period: 14 },
  mfi: { period: 14 },
  cmf: { period: 20 },
};
