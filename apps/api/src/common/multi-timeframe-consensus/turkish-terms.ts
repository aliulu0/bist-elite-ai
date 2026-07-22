import {
  TrendDirection,
  MomentumState,
  VolumeState,
  ConflictType,
  ConflictSeverity,
  ConsensusStrength,
  Timeframe,
  TIMEFRAME_LABELS,
} from './types';

export const TREND_DIRECTION_TR: Record<TrendDirection, string> = {
  [TrendDirection.STRONG_UPTREND]: 'Guclu Yukselen Trend',
  [TrendDirection.UPTREND]: 'Yukselen Trend',
  [TrendDirection.WEAK_UPTREND]: 'Zayif Yukselen Trend',
  [TrendDirection.SIDEWAYS]: 'Yatay Trend',
  [TrendDirection.WEAK_DOWNTREND]: 'Zayif Alcalan Trend',
  [TrendDirection.DOWNTREND]: 'Alcalan Trend',
  [TrendDirection.STRONG_DOWNTREND]: 'Guclu Alcalan Trend',
};

export const MOMENTUM_STATE_TR: Record<MomentumState, string> = {
  [MomentumState.OVERBOUGHT]: 'Asiri Alim',
  [MomentumState.BULLISH_MOMENTUM]: 'Yukselen Momentum',
  [MomentumState.NEUTRAL]: 'Notr',
  [MomentumState.BEARISH_MOMENTUM]: 'Alcalan Momentum',
  [MomentumState.OVERSOLD]: 'Asiri Satis',
};

export const VOLUME_STATE_TR: Record<VolumeState, string> = {
  [VolumeState.HIGH_VOLUME]: 'Yuksek Hacim',
  [VolumeState.NORMAL_VOLUME]: 'Normal Hacim',
  [VolumeState.LOW_VOLUME]: 'Dusuk Hacim',
  [VolumeState.DECLINING]: 'Azalan Hacim',
  [VolumeState.INCREASING]: 'Artan Hacim',
};

export const CONFLICT_TYPE_TR: Record<ConflictType, string> = {
  [ConflictType.SHORT_LONG_CONFLICT]: 'Kisa ve Uzun Vade Celigismesi',
  [ConflictType.TREND_REVERSAL]: 'Trend Donusumu Riski',
  [ConflictType.WEAK_CONFIRMATION]: 'Zayif Onay',
  [ConflictType.MIXED_INDICATORS]: 'Karistirici Gosterge Sinyalleri',
  [ConflictType.VOLUME_INCONSISTENCY]: 'Hacim Tutarsizligi',
  [ConflictType.RISK_INCONSISTENCY]: 'Risk Tutarsizligi',
  [ConflictType.MOMENTUM_DIVERGENCE]: 'Momentum Farkliligi',
};

export const CONFLICT_SEVERITY_TR: Record<ConflictSeverity, string> = {
  [ConflictSeverity.LOW]: 'Dusuk',
  [ConflictSeverity.MEDIUM]: 'Orta',
  [ConflictSeverity.HIGH]: 'Yuksek',
  [ConflictSeverity.CRITICAL]: 'Kritik',
};

export const CONSENSUS_STRENGTH_TR: Record<ConsensusStrength, string> = {
  [ConsensusStrength.STRONG]: 'Guclu Mutabakat',
  [ConsensusStrength.MODERATE]: 'Orta Duzey Mutabakat',
  [ConsensusStrength.WEAK]: 'Zayif Mutabakat',
  [ConsensusStrength.CONFLICTING]: 'Celicikili',
};

export function getTimeframeLabel(timeframe: Timeframe): string {
  return TIMEFRAME_LABELS[timeframe] || timeframe;
}

export function getShortTermLabel(): string {
  return 'Kisa Vade';
}

export function getMediumTermLabel(): string {
  return 'Orta Vade';
}

export function getLongTermLabel(): string {
  return 'Uzun Vade';
}

export function getTrendDescription(direction: TrendDirection, strength: number, timeframe: Timeframe): string {
  const trendName = TREND_DIRECTION_TR[direction];
  const tfLabel = getTimeframeLabel(timeframe);
  const strengthLabel = getStrengthLabel(strength);
  return `${tfLabel} zaman diliminde ${trendName} gozlenmektedir. Trend gucu: ${strengthLabel}.`;
}

export function getStrengthLabel(strength: number): string {
  if (strength >= 80) return 'Cok Guclu';
  if (strength >= 65) return 'Guclu';
  if (strength >= 50) return 'Orta';
  if (strength >= 35) return 'Zayif';
  return 'Cok Zayif';
}

export function getConsensusDescription(
  strength: ConsensusStrength,
  score: number,
  conflictCount: number,
): string {
  const strengthLabel = CONSENSUS_STRENGTH_TR[strength];
  if (conflictCount === 0) {
    return `Tum zaman dilimleri uyum icinde. ${strengthLabel}. Skor: ${score.toFixed(1)}/100.`;
  }
  return `${conflictCount} celiski tespit edildi. ${strengthLabel}. Skor: ${score.toFixed(1)}/100.`;
}

export function getConflictDescription(conflict: { type: ConflictType; severity: ConflictSeverity; timeframe1: Timeframe; timeframe2: Timeframe }): string {
  const typeLabel = CONFLICT_TYPE_TR[conflict.type];
  const severityLabel = CONFLICT_SEVERITY_TR[conflict.severity];
  const tf1 = getTimeframeLabel(conflict.timeframe1);
  const tf2 = getTimeframeLabel(conflict.timeframe2);
  return `${tf1} ve ${tf2} arasinda ${typeLabel}. Ciddiyet: ${severityLabel}.`;
}

export function getEarlyAlignmentDescription(
  timeframe: Timeframe,
  alignmentScore: number,
  isLeading: boolean,
): string {
  const tfLabel = getTimeframeLabel(timeframe);
  if (isLeading) {
    return `${tfLabel} zaman dilimi erken firsat sinyali veriyor. Hizalama skoru: ${(alignmentScore * 100).toFixed(0)}%. On lider gosterge olarak hareket ediyor.`;
  }
  return `${tfLabel} zaman dilimi potansiyel firsat sinyali iceriyor. Hizalama skoru: ${(alignmentScore * 100).toFixed(0)}%.`;
}

export function getSuggestedObservation(
  score: number,
  strength: ConsensusStrength,
  conflictCount: number,
): string {
  if (strength === ConsensusStrength.STRONG && score >= 70) {
    return 'Guclu alis sinyali. Tum zaman dilimleri uyumlu. Dikkatli giris onerilir.';
  }
  if (strength === ConsensusStrength.STRONG && score <= 30) {
    return 'Guclu satis sinyali. Tum zaman dilimleri uyumlu. Pozisyon kapatma veya kisitlama onerilir.';
  }
  if (strength === ConsensusStrength.CONFLICTING) {
    return 'Celiciskili sinyaller mevcut. Beklemede kalma onerilir. Netlesme beklenmeli.';
  }
  if (conflictCount > 2) {
    return 'Cok sayida celiski mevcut. Risk yonetimi onemli. Kucuk pozisyonlarla giris dusunulebilir.';
  }
  return 'Dikkatli analiz gerekli. Net bir yon belirlenene kadar gozlem sureci devam etmelidir.';
}

export function getDisclaimer(): string {
  return 'Bu analiz bilgi amaclidir ve yatirim tavsiyesi degildir. Yatirim kararlari kendi sorumlulugunuz altindadir. Gecmis performans gelecek sonuclarin garantisi degildir.';
}

export function getFalseConfirmWarning(): string {
  return 'Dikkat: Potansiyel yalanci onay tespit edildi. Piyasa kosullari degiskenlik gosterebilir.';
}
