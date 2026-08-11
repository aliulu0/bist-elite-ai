import { VolumeSmaIndicator } from './volume-sma.indicator';
import { RelativeVolumeIndicator } from './relative-volume.indicator';
import { VolumeSpikeIndicator } from './volume-spike.indicator';
import { ObvIndicator } from './obv.indicator';
import { sampleData } from '../test-data';

describe('Volume Indicators', () => {
  describe('VolumeSmaIndicator', () => {
    let indicator: VolumeSmaIndicator;
    beforeEach(() => { indicator = new VolumeSmaIndicator(); });

    it('should calculate Volume SMA', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('VolumeSMA');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid value', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
    });
  });

  describe('RelativeVolumeIndicator', () => {
    let indicator: RelativeVolumeIndicator;
    beforeEach(() => { indicator = new RelativeVolumeIndicator(); });

    it('should calculate Relative Volume', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('RelativeVolume');
      expect(result.timeframe).toBe('1d');
    });

    it('should return valid value', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.isValid).toBe(true);
      expect(typeof result.value).toBe('number');
    });
  });

  describe('VolumeSpikeIndicator', () => {
    let indicator: VolumeSpikeIndicator;
    beforeEach(() => { indicator = new VolumeSpikeIndicator(); });

    it('should calculate Volume Spike', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('VolumeSpike');
      expect(result.timeframe).toBe('1d');
    });

    it('should include isSpike in metadata', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.metadata.isSpike).toBeDefined();
      expect(typeof result.metadata.isSpike).toBe('boolean');
    });
  });

  describe('ObvIndicator', () => {
    let indicator: ObvIndicator;
    beforeEach(() => { indicator = new ObvIndicator(); });

    it('should calculate OBV', () => {
      const result = indicator.calculate(sampleData, '1d');
      expect(result.indicator).toBe('OBV');
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
      expect(result.value).toBeNull();
    });
  });
});
