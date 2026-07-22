export const BIST_SECTORS = [
  'banking', 'holding', 'industrial', 'technology', 'telecom',
  'retail', 'healthcare', 'energy', 'construction', 'chemistry',
  'metal', 'food', 'textile', 'transport', 'tourism', 'real_estate',
  'forestry', 'cement', 'glass', 'auto', 'white_goods', 'defense',
  'aviation', 'maritime', 'mining', 'insurance', 'asset_mgmt',
] as const;

export const TIMEFRAMES = ['4h', '1d', '1w', '1m'] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

export const SCORE_WEIGHTS = {
  ELITE: 0.30,
  DECISION: 0.25,
  CONFIDENCE: 0.20,
  RISK: 0.15,
  LIQUIDITY: 0.10,
} as const;

export const CACHE_DEFAULTS = {
  TTL_SECONDS: 300,
  MAX_SIZE: 256,
} as const;

export const API_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
