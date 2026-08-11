import { MfiIndicator } from './mfi.indicator';
import { CmfIndicator } from './cmf.indicator';
import { AdlIndicator } from './adl.indicator';
import { sampleData } from '../test-data';

describe('Money Flow Indicators', () => {
  describe('MfiIndicator', () => {
    let indicator: MfiIndicator;
    beforeEach(() => { indicator = new MfiIndicator(); });

    it('should calculate MFI', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('MFI');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid MFI between 0 and 100', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(result.value as number).toBeGreaterThanOrEqual(0);
      expect(result.value as number).toBeLessThanOrEqual(100);
    });

    it('should handle insufficient data', () => {
      const shortData = sampleData.slice(0, 5);
      const result = indicator.calculate(shortData, '1d');
      expect(result.isValid).toBe(false);
    });
  });

  describe('CmfIndicator', () => {
    let indicator: CmfIndicator;
    beforeEach(() => { indicator = new CmfIndicator(); });

    it('should calculate CMF', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('CMF');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid CMF between -1 and 1', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(result.value as number).toBeGreaterThanOrEqual(-1);
      expect(result.value as number).toBeLessThanOrEqual(1);
    });
  });

  describe('AdlIndicator', () => {
    let indicator: AdlIndicator;
    beforeEach(() => { indicator = new AdlIndicator(); });

    it('should calculate ADL', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('ADL');
      expect(result.timeframe).toBe('1d');
      expect(result.isValid).toBe(true);
    });

    it('should return numeric value', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(typeof result.value).toBe('number');
    });

    it('should handle empty data', () => {
      const result = indicator.calculate([], '1d');
      expect(result.isValid).toBe(false);
    });
  });
});
