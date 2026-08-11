import { ConfigurationEngine } from './configuration.engine';
import {
  ConfigDomain,
  ConfigValue,
  ConfigProfile,
} from './configuration.types';
import {
  DEFAULT_DOMAIN_CONFIGS,
  ALL_DOMAINS,
  DEFAULT_PROFILES,
} from './configuration.config';

function makeEngine() {
  return new ConfigurationEngine({ enableEvents: false, autoSnapshot: false });
}

describe('ConfigurationEngine', () => {
  let engine: ConfigurationEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('load', () => {
    it('should load all domains with defaults', () => {
      const configs = engine.load();
      expect(Object.keys(configs)).toHaveLength(ALL_DOMAINS.length);
      for (const domain of ALL_DOMAINS) {
        expect(configs[domain]).toBeDefined();
      }
    });

    it('should return a deep copy', () => {
      const configs = engine.load();
      configs.technical.rsiPeriod = 999;
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });

    it('should have correct default values', () => {
      const configs = engine.load();
      expect(configs.technical.rsiPeriod).toBe(14);
      expect(configs.financial.priceToBookPass).toBe(1.5);
      expect(configs.backtest.initialCapital).toBe(100000);
    });
  });

  describe('save', () => {
    it('should increment version', () => {
      expect(engine.getVersion()).toBe(0);
      engine.save();
      expect(engine.getVersion()).toBe(1);
    });

    it('should return new version', () => {
      const v = engine.save();
      expect(v).toBe(1);
    });
  });

  describe('get', () => {
    it('should return domain config', () => {
      const config = engine.get('technical');
      expect(config.rsiPeriod).toBe(14);
    });

    it('should return deep copy', () => {
      const config = engine.get('technical');
      config.rsiPeriod = 999;
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });
  });

  describe('getValue', () => {
    it('should return value for existing key', () => {
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });

    it('should return undefined for non-existent key', () => {
      expect(engine.getValue('technical', 'nonexistent')).toBeUndefined();
    });

    it('should work across all domains', () => {
      expect(engine.getValue('financial', 'priceToBookPass')).toBe(1.5);
      expect(engine.getValue('backtest', 'initialCapital')).toBe(100000);
      expect(engine.getValue('workflow', 'maxConcurrentWorkflows')).toBe(5);
    });
  });

  describe('setValue', () => {
    it('should set a value', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });

    it('should increment version', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      expect(engine.getVersion()).toBe(1);
    });

    it('should track change history', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const history = engine.getChangeHistory();
      expect(history.length).toBe(1);
      expect(history[0].domain).toBe('technical');
      expect(history[0].key).toBe('rsiPeriod');
      expect(history[0].oldValue).toBe(14);
      expect(history[0].newValue).toBe(21);
    });

    it('should not track if value unchanged', () => {
      engine.setValue('technical', 'rsiPeriod', 14);
      expect(engine.getChangeHistory().length).toBe(0);
      expect(engine.getVersion()).toBe(0);
    });

    it('should accept different value types', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.setValue('providers', 'yahooFinanceEnabled', false);
      engine.setValue('providers', 'primaryProvider', 'fintables');
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
      expect(engine.getValue('providers', 'yahooFinanceEnabled')).toBe(false);
      expect(engine.getValue('providers', 'primaryProvider')).toBe('fintables');
    });

    it('should auto-snapshot when enabled', () => {
      const autoEngine = new ConfigurationEngine({ enableEvents: false, autoSnapshot: true });
      autoEngine.setValue('technical', 'rsiPeriod', 21);
      expect(autoEngine.getSnapshots().length).toBe(1);
    });

    it('should not auto-snapshot when disabled', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      expect(engine.getSnapshots().length).toBe(0);
    });
  });

  describe('validate', () => {
    it('should validate a domain with no errors', () => {
      const result = engine.validate('technical');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid positive value', () => {
      engine.setValue('technical', 'rsiPeriod', -1);
      const result = engine.validate('technical');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.key === 'rsiPeriod')).toBe(true);
    });

    it('should detect invalid range value', () => {
      engine.setValue('technical', 'rsiOverbought', 150);
      const result = engine.validate('technical');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.key === 'rsiOverbought')).toBe(true);
    });

    it('should detect non-negative violation', () => {
      engine.setValue('backtest', 'stopLossPercent', -5);
      const result = engine.validate('backtest');
      expect(result.valid).toBe(false);
    });

    it('should pass validation for valid config', () => {
      const results = engine.validateAll();
      const failures = results.filter((r) => !r.valid);
      expect(failures).toHaveLength(0);
    });
  });

  describe('validateAll', () => {
    it('should validate all domains', () => {
      const results = engine.validateAll();
      expect(results).toHaveLength(ALL_DOMAINS.length);
    });

    it('should detect errors across domains', () => {
      engine.setValue('backtest', 'initialCapital', -1);
      const results = engine.validateAll();
      const backtestResult = results.find((r) => r.domain === 'backtest');
      expect(backtestResult!.valid).toBe(false);
    });
  });

  describe('export', () => {
    it('should export full config', () => {
      const data = engine.export();
      expect(data.version).toBe(0);
      expect(data.configs).toBeDefined();
      expect(data.profiles).toBeDefined();
      expect(data.activeProfile).toBe('default');
      expect(data.exportedAt).toBeDefined();
    });

    it('should export deep copies', () => {
      const data = engine.export();
      data.configs.technical.rsiPeriod = 999;
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });
  });

  describe('import', () => {
    it('should import partial configs', () => {
      engine.import({ configs: { technical: { rsiPeriod: 21 } } });
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
      expect(engine.getValue('financial', 'priceToBookPass')).toBe(1.5);
    });

    it('should increment version on import', () => {
      engine.import({ configs: { technical: { rsiPeriod: 21 } } });
      expect(engine.getVersion()).toBe(1);
    });

    it('should import profiles', () => {
      const profile: ConfigProfile = {
        id: 'test-profile',
        name: 'custom',
        label: 'Test',
        description: 'Test profile',
        configs: DEFAULT_DOMAIN_CONFIGS,
        createdAt: new Date().toISOString(),
        isSystem: false,
      };
      engine.import({ profiles: [profile] });
      const profiles = engine.getProfiles();
      expect(profiles.some((p) => p.id === 'test-profile')).toBe(true);
    });

    it('should import active profile', () => {
      engine.import({ activeProfile: 'aggressive' });
      expect(engine.getActiveProfile()).toBe('aggressive');
    });

    it('should reject invalid domain', () => {
      engine.import({ configs: { invalid_domain: { rsiPeriod: 21 } } as any });
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });
  });

  describe('reset', () => {
    it('should reset a domain to defaults', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.reset('technical');
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });

    it('should increment version on reset', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.reset('technical');
      expect(engine.getVersion()).toBe(2);
    });
  });

  describe('resetAll', () => {
    it('should reset all domains to defaults', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.setValue('backtest', 'initialCapital', 50000);
      engine.resetAll();
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
      expect(engine.getValue('backtest', 'initialCapital')).toBe(100000);
    });

    it('should increment version on resetAll', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.resetAll();
      expect(engine.getVersion()).toBe(2);
    });
  });

  describe('snapshots', () => {
    it('should create a snapshot', () => {
      const snap = engine.createSnapshot('test snapshot');
      expect(snap.id).toBeDefined();
      expect(snap.comment).toBe('test snapshot');
      expect(snap.configs).toBeDefined();
    });

    it('should store snapshot', () => {
      engine.createSnapshot('snap1');
      expect(engine.getSnapshots().length).toBe(1);
    });

    it('should track changed keys in snapshot', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = engine.createSnapshot('after change');
      expect(snap.changedKeys.length).toBe(1);
      expect(snap.changedKeys[0].key).toBe('rsiPeriod');
    });

    it('should store configs at snapshot time', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = engine.createSnapshot('snap');
      expect(snap.configs.technical.rsiPeriod).toBe(21);
    });

    it('should rollback to snapshot', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = engine.createSnapshot('before change');
      engine.setValue('technical', 'rsiPeriod', 50);
      const rolled = engine.rollback(snap.id);
      expect(rolled).toBe(true);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });

    it('should increment version on rollback', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = engine.createSnapshot('snap');
      engine.setValue('technical', 'rsiPeriod', 50);
      engine.rollback(snap.id);
      expect(engine.getVersion()).toBe(3);
    });

    it('should return false for non-existent snapshot', () => {
      expect(engine.rollback('nonexistent')).toBe(false);
    });

    it('should delete a snapshot', () => {
      const snap = engine.createSnapshot('to delete');
      const deleted = engine.deleteSnapshot(snap.id);
      expect(deleted).toBe(true);
      expect(engine.getSnapshots().length).toBe(0);
    });

    it('should return false for non-existent snapshot delete', () => {
      expect(engine.deleteSnapshot('nonexistent')).toBe(false);
    });

    it('should cap snapshots at maxSnapshots', () => {
      const smallEngine = new ConfigurationEngine({
        enableEvents: false,
        autoSnapshot: false,
        maxSnapshots: 3,
      });
      for (let i = 0; i < 5; i++) {
        smallEngine.createSnapshot(`snap-${i}`);
      }
      expect(smallEngine.getSnapshots().length).toBe(3);
    });
  });

  describe('profiles', () => {
    it('should have default profiles', () => {
      const profiles = engine.getProfiles();
      expect(profiles.length).toBe(DEFAULT_PROFILES.length);
    });

    it('should create a custom profile', () => {
      const profile = engine.createProfile('custom', 'Custom Test', 'Test profile');
      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('custom');
      expect(profile.isSystem).toBe(false);
    });

    it('should store created profile', () => {
      engine.createProfile('custom', 'Custom', 'Desc');
      const profiles = engine.getProfiles();
      expect(profiles.some((p) => p.name === 'custom')).toBe(true);
    });

    it('should load a profile', () => {
      const profiles = engine.getProfiles();
      const defaultProfile = profiles.find((p) => p.name === 'default')!;
      engine.setValue('technical', 'rsiPeriod', 21);
      const loaded = engine.loadProfile(defaultProfile.id);
      expect(loaded).toBe(true);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(14);
    });

    it('should update active profile on load', () => {
      const aggressive = engine.getProfiles().find((p) => p.name === 'aggressive')!;
      engine.loadProfile(aggressive.id);
      expect(engine.getActiveProfile()).toBe('aggressive');
    });

    it('should return false for non-existent profile load', () => {
      expect(engine.loadProfile('nonexistent')).toBe(false);
    });

    it('should delete a custom profile', () => {
      const profile = engine.createProfile('custom', 'Custom', 'Desc');
      const deleted = engine.deleteProfile(profile.id);
      expect(deleted).toBe(true);
    });

    it('should not delete system profiles', () => {
      const defaultProfile = engine.getProfiles().find((p) => p.name === 'default')!;
      const deleted = engine.deleteProfile(defaultProfile.id);
      expect(deleted).toBe(false);
    });

    it('should return false for non-existent profile delete', () => {
      expect(engine.deleteProfile('nonexistent')).toBe(false);
    });

    it('should duplicate a profile', () => {
      const profiles = engine.getProfiles();
      const source = profiles[0];
      const dup = engine.duplicateProfile(source.id, 'custom', 'Custom Copy');
      expect(dup).not.toBeNull();
      expect(dup!.name).toBe('custom');
      expect(dup!.isSystem).toBe(false);
    });

    it('should return null for non-existent profile duplicate', () => {
      expect(engine.duplicateProfile('nonexistent', 'custom', 'Custom')).toBeNull();
    });

    it('should deep clone profile configs on duplicate', () => {
      const profiles = engine.getProfiles();
      const source = profiles[0];
      const dup = engine.duplicateProfile(source.id, 'custom', 'Custom');
      dup!.configs.technical.rsiPeriod = 999;
      expect(engine.getProfiles().find((p) => p.name === source.name)!.configs.technical.rsiPeriod).toBe(14);
    });
  });

  describe('change history', () => {
    it('should track multiple changes', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      engine.setValue('backtest', 'initialCapital', 50000);
      expect(engine.getChangeHistory().length).toBe(2);
    });

    it('should cap history at maxHistorySize', () => {
      const smallEngine = new ConfigurationEngine({
        enableEvents: false,
        autoSnapshot: false,
        maxHistorySize: 3,
      });
      for (let i = 0; i < 5; i++) {
        smallEngine.setValue('technical', 'rsiPeriod', 10 + i);
      }
      expect(smallEngine.getChangeHistory().length).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      const stats = engine.getStats();
      expect(stats.totalDomains).toBe(ALL_DOMAINS.length);
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.version).toBe(0);
      expect(stats.totalSnapshots).toBe(0);
      expect(stats.totalProfiles).toBe(DEFAULT_PROFILES.length);
      expect(stats.activeProfile).toBe('default');
    });

    it('should reflect changes', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const stats = engine.getStats();
      expect(stats.version).toBe(1);
      expect(stats.totalChanges).toBe(1);
      expect(stats.lastModified).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle setting null value', () => {
      engine.setValue('providers', 'primaryProvider', null);
      expect(engine.getValue('providers', 'primaryProvider')).toBeNull();
    });

    it('should handle setting array value', () => {
      engine.setValue('technical', 'smaPeriods', [5, 10, 20]);
      expect(engine.getValue('technical', 'smaPeriods')).toEqual([5, 10, 20]);
    });

    it('should handle setting object value', () => {
      engine.setValue('workflow', 'customConfig', { key: 'value' });
      expect(engine.getValue('workflow', 'customConfig')).toEqual({ key: 'value' });
    });

    it('should handle concurrent setValue calls', () => {
      for (let i = 0; i < 100; i++) {
        engine.setValue('technical', 'rsiPeriod', i);
      }
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(99);
      expect(engine.getVersion()).toBe(100);
    });

    it('should handle rollback to initial state', () => {
      engine.setValue('technical', 'rsiPeriod', 21);
      const snap = engine.createSnapshot('initial');
      engine.resetAll();
      engine.rollback(snap.id);
      expect(engine.getValue('technical', 'rsiPeriod')).toBe(21);
    });
  });
});
