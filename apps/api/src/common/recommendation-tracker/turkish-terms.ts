import {
  RecommendationStatus,
  RecommendationOutcome,
  EvaluationWindow,
  FailureType,
  FailureSeverity,
  ConfidenceLevel,
  MarketRegime,
} from './types';

export const RECOMMENDATION_STATUS_TURKISH: Record<RecommendationStatus, string> = {
  [RecommendationStatus.CREATED]: 'Olusturuldu',
  [RecommendationStatus.NOTIFICATION_SENT]: 'Bildirim Gonderildi',
  [RecommendationStatus.VIRTUAL_ENTRY]: 'Sanal Giris',
  [RecommendationStatus.HOLDING]: 'Pozisyonda',
  [RecommendationStatus.TARGET_REACHED]: 'Hedefe Ulasildi',
  [RecommendationStatus.STOP_CONDITION]: 'Durma Kosulu',
  [RecommendationStatus.VIRTUAL_EXIT]: 'Sanal Cikis',
  [RecommendationStatus.FINAL_OUTCOME]: 'Nihai Sonuc',
  [RecommendationStatus.CANCELLED]: 'Iptal',
};

export const RECOMMENDATION_OUTCOME_TURKISH: Record<RecommendationOutcome, string> = {
  [RecommendationOutcome.WINNER]: 'Kazanan',
  [RecommendationOutcome.LOSER]: 'Kaybeden',
  [RecommendationOutcome.BREAKEVEN]: 'Basabas',
  [RecommendationOutcome.PENDING]: 'Beklemede',
  [RecommendationOutcome.CANCELLED]: 'Iptal',
};

export const EVALUATION_WINDOW_TURKISH: Record<EvaluationWindow, string> = {
  [EvaluationWindow.ONE_DAY]: '1 Gunluk',
  [EvaluationWindow.THREE_DAYS]: '3 Gunluk',
  [EvaluationWindow.ONE_WEEK]: '1 Haftalik',
  [EvaluationWindow.TWO_WEEKS]: '2 Haftalik',
  [EvaluationWindow.ONE_MONTH]: '1 Aylik',
  [EvaluationWindow.THREE_MONTHS]: '3 Aylik',
  [EvaluationWindow.SIX_MONTHS]: '6 Aylik',
};

export const FAILURE_TYPE_TURKISH: Record<FailureType, string> = {
  [FailureType.LATE_SIGNAL]: 'Gecikmis Sinyal',
  [FailureType.FALSE_POSITIVE]: 'Yanlis Pozitif',
  [FailureType.FALSE_NEGATIVE]: 'Yanlis Negatif',
  [FailureType.WEAK_CONFIRMATION]: 'Zayif Dogrulama',
  [FailureType.HIGH_RISK_SIGNAL]: 'Yuksek Risk Sinyali',
  [FailureType.POOR_TIMING]: 'Zamanlama Hatasi',
};

export const FAILURE_SEVERITY_TURKISH: Record<FailureSeverity, string> = {
  [FailureSeverity.LOW]: 'Dusuk',
  [FailureSeverity.MEDIUM]: 'Orta',
  [FailureSeverity.HIGH]: 'Yuksek',
  [FailureSeverity.CRITICAL]: 'Kritik',
};

export const CONFIDENCE_LEVEL_TURKISH: Record<ConfidenceLevel, string> = {
  [ConfidenceLevel.VERY_HIGH]: 'Cok Yuksek',
  [ConfidenceLevel.HIGH]: 'Yuksek',
  [ConfidenceLevel.MEDIUM]: 'Orta',
  [ConfidenceLevel.LOW]: 'Dusuk',
  [ConfidenceLevel.VERY_LOW]: 'Cok Dusuk',
};

export const MARKET_REGIME_TURKISH: Record<MarketRegime, string> = {
  [MarketRegime.BULL]: 'Yukselis Piyasasi',
  [MarketRegime.BEAR]: 'Dusus Piyasasi',
  [MarketRegime.SIDEWAYS]: 'Yatay Piyasa',
  [MarketRegime.HIGH_VOLATILITY]: 'Yuksek Volatilite',
  [MarketRegime.LOW_VOLATILITY]: 'Dusuk Volatilite',
};

export const METRIC_NAMES_TURKISH: Record<string, string> = {
  totalReturn: 'Toplam Getiri',
  winRate: 'Kazanma Orani',
  lossRate: 'Kayip Orani',
  avgGain: 'Ortalama Kazanc',
  avgLoss: 'Ortalama Kayip',
  profitFactor: 'Kar Faktoru',
  sharpeRatio: 'Sharpe Orani',
  sortinoRatio: 'Sortino Orani',
  precision: 'Hassasiyet',
  recall: 'Duyarlilik',
  f1Score: 'F1 Skoru',
  maxDrawdown: 'Maksimum Drawdown',
  volatility: 'Volatilite',
  riskAdjustedReturn: 'Risk-Getiri Orani',
  scoreAccuracy: 'Skor Dogrulugu',
  confidenceAccuracy: 'Guven Dogrulugu',
  scoreStability: 'Skor Kararliligi',
  predictionQuality: 'Tahmin Kalitesi',
  explanationConsistency: 'Aciklama Tutarliligi',
  evidenceQuality: 'Kanit Kalitesi',
  recommendationQuality: 'Oneri Kalitesi',
  confidenceCalibration: 'Guven Kalibrasyonu',
};

export const TRACKER_TERMS_TURKISH: Record<string, string> = {
  recommendationSummary: 'Oneri Ozeti',
  performanceDashboard: 'Performans Paneli',
  accuracyReport: 'Dogruluk Raporu',
  sectorReport: 'Sektor Raporu',
  strategyReport: 'Strateji Raporu',
  monthlyReport: 'Aylik Rapor',
  failureReport: 'Hata Raporu',
  successAnalytics: 'Basari Analitigi',
  topPerformers: 'En Iyi Performanslar',
  worstPerformers: 'En Kötü Performanslar',
  strategyBreakdown: 'Strateji Analizi',
  sectorBreakdown: 'Sektor Analizi',
  recentRecommendations: 'Son Oneriler',
  disclaimer: 'Sorumluluk Reddi',
  generatedAt: 'Olusturulma Zamani',
};

export function formatCurrency(value: number): string {
  return `${value.toFixed(2)} TL`;
}

export function formatPercentage(value: number): string {
  return `%${value.toFixed(2)}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) return ConfidenceLevel.VERY_HIGH;
  if (confidence >= 0.7) return ConfidenceLevel.HIGH;
  if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
  if (confidence >= 0.3) return ConfidenceLevel.LOW;
  return ConfidenceLevel.VERY_LOW;
}

export function getConfidenceLevelTurkish(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  return CONFIDENCE_LEVEL_TURKISH[level];
}

export function generateReportHeader(title: string): string {
  const separator = '=' .repeat(60);
  return `${separator}\n${title}\n${separator}\n`;
}

export function generateReportFooter(): string {
  const separator = '-'.repeat(60);
  return `\n${separator}\nBu rapor yalnizca bilgilendirme amaclidir ve yatirim tavsiyesi niteliginde degildir.\n${separator}`;
}

export function generatePerformanceCommentary(
  metric: string,
  value: number,
  threshold: number,
): string {
  const metricName = METRIC_NAMES_TURKISH[metric] || metric;
  const isHigherBetter = ['winRate', 'avgGain', 'profitFactor', 'sharpeRatio', 'sortinoRatio',
    'precision', 'recall', 'f1Score', 'scoreAccuracy', 'confidenceAccuracy',
    'scoreStability', 'predictionQuality', 'explanationConsistency',
    'evidenceQuality', 'recommendationQuality', 'confidenceCalibration'].includes(metric);

  const meetsThreshold = isHigherBetter ? value >= threshold : value <= threshold;

  if (meetsThreshold) {
    return `${metricName} gostergesi hedef seviyenin ${isHigherBetter ? 'uzerinde' : 'altindadir'} (${formatNumber(value)}). Olumlu bir gostergedir.`;
  } else {
    return `${metricName} gostergesi hedef seviyenin ${isHigherBetter ? 'altinda' : 'uzerinde'} (${formatNumber(value)}). Dikkatli degerlendirilmelidir.`;
  }
}

export function generateFailureCommentary(failureType: FailureType, stockSymbol: string): string {
  const typeName = FAILURE_TYPE_TURKISH[failureType];
  switch (failureType) {
    case FailureType.LATE_SIGNAL:
      return `${stockSymbol} icin ${typeName} tespit edildi. Sinyal gecikmeli olarak uretilmis olabilir.`;
    case FailureType.FALSE_POSITIVE:
      return `${stockSymbol} icin ${typeName} tespit edildi. Sinyal yanlis bir alis firsati olarak degerlendirilmis olabilir.`;
    case FailureType.FALSE_NEGATIVE:
      return `${stockSymbol} icin ${typeName} tespit edildi. Firsat kacirilmis olabilir.`;
    case FailureType.WEAK_CONFIRMATION:
      return `${stockSymbol} icin ${typeName} tespit edildi. Dogrulama sinyalleri yetersiz kalmis olabilir.`;
    case FailureType.HIGH_RISK_SIGNAL:
      return `${stockSymbol} icin ${typeName} tespit edildi. Risk seviyesi cok yuksek olmus olabilir.`;
    case FailureType.POOR_TIMING:
      return `${stockSymbol} icin ${typeName} tespit edildi. Giris/çikis zamanlamasi uygun olmamis olabilir.`;
    default:
      return `${stockSymbol} icin ${typeName} tespit edildi.`;
  }
}

export function generateMonthlySummary(
  year: number,
  month: number,
  totalRecommendations: number,
  winRate: number,
  avgReturn: number,
): string {
  const monthNames = [
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylül', 'Ekim', 'Kasim', 'Aralik',
  ];
  const monthName = monthNames[month - 1] || `Ay ${month}`;

  let summary = `${monthName} ${year} Aylik Ozet:\n`;
  summary += `  Toplam Oneri: ${totalRecommendations}\n`;
  summary += `  Kazanma Orani: ${formatPercentage(winRate)}\n`;
  summary += `  Ortalama Getiri: ${formatPercentage(avgReturn)}\n`;

  return summary;
}
