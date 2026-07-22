import {
  MarketRegimeType,
  RegimeConfidence,
  TransitionType,
  RegimeTimeframe,
  MarketPhase,
} from './types';
import {
  MARKET_REGIME_TYPE_TURKISH,
  REGIME_CONFIDENCE_TURKISH,
  TRANSITION_TYPE_TURKISH,
  REGIME_TIMEFRAME_TURKISH,
  MARKET_PHASE_TURKISH,
  REGIME_DESCRIPTIONS_TURKISH,
  formatPercentageTurkish,
  formatScoreTurkish,
  formatConfidenceTurkish,
  getRegimeEmojiTurkish,
  REPORT_HEADER_TURKISH,
  REPORT_FOOTER_TURKISH,
} from './turkish-terms';

describe('MarketRegime Turkish Terms', () => {
  describe('MARKET_REGIME_TYPE_TURKISH', () => {
    it('should have translations for all 13 regime types', () => {
      expect(Object.keys(MARKET_REGIME_TYPE_TURKISH)).toHaveLength(13);
    });

    it('should translate STRONG_BULL to Turkish', () => {
      expect(MARKET_REGIME_TYPE_TURKISH[MarketRegimeType.STRONG_BULL]).toBe('Guclu Yukselis');
    });

    it('should translate BEAR to Turkish', () => {
      expect(MARKET_REGIME_TYPE_TURKISH[MarketRegimeType.BEAR]).toBe('Dusus');
    });

    it('should translate ACCUMULATION to Turkish', () => {
      expect(MARKET_REGIME_TYPE_TURKISH[MarketRegimeType.ACCUMULATION]).toBe('Birikim');
    });
  });

  describe('REGIME_CONFIDENCE_TURKISH', () => {
    it('should have translations for all confidence levels', () => {
      expect(Object.keys(REGIME_CONFIDENCE_TURKISH)).toHaveLength(5);
    });

    it('should translate VERY_HIGH to Cok Yuksek', () => {
      expect(REGIME_CONFIDENCE_TURKISH[RegimeConfidence.VERY_HIGH]).toBe('Cok Yuksek');
    });
  });

  describe('TRANSITION_TYPE_TURKISH', () => {
    it('should have translations for all transition types', () => {
      expect(Object.keys(TRANSITION_TYPE_TURKISH)).toHaveLength(7);
    });
  });

  describe('REGIME_TIMEFRAME_TURKISH', () => {
    it('should have translations for all timeframes', () => {
      expect(Object.keys(REGIME_TIMEFRAME_TURKISH)).toHaveLength(4);
    });
  });

  describe('MARKET_PHASE_TURKISH', () => {
    it('should have translations for all phases', () => {
      expect(Object.keys(MARKET_PHASE_TURKISH)).toHaveLength(4);
    });
  });

  describe('REGIME_DESCRIPTIONS_TURKISH', () => {
    it('should have descriptions for all regimes', () => {
      expect(Object.keys(REGIME_DESCRIPTIONS_TURKISH)).toHaveLength(13);
    });

    it('should have non-empty descriptions', () => {
      for (const desc of Object.values(REGIME_DESCRIPTIONS_TURKISH)) {
        expect(desc.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatPercentageTurkish', () => {
    it('should format 0.5 as %50.0', () => {
      expect(formatPercentageTurkish(0.5)).toBe('%50.0');
    });

    it('should format 0.123 as %12.3', () => {
      expect(formatPercentageTurkish(0.123)).toBe('%12.3');
    });
  });

  describe('formatScoreTurkish', () => {
    it('should format to 2 decimal places', () => {
      expect(formatScoreTurkish(0.5)).toBe('0.50');
      expect(formatScoreTurkish(1.234)).toBe('1.23');
    });
  });

  describe('formatConfidenceTurkish', () => {
    it('should format confidence with percentage', () => {
      expect(formatConfidenceTurkish(0.856)).toBe('%85.6 guvenilirlik');
    });
  });

  describe('getRegimeEmojiTurkish', () => {
    it('should return emoji for each regime', () => {
      expect(getRegimeEmojiTurkish(MarketRegimeType.STRONG_BULL)).toBe('[++]');
      expect(getRegimeEmojiTurkish(MarketRegimeType.BEAR)).toBe('[-]');
      expect(getRegimeEmojiTurkish(MarketRegimeType.SIDEWAYS)).toBe('[=]');
      expect(getRegimeEmojiTurkish(MarketRegimeType.HIGH_VOLATILITY)).toBe('[!]');
    });
  });

  describe('Report constants', () => {
    it('should have header and footer', () => {
      expect(REPORT_HEADER_TURKISH).toContain('Piyasa Rejimi');
      expect(REPORT_FOOTER_TURKISH).toContain('Rapor Sonu');
    });
  });
});
