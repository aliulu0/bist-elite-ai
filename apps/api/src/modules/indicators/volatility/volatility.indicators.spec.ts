import { AtrIndicator } from './atr.indicator';
import { BollingerBandsIndicator } from './bollinger-bands.indicator';
import { sampleData, generateUpTrend } from '../test-data';

describe('Volatility Indicators', () => {
  describe('AtrIndicator', () => {
    let indicator: AtrIndicator;
    beforeEach(() => { indicator = new AtrIndicator(); });

    it('should calculate ATR', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('ATR');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid value', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
      expect(result.value as number).toBeGreaterThan(0);
    });
  });

  describe('BollingerBandsIndicator', () => {
    let indicator: BollingerBandsIndicator;
    beforeEach(() => { indicator = new BollingerBandsIndicator(); });

    it('should calculate Bollinger Bands', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('BollingerBands');
      expect(result.timeframe).toBe('1d');
    });

    it('should return upper, middle, lower, bandwidth, percentB', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number>;
        expect(val.upper).toBeDefined();
        expect(val.middle).toBeDefined();
        expect(val.lower).toBeDefined();
        expect(val.bandwidth).toBeDefined();
        expect(val.percentB).toBeDefined();
      }
    });

    it('should have upper > middle > lower', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number>;
        expect(val.upper).toBeGreaterThan(val.middle);
        expect(val.middle).toBeGreaterThan(val.lower);
      }
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 3);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });
});
