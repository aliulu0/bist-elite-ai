import { CentralBankNlpEngine } from '../engines/central-bank-nlp.engine';

describe('CentralBankNlpEngine', () => {
  let engine: CentralBankNlpEngine;

  beforeEach(() => {
    engine = new CentralBankNlpEngine();
  });

  describe('analyze', () => {
    it('should detect hawkish tone from keywords', () => {
      const text = 'We must tighten policy due to inflation risk. The economy is overheating. We will withdraw liquidity.';
      const result = engine.analyze('tcmb', text);
      expect(result.tone).toBe('hawkish');
      expect(result.marketImpact).toBe('negative');
      expect(result.bank).toBe('tcmb');
    });

    it('should detect dovish tone from keywords', () => {
      const text = 'We will cut rates to ease conditions. An accommodative stance supports growth. We must provide stimulus.';
      const result = engine.analyze('fed', text);
      expect(result.tone).toBe('dovish');
      expect(result.marketImpact).toBe('positive');
      expect(result.bank).toBe('fed');
    });

    it('should detect leaning tones', () => {
      const hawkLeaning = 'We remain cautious and data-dependent. A gradual approach is warranted as we monitor conditions.';
      expect(engine.analyze('ecb', hawkLeaning).tone).toBe('hawkish_leaning');
    });

    it('should default to neutral when no strong signals', () => {
      const text = 'The committee met and discussed various economic conditions.';
      expect(engine.analyze('tcmb', text).tone).toBe('neutral');
    });

    it('should extract inflation from text', () => {
      const text = 'Inflation: 42.5 and expected to decline. The committee remains cautious.';
      const result = engine.analyze('tcmb', text);
      expect(result.expectedInflation).toBe(42.5);
    });

    it('should extract growth from text', () => {
      const text = 'GDP: 3.2 growth expected next year. The economy remains weak.';
      const result = engine.analyze('ecb', text);
      expect(result.expectedGrowth).toBe(3.2);
    });

    it('should determine liquidity as tight for hawkish', () => {
      const text = 'The central bank must tighten policy due to inflation risk. The economy is overheating. We need to hike rates. We will withdraw liquidity. A restrictive stance is needed. The committee is cautious and data-dependent. We must tighten further as inflation risks persist. A gradual approach is warranted to cool the overheating economy and withdraw excess liquidity.';
      expect(engine.analyze('fed', text).liquidity).toBe('tight');
    });

    it('should determine liquidity as loose for dovish', () => {
      const text = 'We will cut rates to ease conditions. An accommodative stance supports growth. We must provide stimulus.';
      expect(engine.analyze('tcmb', text).liquidity).toBe('loose');
    });

    it('should determine risk correctly', () => {
      const hawkText = 'The central bank must tighten policy due to inflation risk. The economy is overheating. We need to hike rates. We will withdraw liquidity. A restrictive stance is needed. The committee is cautious and data-dependent. We must tighten further as inflation risks persist. A gradual approach is warranted to cool the overheating economy and withdraw excess liquidity.';
      expect(engine.analyze('tcmb', hawkText).risk).toBe('high');
    });

    it('should determine sector impacts', () => {
      const text = 'Bank profitability and net interest margin improved. Export competitiveness increased.';
      const result = engine.analyze('tcmb', text);
      expect(result.sectorImpacts.banks).toBe('positive');
      expect(result.sectorImpacts.exporters).toBe('positive');
    });

    it('should include analyzedAt timestamp', () => {
      const result = engine.analyze('tcmb', 'neutral text here');
      expect(result.analyzedAt).toBeDefined();
      expect(() => new Date(result.analyzedAt)).not.toThrow();
    });
  });
});
