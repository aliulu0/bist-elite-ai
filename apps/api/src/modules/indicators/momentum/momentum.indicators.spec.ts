import { RsiIndicator } from './rsi.indicator';
import { StochasticRsiIndicator } from './stochastic-rsi.indicator';
import { MacdIndicator } from './macd.indicator';
import { RocIndicator } from './roc.indicator';
import { MomentumOscillatorIndicator } from './momentum-oscillator.indicator';
import { sampleData, generateUpTrend, generateDownTrend } from '../test-data';

describe('Momentum Indicators', () => {
  describe('RsiIndicator', () => {
    let indicator: RsiIndicator;
    beforeEach(() => { indicator = new RsiIndicator(); });

    it('should calculate RSI', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('RSI');
      expect(result.timeframe).toBe('1d');
      expect(result.isValid).toBeDefined();
    });

    it('should return valid RSI for sufficient data', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
    });

    it('should return RSI between 0 and 100', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        expect(result.value as number).toBeGreaterThanOrEqual(0);
        expect(result.value as number).toBeLessThanOrEqual(100);
      }
    });

    it('should handle up trend', () => {
      const data = generateUpTrend(30);
      const result = indicator.calculate(data, '1d');
      expect(result.isValid).toBe(true);
    });

    it('should handle down trend', () => {
      const data = generateDownTrend(30);
      const result = indicator.calculate(data, '1d');
      expect(result.isValid).toBe(true);
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 5);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('StochasticRsiIndicator', () => {
    let indicator: StochasticRsiIndicator;
    beforeEach(() => { indicator = new StochasticRsiIndicator(); });

    it('should calculate Stochastic RSI', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('StochasticRSI');
      expect(result.timeframe).toBe('1d');
    });

    it('should return k and d values', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number>;
        expect(val.k).toBeDefined();
        expect(val.d).toBeDefined();
      }
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 5);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('MacdIndicator', () => {
    let indicator: MacdIndicator;
    beforeEach(() => { indicator = new MacdIndicator(); });

    it('should calculate MACD', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('MACD');
      expect(result.timeframe).toBe('1d');
    });

    it('should return macd, signal, histogram', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number>;
        expect(val.macd).toBeDefined();
        expect(val.signal).toBeDefined();
        expect(val.histogram).toBeDefined();
      }
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 10);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('RocIndicator', () => {
    let indicator: RocIndicator;
    beforeEach(() => { indicator = new RocIndicator(); });

    it('should calculate ROC', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('ROC');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid ROC', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
    });
  });

  describe('MomentumOscillatorIndicator', () => {
    let indicator: MomentumOscillatorIndicator;
    beforeEach(() => { indicator = new MomentumOscillatorIndicator(); });

    it('should calculate Momentum Oscillator', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('MomentumOscillator');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid value', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
    });
  });
});
