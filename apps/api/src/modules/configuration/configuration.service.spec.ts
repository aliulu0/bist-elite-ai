import { ConfigurationService } from './configuration.service';
import { ConfigurationEngine } from './configuration.engine';
import { ConfigDomain } from './configuration.types';

function makeEngine() {
  return new ConfigurationEngine({ enableEvents: false, autoSnapshot: false });
}

function makeService(engine?: ConfigurationEngine) {
  const eng = engine ?? makeEngine();
  const service = new ConfigurationService(eng);
  return { service, engine: eng };
}

describe('ConfigurationService', () => {
  it('should be defined', () => {
    const { service } = makeService();
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all domain configs', () => {
      const { service } = makeService();
      const all = service.getAll();
      expect(all).toHaveProperty('technical');
      expect(all).toHaveProperty('financial');
      expect(all).toHaveProperty('smart_money');
      expect(all).toHaveProperty('opportunity');
      expect(all).toHaveProperty('candidate');
      expect(all).toHaveProperty('confluence');
      expect(all).toHaveProperty('elite_score');
      expect(all).toHaveProperty('workflow');
      expect(all).toHaveProperty('scheduler');
      expect(all).toHaveProperty('providers');
      expect(all).toHaveProperty('scanner');
      expect(all).toHaveProperty('backtest');
      expect(all).toHaveProperty('benchmark');
      expect(all).toHaveProperty('performance_monitor');
    });

    it('should return 14 domains', () => {
      const { service } = makeService();
      const all = service.getAll();
      expect(Object.keys(all)).toHaveLength(14);
    });
  });

  describe('getDomain', () => {
    it('should return config for a specific domain', () => {
      const { service } = makeService();
      const config = service.getDomain('technical');
      expect(config).toHaveProperty('rsiPeriod');
      expect(config.rsiPeriod).toBe(14);
    });

    it('should return config for each domain', () => {
      const { service } = makeService();
      const domains: ConfigDomain[] = [
        'technical', 'financial', 'smart_money', 'opportunity', 'candidate',
        'confluence', 'elite_score', 'workflow', 'scheduler', 'providers',
        'scanner', 'backtest', 'benchmark', 'performance_monitor',
      ];
      for (const d of domains) {
        const config = service.getDomain(d);
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
      }
    });
  });

  describe('setValue', () => {
    it('should update a configuration value', () => {
      const { service, engine } = makeService();
      const version = service.setValue('technical', 'rsiPeriod', 21);
      expect(version).toBeGreaterThan(0);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });

    it('should increment version', () => {
      const { service } = makeService();
      const v1 = service.setValue('technical', 'rsiPeriod', 21);
      const v2 = service.setValue('technical', 'rsiPeriod', 14);
      expect(v2).toBeGreaterThan(v1);
    });

    it('should accept user and comment', () => {
      const { service, engine } = makeService();
      service.setValue('technical', 'rsiPeriod', 21, 'admin', 'Testing');
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });
  });

  describe('getProfiles', () => {
    it('should return default profiles', () => {
      const { service } = makeService();
      const profiles = service.getProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(4);
    });

    it('should include system profiles', () => {
      const { service } = makeService();
      const profiles = service.getProfiles();
      const names = profiles.map((p) => p.name);
      expect(names).toContain('default');
      expect(names).toContain('balanced');
    });
  });

  describe('createProfile', () => {
    it('should create a new profile', () => {
      const { service } = makeService();
      const profile = service.createProfile('test', 'Test Profile', 'A test');
      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('test');
      expect(profile.label).toBe('Test Profile');
      expect(profile.isSystem).toBe(false);
    });

    it('should increment profile count', () => {
      const { service } = makeService();
      const before = service.getProfiles().length;
      service.createProfile('test', 'Test');
      expect(service.getProfiles().length).toBe(before + 1);
    });
  });

  describe('loadProfile', () => {
    it('should return true for valid profile', () => {
      const { service } = makeService();
      const profiles = service.getProfiles();
      const result = service.loadProfile(profiles[0].id);
      expect(result).toBe(true);
    });

    it('should return false for invalid profile', () => {
      const { service } = makeService();
      const result = service.loadProfile('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('duplicateProfile', () => {
    it('should duplicate a profile', () => {
      const { service } = makeService();
      const profiles = service.getProfiles();
      const dup = service.duplicateProfile(profiles[0].id, 'dup', 'Duplicate');
      expect(dup).not.toBeNull();
      expect(dup!.name).toBe('dup');
    });

    it('should return null for invalid source', () => {
      const { service } = makeService();
      const dup = service.duplicateProfile('nonexistent', 'dup', 'Duplicate');
      expect(dup).toBeNull();
    });
  });

  describe('deleteProfile', () => {
    it('should delete a non-system profile', () => {
      const { service } = makeService();
      const profile = service.createProfile('to_delete', 'Delete Me');
      const result = service.deleteProfile(profile.id);
      expect(result).toBe(true);
    });

    it('should return false for system profile', () => {
      const { service } = makeService();
      const profiles = service.getProfiles();
      const systemProfile = profiles.find((p) => p.isSystem);
      if (systemProfile) {
        const result = service.deleteProfile(systemProfile.id);
        expect(result).toBe(false);
      }
    });

    it('should return false for nonexistent profile', () => {
      const { service } = makeService();
      const result = service.deleteProfile('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getSnapshots', () => {
    it('should return empty array initially', () => {
      const { service } = makeService();
      expect(service.getSnapshots()).toEqual([]);
    });
  });

  describe('createSnapshot', () => {
    it('should create a snapshot', () => {
      const { service } = makeService();
      const snap = service.createSnapshot('Test snapshot');
      expect(snap.id).toBeDefined();
      expect(snap.comment).toBe('Test snapshot');
      expect(snap.timestamp).toBeDefined();
    });

    it('should appear in getSnapshots', () => {
      const { service } = makeService();
      service.createSnapshot('Test');
      expect(service.getSnapshots()).toHaveLength(1);
    });
  });

  describe('rollbackSnapshot', () => {
    it('should rollback to a snapshot', () => {
      const { service, engine } = makeService();
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = service.createSnapshot('Before rollback');
      engine.setValue('technical', 'rsiPeriod', 50);
      const result = service.rollbackSnapshot(snap.id);
      expect(result).toBe(true);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });

    it('should return false for invalid snapshot', () => {
      const { service } = makeService();
      const result = service.rollbackSnapshot('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should return history with pagination', () => {
      const { service, engine } = makeService();
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.setValue('technical', 'macdFast', 10);
      const result = service.getHistory(50, 0);
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support limit', () => {
      const { service, engine } = makeService();
      for (let i = 0; i < 10; i++) {
        engine.setValue('technical', `key${i}`, i);
      }
      const result = service.getHistory(3, 0);
      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('should support offset', () => {
      const { service, engine } = makeService();
      for (let i = 0; i < 10; i++) {
        engine.setValue('technical', `key${i}`, i);
      }
      const result = service.getHistory(5, 5);
      expect(result.entries).toHaveLength(5);
      expect(result.total).toBe(10);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const { service } = makeService();
      const stats = service.getStats();
      expect(stats).toHaveProperty('version');
      expect(stats).toHaveProperty('totalDomains');
      expect(stats).toHaveProperty('totalKeys');
      expect(stats).toHaveProperty('totalSnapshots');
      expect(stats).toHaveProperty('totalProfiles');
      expect(stats).toHaveProperty('activeProfile');
      expect(stats).toHaveProperty('totalChanges');
    });

    it('should report 14 domains', () => {
      const { service } = makeService();
      const stats = service.getStats();
      expect(stats.totalDomains).toBe(14);
    });
  });

  describe('resetDomain', () => {
    it('should reset a domain to defaults', () => {
      const { service, engine } = makeService();
      engine.setValue('technical', 'rsiPeriod', 50);
      service.resetDomain('technical');
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });
  });

  describe('resetAll', () => {
    it('should reset all domains to defaults', () => {
      const { service, engine } = makeService();
      engine.setValue('technical', 'rsiPeriod', 50);
      engine.setValue('financial', 'priceToBookPass', 99);
      service.resetAll();
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
      expect(engine.getValue('financial', 'priceToBookPass')).toBe(1.5);
    });
  });
});
