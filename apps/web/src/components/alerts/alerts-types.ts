export type AlertType =
  | 'ERKEN_FIRSAT'
  | 'ELITE_YUKSELDI'
  | 'SMART_MONEY'
  | 'DESTEK_KRILDI'
  | 'DIRENC_ASILDI'
  | 'WORKFLOW_TAMAMLANDI'
  | 'WORKFLOW_HATA'
  | 'PROVIDER_OFFLINE'
  | 'PROVIDER_RECOVERY'
  | 'SISTEM_UYARISI'
  | 'PORTFOY_RISK'
  | 'WATCHLIST_ALARM';

export type AlertPriority = 'KRITIK' | 'YUKSEK' | 'ORTA' | 'DUSUK' | 'BILGI';
export type AlertStatus = 'YENI' | 'OKUNDU' | 'COZULDU' | 'ATLADI';
export type AlertGroup = 'PIYASA' | 'WORKFLOW' | 'PROVIDER' | 'SISTEM' | 'PORTFOY' | 'WATCHLIST';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  priority: AlertPriority;
  status: AlertStatus;
  group: AlertGroup;
  source: string;
  symbol?: string;
  workflowId?: string;
  providerName?: string;
  timestamp: string;
  read: boolean;
  extraInfo?: Record<string, string>;
}

export const ALERT_TABS: Array<{ key: AlertGroup | 'TUMU'; label: string }> = [
  { key: 'TUMU', label: 'Tümü' },
  { key: 'PIYASA', label: 'Piyasa Alarmları' },
  { key: 'WORKFLOW', label: 'Workflow Alarmları' },
  { key: 'PROVIDER', label: 'Provider Alarmları' },
  { key: 'SISTEM', label: 'Sistem Alarmları' },
  { key: 'PORTFOY', label: 'Portföy Alarmları' },
  { key: 'WATCHLIST', label: 'Watchlist Alarmları' },
];

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  ERKEN_FIRSAT: 'Yeni Erken Fırsat',
  ELITE_YUKSELDI: 'Elite Skoru Yükseldi',
  SMART_MONEY: 'Smart Money Güçlendi',
  DESTEK_KRILDI: 'Destek Kırıldı',
  DIRENC_ASILDI: 'Direnç Aşıldı',
  WORKFLOW_TAMAMLANDI: 'Workflow Tamamlandı',
  WORKFLOW_HATA: 'Workflow Hata Verdi',
  PROVIDER_OFFLINE: 'Provider Offline',
  PROVIDER_RECOVERY: 'Provider Recovery',
  SISTEM_UYARISI: 'Sistem Uyarısı',
  PORTFOY_RISK: 'Portföy Risk Uyarısı',
  WATCHLIST_ALARM: 'Watchlist Alarmı',
};

export const PRIORITY_LABELS: Record<AlertPriority, string> = {
  KRITIK: 'Kritik',
  YUKSEK: 'Yüksek',
  ORTA: 'Orta',
  DUSUK: 'Düşük',
  BILGI: 'Bilgi',
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  YENI: 'Yeni',
  OKUNDU: 'Okundu',
  COZULDU: 'Çözüldü',
  ATLADI: 'Atlandı',
};

export const PRIORITY_COLORS: Record<AlertPriority, string> = {
  KRITIK: 'bg-destructive/10 text-destructive',
  YUKSEK: 'bg-warning/10 text-warning',
  ORTA: 'bg-primary/10 text-primary',
  DUSUK: 'bg-muted text-muted-foreground',
  BILGI: 'bg-info/10 text-info',
};

export const STATUS_COLORS: Record<AlertStatus, string> = {
  YENI: 'bg-destructive/10 text-destructive',
  OKUNDU: 'bg-muted text-muted-foreground',
  COZULDU: 'bg-success/10 text-success',
  ATLADI: 'bg-muted text-muted-foreground',
};

export const GROUP_LABELS: Record<AlertGroup, string> = {
  PIYASA: 'Piyasa',
  WORKFLOW: 'Workflow',
  PROVIDER: 'Provider',
  SISTEM: 'Sistem',
  PORTFOY: 'Portföy',
  WATCHLIST: 'Watchlist',
};

export interface AlertSettings {
  piyasa: boolean;
  workflow: boolean;
  provider: boolean;
  sistem: boolean;
  portfoy: boolean;
  watchlist: boolean;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  piyasa: true, workflow: true, provider: true, sistem: true, portfoy: true, watchlist: true,
};

export interface AlertSummary {
  total: number;
  unread: number;
  kritik: number;
  yuksek: number;
  orta: number;
  dusuk: number;
  todayCount: number;
  resolvedCount: number;
}
