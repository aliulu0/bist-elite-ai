import { describe, it, expect } from 'vitest';
import {
  validateTranslationStructure,
  validateAllTranslations,
  getTranslationCoverage,
  getTranslationStats,
} from '../src/locales/validation';

describe('validateTranslationStructure', () => {
  it('returns valid for matching structures', () => {
    const source = { a: '1', b: { c: '2' } };
    const target = { a: '1', b: { c: '2' } };
    const result = validateTranslationStructure(source, target);
    expect(result.valid).toBe(true);
    expect(result.missingKeys).toEqual([]);
  });

  it('detects missing keys', () => {
    const source = { a: '1', b: '2' };
    const target = { a: '1' };
    const result = validateTranslationStructure(source, target);
    expect(result.valid).toBe(false);
    expect(result.missingKeys).toContain('b');
  });

  it('detects extra keys', () => {
    const source = { a: '1' };
    const target = { a: '1', b: '2' };
    const result = validateTranslationStructure(source, target);
    expect(result.extraKeys).toContain('b');
  });

  it('detects type mismatches', () => {
    const source = { a: 'string' };
    const target = { a: 123 };
    const result = validateTranslationStructure(source, target);
    expect(result.valid).toBe(false);
    expect(result.mismatchedTypes.length).toBeGreaterThan(0);
  });
});

describe('validateAllTranslations', () => {
  it('validates all locales', () => {
    const results = validateAllTranslations();
    expect(results.tr).toBeDefined();
    expect(results.en).toBeDefined();
  });

  it('tr locale has no missing keys', () => {
    const results = validateAllTranslations();
    expect(results.tr.missingKeys).toEqual([]);
  });

  it('en locale structure matches tr', () => {
    const results = validateAllTranslations();
    expect(results.en.missingKeys).toEqual([]);
  });
});

describe('getTranslationCoverage', () => {
  it('returns 100% for base locale', () => {
    const coverage = getTranslationCoverage('tr');
    expect(coverage).toBe(1);
  });

  it('returns coverage for en locale', () => {
    const coverage = getTranslationCoverage('en');
    expect(coverage).toBeGreaterThanOrEqual(0);
    expect(coverage).toBeLessThanOrEqual(1);
  });
});

describe('getTranslationStats', () => {
  it('returns stats for tr', () => {
    const stats = getTranslationStats('tr');
    expect(stats.totalKeys).toBeGreaterThan(0);
    expect(stats.translatedKeys).toBe(stats.totalKeys);
    expect(stats.coverage).toBe(1);
    expect(stats.missingKeys).toEqual([]);
  });

  it('returns stats for en', () => {
    const stats = getTranslationStats('en');
    expect(stats.totalKeys).toBeGreaterThan(0);
    expect(typeof stats.coverage).toBe('number');
  });
});
