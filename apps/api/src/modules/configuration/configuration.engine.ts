import { Injectable, Optional } from '@nestjs/common';
import {
  ConfigDomain,
  DomainConfig,
  ConfigValue,
  ConfigSnapshot,
  ConfigChangedKey,
  ConfigChangeEntry,
  ConfigProfile,
  ConfigProfileName,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigExportData,
  ConfigImportData,
  ConfigurationStats,
} from './configuration.types';
import {
  ConfigurationEngineConfig,
  DEFAULT_CONFIGURATION_ENGINE_CONFIG,
  DEFAULT_DOMAIN_CONFIGS,
  ALL_DOMAINS,
  DEFAULT_VALIDATION_RULES,
  DEFAULT_PROFILES,
} from './configuration.config';
import { EventBusEngine } from '../event-bus/event-bus.engine';

let nextSnapshotId = 0;

@Injectable()
export class ConfigurationEngine {
  private readonly config: ConfigurationEngineConfig;
  private readonly configs: Record<ConfigDomain, DomainConfig>;
  private readonly snapshots: ConfigSnapshot[] = [];
  private readonly changeHistory: ConfigChangeEntry[] = [];
  private readonly profiles: ConfigProfile[] = [];
  private version = 0;
  private activeProfile: ConfigProfileName = 'default';
  private lastModified: string | null = null;

  constructor(
    @Optional() config?: Partial<ConfigurationEngineConfig>,
    @Optional() private readonly eventBus?: EventBusEngine,
  ) {
    this.config = { ...DEFAULT_CONFIGURATION_ENGINE_CONFIG, ...config };
    this.configs = {} as Record<ConfigDomain, DomainConfig>;
    for (const domain of ALL_DOMAINS) {
      this.configs[domain] = { ...DEFAULT_DOMAIN_CONFIGS[domain] };
    }
    for (const profile of DEFAULT_PROFILES) {
      this.profiles.push({ ...profile, configs: deepClone(profile.configs) });
    }
  }

  load(): Record<ConfigDomain, DomainConfig> {
    return deepClone(this.configs);
  }

  save(): number {
    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('config.changed', { action: 'save', version: this.version });
    return this.version;
  }

  get(domain: ConfigDomain): DomainConfig {
    return deepClone(this.configs[domain]);
  }

  getValue(domain: ConfigDomain, key: string): ConfigValue {
    return this.configs[domain][key];
  }

  setValue(domain: ConfigDomain, key: string, value: ConfigValue, user = 'system', comment = ''): void {
    const oldValue = this.configs[domain][key];
    if (oldValue === value) return;

    this.configs[domain][key] = value;
    this.version++;
    this.lastModified = new Date().toISOString();

    const change: ConfigChangeEntry = {
      domain,
      key,
      oldValue,
      newValue: value,
      timestamp: this.lastModified,
    };
    this.changeHistory.push(change);
    if (this.changeHistory.length > this.config.maxHistorySize) {
      this.changeHistory.splice(0, this.changeHistory.length - this.config.maxHistorySize);
    }

    if (this.config.autoSnapshot) {
      this.createSnapshot(`Auto: ${domain}.${key} changed`, user);
    }

    this.emitEvent('config.changed', { domain, key, oldValue, newValue: value, user, comment });
  }

  validate(domain: ConfigDomain): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const domainConfig = this.configs[domain];

    for (const rule of DEFAULT_VALIDATION_RULES) {
      if (rule.domain !== domain) continue;
      const value = domainConfig[rule.key];
      if (value === undefined) continue;

      const error = this.evaluateRule(rule.key, value, rule);
      if (error) errors.push(error);
    }

    return { valid: errors.length === 0, domain, errors };
  }

  validateAll(): ConfigValidationResult[] {
    return ALL_DOMAINS.map((d) => this.validate(d));
  }

  export(): ConfigExportData {
    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      profiles: deepClone(this.profiles),
      configs: deepClone(this.configs),
      activeProfile: this.activeProfile,
    };
  }

  import(data: ConfigImportData): void {
    if (data.configs) {
      for (const [domain, domainConfig] of Object.entries(data.configs)) {
        const d = domain as ConfigDomain;
        if (!ALL_DOMAINS.includes(d)) continue;
        if (domainConfig) {
          this.configs[d] = { ...this.configs[d], ...domainConfig };
        }
      }
    }

    if (data.profiles) {
      for (const profile of data.profiles) {
        const existing = this.profiles.findIndex((p) => p.id === profile.id);
        if (existing >= 0) {
          this.profiles[existing] = profile;
        } else {
          this.profiles.push(profile);
        }
      }
    }

    if (data.activeProfile) {
      this.activeProfile = data.activeProfile;
    }

    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('config.imported', { version: this.version });
  }

  reset(domain: ConfigDomain): void {
    this.configs[domain] = { ...DEFAULT_DOMAIN_CONFIGS[domain] };
    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('config.changed', { action: 'reset', domain, version: this.version });
  }

  resetAll(): void {
    for (const domain of ALL_DOMAINS) {
      this.configs[domain] = { ...DEFAULT_DOMAIN_CONFIGS[domain] };
    }
    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('config.changed', { action: 'resetAll', version: this.version });
  }

  createSnapshot(comment: string, user = 'system'): ConfigSnapshot {
    const changedKeys: ConfigChangedKey[] = [];
    const recentWindow = 50;
    const recentChanges = this.changeHistory.slice(-recentWindow);
    for (const change of recentChanges) {
      changedKeys.push({
        domain: change.domain,
        key: change.key,
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    }

    const snapshot: ConfigSnapshot = {
      id: `snap-${Date.now()}-${(nextSnapshotId++).toString(36)}`,
      timestamp: new Date().toISOString(),
      user,
      comment,
      changedKeys,
      configs: deepClone(this.configs),
      version: this.version,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.splice(0, this.snapshots.length - this.config.maxSnapshots);
    }

    return snapshot;
  }

  rollback(snapshotId: string): boolean {
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return false;

    for (const domain of ALL_DOMAINS) {
      this.configs[domain] = deepClone(snapshot.configs[domain]);
    }

    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('config.rollback', { snapshotId, version: this.version });
    return true;
  }

  getSnapshots(): ConfigSnapshot[] {
    return [...this.snapshots];
  }

  deleteSnapshot(snapshotId: string): boolean {
    const index = this.snapshots.findIndex((s) => s.id === snapshotId);
    if (index < 0) return false;
    this.snapshots.splice(index, 1);
    return true;
  }

  createProfile(name: string, label: string, description: string): ConfigProfile {
    const id = `profile-${Date.now()}-${(nextSnapshotId++).toString(36)}`;
    const profile: ConfigProfile = {
      id,
      name: name as ConfigProfileName,
      label,
      description,
      configs: deepClone(this.configs),
      createdAt: new Date().toISOString(),
      isSystem: false,
    };
    this.profiles.push(profile);
    this.emitEvent('profile.created', { profileId: id, name });
    return profile;
  }

  loadProfile(profileId: string): boolean {
    const profile = this.profiles.find((p) => p.id === profileId);
    if (!profile) return false;

    for (const domain of ALL_DOMAINS) {
      this.configs[domain] = deepClone(profile.configs[domain]);
    }

    this.activeProfile = profile.name;
    this.version++;
    this.lastModified = new Date().toISOString();
    this.emitEvent('profile.loaded', { profileId, name: profile.name });
    return true;
  }

  deleteProfile(profileId: string): boolean {
    const index = this.profiles.findIndex((p) => p.id === profileId);
    if (index < 0) return false;
    if (this.profiles[index].isSystem) return false;
    this.profiles.splice(index, 1);
    return true;
  }

  duplicateProfile(profileId: string, newName: string, newLabel: string): ConfigProfile | null {
    const source = this.profiles.find((p) => p.id === profileId);
    if (!source) return null;

    const id = `profile-${Date.now()}-${(nextSnapshotId++).toString(36)}`;
    const duplicate: ConfigProfile = {
      id,
      name: newName as ConfigProfileName,
      label: newLabel,
      description: `Copy of ${source.description}`,
      configs: deepClone(source.configs),
      createdAt: new Date().toISOString(),
      isSystem: false,
    };
    this.profiles.push(duplicate);
    return duplicate;
  }

  getProfiles(): ConfigProfile[] {
    return deepClone(this.profiles);
  }

  getVersion(): number {
    return this.version;
  }

  getActiveProfile(): ConfigProfileName {
    return this.activeProfile;
  }

  getChangeHistory(): ConfigChangeEntry[] {
    return [...this.changeHistory];
  }

  getStats(): ConfigurationStats {
    let totalKeys = 0;
    for (const domain of ALL_DOMAINS) {
      totalKeys += Object.keys(this.configs[domain]).length;
    }

    return {
      version: this.version,
      totalDomains: ALL_DOMAINS.length,
      totalKeys,
      totalSnapshots: this.snapshots.length,
      totalProfiles: this.profiles.length,
      activeProfile: this.activeProfile,
      totalChanges: this.changeHistory.length,
      lastModified: this.lastModified,
    };
  }

  private evaluateRule(key: string, value: ConfigValue, rule: { type: string; params?: Record<string, unknown>; message: string }): ConfigValidationError | null {
    if (typeof value !== 'number') return null;

    switch (rule.type) {
      case 'positive':
        if (value <= 0) return { key, rule: rule.type, message: rule.message, value };
        break;
      case 'non_negative':
        if (value < 0) return { key, rule: rule.type, message: rule.message, value };
        break;
      case 'range': {
        const min = rule.params?.min as number;
        const max = rule.params?.max as number;
        if (value < min || value > max) return { key, rule: rule.type, message: rule.message, value };
        break;
      }
    }
    return null;
  }

  private emitEvent(type: string, payload: unknown): void {
    if (!this.config.enableEvents || !this.eventBus) return;
    try {
      this.eventBus.publish(type, 'system', payload, { source: 'configuration-engine' });
    } catch { /* event bus failure is non-fatal */ }
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
