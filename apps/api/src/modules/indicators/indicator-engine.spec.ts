import { Test, TestingModule } from '@nestjs/testing';
import { IndicatorEngine } from './indicator-engine.service';
import { SmaIndicator, EmaIndicator, IchimokuIndicator } from './trend';
import { RsiIndicator, StochasticRsiIndicator, MacdIndicator, RocIndicator, MomentumOscillatorIndicator } from './momentum';
import { VolumeSmaIndicator, RelativeVolumeIndicator, VolumeSpikeIndicator, ObvIndicator } from './volume';
import { AtrIndicator, BollingerBandsIndicator } from './volatility';
import { AdxIndicator } from './trend-strength';
import { MfiIndicator, CmfIndicator, AdlIndicator } from './money-flow';
import { CompressionIndicator } from './compression';
import { sampleData } from './test-data';

describe('IndicatorEngine', () => {
  let engine: IndicatorEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicatorEngine,
        SmaIndicator,
        EmaIndicator,
        IchimokuIndicator,
        RsiIndicator,
        StochasticRsiIndicator,
        MacdIndicator,
        RocIndicator,
        MomentumOscillatorIndicator,
        VolumeSmaIndicator,
        RelativeVolumeIndicator,
        VolumeSpikeIndicator,
        ObvIndicator,
        AtrIndicator,
        BollingerBandsIndicator,
        AdxIndicator,
        MfiIndicator,
        CmfIndicator,
        AdlIndicator,
        CompressionIndicator,
      ],
    }).compile();

    engine = module.get(IndicatorEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('calculateAll', () => {
    it('should calculate all indicators', () => {
      const results = engine.calculateAll(sampleData, '1d');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results for all indicator categories', () => {
      const results = engine.calculateAll(sampleData, '1d');
      const indicators = results.map((r) => r.indicator);

      expect(indicators.some((i) => i.startsWith('SMA'))).toBe(true);
      expect(indicators.some((i) => i.startsWith('EMA'))).toBe(true);
      expect(indicators.some((i) => i.startsWith('Ichimoku'))).toBe(true);
      expect(indicators.some((i) => i === 'RSI')).toBe(true);
      expect(indicators.some((i) => i === 'StochasticRSI')).toBe(true);
      expect(indicators.some((i) => i === 'MACD')).toBe(true);
      expect(indicators.some((i) => i === 'ROC')).toBe(true);
      expect(indicators.some((i) => i === 'MomentumOscillator')).toBe(true);
      expect(indicators.some((i) => i === 'VolumeSMA')).toBe(true);
      expect(indicators.some((i) => i === 'RelativeVolume')).toBe(true);
      expect(indicators.some((i) => i === 'VolumeSpike')).toBe(true);
      expect(indicators.some((i) => i === 'OBV')).toBe(true);
      expect(indicators.some((i) => i === 'ATR')).toBe(true);
      expect(indicators.some((i) => i === 'BollingerBands')).toBe(true);
      expect(indicators.some((i) => i === 'ADX')).toBe(true);
      expect(indicators.some((i) => i === 'MFI')).toBe(true);
      expect(indicators.some((i) => i === 'CMF')).toBe(true);
      expect(indicators.some((i) => i === 'ADL')).toBe(true);
      expect(indicators.some((i) => i === 'Compression')).toBe(true);
    });

    it('should set correct timeframe on all results', () => {
      const results = engine.calculateAll(sampleData, '1w');
      results.forEach((r) => {
        expect(r.timeframe).toBe('1w');
      });
    });

    it('should set timestamp on all results', () => {
      const results = engine.calculateAll(sampleData, '1d');
      results.forEach((r) => {
        expect(r.timestamp).toBeDefined();
      });
    });

    it('should handle empty data gracefully', () => {
      const results = engine.calculateAll([], '1d');
      expect(results.length).toBeGreaterThan(0);
      const invalidCount = results.filter((r) => !r.isValid).length;
      expect(invalidCount).toBeGreaterThan(0);
    });
  });
});
