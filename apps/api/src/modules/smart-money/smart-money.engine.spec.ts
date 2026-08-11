import { Test, TestingModule } from '@nestjs/testing';
import { SmartMoneyEngine } from './smart-money.engine';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';

function makeIndicator(
  indicator: string,
  value: number | number[] | Record<string, number | boolean> | null,
): IndicatorResult {
  return {
    indicator,
    timeframe: '1d',
    timestamp: '2025-01-15T00:00:00Z',
    value,
    metadata: {},
    isValid: true,
  };
}

function makeStructure(overrides: Partial<MarketStructureResult> = {}): MarketStructureResult {
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

describe('SmartMoneyEngine', () => {
  let engine: SmartMoneyEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmartMoneyEngine],
    }).compile();
    engine = module.get(SmartMoneyEngine);
  });

  describe('invalid input', () => {
    it('returns invalid result for invalid structure', () => {
      const structure = makeStructure({ isValid: false });
      const result = engine.evaluate([], structure, '1d');
      expect(result.isValid).toBe(false);
      expect(result.signals).toHaveLength(0);
    });

    it('returns invalid result for empty indicators', () => {
      const structure = makeStructure();
      const result = engine.evaluate([], structure, '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('accumulation scenarios', () => {
    it('detects accumulation when RSI is in accumulation zone', () => {
      const indicators = [
        makeIndicator('RSI', 35),
        makeIndicator('MFI', 25),
        makeIndicator('CMF', 0.08),
        makeIndicator('OBV', [100, 110, 120, 130, 140]),
      ];
      const structure = makeStructure({ trend: 'uptrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.accumulationScore).toBeGreaterThan(0.5);
      expect(result.institutionalActivity).toBe('accumulating');
    });

    it('detects accumulation with oversold RSI and positive CMF', () => {
      const indicators = [
        makeIndicator('RSI', 25),
        makeIndicator('MFI', 15),
        makeIndicator('CMF', 0.1),
        makeIndicator('OBV', [80, 85, 90, 95, 100]),
      ];
      const structure = makeStructure({ trend: 'uptrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.accumulationScore).toBeGreaterThan(0.4);
      expect(result.signals.some((s) => s.type === 'accumulation')).toBe(true);
    });
  });

  describe('distribution scenarios', () => {
    it('detects distribution when RSI is in distribution zone', () => {
      const indicators = [
        makeIndicator('RSI', 65),
        makeIndicator('MFI', 85),
        makeIndicator('CMF', -0.08),
        makeIndicator('OBV', [140, 130, 120, 110, 100]),
      ];
      const structure = makeStructure({ trend: 'downtrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.distributionScore).toBeGreaterThan(0.5);
      expect(result.institutionalActivity).toBe('distributing');
    });

    it('detects distribution with overbought RSI and negative CMF', () => {
      const indicators = [
        makeIndicator('RSI', 75),
        makeIndicator('MFI', 90),
        makeIndicator('CMF', -0.1),
        makeIndicator('OBV', [100, 95, 90, 85, 80]),
      ];
      const structure = makeStructure({ trend: 'downtrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.distributionScore).toBeGreaterThan(0.4);
      expect(result.signals.some((s) => s.type === 'distribution')).toBe(true);
    });
  });

  describe('volume scenarios', () => {
    it('detects high volume confirmation', () => {
      const indicators = [
        makeIndicator('RELATIVE_VOLUME', 3.5),
        makeIndicator('VOLUME_SPIKE', 2.8),
        makeIndicator('OBV', [100, 110, 130, 160, 200]),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'volume_confirmation')).toBe(true);
    });

    it('handles low volume scenario', () => {
      const indicators = [
        makeIndicator('RELATIVE_VOLUME', 0.5),
        makeIndicator('VOLUME_SPIKE', 0.3),
        makeIndicator('OBV', [100, 101, 100, 101, 100]),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'volume_confirmation')).toBe(false);
    });
  });

  describe('trend scenarios', () => {
    it('detects trend continuation with strong ADX', () => {
      const indicators = [
        makeIndicator('ADX', { adx: 35, diPlus: 25, diMinus: 10 }),
        makeIndicator('RSI', 55),
        makeIndicator('MFI', 60),
      ];
      const structure = makeStructure({
        trend: 'uptrend',
        structure: [
          { index: 10, price: 110, timestamp: '2025-01-10', type: 'HH', brokenSwing: { index: 5, price: 100, timestamp: '2025-01-05', type: 'high' } },
        ],
      });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'trend_confirmation')).toBe(true);
    });

    it('handles trend reversal with ChoCH', () => {
      const indicators = [
        makeIndicator('ADX', { adx: 30, diPlus: 15, diMinus: 20 }),
        makeIndicator('RSI', 45),
      ];
      const structure = makeStructure({
        trend: 'uptrend',
        changeOfCharacter: [
          { index: 15, price: 105, timestamp: '2025-01-15', type: 'LH', brokenSwing: { index: 10, price: 110, timestamp: '2025-01-10', type: 'high' } },
        ],
      });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'trend_confirmation')).toBe(true);
    });
  });

  describe('money flow confirmation', () => {
    it('detects money flow confirmation with aligned MFI and CMF', () => {
      const indicators = [
        makeIndicator('MFI', 65),
        makeIndicator('CMF', 0.08),
        makeIndicator('ADX', { adx: 30, diPlus: 22, diMinus: 12 }),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'money_flow_confirmation')).toBe(true);
    });
  });

  describe('compression breakout readiness', () => {
    it('detects compression breakout readiness', () => {
      const indicators = [
        makeIndicator('COMPRESSION', { isSqueezing: true, bandwidth: 0.015 }),
        makeIndicator('RELATIVE_VOLUME', 2.0),
        makeIndicator('VOLUME_SPIKE', 1.5),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'compression_breakout')).toBe(true);
    });

    it('detects compression with low bandwidth', () => {
      const indicators = [
        makeIndicator('COMPRESSION', { isSqueezing: false, bandwidth: 0.018 }),
        makeIndicator('RELATIVE_VOLUME', 1.2),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
    });
  });

  describe('institutional participation', () => {
    it('detects institutional participation with strong signals', () => {
      const indicators = [
        makeIndicator('RSI', 38),
        makeIndicator('MFI', 20),
        makeIndicator('CMF', 0.1),
        makeIndicator('RELATIVE_VOLUME', 2.5),
        makeIndicator('ADX', { adx: 35, diPlus: 25, diMinus: 10 }),
        makeIndicator('OBV', [100, 110, 120, 130, 140]),
      ];
      const structure = makeStructure({
        trend: 'uptrend',
        structure: [
          { index: 10, price: 110, timestamp: '2025-01-10', type: 'HH', brokenSwing: { index: 5, price: 100, timestamp: '2025-01-05', type: 'high' } },
        ],
      });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.institutionalActivity).toBe('accumulating');
      expect(result.smartMoneyConfidence).toBeGreaterThan(0.3);
    });
  });

  describe('metadata', () => {
    it('includes all raw scores in metadata', () => {
      const indicators = [
        makeIndicator('RSI', 50),
        makeIndicator('MFI', 50),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.metadata.accumulationRaw).toBeDefined();
      expect(result.metadata.distributionRaw).toBeDefined();
      expect(result.metadata.volumeConfirmation).toBeDefined();
      expect(result.metadata.trendConfirmation).toBeDefined();
      expect(result.metadata.moneyFlowConfirmation).toBeDefined();
      expect(result.metadata.compressionBreakout).toBeDefined();
      expect(result.metadata.institutionalParticipation).toBeDefined();
    });
  });

  describe('confidence calculation', () => {
    it('returns confidence between 0 and 1', () => {
      const indicators = [
        makeIndicator('RSI', 40),
        makeIndicator('MFI', 25),
        makeIndicator('CMF', 0.08),
        makeIndicator('ADX', { adx: 30, diPlus: 22, diMinus: 12 }),
        makeIndicator('OBV', [100, 110, 120, 130, 140]),
      ];
      const structure = makeStructure({ trend: 'uptrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.smartMoneyConfidence).toBeGreaterThanOrEqual(0);
      expect(result.smartMoneyConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('all timeframes', () => {
    it.each(['4h', '1d', '1w', '1m', '3m', '6m'] as const)('supports %s', (tf) => {
      const indicators = [makeIndicator('RSI', 45)];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, tf);
      expect(result.timeframe).toBe(tf);
      expect(result.isValid).toBe(true);
    });
  });

  describe('neutral activity', () => {
    it('returns neutral when no clear accumulation or distribution', () => {
      const indicators = [
        makeIndicator('RSI', 50),
        makeIndicator('MFI', 50),
        makeIndicator('CMF', 0),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.institutionalActivity).toBe('neutral');
    });
  });

  describe('false breakout', () => {
    it('detects false breakout with compression but no volume', () => {
      const indicators = [
        makeIndicator('COMPRESSION', { isSqueezing: true, bandwidth: 0.01 }),
        makeIndicator('RELATIVE_VOLUME', 0.5),
        makeIndicator('VOLUME_SPIKE', 0.3),
      ];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.signals.some((s) => s.type === 'volume_confirmation')).toBe(false);
    });
  });

  describe('partial indicators', () => {
    it('works with only RSI', () => {
      const indicators = [makeIndicator('RSI', 35)];
      const structure = makeStructure({ trend: 'uptrend' });
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
      expect(result.accumulationScore).toBeGreaterThanOrEqual(0);
    });

    it('works with only OBV', () => {
      const indicators = [makeIndicator('OBV', [100, 110, 120, 130, 140])];
      const structure = makeStructure();
      const result = engine.evaluate(indicators, structure, '1d');

      expect(result.isValid).toBe(true);
    });
  });
});
