import { MacroConfig } from './macro.types';

export const DEFAULT_MACRO_CONFIG: MacroConfig = {
  refreshIntervalMs: 15 * 60 * 1000,
  dataSources: {
    tcmb: {
      enabled: process.env.TCMB_MACRO_ENABLED !== 'false',
      apiKey: process.env.TCMB_API_KEY || '',
      baseUrl: process.env.TCMB_BASE_URL || 'https://evds2.tcmb.gov.tr/service/evds',
    },
    fed: {
      enabled: process.env.FED_MACRO_ENABLED !== 'false',
    },
    ecb: {
      enabled: process.env.ECB_MACRO_ENABLED !== 'false',
    },
    market: {
      enabled: process.env.MARKET_MACRO_ENABLED !== 'false',
    },
  },
  regime: {
    vixThresholdRiskOff: 25,
    vixThresholdExtreme: 40,
    cdsThresholdRiskOff: 400,
  },
  scoring: {
    weights: {
      monetaryPolicy: 0.25,
      globalRisk: 0.25,
      domesticRisk: 0.20,
      growth: 0.15,
      liquidity: 0.15,
    },
  },
  combinedConfidence: {
    defaultWeightElite: 0.6,
    defaultWeightMacro: 0.4,
  },
};
