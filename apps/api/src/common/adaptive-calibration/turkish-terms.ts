import {
  CalibrationStatus, TrendDirection, RecommendationPriority,
  ComponentHealth, DiagnosticIssueType
} from './types';

export const CALIBRATION_STATUS_TURKISH: Record<CalibrationStatus, string> = {
  [CalibrationStatus.HEALTHY]: 'Sağlıklı',
  [CalibrationStatus.NEEDS_REVIEW]: 'İnceleme Gerektiriyor',
  [CalibrationStatus.DEGRADING]: 'Kötüleşiyor',
  [CalibrationStatus.CRITICAL]: 'Kritik',
};

export const TREND_DIRECTION_TURKISH: Record<TrendDirection, string> = {
  [TrendDirection.IMPROVING]: 'İyileşiyor',
  [TrendDirection.STABLE]: 'Stabil',
  [TrendDirection.DEGRADING]: 'Kötüleşiyor',
  [TrendDirection.INSUFFICIENT_DATA]: 'Yetersiz Veri',
};

export const RECOMMENDATION_PRIORITY_TURKISH: Record<RecommendationPriority, string> = {
  [RecommendationPriority.LOW]: 'Düşük',
  [RecommendationPriority.MEDIUM]: 'Orta',
  [RecommendationPriority.HIGH]: 'Yüksek',
  [RecommendationPriority.CRITICAL]: 'Kritik',
};

export const COMPONENT_HEALTH_TURKISH: Record<ComponentHealth, string> = {
  [ComponentHealth.EXCELLENT]: 'Mükemmel',
  [ComponentHealth.GOOD]: 'İyi',
  [ComponentHealth.FAIR]: 'Orta',
  [ComponentHealth.POOR]: 'Zayıf',
  [ComponentHealth.CRITICAL]: 'Kritik',
};

export const DIAGNOSTIC_ISSUE_TURKISH: Record<DiagnosticIssueType, string> = {
  [DiagnosticIssueType.OVERWEIGHTED]: 'Ağırlık Fazla',
  [DiagnosticIssueType.UNDERWEIGHTED]: 'Ağırlık Az',
  [DiagnosticIssueType.UNSTABLE]: 'Kararsız',
  [DiagnosticIssueType.CONFLICTING]: 'Çelişkili',
  [DiagnosticIssueType.LOW_VALUE]: 'Düşük Değer',
  [DiagnosticIssueType.HIGHLY_PREDICTIVE]: 'Yüksek Tahmin Gücü',
};

export const COMPONENT_NAMES_TURKISH: Record<string, string> = {
  technical: 'Teknik Analiz',
  trend: 'Trend Analizi',
  momentum: 'Momentum',
  volume: 'Hacim',
  volatility: 'Volatilite',
  liquidity: 'Likidite',
  risk: 'Risk',
  strategy: 'Strateji',
  multiTimeframeConsensus: 'Çoklu Zaman Dilimi',
  historicalReliability: 'Tarihsel Güvenilirlik',
  earlyOpportunity: 'Erken Fırsat',
};

export const METRIC_NAMES_TURKISH: Record<string, string> = {
  predictionAccuracy: 'Tahmin Doğruluğu',
  precision: 'Hassasiyet',
  recall: 'Duyarlılık',
  f1Score: 'F1 Skoru',
  profitFactor: 'Kâr Faktörü',
  sharpeRatio: 'Sharpe Oranı',
  maxDrawdown: 'Maksimum Drawdown',
  historicalReliability: 'Tarihsel Güvenilirlik',
  calibrationError: 'Kalibrasyon Hatası',
  brierScore: 'Brier Skoru',
  effectiveness: 'Etkinlik',
  stability: 'Kararlılık',
  contribution: 'Katkı',
};

export const CALIBRATION_TERMS_TURKISH: Record<string, string> = {
  overallStatus: 'Genel Durum',
  overallScore: 'Genel Skor',
  confidence: 'Güven',
  componentDiagnostics: 'Bileşen Tanılama',
  performanceEvaluation: 'Performans Değerlendirmesi',
  componentTrends: 'Bileşen Trendleri',
  recommendations: 'Öneriler',
  historicalComparison: 'Tarihsel Karşılaştırma',
  calibrationSummary: 'Kalibrasyon Özeti',
  evidenceReport: 'Kanıt Raporu',
  componentRankings: 'Bileşen Sıralamaları',
  improvementOpportunities: 'İyileştirme Fırsatları',
  riskAssessment: 'Risk Değerlendirmesi',
  generatedAt: 'Oluşturulma Zamanı',
  calibrationDuration: 'Kalibrasyon Süresi',
  disclaimer: 'Sorumluluk Reddi',
  noRecommendation: 'Yeterli kanıt bulunamadı, öneri oluşturulmadı',
  approvalRequired: 'Onay Gerektiriyor',
  autoApplicable: 'Otomatik Uygulanabilir',
  expectedImpact: 'Beklenen Etki',
  safeguards: 'Koruyucu Önlemler',
};

export function generateCalibrationSummaryTurkish(
  overallStatus: CalibrationStatus,
  overallScore: number,
  confidence: number,
  componentCount: number,
  recommendationCount: number
): string {
  const statusTurkish = CALIBRATION_STATUS_TURKISH[overallStatus];
  const scoreDescription = overallScore >= 80 ? 'mükemmel' :
    overallScore >= 65 ? 'iyi' :
    overallScore >= 50 ? 'orta' :
    overallScore >= 35 ? 'zayıf' : 'çok zayıf';

  let summary = `Kalibrasyon analizi ${scoreDescription} bir durum göstermektedir.\n`;
  summary += `Genel Durum: ${statusTurkish}\n`;
  summary += `Genel Skor: ${overallScore.toFixed(1)}/100\n`;
  summary += `Güven Seviyesi: ${(confidence * 100).toFixed(1)}%\n`;
  summary += `Bileşen Sayısı: ${componentCount}\n`;

  if (recommendationCount > 0) {
    summary += `\n${recommendationCount} adet kalibrasyon önerisi mevcuttur.\n`;
  } else {
    summary += `\nMevcut durum için öneri bulunmamaktadır.\n`;
  }

  return summary;
}

export function generateComponentCommentaryTurkish(
  component: string,
  health: ComponentHealth,
  effectiveness: number,
  trend: TrendDirection
): string {
  const componentName = COMPONENT_NAMES_TURKISH[component] || component;
  const healthTurkish = COMPONENT_HEALTH_TURKISH[health];
  const trendTurkish = TREND_DIRECTION_TURKISH[trend];

  let commentary = `${componentName} bileşeni ${healthTurkish} durumundadır. `;
  commentary += `Etkinlik: %${(effectiveness * 100).toFixed(1)}. `;
  commentary += `Trend: ${trendTurkish}.`;

  return commentary;
}

export function generateRecommendationCommentaryTurkish(
  component: string,
  currentWeight: number,
  recommendedWeight: number,
  reason: string
): string {
  const componentName = COMPONENT_NAMES_TURKISH[component] || component;
  const change = recommendedWeight - currentWeight;
  const direction = change > 0 ? 'artırılmalı' : 'azaltılmalı';
  const changePercent = Math.abs(change / currentWeight * 100).toFixed(1);

  return `${componentName} bileşeninin ağırlığı %{${changePercent}} ${direction} mevcut: %${(currentWeight * 100).toFixed(1)} → Önerilen: %${(recommendedWeight * 100).toFixed(1)}. Neden: ${reason}`;
}

export function generateTrendCommentaryTurkish(
  component: string,
  direction: TrendDirection,
  strength: number,
  slope: number
): string {
  const componentName = COMPONENT_NAMES_TURKISH[component] || component;
  const directionTurkish = TREND_DIRECTION_TURKISH[direction];

  let commentary = `${componentName} trendi ${directionTurkish} `;
  commentary += `(Güç: ${(strength * 100).toFixed(1)}%, Eğim: ${slope >= 0 ? '+' : ''}${(slope * 100).toFixed(2)}%).`;

  return commentary;
}
