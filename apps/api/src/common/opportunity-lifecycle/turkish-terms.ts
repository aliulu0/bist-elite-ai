import {
  OpportunityStage,
  StageTransitionReason,
  HealthLevel,
  EvolutionTrend,
  FailureCategory,
  EarlyDetectionResult,
  SignalDirection,
} from './types';

export const OPPORTUNITY_STAGE_TURKISH: Record<OpportunityStage, string> = {
  [OpportunityStage.DETECTED]: 'Tespit Edildi',
  [OpportunityStage.EMERGING]: 'Gelisiyor',
  [OpportunityStage.CONFIRMED]: 'Dogrulandi',
  [OpportunityStage.STRENGTHENING]: 'Gucleniyor',
  [OpportunityStage.MATURE]: 'Olgun',
  [OpportunityStage.WEAKENING]: 'Zayifliyor',
  [OpportunityStage.EXPIRED]: 'Suresi Doldu',
  [OpportunityStage.CANCELLED]: 'Iptal Edildi',
};

export const TRANSITION_REASON_TURKISH: Record<StageTransitionReason, string> = {
  [StageTransitionReason.AUTOMATIC]: 'Otomatik Gecis',
  [StageTransitionReason.MANUAL]: 'Manuel Gecis',
  [StageTransitionReason.SCORE_THRESHOLD]: 'Skor Esik Degeri',
  [StageTransitionReason.CONFIDENCE_DROP]: 'Guvenilirlik Dustu',
  [StageTransitionReason.REGIME_CHANGE]: 'Piyasa Rejimi Degisikligi',
  [StageTransitionReason.TIME_DECAY]: 'Zaman Azalmasi',
  [StageTransitionReason.RISK_BREACH]: 'Risk Ihlali',
  [StageTransitionReason.CONSENSUS_BREAK]: 'Konsensus Bozulmasi',
  [StageTransitionReason.HEALTH_DECLINE]: 'Saglik Dususu',
  [StageTransitionReason.TARGET_REACHED]: 'Hedefe Ulasildi',
};

export const HEALTH_LEVEL_TURKISH: Record<HealthLevel, string> = {
  [HealthLevel.EXCELLENT]: 'Mukemmel',
  [HealthLevel.GOOD]: 'Iyi',
  [HealthLevel.FAIR]: 'Orta',
  [HealthLevel.POOR]: 'Kotu',
  [HealthLevel.CRITICAL]: 'Kritik',
};

export const EVOLUTION_TREND_TURKISH: Record<EvolutionTrend, string> = {
  [EvolutionTrend.IMPROVING]: 'Iyilesiyor',
  [EvolutionTrend.STABLE]: 'Kararli',
  [EvolutionTrend.DEGRADING]: 'Kotulesiyor',
  [EvolutionTrend.INSUFFICIENT_DATA]: 'Yetersiz Veri',
};

export const FAILURE_CATEGORY_TURKISH: Record<FailureCategory, string> = {
  [FailureCategory.FALSE_OPPORTUNITY]: 'Yanlis Firsat',
  [FailureCategory.WEAK_OPPORTUNITY]: 'Zayif Firsat',
  [FailureCategory.LATE_OPPORTUNITY]: 'Gecikmis Firsat',
  [FailureCategory.CANCELLED_OPPORTUNITY]: 'Iptal Edilmis Firsat',
  [FailureCategory.HIGH_RISK_OPPORTUNITY]: 'Yuksek Riskli Firsat',
};

export const EARLY_DETECTION_RESULT_TURKISH: Record<EarlyDetectionResult, string> = {
  [EarlyDetectionResult.EARLY]: 'Erken Tespit',
  [EarlyDetectionResult.ON_TIME]: 'Zamaninda Tespit',
  [EarlyDetectionResult.LATE]: 'Gecikmis Tespit',
  [EarlyDetectionResult.MISSED]: 'Kacirilmis Tespit',
};

export const SIGNAL_DIRECTION_TURKISH: Record<SignalDirection, string> = {
  [SignalDirection.STRENGTHENING]: 'Gucleniyor',
  [SignalDirection.WEAKENING]: 'Zayifliyor',
  [SignalDirection.NEUTRAL]: 'Notr',
};

export const METRIC_NAMES_TURKISH: Record<string, string> = {
  eliteScore: 'Elite Skor',
  confidence: 'Guvenilirlik',
  consensusScore: 'Konsensüs Skoru',
  riskScore: 'Risk Skoru',
  momentumScore: 'Momentum Skoru',
  volumeScore: 'Hacim Skoru',
  volatilityScore: 'Volatilite Skoru',
  healthIndex: 'Saglik Indeksi',
  leadTime: 'Liderlik Suresi',
  signalPersistence: 'Sinyal Dayanikliligi',
  confirmationDelay: 'Dogrulama Gecikmesi',
  overallScore: 'Genel Skor',
};

export const REPORT_HEADER_TURKISH = '=== Firsat Yasam Dongusu Raporu ===';
export const REPORT_FOOTER_TURKISH = '=== Rapor Sonu ===';

export function formatScoreTurkish(value: number): string {
  return value.toFixed(2);
}

export function formatPercentageTurkish(value: number): string {
  return `%${(value * 100).toFixed(1)}`;
}

export function formatDurationTurkish(days: number): string {
  if (days < 1) return `${Math.round(days * 24)} saat`;
  if (days === 1) return '1 gun';
  return `${Math.round(days)} gun`;
}

export function getStageIconTurkish(stage: OpportunityStage): string {
  const icons: Record<OpportunityStage, string> = {
    [OpportunityStage.DETECTED]: '[*]',
    [OpportunityStage.EMERGING]: '[~]',
    [OpportunityStage.CONFIRMED]: '[+]',
    [OpportunityStage.STRENGTHENING]: '[++]',
    [OpportunityStage.MATURE]: '[M]',
    [OpportunityStage.WEAKENING]: '[-]',
    [OpportunityStage.EXPIRED]: '[X]',
    [OpportunityStage.CANCELLED]: '[!]',
  };
  return icons[stage];
}
