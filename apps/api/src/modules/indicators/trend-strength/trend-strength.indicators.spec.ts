import { AdxIndicator } from './adx.indicator';
import { sampleData, generateUpTrend, generateDownTrend } from '../test-data';

describe('Trend Strength Indicators', () => {
  describe('AdxIndicator', () => {
    let indicator: AdxIndicator;
    beforeEach(() => { indicator = new AdxIndicator(); });

    it('should calculate ADX', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('ADX');
      expect(result.timeframe).toBe('1d');
    });

    it('should return adx, diPlus, diMinus', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number>;
        expect(val.adx).toBeDefined();
        expect(val.diPlus).toBeDefined();
        expect(val.diMinus).toBeDefined();
      }
    });

    it('should handle up trend', () => {
      const data = generateUpTrend(30);
      const result = indicator.calculate(data, '1d');
      expect(result.isValid).toBe(true);
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 5);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });
});
