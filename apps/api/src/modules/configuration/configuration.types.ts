export type ConfigDomain =
  | 'technical'
  | 'financial'
  | 'smart_money'
  | 'opportunity'
  | 'candidate'
  | 'confluence'
  | 'elite_score'
  | 'workflow'
  | 'scheduler'
  | 'providers'
  | 'scanner'
  | 'backtest'
  | 'benchmark'
  | 'performance_monitor';

export type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

export type DomainConfig = Record<string, ConfigValue>;

export type ConfigProfileName = 'default' | 'balanced' | 'aggressive' | 'conservative' | 'custom';

export interface ConfigSnapshot {
  id: string;
  timestamp: string;
  user: string;
  comment: string;
  changedKeys: ConfigChangedKey[];
  configs: Record<ConfigDomain, DomainConfig>;
  version: number;
}

export interface ConfigChangedKey {
  domain: ConfigDomain;
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
}

export interface ConfigChangeEntry {
  domain: ConfigDomain;
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  timestamp: string;
}

export interface ConfigProfile {
  id: string;
  name: ConfigProfileName;
  label: string;
  description: string;
  configs: Record<ConfigDomain, DomainConfig>;
  createdAt: string;
  isSystem: boolean;
}

export interface ConfigValidationRule {
  domain: ConfigDomain;
  key: string;
  type: 'range' | 'positive' | 'non_negative' | 'unique' | 'total_equals' | 'enum' | 'custom';
  params?: Record<string, unknown>;
  message: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  domain: ConfigDomain;
  errors: ConfigValidationError[];
}

export interface ConfigValidationError {
  key: string;
  rule: string;
  message: string;
  value: ConfigValue;
}

export interface ConfigExportData {
  version: number;
  exportedAt: string;
  profiles: ConfigProfile[];
  configs: Record<ConfigDomain, DomainConfig>;
  activeProfile: ConfigProfileName;
}

export interface ConfigImportData {
  configs?: Partial<Record<ConfigDomain, DomainConfig>>;
  profiles?: ConfigProfile[];
  activeProfile?: ConfigProfileName;
}

export interface ConfigurationStats {
  version: number;
  totalDomains: number;
  totalKeys: number;
  totalSnapshots: number;
  totalProfiles: number;
  activeProfile: ConfigProfileName;
  totalChanges: number;
  lastModified: string | null;
}
