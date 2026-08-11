export type MacroDataSource =
  | 'tcmb_policy_rate'
  | 'tcmb_decision_text'
  | 'fed_rate'
  | 'fomc_statement'
  | 'ecb_rate'
  | 'us10y'
  | 'us2y'
  | 'dxy'
  | 'vix'
  | 'brent'
  | 'gold'
  | 'usdtry'
  | 'eurusd'
  | 'turkey_cds'
  | 'pmi'
  | 'inflation'
  | 'bist_sector_indices';

export type MacroDataStatus = 'fetched' | 'stale' | 'error' | 'pending';

export interface MacroDataPoint {
  source: MacroDataSource;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  status: MacroDataStatus;
  label: string;
  unit: string;
}

export interface MacroDataSnapshot {
  points: MacroDataPoint[];
  fetchedAt: string;
  sourceCount: number;
  healthyCount: number;
  staleCount: number;
  errorCount: number;
}

export type CentralBank = 'tcmb' | 'fed' | 'ecb';

export type CentralBankTone = 'hawkish' | 'dovish' | 'neutral' | 'hawkish_leaning' | 'dovish_leaning';

export type MarketImpact = 'positive' | 'negative' | 'neutral';

export interface CentralBankAnalysis {
  bank: CentralBank;
  tone: CentralBankTone;
  confidence: number;
  marketImpact: MarketImpact;
  sectorImpacts: Record<string, MarketImpact>;
  expectedInflation?: number;
  expectedGrowth?: number;
  liquidity: 'tight' | 'loose' | 'neutral';
  risk: 'low' | 'moderate' | 'high' | 'extreme';
  summary: string;
  analyzedAt: string;
}

export type MarketRegimeType = 'risk_on' | 'neutral' | 'risk_off' | 'extreme_risk';

export interface MarketRegimeAnalysis {
  regime: MarketRegimeType;
  score: number;
  components: {
    vix: { value: number; impact: number };
    dxy: { value: number; impact: number };
    us10y: { value: number; impact: number };
    cds: { value: number; impact: number };
    liquidity: { value: number; impact: number };
    momentum: { value: number; impact: number };
  };
  signals: string[];
  analyzedAt: string;
}

export interface MacroScoreResult {
  macroScore: number;
  components: {
    monetaryPolicy: number;
    globalRisk: number;
    domesticRisk: number;
    growth: number;
    liquidity: number;
  };
  confidence: number;
  calculatedAt: string;
}

export interface SectorImpact {
  sector: string;
  impact: MarketImpact;
  score: number;
  drivers: string[];
}

export interface CombinedConfidence {
  eliteScore: number;
  macroScore: number;
  combined: number;
  weightElite: number;
  weightMacro: number;
  calculatedAt: string;
}

export interface MacroAlertEvent {
  id: string;
  type: 'macro_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  source: MacroDataSource | CentralBank;
  timestamp: string;
}

export interface MacroOpportunity {
  ticker: string;
  name: string;
  sector: string;
  eliteScore: number;
  macroScore: number;
  combinedConfidence: number;
  reason: string;
  sectorImpact: MarketImpact;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface MacroRiskItem {
  ticker: string;
  name: string;
  sector: string;
  riskType: 'rate_sensitive' | 'currency_sensitive' | 'global_risk_exposed' | 'weak_sector' | 'high_macro_risk';
  riskDescription: string;
  macroScore: number;
  severity: MarketRegimeType;
  timestamp: string;
}

export interface MacroConfig {
  refreshIntervalMs: number;
  dataSources: {
    tcmb: { enabled: boolean; apiKey: string; baseUrl: string };
    fed: { enabled: boolean };
    ecb: { enabled: boolean };
    market: { enabled: boolean };
  };
  regime: {
    vixThresholdRiskOff: number;
    vixThresholdExtreme: number;
    cdsThresholdRiskOff: number;
  };
  scoring: {
    weights: {
      monetaryPolicy: number;
      globalRisk: number;
      domesticRisk: number;
      growth: number;
      liquidity: number;
    };
  };
  combinedConfidence: {
    defaultWeightElite: number;
    defaultWeightMacro: number;
  };
}
