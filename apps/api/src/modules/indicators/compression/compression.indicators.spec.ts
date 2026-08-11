import { CompressionIndicator } from './compression.indicator';
import { sampleData } from '../test-data';

describe('Compression Indicators', () => {
  describe('CompressionIndicator', () => {
    let indicator: CompressionIndicator;
    beforeEach(() => { indicator = new CompressionIndicator(); });

    it('should calculate Compression', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('Compression');
      expect(result.timeframe).toBe('1d');
    });

    it('should return bollingerWidth, atrCompression, isSqueezing', () => {
      const result = indicator.calculate(sampleData, '1d');
      if (result.isValid) {
        const val = result.value as Record<string, number | boolean>;
        expect(val.bollingerWidth).toBeDefined();
        expect(val.atrCompression).toBeDefined();
        expect(val.isSqueezing).toBeDefined();
        expect(typeof val.isSqueezing).toBe('boolean');
      }
    });
  });
});
