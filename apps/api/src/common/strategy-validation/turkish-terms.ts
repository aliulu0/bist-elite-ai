import { ValidationType, ValidationStatus, MarketCondition, SignalAction, TrendDirection, ConsensusStrength } from './types';

export const VALIDATION_TYPE_TURKISH: Record<ValidationType, string> = {
  [ValidationType.SINGLE_STRATEGY]: 'Tek Strateji Doğrulama',
  [ValidationType.MULTI_STRATEGY_COMPARISON]: 'Çoklu Strateji Karşılaştırma',
  [ValidationType.INDICATOR_COMBINATION]: 'Gösterge Kombinasyonu Doğrulama',
  [ValidationType.PORTFOLIO_VALIDATION]: 'Portföy Doğrulama',
  [ValidationType.MULTI_TIMEFRAME]: 'Çoklu Zaman Dilimi Doğrulama',
  [ValidationType.HISTORICAL_SCENARIO]: 'Tarihsel Senaryo Doğrulama',
};

export const VALIDATION_STATUS_TURKISH: Record<ValidationStatus, string> = {
  [ValidationStatus.PASSED]: 'Başarılı',
  [ValidationStatus.WARNING]: 'Uyarı',
  [ValidationStatus.FAILED]: 'Başarısız',
  [ValidationStatus.INSUFFICIENT_DATA]: 'Yetersiz Veri',
};

export const MARKET_CONDITION_TURKISH: Record<MarketCondition, string> = {
  [MarketCondition.BULL_MARKET]: 'Yükseliş Piyasası',
  [MarketCondition.BEAR_MARKET]: 'Düşüş Piyasası',
  [MarketCondition.SIDEWAYS_MARKET]: 'Yatay Piyasa',
  [MarketCondition.HIGH_VOLATILITY]: 'Yüksek Volatilite',
  [MarketCondition.LOW_VOLATILITY]: 'Düşük Volatilite',
  [MarketCondition.HIGH_VOLUME]: 'Yüksek Hacim',
  [MarketCondition.LOW_VOLUME]: 'Düşük Hacim',
};

export const SIGNAL_ACTION_TURKISH: Record<SignalAction, string> = {
  [SignalAction.BUY]: 'Alış',
  [SignalAction.SELL]: 'Satış',
  [SignalAction.HOLD]: 'Bekle',
  [SignalAction.WATCH]: 'İzle',
};

export const TREND_DIRECTION_TURKISH: Record<TrendDirection, string> = {
  [TrendDirection.STRONG_UPTREND]: 'Güçlü Yükseliş Trendi',
  [TrendDirection.UPTREND]: 'Yükseliş Trendi',
  [TrendDirection.WEAK_UPTREND]: 'Zayıf Yükseliş Trendi',
  [TrendDirection.NEUTRAL]: 'Nötr',
  [TrendDirection.WEAK_DOWNTREND]: 'Zayıf Düşüş Trendi',
  [TrendDirection.DOWNTREND]: 'Düşüş Trendi',
  [TrendDirection.STRONG_DOWNTREND]: 'Güçlü Düşüş Trendi',
};

export const CONSENSUS_STRENGTH_TURKISH: Record<ConsensusStrength, string> = {
  [ConsensusStrength.STRONG]: 'Güçlü',
  [ConsensusStrength.MODERATE]: 'Orta',
  [ConsensusStrength.WEAK]: 'Zayıf',
  [ConsensusStrength.CONFLICTING]: 'Çelişkili',
};

export const METRIC_NAMES_TURKISH: Record<string, string> = {
  totalReturn: 'Toplam Getiri',
  annualizedReturn: 'Yıllık Getiri',
  winRate: 'Kazanma Oranı',
  lossRate: 'Kayıp Oranı',
  profitFactor: 'Kâr Faktörü',
  sharpeRatio: 'Sharpe Oranı',
  sortinoRatio: 'Sortino Oranı',
  maxDrawdown: 'Maksimum Drawdown',
  avgDrawdown: 'Ortalama Drawdown',
  recoveryFactor: 'Kurtarma Faktörü',
  avgHoldingPeriod: 'Ortalama Pozisyon Süresi',
  signalFrequency: 'Sinyal Sıklığı',
  volatility: 'Volatilite',
  beta: 'Beta',
  alpha: 'Alpha',
  treynorRatio: 'Treynor Oranı',
  calmarRatio: 'Calmar Oranı',
  expectancy: 'Beklenti',
  kellyCriterion: 'Kriteri',
  precision: 'Hassasiyet',
  recall: 'Duyarlılık',
  f1Score: 'F1 Skoru',
  falsePositiveRate: 'Yanlış Pozitif Oranı',
  falseNegativeRate: 'Yanlış Negatif Oranı',
  signalStability: 'Sinyal Kararlılığı',
  signalConsistency: 'Sinyal Tutarlılığı',
};

export const VALIDATION_TERMS_TURKISH: Record<string, string> = {
  overallScore: 'Genel Skor',
  confidence: 'Güven',
  strengths: 'Güçlü Yönler',
  weaknesses: 'Zayıf Yönler',
  riskAssessment: 'Risk Değerlendirmesi',
  improvementSuggestions: 'İyileştirme Önerileri',
  validatedAt: 'Doğrulama Zamanı',
  validationDuration: 'Doğrulama Süresi',
  tradeAnalysis: 'İşlem Analizi',
  monthlyReturns: 'Aylık Getiriler',
  drawdownAnalysis: 'Drawdown Analizi',
  indicatorPerformance: 'Gösterge Performansı',
  validationSummary: 'Doğrulama Özeti',
  performanceReport: 'Performans Raporu',
  signalQualityReport: 'Sinyal Kalitesi Raporu',
  marketConditionReport: 'Piyasa Durumu Raporu',
  timeframeReport: 'Zaman Dilimi Raporu',
  eliteScoreReport: 'Elite Skor Raporu',
  disclaimer: 'Sorumluluk Reddi',
  generatedAt: 'Oluşturulma Zamanı',
};

export function generateValidationSummaryTurkish(
  strategyName: string,
  overallScore: number,
  status: ValidationStatus,
  confidence: number,
  strengths: string[],
  weaknesses: string[]
): string {
  const statusTurkish = VALIDATION_STATUS_TURKISH[status];
  const scoreDescription = overallScore >= 80 ? 'mükemmel' :
    overallScore >= 65 ? 'iyi' :
    overallScore >= 50 ? 'orta' :
    overallScore >= 35 ? 'zayıf' : 'çok zayıf';

  let summary = `${strategyName} stratejisi ${scoreDescription} bir performans gösterdi.\n`;
  summary += `Genel Skor: ${overallScore.toFixed(1)}/100 (${statusTurkish})\n`;
  summary += `Güven Seviyesi: ${(confidence * 100).toFixed(1)}%\n\n`;

  if (strengths.length > 0) {
    summary += 'Güçlü Yönler:\n';
    strengths.forEach(s => { summary += `  • ${s}\n`; });
  }

  if (weaknesses.length > 0) {
    summary += '\nZayıf Yönler:\n';
    weaknesses.forEach(w => { summary += `  • ${w}\n`; });
  }

  return summary;
}

export function generatePerformanceCommentaryTurkish(
  metric: string,
  value: number,
  threshold: number
): string {
  const isGood = metric.includes('Return') || metric.includes('Rate') || metric.includes('Factor') ||
    metric.includes('Ratio') || metric.includes('Precision') || metric.includes('Recall') ||
    metric.includes('F1Score') || metric.includes('Stability') || metric.includes('Consistency');

  const meetsThreshold = isGood ? value >= threshold : value <= threshold;

  const metricName = METRIC_NAMES_TURKISH[metric] || metric;

  if (meetsThreshold) {
    return `${metricName} göstergesi hedef seviyenin üzerindedir (${value.toFixed(2)}). Bu olumlu bir göstergedir.`;
  } else {
    return `${metricName} göstergesi hedef seviyenin altındadır (${value.toFixed(2)}). Dikkatli değerlendirilmelidir.`;
  }
}

export function generateMarketConditionCommentaryTurkish(
  condition: MarketCondition,
  winRate: number,
  avgReturn: number
): string {
  const conditionName = MARKET_CONDITION_TURKISH[condition];
  let commentary = `${conditionName} koşullarında strateji `;

  if (winRate >= 60 && avgReturn > 0) {
    commentary += `başarılı bir performans gösterdi. Kazanma oranı: ${winRate.toFixed(1)}%, Ortalama getiri: ${avgReturn.toFixed(2)}%.`;
  } else if (winRate >= 50 && avgReturn > 0) {
    commentary += `kabul edilebilir bir performans gösterdi. Kazanma oranı: ${winRate.toFixed(1)}%, Ortalama getiri: ${avgReturn.toFixed(2)}%.`;
  } else if (winRate < 50) {
    commentary += `zayıf bir performans gösterdi. Kazanma oranı: ${winRate.toFixed(1)}%. Strateji bu koşullarda yeniden değerlendirilmelidir.`;
  } else {
    commentary += `negatif getiri elde etti. Ortalama getiri: ${avgReturn.toFixed(2)}%. Strateji bu koşullarda kullanılmamalıdır.`;
  }

  return commentary;
}
