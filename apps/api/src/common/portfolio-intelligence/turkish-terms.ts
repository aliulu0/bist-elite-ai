import { DashboardWidget, AlertPriority, AlertCategory, RiskLevel, TrendDirection, DashboardFilterType } from './types';

export const DASHBOARD_WIDGET_TURKISH: Record<DashboardWidget, string> = {
  [DashboardWidget.PORTFOLIO_SUMMARY]: 'Portfozet Ozeti',
  [DashboardWidget.INTELLIGENCE_PANEL]: 'Zeka Paneli',
  [DashboardWidget.PERFORMANCE_ANALYTICS]: 'Performans Analitigi',
  [DashboardWidget.RISK_CENTER]: 'Risk Merkezi',
  [DashboardWidget.EXPLAINABILITY_CENTER]: 'Aciklanabilirlik Merkezi',
  [DashboardWidget.NOTIFICATION_CENTER]: 'Bildirim Merkezi',
  [DashboardWidget.TIMELINE]: 'Zaman Cizelgesi',
};

export const ALERT_PRIORITY_TURKISH: Record<AlertPriority, string> = {
  [AlertPriority.LOW]: 'Dusuk',
  [AlertPriority.MEDIUM]: 'Orta',
  [AlertPriority.HIGH]: 'Yuksek',
  [AlertPriority.CRITICAL]: 'Kritik',
};

export const ALERT_CATEGORY_TURKISH: Record<AlertCategory, string> = {
  [AlertCategory.PORTFOLIO]: 'Portfoy',
  [AlertCategory.OPPORTUNITY]: 'Firsat',
  [AlertCategory.RISK]: 'Risk',
  [AlertCategory.PERFORMANCE]: 'Performans',
  [AlertCategory.REGIME]: 'Piyasa Rejimi',
  [AlertCategory.SYSTEM]: 'Sistem',
};

export const RISK_LEVEL_TURKISH: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Dusuk Risk',
  [RiskLevel.MEDIUM]: 'Orta Risk',
  [RiskLevel.HIGH]: 'Yuksek Risk',
  [RiskLevel.CRITICAL]: 'Kritik Risk',
};

export const TREND_DIRECTION_TURKISH: Record<TrendDirection, string> = {
  [TrendDirection.UP]: 'Yukselis',
  [TrendDirection.DOWN]: 'Dusus',
  [TrendDirection.FLAT]: 'Yatay',
};

export const FILTER_TYPE_TURKISH: Record<DashboardFilterType, string> = {
  [DashboardFilterType.SECTOR]: 'Sektor',
  [DashboardFilterType.INDUSTRY]: 'Alt Sektor',
  [DashboardFilterType.ELITE_SCORE]: 'Elite Skoru',
  [DashboardFilterType.CONFIDENCE]: 'Guven Skoru',
  [DashboardFilterType.MARKET_REGIME]: 'Piyasa Rejimi',
  [DashboardFilterType.OPPORTUNITY_STAGE]: 'Firsat Asamasi',
  [DashboardFilterType.TIMEFRAME]: 'Zaman Cercevesi',
  [DashboardFilterType.RISK_LEVEL]: 'Risk Seviyesi',
  [DashboardFilterType.STRATEGY]: 'Strateji',
};

export const PERFORMANCE_LABELS_TURKISH: Record<string, string> = {
  winRate: 'Kazanma Orani',
  totalReturn: 'Toplam Getiri',
  sharpeRatio: 'Sharpe Orani',
  maxDrawdown: 'Maksimum Cekilme',
  volatility: 'Volatilite',
  avgReturn: 'Ortalama Getiri',
  todayReturn: 'Gunluk Getiri',
  weekReturn: 'Haftalik Getiri',
  monthReturn: 'Aylik Getiri',
};

export const RISK_LABELS_TURKISH: Record<string, string> = {
  portfolioRisk: 'Portfoy Riski',
  sectorConcentration: 'Sektor Konsantrasyonu',
  drawdown: 'Cekilme',
  volatilityRisk: 'Volatilite Riski',
  liquidityRisk: 'Likitidite Riski',
  timeframeConflict: 'Zaman Cercevesi Cakismasi',
  regimeRisk: 'Rejim Riski',
};

export const OVERVIEW_LABELS_TURKISH: Record<string, string> = {
  totalValue: 'Toplam Deger',
  cashBalance: 'Nakit Bakiye',
  investedValue: 'Yatirim Degeri',
  openPositions: 'Acik Pozisyonlar',
  closedPositions: 'Kapali Pozisyonlar',
  todayPerformance: 'Gunluk Performans',
  weeklyPerformance: 'Haftalik Performans',
  monthlyPerformance: 'Aylik Performans',
  activeOpportunities: 'Aktif Firsatlar',
  currentRegime: 'Mevcut Rejim',
};

export function formatTurkishPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}%${value.toFixed(2)}`;
}

export function formatTurkishCurrency(value: number): string {
  return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTurkishScore(value: number): string {
  return value.toFixed(1);
}
