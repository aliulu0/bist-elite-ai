import { ExplainabilityCenterService } from './explainability-center.service';
import { RiskLevel } from './types';

describe('ExplainabilityCenterService', () => {
  let service: ExplainabilityCenterService;

  beforeEach(() => {
    service = new ExplainabilityCenterService();
  });

  describe('getExplanation', () => {
    it('should return explanation with correct structure', () => {
      const result = service.getExplanation('THYAO', 75, 0.85);

      expect(result.symbol).toBe('THYAO');
      expect(result.eliteScore).toBe(75);
      expect(result.confidence).toBe(0.85);
      expect(result).toHaveProperty('positiveFactors');
      expect(result).toHaveProperty('negativeFactors');
      expect(result).toHaveProperty('riskFactors');
      expect(result).toHaveProperty('consensusSummary');
      expect(result).toHaveProperty('regimeContext');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should include provided factors', () => {
      const result = service.getExplanation('THYAO', 75, 0.85,
        [{ factor: 'Trend', contribution: 20, description: 'Guc' }],
        [{ factor: 'Risk', contribution: -10, description: 'Yuksek' }],
        [{ type: 'VOLATILITY', severity: 'HIGH', score: 80, description: 'Volatil', mitigation: 'Dikkat' }],
      );

      expect(result.positiveFactors).toHaveLength(1);
      expect(result.negativeFactors).toHaveLength(1);
      expect(result.riskFactors).toHaveLength(1);
    });
  });

  describe('getExplanationBatch', () => {
    it('should return array of explanations', () => {
      const results = service.getExplanationBatch([
        { symbol: 'THYAO', eliteScore: 75, confidence: 0.85 },
        { symbol: 'GARAN', eliteScore: 60, confidence: 0.7 },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('THYAO');
      expect(results[1].symbol).toBe('GARAN');
    });
  });

  describe('generateFactorSummary', () => {
    it('should summarize positive and negative factors', () => {
      const summary = service.generateFactorSummary(
        [{ factor: 'Trend', contribution: 20 }, { factor: 'Momentum', contribution: 15 }],
        [{ factor: 'Risk', contribution: -10 }],
      );

      expect(summary).toContain('Olumlu');
      expect(summary).toContain('Olumsuz');
    });

    it('should handle empty factors', () => {
      const summary = service.generateFactorSummary([], []);
      expect(summary).toContain('Yeterli veri yok');
    });

    it('should handle only positive', () => {
      const summary = service.generateFactorSummary(
        [{ factor: 'Trend', contribution: 20 }],
        [],
      );
      expect(summary).toContain('Olumlu');
      expect(summary).not.toContain('Olumsuz');
    });
  });

  describe('getRiskLevelFromScore', () => {
    it('should return LOW for high score', () => {
      expect(service.getRiskLevelFromScore(85)).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM for mid score', () => {
      expect(service.getRiskLevelFromScore(65)).toBe(RiskLevel.MEDIUM);
    });

    it('should return HIGH for low-mid score', () => {
      expect(service.getRiskLevelFromScore(45)).toBe(RiskLevel.HIGH);
    });

    it('should return CRITICAL for very low score', () => {
      expect(service.getRiskLevelFromScore(20)).toBe(RiskLevel.CRITICAL);
    });
  });
});
