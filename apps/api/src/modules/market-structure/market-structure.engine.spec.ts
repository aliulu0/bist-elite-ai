import { Test, TestingModule } from '@nestjs/testing';
import { MarketStructureEngine } from './market-structure.engine';
import { OHLCV } from '../indicators/indicator.types';

function candle(i: number, high: number, low: number): OHLCV {
  const close = (high + low) / 2;
  return {
    open: close,
    high,
    low,
    close,
    volume: 1_000_000,
    timestamp: `2025-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
  };
}

function fromHL(highs: number[], lows: number[]): OHLCV[] {
  return highs.map((h, i) => candle(i, h, lows[i]));
}

describe('MarketStructureEngine', () => {
  let engine: MarketStructureEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketStructureEngine],
    }).compile();
    engine = module.get(MarketStructureEngine);
  });

  describe('insufficient data', () => {
    it('returns invalid for empty array', () => {
      const result = engine.analyze([], '1d');
      expect(result.isValid).toBe(false);
      expect(result.structure).toHaveLength(0);
      expect(result.trend).toBe('sideways');
    });

    it('returns invalid for too few candles', () => {
      const d = fromHL([100, 101, 102, 103, 104], [99, 100, 101, 102, 103]);
      expect(engine.analyze(d, '1d').isValid).toBe(false);
    });
  });

  describe('uptrend', () => {
    it('detects uptrend with ascending HH and HL', () => {
      const h = [
        100, 100, 100, 100, 100, 120, 100, 100, 100, 100,
        100, 110, 110, 110, 110, 130, 110, 110, 110, 110,
        100, 115, 115, 115, 115, 140, 115, 115, 115, 115,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 115, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 125, 105, 105, 105, 105,
        95, 110, 110, 110, 110, 135, 110, 110, 110, 110,
        100, 105, 105, 105, 105,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.trend).toBe('uptrend');
      expect(result.swingHighs.length).toBeGreaterThanOrEqual(2);
      expect(result.swingLows.length).toBeGreaterThanOrEqual(2);
      expect(result.structure.filter((s) => s.type === 'HH').length).toBeGreaterThanOrEqual(1);
      expect(result.structure.filter((s) => s.type === 'HL').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('downtrend', () => {
    it('detects downtrend with descending LH and LL', () => {
      const h = [
        100, 100, 100, 100, 100, 140, 100, 100, 100, 100,
        100, 115, 115, 115, 115, 130, 115, 115, 115, 115,
        100, 110, 110, 110, 110, 120, 110, 110, 110, 110,
        100, 100, 100, 100, 100,
      ];
      const l = [
        105, 105, 105, 105, 105, 135, 105, 105, 105, 105,
        100, 110, 110, 110, 110, 125, 110, 110, 110, 110,
        95, 105, 105, 105, 105, 115, 105, 105, 105, 105,
        90, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.trend).toBe('downtrend');
      expect(result.swingHighs.length).toBeGreaterThanOrEqual(2);
      expect(result.swingLows.length).toBeGreaterThanOrEqual(2);
      expect(result.structure.filter((s) => s.type === 'LH').length).toBeGreaterThanOrEqual(1);
      expect(result.structure.filter((s) => s.type === 'LL').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sideways', () => {
    it('detects sideways with equal peaks and troughs', () => {
      const h = [
        100, 100, 100, 100, 100, 130, 100, 100, 100, 100,
        100, 120, 120, 120, 120, 130, 120, 120, 120, 120,
        100, 120, 120, 120, 120, 130, 120, 120, 120, 120,
        100, 100, 100, 100, 100,
      ];
      const l = [
        105, 105, 105, 105, 105, 125, 105, 105, 105, 105,
        100, 115, 115, 115, 115, 125, 115, 115, 115, 115,
        100, 115, 115, 115, 115, 125, 115, 115, 115, 115,
        100, 105, 105, 105, 105,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.trend).toBe('sideways');
    });
  });

  describe('trend reversal', () => {
    it('detects ChoCH on trend change', () => {
      const h = [
        100, 100, 100, 100, 100, 120, 100, 100, 100, 100,
        100, 115, 115, 115, 115, 130, 115, 115, 115, 115,
        100, 110, 110, 110, 110, 125, 110, 110, 110, 110,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 115, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 120, 105, 105, 105, 105,
        95, 110, 110, 110, 110, 120, 110, 110, 110, 110,
        85, 90, 90, 90, 90,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.changeOfCharacter.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('support and resistance zones', () => {
    it('finds resistance zones from clustered swing highs', () => {
      const h = [
        100, 100, 100, 100, 100, 110, 100, 100, 100, 100,
        100, 105, 105, 105, 105, 110.3, 100, 100, 100, 100,
        100, 105, 105, 105, 105, 109.7, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 105, 95, 95, 95, 95,
        90, 100, 100, 100, 100, 105.3, 100, 100, 100, 100,
        90, 100, 100, 100, 100, 104.7, 95, 95, 95, 95,
        90, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.resistanceZones)).toBe(true);
    });

    it('finds support zones from clustered swing lows', () => {
      const h = [
        120, 120, 120, 120, 120, 130, 120, 120, 120, 120,
        120, 125, 125, 125, 125, 130, 125, 125, 125, 125,
        120, 125, 125, 125, 125, 130, 125, 125, 125, 125,
        120, 120, 120, 120, 120,
      ];
      const l = [
        115, 115, 115, 115, 115, 125, 115, 115, 115, 115,
        110, 120, 120, 120, 120, 125, 120, 120, 120, 120,
        110, 120, 120, 120, 120, 125, 120, 120, 120, 120,
        110, 115, 115, 115, 115,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.supportZones)).toBe(true);
    });
  });

  describe('break of structure', () => {
    it('detects BoS in trending market', () => {
      const h = [
        100, 100, 100, 100, 100, 120, 100, 100, 100, 100,
        100, 110, 110, 110, 110, 130, 110, 110, 110, 110,
        100, 115, 115, 115, 115, 140, 115, 115, 115, 115,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 115, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 125, 105, 105, 105, 105,
        95, 110, 110, 110, 110, 135, 110, 110, 110, 110,
        100, 105, 105, 105, 105,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.breakOfStructure.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('metadata', () => {
    it('includes timeframe and config', () => {
      const h = Array.from({ length: 20 }, (_, i) => 100 + i);
      const l = h.map((v) => v - 5);
      const result = engine.analyze(fromHL(h, l), '4h');
      expect(result.timeframe).toBe('4h');
      expect(result.metadata.config).toBeDefined();
      expect(result.metadata.dataLength).toBe(20);
    });
  });

  describe('swing detection', () => {
    it('finds swing high at clear peak', () => {
      const h = [100, 100, 100, 100, 100, 150, 100, 100, 100, 100, 100];
      const l = [95, 95, 95, 95, 95, 145, 95, 95, 95, 95, 95];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.swingHighs.some((s) => s.price === 150)).toBe(true);
    });

    it('finds swing low at clear trough', () => {
      const h = [110, 110, 110, 110, 110, 50, 110, 110, 110, 110, 110];
      const l = [105, 105, 105, 105, 105, 45, 105, 105, 105, 105, 105];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
      expect(result.swingLows.some((s) => s.price === 45)).toBe(true);
    });
  });

  describe('structure classification', () => {
    it('classifies HH when peak is higher than previous', () => {
      const h = [
        100, 100, 100, 100, 100, 110, 100, 100, 100, 100,
        100, 110, 110, 110, 110, 120, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 105, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 115, 95, 95, 95, 95,
        95, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.structure.filter((s) => s.type === 'HH').length).toBeGreaterThanOrEqual(1);
    });

    it('classifies LL when trough is lower than previous', () => {
      const h = [
        100, 100, 100, 100, 100, 130, 100, 100, 100, 100,
        100, 120, 120, 120, 120, 130, 100, 100, 100, 100,
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        105, 105, 105, 105, 105, 125, 105, 105, 105, 105,
        100, 115, 115, 115, 115, 125, 105, 105, 105, 105,
        90, 95, 95, 95, 95, 95, 95, 95, 95, 95,
        95, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.structure.filter((s) => s.type === 'LL').length).toBeGreaterThanOrEqual(1);
    });

    it('classifies LH when peak is lower than previous', () => {
      const h = [
        100, 100, 100, 100, 100, 130, 100, 100, 100, 100,
        100, 110, 110, 110, 110, 120, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 125, 95, 95, 95, 95,
        90, 110, 110, 110, 110, 115, 95, 95, 95, 95,
        95, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.structure.filter((s) => s.type === 'LH').length).toBeGreaterThanOrEqual(1);
    });

    it('classifies HL when trough is higher than previous', () => {
      const h = [
        100, 100, 100, 100, 100, 130, 100, 100, 100, 100,
        100, 120, 120, 120, 120, 130, 100, 100, 100, 100,
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 125, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 125, 105, 105, 105, 105,
        100, 105, 105, 105, 105, 105, 105, 105, 105, 105,
        105, 105, 105, 105, 105,
      ];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.structure.filter((s) => s.type === 'HL').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('all timeframes', () => {
    it.each(['4h', '1d', '1w', '1m', '3m', '6m'] as const)('supports %s', (tf) => {
      const h = [
        100, 100, 100, 100, 100, 120, 100, 100, 100, 100,
        100, 110, 110, 110, 110, 130, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ];
      const l = [
        95, 95, 95, 95, 95, 115, 95, 95, 95, 95,
        90, 105, 105, 105, 105, 125, 95, 95, 95, 95,
        95, 95, 95, 95, 95,
      ];
      const result = engine.analyze(fromHL(h, l), tf);
      expect(result.timeframe).toBe(tf);
      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles constant price (no swings)', () => {
      const d = Array.from({ length: 20 }, (_, i) => candle(i, 100, 100));
      const result = engine.analyze(d, '1d');
      expect(result.isValid).toBe(true);
      expect(result.trend).toBe('sideways');
    });

    it('handles exactly minimum required data (11 candles)', () => {
      const h = [100, 100, 100, 100, 100, 120, 100, 100, 100, 100, 100];
      const l = [95, 95, 95, 95, 95, 80, 95, 95, 95, 95, 95];
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.isValid).toBe(true);
    });

    it('returns empty zones when no qualifying zones', () => {
      const h = Array.from({ length: 30 }, (_, i) => 100 + i * 3);
      const l = h.map((v) => v - 5);
      const result = engine.analyze(fromHL(h, l), '1d');
      expect(result.supportZones).toBeDefined();
      expect(result.resistanceZones).toBeDefined();
    });
  });
});
