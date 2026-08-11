import { SmaIndicator } from './sma.indicator';
import { EmaIndicator } from './ema.indicator';
import { IchimokuIndicator } from './ichimoku.indicator';
import { sampleData, generateUpTrend, generateDownTrend } from '../test-data';

describe('Trend Indicators', () => {
  describe('SmaIndicator', () => {
    let indicator: SmaIndicator;
    beforeEach(() => { indicator = new SmaIndicator(); });

    it('should calculate SMA for all periods', () => {
      const results = indicator.calculate(sampleData, '1d');
      expect(results.length).toBe(5);
      results.forEach((r) => {
        expect(r.indicator).toMatch(/^SMA_\d+$/);
        expect(r.timeframe).toBe('1d');
        expect(r.isValid).toBeDefined();
      });
    });

    it('should calculate SMA for specific period', () => {
      const results = indicator.calculate(sampleData, '1d', 9);
      expect(results.length).toBe(1);
      expect(results[0].indicator).toBe('SMA_9');
    });

    it('should return valid values for sufficient data', () => {
      const results = indicator.calculate(sampleData, '1d', 9);
      expect(results[0].isValid).toBe(true);
      expect(typeof results[0].value).toBe('number');
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 3);
      const results = indicator.calculate(shortData, '1d', 9);
      expect(results[0].isValid).toBe(false);
      expect(results[0].value).toBeNull();
    });
  });

  describe('EmaIndicator', () => {
    let indicator: EmaIndicator;
    beforeEach(() => { indicator = new EmaIndicator(); });

    it('should calculate EMA for all periods', () => {
      const results = indicator.calculate(sampleData, '1d');
      expect(results.length).toBe(5);
      results.forEach((r) => {
        expect(r.indicator).toMatch(/^EMA_\d+$/);
        expect(r.timeframe).toBe('1d');
      });
    });

    it('should calculate EMA for specific period', () => {
      const results = indicator.calculate(sampleData, '1d', 20);
      expect(results.length).toBe(1);
      expect(results[0].indicator).toBe('EMA_20');
    });

    it('should return valid values for sufficient data', () => {
      const results = indicator.calculate(sampleData, '1d', 9);
      expect(results[0].isValid).toBe(true);
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 3);
      const results = indicator.calculate(shortData, '1d', 9);
      expect(results[0].isValid).toBe(false);
    });
  });

  describe('IchimokuIndicator', () => {
    let indicator: IchimokuIndicator;
    beforeEach(() => { indicator = new IchimokuIndicator(); });

    it('should calculate all 5 Ichimoku lines', () => {
      const results = indicator.calculate(sampleData, '1d');
      expect(results.length).toBe(5);
      expect(results[0].indicator).toBe('Ichimoku_Tenkan');
      expect(results[1].indicator).toBe('Ichimoku_Kijun');
      expect(results[2].indicator).toBe('Ichimoku_SenkouA');
      expect(results[3].indicator).toBe('Ichimoku_SenkouB');
      expect(results[4].indicator).toBe('Ichimoku_Chikou');
    });

    it('should return valid values for sufficient data', () => {
      const data = generateUpTrend(60);
      const results = indicator.calculate(data, '1d');
      const tenkan = results.find((r) => r.indicator === 'Ichimoku_Tenkan')!;
      expect(tenkan.isValid).toBe(true);
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 5);
      const results = indicator.calculate(shortData, '1d');
      const tenkan = results.find((r) => r.indicator === 'Ichimoku_Tenkan')!;
      expect(tenkan.isValid).toBe(false);
    });
  });
});
