export type AuditTab =
  | 'all'
  | 'workflow'
  | 'queue'
  | 'scheduler'
  | 'providers'
  | 'config'
  | 'performance'
  | 'eventbus'
  | 'analysis'
  | 'scanner'
  | 'portfolio'
  | 'diagnostics'
  | 'system'
  | 'other';

export const AUDIT_TABS: Array<{ key: AuditTab; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'workflow', label: 'İş Akışı' },
  { key: 'queue', label: 'Kuyruk' },
  { key: 'scheduler', label: 'Zamanlayıcı' },
  { key: 'providers', label: 'Sağlayıcılar' },
  { key: 'config', label: 'Konfigürasyon' },
  { key: 'performance', label: 'Performans' },
  { key: 'eventbus', label: 'Olay Yolu' },
  { key: 'analysis', label: 'Analiz' },
  { key: 'scanner', label: 'Tarayıcı' },
  { key: 'portfolio', label: 'Portföy' },
  { key: 'diagnostics', label: 'Tanılama' },
  { key: 'system', label: 'Sistem' },
  { key: 'other', label: 'Diğer' },
];

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  INFO: 'Bilgi',
  WARNING: 'Uyarı',
  ERROR: 'Hata',
  CRITICAL: 'Kritik',
};

export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  INFO: 'text-success',
  WARNING: 'text-warning',
  ERROR: 'text-destructive',
  CRITICAL: 'text-destructive',
};

export const SEVERITY_BADGE: Record<AuditSeverity, 'success' | 'warning' | 'danger'> = {
  INFO: 'success',
  WARNING: 'warning',
  ERROR: 'danger',
  CRITICAL: 'danger',
};

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STARTED'
  | 'STOPPED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRIED'
  | 'RESET'
  | 'IMPORTED'
  | 'EXPORTED'
  | 'CUSTOM';

export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATED: 'Oluşturuldu',
  UPDATED: 'Güncellendi',
  DELETED: 'Silindi',
  STARTED: 'Başlatıldı',
  STOPPED: 'Durduruldu',
  COMPLETED: 'Tamamlandı',
  FAILED: 'Hata Verdi',
  RETRIED: 'Yeniden Denendi',
  RESET: 'Sıfırlandı',
  IMPORTED: 'İçe Aktarıldı',
  EXPORTED: 'Dışa Aktarıldı',
  CUSTOM: 'Özel',
};

export const MODULE_TAB_MAP: Record<string, AuditTab> = {
  Workflow: 'workflow',
  'Workflow Queue': 'queue',
  'Workflow Kuyruğu': 'queue',
  Scheduler: 'scheduler',
  'Zamanlayıcı': 'scheduler',
  Provider: 'providers',
  'Provider Health': 'providers',
  'Sağlayıcı Sağlığı': 'providers',
  Config: 'config',
  Configuration: 'config',
  'Konfigürasyon': 'config',
  Performance: 'performance',
  'Performance Monitor': 'performance',
  'Performans Monitörü': 'performance',
  'Event Bus': 'eventbus',
  Analysis: 'analysis',
  'Analysis Pipeline': 'analysis',
  Scanner: 'scanner',
  'Market Scanner': 'scanner',
  Portfolio: 'portfolio',
  Watchlist: 'portfolio',
  Diagnostics: 'diagnostics',
  'System Diagnostics': 'diagnostics',
  'Sistem Tanılama': 'diagnostics',
};

export const MODULE_DISPLAY: Record<string, string> = {
  Workflow: 'İş Akışı',
  'Workflow Queue': 'İş Akışı Kuyruğu',
  Scheduler: 'Zamanlayıcı',
  Provider: 'Sağlayıcı',
  'Provider Health': 'Sağlayıcı Sağlığı',
  Config: 'Yapılandırma',
  Configuration: 'Yapılandırma',
  Performance: 'Performans',
  'Performance Monitor': 'Performans Monitörü',
  'Event Bus': 'Olay Yolu',
  Analysis: 'Analiz',
  'Analysis Pipeline': 'Analiz İş Hattı',
  Scanner: 'Tarayıcı',
  'Market Scanner': 'Piyasa Tarayıcısı',
  Portfolio: 'Portföy',
  Watchlist: 'İzleme Listesi',
  Diagnostics: 'Tanılama',
  'System Diagnostics': 'Sistem Tanılama',
};

export function moduleDisplay(module: string): string {
  return MODULE_DISPLAY[module] ?? module;
}

export const AUDIT_MODULES: Array<{ name: string; tab: AuditTab }> = [
  { name: 'İş Akışı', tab: 'workflow' },
  { name: 'İş Akışı Kuyruğu', tab: 'queue' },
  { name: 'Zamanlayıcı', tab: 'scheduler' },
  { name: 'Konfigürasyon', tab: 'config' },
  { name: 'Sağlayıcı Sağlığı', tab: 'providers' },
  { name: 'Performans Monitörü', tab: 'performance' },
  { name: 'Analiz', tab: 'analysis' },
  { name: 'Tarayıcı', tab: 'scanner' },
  { name: 'Portföy', tab: 'portfolio' },
  { name: 'İzleme Listesi', tab: 'portfolio' },
  { name: 'Alarm Merkezi', tab: 'other' },
  { name: 'Sistem Tanılama', tab: 'diagnostics' },
  { name: 'Olay Yolu', tab: 'eventbus' },
  { name: 'Diğer', tab: 'other' },
];

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  severity: AuditSeverity;
  user?: string;
  targetType?: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
  details: string;
}

export interface AuditModuleStats {
  module: string;
  count: number;
  lastActivity: string | null;
}

export interface AuditSnapshot {
  logs: AuditLogEntry[];
  moduleStats: AuditModuleStats[];
  severityCounts: Record<AuditSeverity, number>;
  totalCount: number;
  todayCount: number;
  lastEntry: string | null;
  activeModules: number;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
