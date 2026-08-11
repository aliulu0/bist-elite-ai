export type DiagnosticsTab =
  | 'overview'
  | 'workflow'
  | 'queue'
  | 'scheduler'
  | 'providers'
  | 'performance'
  | 'cache'
  | 'eventbus'
  | 'audit'
  | 'analysis';

export const DIAGNOSTICS_TABS: Array<{ key: DiagnosticsTab; label: string }> = [
  { key: 'overview', label: 'Genel' },
  { key: 'workflow', label: 'İş Akışı' },
  { key: 'queue', label: 'Kuyruk' },
  { key: 'scheduler', label: 'Zamanlayıcı' },
  { key: 'providers', label: 'Sağlayıcılar' },
  { key: 'performance', label: 'Performans' },
  { key: 'cache', label: 'Önbellek' },
  { key: 'eventbus', label: 'Olay Yolu' },
  { key: 'audit', label: 'Denetim Kayıt' },
  { key: 'analysis', label: 'Analiz' },
];

export type CheckStatus = 'pass' | 'warning' | 'fail' | 'unknown';

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  pass: 'Geçti',
  warning: 'Uyarı',
  fail: 'Başarısız',
  unknown: 'Bilinmiyor',
};

export const CHECK_STATUS_COLORS: Record<CheckStatus, string> = {
  pass: 'text-success',
  warning: 'text-warning',
  fail: 'text-destructive',
  unknown: 'text-muted-foreground',
};

export const CHECK_STATUS_BADGE: Record<CheckStatus, 'success' | 'warning' | 'danger'> = {
  pass: 'success',
  warning: 'warning',
  fail: 'danger',
  unknown: 'warning',
};

export interface DiagnosticCheck {
  name: string;
  status: CheckStatus;
  message: string;
  duration: number;
  category?: string;
  details?: string;
}

export interface DiagnosticModule {
  name: string;
  status: CheckStatus;
  checks?: number;
  lastRun?: string;
}

export interface DiagnosticAlert {
  id: string;
  type: 'FAILED_CHECK' | 'DEGRADED' | 'TIMEOUT' | 'HIGH_MEMORY' | 'SLOW_RUNTIME' | 'PROVIDER_ERROR' | 'QUEUE_OVERLOAD' | 'WORKFLOW_FAILURE';
  title: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface DiagnosticHistoryEntry {
  id: string;
  timestamp: string;
  module: string;
  status: CheckStatus;
  duration: number;
  message: string;
  details?: string;
}

export interface DiagnosticsSnapshot {
  checks: DiagnosticCheck[];
  modules: DiagnosticModule[];
  alerts: DiagnosticAlert[];
  history: DiagnosticHistoryEntry[];
  overallStatus: CheckStatus;
  lastRun: string | null;
  totalDurationMs: number;
}

export const MODULE_DISPLAY: Record<string, string> = {
  'Workflow Engine': 'İş Akışı Motoru',
  'Workflow Queue': 'İş Akışı Kuyruğu',
  'Scheduler Engine': 'Zamanlayıcı Motoru',
  'Provider Health': 'Sağlayıcı Sağlığı',
  'Performance Monitor': 'Performans Monitörü',
  'Configuration Engine': 'Yapılandırma Motoru',
  'Event Bus Engine': 'Olay Yolu Motoru',
  'Audit Log Engine': 'Denetim Kayıt Motoru',
  'Market Scanner': 'Piyasa Tarayıcısı',
  'Analysis Pipeline': 'Analiz İş Hattı',
  'Historical Data': 'Geçmiş Veri',
  'Memory': 'Bellek',
  'CPU': 'İşlemci',
  'Heap': 'Yığın',
  'Node Runtime': 'Node Çalışma Zamanı',
  Workflow: 'İş Akışı',
  Queue: 'Kuyruk',
  Scheduler: 'Zamanlayıcı',
  Performance: 'Performans',
  Configuration: 'Yapılandırma',
  'Event Bus': 'Olay Yolu',
  Audit: 'Denetim',
  Analysis: 'Analiz',
  Scanner: 'Tarayıcı',
};

export function moduleDisplay(module: string): string {
  return MODULE_DISPLAY[module] ?? module;
}

export const MODULE_CATEGORY_MAP: Record<string, string> = {
  'Workflow Engine': 'workflow',
  'Workflow Queue': 'queue',
  'Scheduler Engine': 'scheduler',
  'Provider Health': 'providers',
  'Performance Monitor': 'performance',
  'Configuration Engine': 'performance',
  'Event Bus Engine': 'eventbus',
  'Audit Log Engine': 'audit',
  'Market Scanner': 'analysis',
  'Analysis Pipeline': 'analysis',
  'Historical Data': 'analysis',
  'Memory': 'performance',
  'CPU': 'performance',
  'Heap': 'performance',
  'Node Runtime': 'performance',
};

export const SERVICE_NAMES: Array<{ name: string; category: string }> = [
  { name: 'API', category: 'performance' },
  { name: 'İş Akışı', category: 'workflow' },
  { name: 'Kuyruk', category: 'queue' },
  { name: 'Zamanlayıcı', category: 'scheduler' },
  { name: 'Sağlayıcı Sağlığı', category: 'providers' },
  { name: 'Performans', category: 'performance' },
  { name: 'Yapılandırma', category: 'performance' },
  { name: 'Olay Yolu', category: 'eventbus' },
  { name: 'Denetim', category: 'audit' },
  { name: 'Analiz', category: 'analysis' },
  { name: 'Tarayıcı', category: 'analysis' },
];
