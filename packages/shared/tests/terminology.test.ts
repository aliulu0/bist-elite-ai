import { describe, it, expect } from 'vitest';
import {
  FINANCIAL_TERMINOLOGY,
  getTerminology,
  getTerminologyByCategory,
  getIndicatorTerminology,
  getMarketTerminology,
  getAnalysisTerminology,
  getRiskTerminology,
} from '../src/locales/terminology';

describe('FINANCIAL_TERMINOLOGY', () => {
  it('contains entries', () => {
    expect(FINANCIAL_TERMINOLOGY.length).toBeGreaterThan(0);
  });

  it('each entry has required fields', () => {
    for (const entry of FINANCIAL_TERMINOLOGY) {
      expect(entry.key).toBeTruthy();
      expect(entry.tr).toBeTruthy();
      expect(entry.en).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(typeof entry.preserveOriginal).toBe('boolean');
    }
  });

  it('indicator names are preserved', () => {
    const indicators = getIndicatorTerminology();
    for (const entry of indicators) {
      expect(entry.preserveOriginal).toBe(true);
      expect(entry.tr).toBe(entry.en);
    }
  });
});

describe('getTerminology', () => {
  it('returns Turkish for known indicator', () => {
    expect(getTerminology('rsi', 'tr')).toBe('RSI');
  });

  it('returns English for known indicator', () => {
    expect(getTerminology('rsi', 'en')).toBe('RSI');
  });

  it('returns Turkish market term', () => {
    expect(getTerminology('bullish', 'tr')).toBe('Yükseliş Eğilimi');
  });

  it('returns English market term', () => {
    expect(getTerminology('bullish', 'en')).toBe('Bullish');
  });

  it('returns key for unknown term', () => {
    expect(getTerminology('unknown', 'tr')).toBe('unknown');
  });
});

describe('getTerminologyByCategory', () => {
  it('returns indicator terminology', () => {
    const indicators = getTerminologyByCategory('indicator');
    expect(indicators.length).toBeGreaterThan(0);
    for (const entry of indicators) {
      expect(entry.category).toBe('indicator');
    }
  });

  it('returns market terminology', () => {
    const market = getTerminologyByCategory('market');
    expect(market.length).toBeGreaterThan(0);
    for (const entry of market) {
      expect(entry.category).toBe('market');
    }
  });

  it('returns analysis terminology', () => {
    const analysis = getTerminologyByCategory('analysis');
    expect(analysis.length).toBeGreaterThan(0);
    for (const entry of analysis) {
      expect(entry.category).toBe('analysis');
    }
  });

  it('returns risk terminology', () => {
    const risk = getTerminologyByCategory('risk');
    expect(risk.length).toBeGreaterThan(0);
    for (const entry of risk) {
      expect(entry.category).toBe('risk');
    }
  });
});

describe('helper functions', () => {
  it('getIndicatorTerminology returns indicators', () => {
    const result = getIndicatorTerminology();
    expect(result.length).toBeGreaterThan(0);
  });

  it('getMarketTerminology returns market terms', () => {
    const result = getMarketTerminology();
    expect(result.length).toBeGreaterThan(0);
  });

  it('getAnalysisTerminology returns analysis terms', () => {
    const result = getAnalysisTerminology();
    expect(result.length).toBeGreaterThan(0);
  });

  it('getRiskTerminology returns risk terms', () => {
    const result = getRiskTerminology();
    expect(result.length).toBeGreaterThan(0);
  });
});
