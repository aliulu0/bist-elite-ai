export interface WatchlistItem {
  symbol: string;
  name: string;
  sector: string;
  eliteScore: number;
  eliteRating: string;
  opportunityLevel: string;
  confidence: number;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  weeklyChangePercent: number;
  smartMoneyScore: number;
  trend: string;
  status: 'AKTİF' | 'İZLENEN' | 'BEKLEMEDE' | 'PASİF';
  alert: boolean;
  alertMessage: string;
  notes: string;
}

export interface WatchlistAlert {
  id: string;
  symbol: string;
  type: 'ERKEN_FIRSAT' | 'ELITE_YUKSELDI' | 'SMART_MONEY' | 'DESTEK_KRILDI' | 'SIKISMA';
  message: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface WatchlistNote {
  symbol: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistPerformance {
  symbol: string;
  change1w: number;
  change1m: number;
  change3m: number;
  volatility: number;
  avgVolume: number;
}

export interface WatchlistSummary {
  totalWatched: number;
  earlyOpportunities: number;
  aaaCount: number;
  risingCount: number;
  fallingCount: number;
  newAlerts: number;
  avgEliteScore: number;
  avgConfidence: number;
}

export const WATCHLIST_TAB = {
  TABLE: 'table',
  ALERTS: 'alerts',
  NOTES: 'notes',
  PERFORMANCE: 'performance',
} as const;

export type WatchlistTabType = typeof WATCHLIST_TAB[keyof typeof WATCHLIST_TAB];

export const STATUS_LABELS: Record<string, string> = {
  AKTİF: 'Aktif',
  İZLENEN: 'İzlenen',
  BEKLEMEDE: 'Beklemede',
  PASİF: 'Pasif',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  ERKEN_FIRSAT: 'Yeni Erken Fırsat',
  ELITE_YUKSELDI: 'Elite Skoru Yükseldi',
  SMART_MONEY: 'Smart Money Güçlendi',
  DESTEK_KRILDI: 'Destek Kırıldı',
  SIKISMA: 'Sıkışma Devam Ediyor',
};

export const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'text-info',
  WARNING: 'text-warning',
  CRITICAL: 'text-destructive',
};

export const STATUS_COLORS: Record<string, string> = {
  AKTİF: 'bg-success/10 text-success',
  İZLENEN: 'bg-primary/10 text-primary',
  BEKLEMEDE: 'bg-warning/10 text-warning',
  PASİF: 'bg-muted text-muted-foreground',
};
