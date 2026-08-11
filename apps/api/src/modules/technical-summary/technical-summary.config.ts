export interface RuleTemplates {
  pass: string;
  warning: string;
  fail: string;
}

export interface TechnicalSummaryConfig {
  maxStrengths: number;
  maxWeaknesses: number;
  maxRisks: number;
  maxRecommendations: number;
  ruleTemplates: Record<string, RuleTemplates>;
}

export const DEFAULT_RULE_TEMPLATES: Record<string, RuleTemplates> = {
  EMA_ALIGNMENT: {
    pass: 'EMA alignment is bullish (price above all EMAs)',
    warning: 'EMA alignment is mixed — some EMAs below price',
    fail: 'EMA alignment is bearish (price below most EMAs)',
  },
  SMA_ALIGNMENT: {
    pass: 'SMA alignment confirms uptrend',
    warning: 'SMA alignment is mixed',
    fail: 'SMA alignment confirms downtrend',
  },
  ICHIMOKU: {
    pass: 'Ichimoku cloud shows bullish bias',
    warning: 'Ichimoku cloud is neutral',
    fail: 'Ichimoku cloud shows bearish bias',
  },
  RSI: {
    pass: 'RSI is in healthy range',
    warning: 'RSI is approaching overbought/oversold',
    fail: 'RSI is overbought or oversold',
  },
  STOCHASTIC_RSI: {
    pass: 'Stochastic RSI confirms momentum',
    warning: 'Stochastic RSI is inconclusive',
    fail: 'Stochastic RSI shows weak momentum',
  },
  MACD: {
    pass: 'MACD is bullish',
    warning: 'MACD is neutral or flattening',
    fail: 'MACD is bearish',
  },
  ROC: {
    pass: 'Rate of change is positive',
    warning: 'Rate of change is flat',
    fail: 'Rate of change is negative',
  },
  RELATIVE_VOLUME: {
    pass: 'Volume is above average — strong participation',
    warning: 'Volume is average',
    fail: 'Volume is below average — weak participation',
  },
  VOLUME_SPIKE: {
    pass: 'Volume spike confirms move',
    warning: 'No significant volume spike',
    fail: 'Low volume — move may be false',
  },
  OBV: {
    pass: 'OBV trend confirms price direction',
    warning: 'OBV trend is flat',
    fail: 'OBV trend diverges from price',
  },
  ATR: {
    pass: 'Volatility is in normal range',
    warning: 'Volatility is elevated',
    fail: 'Volatility is extreme',
  },
  COMPRESSION: {
    pass: 'No compression detected — market is active',
    warning: 'Market compression building — breakout possible',
    fail: 'Market is compressed — expect breakout',
  },
  MFI: {
    pass: 'Money flow confirms buying pressure',
    warning: 'Money flow is neutral',
    fail: 'Money flow shows selling pressure',
  },
  CMF: {
    pass: 'Chaikin money flow is positive',
    warning: 'Chaikin money flow is flat',
    fail: 'Chaikin money flow is negative',
  },
  HH: { pass: 'Higher highs confirm uptrend', warning: 'No recent higher highs', fail: 'Lower highs forming' },
  HL: { pass: 'Higher lows confirm uptrend', warning: 'No recent higher lows', fail: 'Lower lows forming' },
  BOS: { pass: 'Break of structure confirms trend', warning: 'No break of structure', fail: 'Break of structure suggests reversal' },
  CHOCH: { pass: 'No change of character — trend intact', warning: 'Change of character emerging', fail: 'Change of character — trend may reverse' },
  ACCUMULATION: { pass: 'Accumulation detected', warning: 'Neutral money flow', fail: 'Distribution detected' },
  INSTITUTIONAL: { pass: 'Institutional participation detected', warning: 'Low institutional activity', fail: 'No institutional participation' },
};

export const DEFAULT_TECHNICAL_SUMMARY_CONFIG: TechnicalSummaryConfig = {
  maxStrengths: 5,
  maxWeaknesses: 5,
  maxRisks: 3,
  maxRecommendations: 3,
  ruleTemplates: DEFAULT_RULE_TEMPLATES,
};
