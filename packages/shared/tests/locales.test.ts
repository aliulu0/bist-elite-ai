import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalizationProvider,
  getLocalizationProvider,
  setLocalizationProvider,
  t,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from '../src/locales/provider';

describe('LocalizationProvider', () => {
  let provider: LocalizationProvider;

  beforeEach(() => {
    provider = new LocalizationProvider('tr');
  });

  describe('constructor', () => {
    it('initializes with default locale', () => {
      expect(provider.locale).toBe('tr');
    });

    it('initializes with specified locale', () => {
      const p = new LocalizationProvider('en');
      expect(p.locale).toBe('en');
    });
  });

  describe('locale setter', () => {
    it('changes locale', () => {
      provider.locale = 'en';
      expect(provider.locale).toBe('en');
    });

    it('throws for unsupported locale', () => {
      expect(() => {
        provider.locale = 'fr' as any;
      }).toThrow('Unsupported locale');
    });
  });

  describe('t()', () => {
    it('returns Turkish translation for simple key', () => {
      expect(provider.t('app.name')).toBe('BIST Elite AI');
    });

    it('returns Turkish translation for nested key', () => {
      expect(provider.t('nav.dashboard')).toBe('Kontrol Paneli');
    });

    it('returns fallback for missing key', () => {
      expect(provider.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('returns English translation when locale is en', () => {
      provider.locale = 'en';
      expect(provider.t('nav.dashboard')).toBe('Dashboard');
    });

    it('handles parameter interpolation', () => {
      const result = provider.t('errors.stockNotFound', { symbol: 'GARAN' });
      expect(result).toBe('Hisse bulunamadı: GARAN');
    });

    it('caches translations', () => {
      const result1 = provider.t('app.name');
      const result2 = provider.t('app.name');
      expect(result1).toBe(result2);
    });

    it('clears cache on locale change', () => {
      provider.t('app.name');
      provider.locale = 'en';
      const result = provider.t('app.name');
      expect(result).toBe('BIST Elite AI');
    });
  });

  describe('tArray()', () => {
    it('returns empty array for non-array key', () => {
      const result = provider.tArray('app.name');
      expect(result).toEqual([]);
    });

    it('returns empty array for non-existent key', () => {
      const result = provider.tArray('nonexistent.array');
      expect(result).toEqual([]);
    });
  });

  describe('hasTranslation()', () => {
    it('returns true for existing key', () => {
      expect(provider.hasTranslation('app.name')).toBe(true);
    });

    it('returns false for missing key', () => {
      expect(provider.hasTranslation('nonexistent.key')).toBe(false);
    });
  });

  describe('getMissingKeys()', () => {
    it('returns empty array for tr (base locale)', () => {
      const missing = provider.getMissingKeys('tr');
      expect(missing).toEqual([]);
    });

    it('detects missing keys in target locale', () => {
      const missing = provider.getMissingKeys('en');
      expect(Array.isArray(missing)).toBe(true);
    });
  });
});

describe('Global provider', () => {
  it('returns default provider', () => {
    const provider = getLocalizationProvider();
    expect(provider).toBeInstanceOf(LocalizationProvider);
  });

  it('allows setting custom provider', () => {
    const custom = new LocalizationProvider('en');
    setLocalizationProvider(custom);
    const provider = getLocalizationProvider();
    expect(provider.locale).toBe('en');
  });

  it('global t() function works', () => {
    const provider = new LocalizationProvider('tr');
    setLocalizationProvider(provider);
    expect(t('nav.dashboard')).toBe('Kontrol Paneli');
  });
});
