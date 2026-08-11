import { Injectable } from '@nestjs/common';
import { ConfigurationEngine } from './configuration.engine';
import { ConfigDomain, ConfigValue } from './configuration.types';

@Injectable()
export class ConfigurationService {
  constructor(private readonly engine: ConfigurationEngine) {}

  getAll() {
    return this.engine.load();
  }

  getDomain(domain: ConfigDomain) {
    return this.engine.get(domain);
  }

  setValue(domain: ConfigDomain, key: string, value: ConfigValue, user?: string, comment?: string) {
    this.engine.setValue(domain, key, value, user ?? 'system', comment ?? '');
    return this.engine.getVersion();
  }

  getProfiles() {
    return this.engine.getProfiles();
  }

  createProfile(name: string, label: string, description?: string) {
    return this.engine.createProfile(name, label, description ?? '');
  }

  loadProfile(profileId: string): boolean {
    return this.engine.loadProfile(profileId);
  }

  duplicateProfile(profileId: string, newName: string, newLabel: string) {
    return this.engine.duplicateProfile(profileId, newName, newLabel);
  }

  deleteProfile(profileId: string): boolean {
    return this.engine.deleteProfile(profileId);
  }

  getSnapshots() {
    return this.engine.getSnapshots();
  }

  createSnapshot(comment?: string, user?: string) {
    return this.engine.createSnapshot(comment ?? '', user ?? 'system');
  }

  rollbackSnapshot(snapshotId: string): boolean {
    return this.engine.rollback(snapshotId);
  }

  getHistory(limit: number, offset: number) {
    const all = this.engine.getChangeHistory();
    const total = all.length;
    const entries = all.slice(offset, offset + limit);
    return { entries, total };
  }

  getStats() {
    return this.engine.getStats();
  }

  resetDomain(domain: ConfigDomain) {
    this.engine.reset(domain);
  }

  resetAll() {
    this.engine.resetAll();
  }
}
