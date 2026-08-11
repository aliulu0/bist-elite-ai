import { SignalGenerator } from './signal-generator.service';
import { DEFAULT_SIGNAL_THRESHOLDS } from './config/ai-analysis.config';

describe('SignalGenerator', () => {
  let generator: SignalGenerator;

  beforeEach(() => {
    generator = new SignalGenerator();
  });

  describe('generate', () => {
    it('should return STRONG_BUY for high scores', () => {
      expect(generator.generate(90)).toBe('STRONG_BUY');
      expect(generator.generate(80)).toBe('STRONG_BUY');
    });

    it('should return BUY for good scores', () => {
      expect(generator.generate(75)).toBe('BUY');
      expect(generator.generate(65)).toBe('BUY');
    });

    it('should return ACCUMULATE for moderate scores', () => {
      expect(generator.generate(60)).toBe('ACCUMULATE');
      expect(generator.generate(55)).toBe('ACCUMULATE');
    });

    it('should return NEUTRAL for balanced scores', () => {
      expect(generator.generate(50)).toBe('NEUTRAL');
      expect(generator.generate(45)).toBe('NEUTRAL');
    });

    it('should return REDUCE for below-average scores', () => {
      expect(generator.generate(40)).toBe('REDUCE');
      expect(generator.generate(35)).toBe('REDUCE');
    });

    it('should return SELL for low scores', () => {
      expect(generator.generate(30)).toBe('SELL');
      expect(generator.generate(20)).toBe('SELL');
    });

    it('should return STRONG_SELL for very low scores', () => {
      expect(generator.generate(15)).toBe('STRONG_SELL');
      expect(generator.generate(0)).toBe('STRONG_SELL');
    });

    it('should handle boundary values', () => {
      expect(generator.generate(100)).toBe('STRONG_BUY');
      expect(generator.generate(0)).toBe('STRONG_SELL');
    });
  });

  describe('getSignalDescription', () => {
    it('should return description for each signal', () => {
      const signals = ['STRONG_BUY', 'BUY', 'ACCUMULATE', 'NEUTRAL', 'REDUCE', 'SELL', 'STRONG_SELL'] as const;
      for (const signal of signals) {
        const desc = generator.getSignalDescription(signal);
        expect(desc).toBeTruthy();
        expect(typeof desc).toBe('string');
      }
    });
  });
});
