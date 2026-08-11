import { ScoreWeights } from './scoring-types';

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  technical: 10,
  fundamental: 10,
  verification: 10,
  catalyst: 10,
  liquidity: 10,
  risk: 10,
  volume: 10,
  momentum: 10,
  trend: 10,
  quality: 10,
};

export const VALUE_HUNTER_WEIGHTS: ScoreWeights = {
  technical: 10,
  fundamental: 40,
  verification: 15,
  catalyst: 10,
  liquidity: 5,
  risk: 20,
  volume: 5,
  momentum: 5,
  trend: 5,
  quality: 10,
};

export const SMART_MONEY_WEIGHTS: ScoreWeights = {
  technical: 15,
  fundamental: 15,
  verification: 20,
  catalyst: 15,
  liquidity: 10,
  risk: 10,
  volume: 5,
  momentum: 5,
  trend: 5,
  quality: 5,
};

export const MOMENTUM_WEIGHTS: ScoreWeights = {
  technical: 15,
  fundamental: 5,
  verification: 10,
  catalyst: 10,
  liquidity: 5,
  risk: 15,
  volume: 10,
  momentum: 35,
  trend: 30,
  quality: 5,
};

export const SWING_WEIGHTS: ScoreWeights = {
  technical: 20,
  fundamental: 10,
  verification: 10,
  catalyst: 10,
  liquidity: 10,
  risk: 15,
  volume: 5,
  momentum: 10,
  trend: 15,
  quality: 5,
};

export const DIP_COLLECTOR_WEIGHTS: ScoreWeights = {
  technical: 10,
  fundamental: 30,
  verification: 10,
  catalyst: 10,
  liquidity: 10,
  risk: 20,
  volume: 5,
  momentum: 5,
  trend: 5,
  quality: 15,
};

export const MINERVINI_WEIGHTS: ScoreWeights = {
  technical: 20,
  fundamental: 10,
  verification: 10,
  catalyst: 15,
  liquidity: 5,
  risk: 10,
  volume: 10,
  momentum: 10,
  trend: 15,
  quality: 5,
};

export const CANSlim_WEIGHTS: ScoreWeights = {
  technical: 15,
  fundamental: 20,
  verification: 10,
  catalyst: 15,
  liquidity: 5,
  risk: 10,
  volume: 10,
  momentum: 10,
  trend: 10,
  quality: 5,
};

export const WILLIAM_ONEIL_WEIGHTS: ScoreWeights = {
  technical: 25,
  fundamental: 10,
  verification: 5,
  catalyst: 15,
  liquidity: 5,
  risk: 10,
  volume: 10,
  momentum: 10,
  trend: 15,
  quality: 5,
};

export const QULLAMAGGIE_WEIGHTS: ScoreWeights = {
  technical: 20,
  fundamental: 10,
  verification: 10,
  catalyst: 15,
  liquidity: 5,
  risk: 15,
  volume: 10,
  momentum: 10,
  trend: 10,
  quality: 5,
};

export const STRATEGY_WEIGHT_PROFILES: Record<string, { name: string; weights: ScoreWeights }> = {
  'value-hunter': { name: 'Değer Avcısı', weights: VALUE_HUNTER_WEIGHTS },
  'smart-money': { name: 'Akıllı Para', weights: SMART_MONEY_WEIGHTS },
  'momentum': { name: 'Momentum', weights: MOMENTUM_WEIGHTS },
  'swing': { name: 'Swing', weights: SWING_WEIGHTS },
  'dip-collector': { name: 'Dip Toplayıcı', weights: DIP_COLLECTOR_WEIGHTS },
  'minervini': { name: 'Minervini', weights: MINERVINI_WEIGHTS },
  'canslim': { name: 'CANSLIM', weights: CANSlim_WEIGHTS },
  'william-oneil': { name: "William O'Neil", weights: WILLIAM_ONEIL_WEIGHTS },
  'qullamaggie': { name: 'Qullamaggie', weights: QULLAMAGGIE_WEIGHTS },
};