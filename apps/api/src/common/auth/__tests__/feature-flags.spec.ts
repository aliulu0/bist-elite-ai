import { ConfigService } from '@nestjs/config';
import { FeatureFlags } from '../feature-flags';

class MockConfigService {
  private data: Record<string, string> = {
    FEATURE_FLAGS: 'audit_logging=true,rate_limiting=true',
  };

  get(key: string, defaultValue?: string): string | undefined {
    return this.data[key] ?? defaultValue;
  }
}

describe('FeatureFlags', () => {
  let flags: FeatureFlags;

  beforeEach(() => {
    flags = new FeatureFlags(new MockConfigService() as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(flags).toBeDefined();
  });

  describe('isEnabled', () => {
    it('returns true for enabled flags', () => {
      expect(flags.isEnabled('audit_logging')).toBe(true);
    });

    it('returns false for disabled flags', () => {
      expect(flags.isEnabled('auth_enabled')).toBe(false);
    });

    it('returns false for unknown flags', () => {
      expect(flags.isEnabled('unknown_flag')).toBe(false);
    });
  });

  describe('get', () => {
    it('returns flag definition', () => {
      const flag = flags.get('auth_enabled');
      expect(flag).toBeDefined();
      expect(flag?.name).toBe('auth_enabled');
      expect(flag?.description).toContain('authentication');
    });

    it('returns undefined for unknown flag', () => {
      expect(flags.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all flags', () => {
      const all = flags.getAll();
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('getEnabled', () => {
    it('returns only enabled flags', () => {
      const enabled = flags.getEnabled();
      for (const flag of enabled) {
        expect(flag.enabled).toBe(true);
      }
    });
  });

  describe('getDisabled', () => {
    it('returns only disabled flags', () => {
      const disabled = flags.getDisabled();
      for (const flag of disabled) {
        expect(flag.enabled).toBe(false);
      }
    });
  });

  describe('environment override', () => {
    it('applies feature flag overrides from config', () => {
      expect(flags.isEnabled('audit_logging')).toBe(true);
      expect(flags.isEnabled('rate_limiting')).toBe(true);
    });
  });

  describe('default flags', () => {
    it('has auth_enabled flag', () => {
      expect(flags.get('auth_enabled')).toBeDefined();
    });

    it('has registration_enabled flag', () => {
      expect(flags.get('registration_enabled')).toBeDefined();
    });

    it('has multi_tenant flag', () => {
      expect(flags.get('multi_tenant')).toBeDefined();
    });

    it('has oauth2_google flag', () => {
      expect(flags.get('oauth2_google')).toBeDefined();
    });
  });
});
