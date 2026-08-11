import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalRulesEngine } from './technical-rules.engine';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { SmartMoneyResult } from '../smart-money/smart-money.types';

function ind(name: string, value: number | number[] | Record<string, number | boolean> | null): IndicatorResult {
  return {
    indicator: name,
    timeframe: '1d',
    timestamp: '2025-01-15T00:00:00Z',
    value,
    metadata: {},
    isValid: true,
  };
}

function struct(overrides: Partial<MarketStructureResult> = {}): MarketStructureResult {
  return {
    timeframe: '1d',
    trend: 'sideways',
    structure: [],
    swingHighs: [],
    swingLows: [],
    supportZones: [],
    resistanceZones: [],
    breakOfStructure: [],
    changeOfCharacter: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

function sm(overrides: Partial<SmartMoneyResult> = {}): SmartMoneyResult {
  return {
    timeframe: '1d',
    accumulationScore: 0,
    distributionScore: 0,
    institutionalActivity: 'neutral',
    smartMoneyConfidence: 0,
    trendAlignment: 'sideways',
    signals: [],
    metadata: {},
    isValid: true,
    ...overrides,
  };
}

describe('TechnicalRulesEngine', () => {
  let engine: TechnicalRulesEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnicalRulesEngine],
    }).compile();
    engine = module.get(TechnicalRulesEngine);
  });

  it('evaluates all rules and returns valid output', () => {
    const result = engine.evaluate([], struct(), sm(), '1d');
    expect(result.isValid).toBe(true);
    expect(result.timeframe).toBe('1d');
    expect(result.rules.length).toBeGreaterThan(0);
  });

  describe('trend rules', () => {
    it('EMA alignment PASS when aligned bullish', () => {
      const indicators = [
        ind('EMA_9', 110),
        ind('EMA_20', 105),
        ind('EMA_50', 100),
      ];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'EMA_ALIGNMENT');
      expect(rule?.status).toBe('PASS');
    });

    it('EMA alignment FAIL when aligned bearish', () => {
      const indicators = [
        ind('EMA_9', 90),
        ind('EMA_20', 95),
        ind('EMA_50', 100),
      ];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'EMA_ALIGNMENT');
      expect(rule?.status).toBe('FAIL');
    });

    it('EMA alignment WARNING when mixed', () => {
      const indicators = [
        ind('EMA_9', 100),
        ind('EMA_20', 110),
        ind('EMA_50', 95),
      ];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'EMA_ALIGNMENT');
      expect(rule?.status).toBe('WARNING');
    });

    it('SMA alignment PASS when aligned bullish', () => {
      const indicators = [
        ind('SMA_20', 110),
        ind('SMA_50', 105),
        ind('SMA_200', 100),
      ];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'SMA_ALIGNMENT');
      expect(rule?.status).toBe('PASS');
    });

    it('SMA alignment FAIL when aligned bearish', () => {
      const indicators = [
        ind('SMA_20', 90),
        ind('SMA_50', 95),
        ind('SMA_200', 100),
      ];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'SMA_ALIGNMENT');
      expect(rule?.status).toBe('FAIL');
    });

    it('Ichimoku trend PASS when tenkan > kijun', () => {
      const indicators = [ind('ICHIMOKU', { tenkan: 105, kijun: 100, senkouA: 102, senkouB: 98 })];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'ICHIMOKU_TREND');
      expect(rule?.status).toBe('PASS');
    });

    it('Ichimoku trend FAIL when tenkan < kijun', () => {
      const indicators = [ind('ICHIMOKU', { tenkan: 95, kijun: 100, senkouA: 97, senkouB: 102 })];
      const result = engine.evaluate(indicators, struct(), sm(), '1d');
      const rule = result.rules.find((r) => r.rule === 'ICHIMOKU_TREND');
      expect(rule?.status).toBe('FAIL');
    });
  });

  describe('momentum rules', () => {
    it('RSI PASS when oversold', () => {
      const result = engine.evaluate([ind('RSI', 25)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'RSI')?.status).toBe('PASS');
    });

    it('RSI FAIL when overbought', () => {
      const result = engine.evaluate([ind('RSI', 75)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'RSI')?.status).toBe('FAIL');
    });

    it('RSI WARNING when neutral', () => {
      const result = engine.evaluate([ind('RSI', 50)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'RSI')?.status).toBe('WARNING');
    });

    it('StochRSI PASS when oversold', () => {
      const result = engine.evaluate([ind('STOCHASTIC_RSI', { k: 15, d: 18 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'STOCHASTIC_RSI')?.status).toBe('PASS');
    });

    it('StochRSI FAIL when overbought', () => {
      const result = engine.evaluate([ind('STOCHASTIC_RSI', { k: 85, d: 82 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'STOCHASTIC_RSI')?.status).toBe('FAIL');
    });

    it('MACD PASS on bullish crossover', () => {
      const result = engine.evaluate([ind('MACD', { macd: 1.5, signal: 1.0, histogram: 0.5 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'MACD')?.status).toBe('PASS');
    });

    it('MACD FAIL on bearish crossover', () => {
      const result = engine.evaluate([ind('MACD', { macd: -1.5, signal: -1.0, histogram: -0.5 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'MACD')?.status).toBe('FAIL');
    });

    it('ROC PASS when positive', () => {
      const result = engine.evaluate([ind('ROC', 2.5)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'ROC')?.status).toBe('PASS');
    });

    it('ROC FAIL when negative', () => {
      const result = engine.evaluate([ind('ROC', -2.5)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'ROC')?.status).toBe('FAIL');
    });
  });

  describe('volume rules', () => {
    it('Relative volume PASS when high', () => {
      const result = engine.evaluate([ind('RELATIVE_VOLUME', 2.5)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'RELATIVE_VOLUME')?.status).toBe('PASS');
    });

    it('Relative volume FAIL when low', () => {
      const result = engine.evaluate([ind('RELATIVE_VOLUME', 0.3)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'RELATIVE_VOLUME')?.status).toBe('FAIL');
    });

    it('Volume spike PASS when detected', () => {
      const result = engine.evaluate([ind('VOLUME_SPIKE', 3.0)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'VOLUME_SPIKE')?.status).toBe('PASS');
    });

    it('OBV confirmation PASS when rising', () => {
      const result = engine.evaluate([ind('OBV', [100, 110, 120])], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'OBV_CONFIRMATION')?.status).toBe('PASS');
    });

    it('OBV confirmation FAIL when falling', () => {
      const result = engine.evaluate([ind('OBV', [120, 110, 100])], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'OBV_CONFIRMATION')?.status).toBe('FAIL');
    });
  });

  describe('volatility rules', () => {
    it('ATR PASS when available', () => {
      const result = engine.evaluate([ind('ATR', 2.5)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'ATR')?.status).toBe('PASS');
    });

    it('Compression PASS when squeezing', () => {
      const result = engine.evaluate([ind('COMPRESSION', { isSqueezing: true, bandwidth: 0.015 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'COMPRESSION')?.status).toBe('PASS');
    });

    it('Compression WARNING when not squeezing', () => {
      const result = engine.evaluate([ind('COMPRESSION', { isSqueezing: false, bandwidth: 0.05 })], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'COMPRESSION')?.status).toBe('WARNING');
    });
  });

  describe('money flow rules', () => {
    it('MFI PASS when oversold', () => {
      const result = engine.evaluate([ind('MFI', 15)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'MFI')?.status).toBe('PASS');
    });

    it('MFI FAIL when overbought', () => {
      const result = engine.evaluate([ind('MFI', 85)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'MFI')?.status).toBe('FAIL');
    });

    it('CMF PASS when bullish', () => {
      const result = engine.evaluate([ind('CMF', 0.1)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'CMF')?.status).toBe('PASS');
    });

    it('CMF FAIL when bearish', () => {
      const result = engine.evaluate([ind('CMF', -0.1)], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'CMF')?.status).toBe('FAIL');
    });
  });

  describe('market structure rules', () => {
    it('HH PASS when higher highs exist', () => {
      const s = struct({
        structure: [
          { index: 10, price: 110, timestamp: '2025-01-10', type: 'HH', brokenSwing: { index: 5, price: 100, timestamp: '2025-01-05', type: 'high' } },
        ],
      });
      const result = engine.evaluate([], s, sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'HH')?.status).toBe('PASS');
    });

    it('HL PASS when higher lows exist', () => {
      const s = struct({
        structure: [
          { index: 10, price: 95, timestamp: '2025-01-10', type: 'HL', brokenSwing: { index: 5, price: 90, timestamp: '2025-01-05', type: 'low' } },
        ],
      });
      const result = engine.evaluate([], s, sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'HL')?.status).toBe('PASS');
    });

    it('BOS PASS when break of structure exists', () => {
      const s = struct({
        breakOfStructure: [
          { index: 10, price: 110, timestamp: '2025-01-10', type: 'HH', brokenSwing: { index: 5, price: 100, timestamp: '2025-01-05', type: 'high' } },
        ],
      });
      const result = engine.evaluate([], s, sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'BOS')?.status).toBe('PASS');
    });

    it('ChoCH FAIL when change of character exists', () => {
      const s = struct({
        changeOfCharacter: [
          { index: 10, price: 105, timestamp: '2025-01-10', type: 'LH', brokenSwing: { index: 5, price: 110, timestamp: '2025-01-05', type: 'high' } },
        ],
      });
      const result = engine.evaluate([], s, sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'CHOCH')?.status).toBe('FAIL');
    });

    it('ChoCH PASS when no change of character', () => {
      const result = engine.evaluate([], struct(), sm(), '1d');
      expect(result.rules.find((r) => r.rule === 'CHOCH')?.status).toBe('PASS');
    });
  });

  describe('smart money rules', () => {
    it('Accumulation PASS when score is high', () => {
      const result = engine.evaluate([], struct(), sm({ accumulationScore: 0.8 }), '1d');
      expect(result.rules.find((r) => r.rule === 'ACCUMULATION')?.status).toBe('PASS');
    });

    it('Accumulation FAIL when distribution is high', () => {
      const result = engine.evaluate([], struct(), sm({ distributionScore: 0.8 }), '1d');
      expect(result.rules.find((r) => r.rule === 'ACCUMULATION')?.status).toBe('FAIL');
    });

    it('Institutional PASS when confidence is high', () => {
      const result = engine.evaluate([], struct(), sm({ smartMoneyConfidence: 0.7 }), '1d');
      expect(result.rules.find((r) => r.rule === 'INSTITUTIONAL_PARTICIPATION')?.status).toBe('PASS');
    });

    it('Institutional WARNING when confidence is low', () => {
      const result = engine.evaluate([], struct(), sm({ smartMoneyConfidence: 0.2 }), '1d');
      expect(result.rules.find((r) => r.rule === 'INSTITUTIONAL_PARTICIPATION')?.status).toBe('WARNING');
    });
  });

  describe('NOT_AVAILABLE rules', () => {
    it('returns NOT_AVAILABLE for missing indicators', () => {
      const result = engine.evaluate([], struct(), sm(), '1d');
      const naRules = result.rules.filter((r) => r.status === 'NOT_AVAILABLE');
      expect(naRules.length).toBeGreaterThan(0);
    });

    it('returns NOT_AVAILABLE for invalid structure', () => {
      const s = struct({ isValid: false });
      const result = engine.evaluate([], s, sm(), '1d');
      const naRules = result.rules.filter((r) => r.status === 'NOT_AVAILABLE');
      expect(naRules.length).toBeGreaterThan(0);
    });

    it('returns NOT_AVAILABLE for invalid smart money', () => {
      const result = engine.evaluate([], struct(), sm({ isValid: false }), '1d');
      const naRules = result.rules.filter((r) => r.status === 'NOT_AVAILABLE');
      expect(naRules.length).toBeGreaterThan(0);
    });
  });

  describe('all timeframes', () => {
    it.each(['4h', '1d', '1w', '1m', '3m', '6m'] as const)('supports %s', (tf) => {
      const result = engine.evaluate([], struct(), sm(), tf);
      expect(result.timeframe).toBe(tf);
      expect(result.isValid).toBe(true);
    });
  });

  describe('rule categories', () => {
    it('has rules from all categories', () => {
      const result = engine.evaluate([], struct(), sm(), '1d');
      const categories = new Set(result.rules.map((r) => r.category));
      expect(categories.has('trend')).toBe(true);
      expect(categories.has('momentum')).toBe(true);
      expect(categories.has('volume')).toBe(true);
      expect(categories.has('volatility')).toBe(true);
      expect(categories.has('money_flow')).toBe(true);
      expect(categories.has('market_structure')).toBe(true);
      expect(categories.has('smart_money')).toBe(true);
    });
  });

  describe('metadata and descriptions', () => {
    it('includes descriptions for all rules', () => {
      const result = engine.evaluate([], struct(), sm(), '1d');
      result.rules.forEach((rule) => {
        expect(rule.description).toBeTruthy();
        expect(rule.rule).toBeTruthy();
      });
    });
  });
});
