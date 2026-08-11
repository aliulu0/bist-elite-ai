import { PredictionResult } from '../../prediction/prediction.types';
import { SmartMoneyScoreResult } from '../../smart-money/smart-money.types';
import { CatalystResult } from '../../catalyst/catalyst.types';
import { MultiTimeframeOpportunityResult } from '../multi-timeframe/multi-timeframe.types';
import { FundamentalValidationReport } from '../../financial-rules/fundamental-validation.service';
import { FinancialDataQualityReport } from '../../financial-rules/financial-data-quality.types';

export const EARLY_SIGNAL_ENGINE_VERSION = '1.0.0';

export type SignalCategory =
  | 'PRICE_VOLUME'
  | 'SMART_MONEY'
  | 'FUNDAMENTAL'
  | 'CATALYST'
  | 'MULTI_TIMEFRAME'
  | 'MARKET_STRUCTURE';

export const SIGNAL_CATEGORIES: readonly SignalCategory[] = [
  'PRICE_VOLUME',
  'SMART_MONEY',
  'FUNDAMENTAL',
  'CATALYST',
  'MULTI_TIMEFRAME',
  'MARKET_STRUCTURE',
];

export type SignalStrengthLabel = 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

export const SIGNAL_STRENGTH_META: Record<
  SignalStrengthLabel,
  { label: string; min: number }
> = {
  Weak: { label: 'Zayıf', min: 0 },
  Medium: { label: 'Orta', min: 40 },
  Strong: { label: 'Güçlü', min: 65 },
  'Very Strong': { label: 'Çok Güçlü', min: 80 },
};

export type SignalPhase = 'EARLY' | 'CONFIRMED';

export type SignalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EarlySignal {
  id: string;
  ticker: string;
  category: SignalCategory;
  type: string;
  phase: SignalPhase;
  strength: number;
  strengthLabel: SignalStrengthLabel;
  priority: SignalPriority;
  description: string;
  sourceFields: string[];
  detectedAt: string;
}

export interface SignalConvergenceSummary {
  convergenceScore: number;
  totalSignals: number;
  strongSignalCount: number;
  earlyCount: number;
  confirmedCount: number;
  categoryCoverage: number;
  avgStrength: number;
  confirmedShare: number;
  strongestSignals: EarlySignal[];
}

export interface EarlySignalScannerInput {
  ticker: string;
  company: string;
  sector: string;
  prediction: PredictionResult | null;
  smartMoney: SmartMoneyScoreResult | null;
  catalyst: CatalystResult | null;
  multiTimeframe: MultiTimeframeOpportunityResult | null;
  fundamentals: FundamentalValidationReport | null;
  financialDataQuality: FinancialDataQualityReport | null;
}

export interface EarlySignalScannerResult {
  ticker: string;
  company: string;
  sector: string;
  signals: EarlySignal[];
  convergence: SignalConvergenceSummary;
  dataQualityStatus: string | null;
  scannedAt: string;
}

export interface EarlySignalScanContext {
  prediction?: PredictionResult | null;
  smartMoney?: SmartMoneyScoreResult | null;
  catalyst?: CatalystResult | null;
  multiTimeframe?: MultiTimeframeOpportunityResult | null;
  fundamentals?: FundamentalValidationReport | null;
  financialDataQuality?: FinancialDataQualityReport | null;
}

export interface EarlySignalFilters {
  minSignalStrength?: number;
  minSignalConvergence?: number;
  signalCategory?: SignalCategory;
  signalType?: string;
  earlyOnly?: boolean;
  confirmedOnly?: boolean;
}

export function signalMatchesFilters(
  signal: EarlySignal,
  filters: EarlySignalFilters,
): boolean {
  if (filters.minSignalStrength != null && signal.strength < filters.minSignalStrength) return false;
  if (filters.signalCategory != null && signal.category !== filters.signalCategory) return false;
  if (filters.signalType != null && signal.type !== filters.signalType) return false;
  if (filters.earlyOnly === true && signal.phase !== 'EARLY') return false;
  if (filters.confirmedOnly === true && signal.phase !== 'CONFIRMED') return false;
  return true;
}

export function resultMatchesSignalFilters(
  result: EarlySignalScannerResult,
  filters: EarlySignalFilters,
): boolean {
  const matching = result.signals.filter((s) => signalMatchesFilters(s, filters));
  if (filters.minSignalConvergence != null && result.convergence.convergenceScore < filters.minSignalConvergence) {
    return false;
  }
  if (filters.minSignalStrength != null || filters.signalCategory != null || filters.signalType != null) {
    return matching.length > 0;
  }
  if (filters.earlyOnly === true) return result.convergence.earlyCount > 0;
  if (filters.confirmedOnly === true) return result.convergence.confirmedCount > 0;
  return true;
}
