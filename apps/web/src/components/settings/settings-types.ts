export type SettingsTab =
  | 'general'
  | 'theme'
  | 'scanner'
  | 'analysis'
  | 'workflow'
  | 'scheduler'
  | 'providers'
  | 'notifications'
  | 'advanced'
  | 'profiles'
  | 'snapshots';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'normal' | 'spacious';

export interface GeneralSettings {
  language: string;
  timezone: string;
  currency: string;
  defaultPage: string;
  startupMode: string;
  autoRefresh: boolean;
}

export interface ThemeSettings {
  mode: ThemeMode;
  density: Density;
  accentColor: string;
}

export interface ScannerSettings {
  minEliteScore: number;
  minOpportunity: number;
  minConfidence: number;
  maxResults: number;
  watchlistLimit: number;
  sectorFilters: string[];
  defaultSort: string;
}

export interface AnalysisSettings {
  defaultTimeframe: string;
  indicatorSettings: Record<string, number>;
  technicalWeights: Record<string, number>;
  financialWeights: Record<string, number>;
  smartMoneyWeights: Record<string, number>;
}

export interface WorkflowSettings {
  defaultType: string;
  timeout: number;
  retry: number;
  queuePriority: string;
  maxConcurrent: number;
  autoStart: boolean;
}

export interface SchedulerSettings {
  marketScan: string;
  incrementalScan: string;
  nightlyBacktest: string;
  nightlyBenchmark: string;
  updateInterval: string;
  cacheCleanup: string;
}

export interface ProviderSettings {
  priority: string[];
  timeout: number;
  retry: number;
  failover: boolean;
}

export interface NotificationSettings {
  piyasa: boolean;
  workflow: boolean;
  provider: boolean;
  sistem: boolean;
  portfoy: boolean;
  watchlist: boolean;
}

export interface AdvancedSettings {
  cacheCleanup: boolean;
  localStorageCleanup: boolean;
  debugMode: boolean;
  verboseLogging: boolean;
  experimentalFeatures: boolean;
}

export interface SettingsProfile {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface SettingsSnapshot {
  id: string;
  profileId: string;
  createdAt: string;
  createdBy: string;
  changes: Record<string, { from: unknown; to: unknown }>;
}

export interface SettingsValues {
  general: GeneralSettings;
  theme: ThemeSettings;
  scanner: ScannerSettings;
  analysis: AnalysisSettings;
  workflow: WorkflowSettings;
  scheduler: SchedulerSettings;
  providers: ProviderSettings;
  notifications: NotificationSettings;
  advanced: AdvancedSettings;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const SETTINGS_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: 'general', label: 'Genel' },
  { key: 'theme', label: 'Görünüm' },
  { key: 'scanner', label: 'Tarayıcı' },
  { key: 'analysis', label: 'Analiz' },
  { key: 'workflow', label: 'İş Akışı' },
  { key: 'scheduler', label: 'Zamanlayıcı' },
  { key: 'providers', label: 'Sağlayıcılar' },
  { key: 'notifications', label: 'Bildirimler' },
  { key: 'advanced', label: 'Gelişmiş' },
  { key: 'profiles', label: 'Profiller' },
  { key: 'snapshots', label: 'Anlık Görüntüler' },
];

export const DEFAULT_GENERAL: GeneralSettings = {
  language: 'tr',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  defaultPage: 'dashboard',
  startupMode: 'last',
  autoRefresh: true,
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'dark',
  density: 'normal',
  accentColor: '#3b82f6',
};

export const DEFAULT_SCANNER: ScannerSettings = {
  minEliteScore: 60,
  minOpportunity: 40,
  minConfidence: 0.5,
  maxResults: 50,
  watchlistLimit: 20,
  sectorFilters: [],
  defaultSort: 'eliteScore',
};

export const DEFAULT_ANALYSIS: AnalysisSettings = {
  defaultTimeframe: '1d',
  indicatorSettings: { rsi: 14, ema: 20, sma: 50 },
  technicalWeights: { trend: 30, momentum: 25, volatility: 20, volume: 25 },
  financialWeights: { valuation: 35, growth: 35, profitability: 30 },
  smartMoneyWeights: { accumulation: 30, distribution: 25, flow: 25, compression: 20 },
};

export const DEFAULT_WORKFLOW: WorkflowSettings = {
  defaultType: 'FULL_SCAN',
  timeout: 300000,
  retry: 3,
  queuePriority: 'HIGH',
  maxConcurrent: 3,
  autoStart: false,
};

export const DEFAULT_SCHEDULER: SchedulerSettings = {
  marketScan: '0 9 * * 1-5',
  incrementalScan: '0 */4 * * 1-5',
  nightlyBacktest: '0 22 * * 1-5',
  nightlyBenchmark: '0 23 * * 1-5',
  updateInterval: '15',
  cacheCleanup: '0 3 * * *',
};

export const DEFAULT_PROVIDERS: ProviderSettings = {
  priority: ['yahoo', 'fintables'],
  timeout: 10000,
  retry: 3,
  failover: true,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  piyasa: true,
  workflow: true,
  provider: true,
  sistem: true,
  portfoy: true,
  watchlist: true,
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  cacheCleanup: false,
  localStorageCleanup: false,
  debugMode: false,
  verboseLogging: false,
  experimentalFeatures: false,
};

export const DEFAULT_SETTINGS: SettingsValues = {
  general: { ...DEFAULT_GENERAL },
  theme: { ...DEFAULT_THEME },
  scanner: { ...DEFAULT_SCANNER },
  analysis: { ...DEFAULT_ANALYSIS },
  workflow: { ...DEFAULT_WORKFLOW },
  scheduler: { ...DEFAULT_SCHEDULER },
  providers: { ...DEFAULT_PROVIDERS },
  notifications: { ...DEFAULT_NOTIFICATIONS },
  advanced: { ...DEFAULT_ADVANCED },
};

export const DEFAULT_PROFILES: SettingsProfile[] = [
  { id: 'default', name: 'Varsayılan', description: 'Standart yapılandırma', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isDefault: true },
  { id: 'balanced', name: 'Dengeli', description: 'Dengeli yapılandırma', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isDefault: false },
  { id: 'aggressive', name: 'Agresif', description: 'Agresif yatırım profili', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isDefault: false },
  { id: 'conservative', name: 'Muhafazakar', description: 'Güvenli yapılandırma', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isDefault: false },
];

export const LANGUAGE_OPTIONS = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'İngilizce' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
  { value: 'Europe/London', label: 'Londra (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
];
