import { MacroAnalysisService } from '../macro-analysis.service';
import { MacroDataService } from '../macro-data.service';
import { CentralBankNlpEngine } from '../engines/central-bank-nlp.engine';
import { MarketRegimeEngine } from '../engines/market-regime.engine';
import { MacroScoreEngine } from '../engines/macro-score.engine';
import { SectorImpactEngine } from '../engines/sector-impact.engine';
import { CombinedConfidenceEngine } from '../engines/combined-confidence.engine';
import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';
import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';

function createMockOrchestrator() {
  return { fetchMacroIndicators: jest.fn().mockResolvedValue([]) } as any;
}

describe('MacroAnalysisService', () => {
  let service: MacroAnalysisService;

  function makeService() {
    return new MacroAnalysisService(
      new MacroDataService(createMockOrchestrator()),
      new CentralBankNlpEngine(),
      new MarketRegimeEngine(),
      new MacroScoreEngine(),
      new SectorImpactEngine(),
      new CombinedConfidenceEngine(),
      new TCMBDecisionStoreService(),
    );
  }

  beforeEach(() => {
    service = makeService();
  });

  describe('getFullAnalysis', () => {
    it('should return complete analysis with all sections', async () => {
      const result = await service.getFullAnalysis();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('tcmb');
      expect(result).toHaveProperty('fed');
      expect(result).toHaveProperty('ecb');
      expect(result).toHaveProperty('regime');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('sectors');
    });

    it('should include data snapshot with points', async () => {
      const result = await service.getFullAnalysis();
      expect(result.data.points.length).toBeGreaterThan(0);
      expect(result.data.sourceCount).toBeGreaterThan(0);
    });

    it('should include central bank analysis for all three banks', async () => {
      const result = await service.getFullAnalysis();
      expect(result.tcmb.bank).toBe('tcmb');
      expect(result.fed.bank).toBe('fed');
      expect(result.ecb.bank).toBe('ecb');
    });

    it('should include regime analysis', async () => {
      const result = await service.getFullAnalysis();
      expect(['risk_on', 'neutral', 'risk_off', 'extreme_risk']).toContain(result.regime.regime);
    });

    it('should include macro score', async () => {
      const result = await service.getFullAnalysis();
      expect(result.score.macroScore).toBeGreaterThanOrEqual(0);
      expect(result.score.macroScore).toBeLessThanOrEqual(100);
    });

    it('should include sector impacts', async () => {
      const result = await service.getFullAnalysis();
      expect(result.sectors.length).toBe(10);
    });
  });

  describe('getMacroScore', () => {
    it('should return a valid score', async () => {
      const result = await service.getMacroScore();
      expect(result.macroScore).toBeGreaterThanOrEqual(0);
      expect(result.macroScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getRegime', () => {
    it('should return a valid regime', async () => {
      const result = await service.getRegime();
      expect(['risk_on', 'neutral', 'risk_off', 'extreme_risk']).toContain(result.regime);
    });
  });

  describe('getCentralBankAnalysis', () => {
    it('should analyze TCMB', async () => {
      const result = await service.getCentralBankAnalysis('tcmb');
      expect(result.bank).toBe('tcmb');
    });

    it('should analyze FED', async () => {
      const result = await service.getCentralBankAnalysis('fed');
      expect(result.bank).toBe('fed');
    });

    it('should analyze ECB', async () => {
      const result = await service.getCentralBankAnalysis('ecb');
      expect(result.bank).toBe('ecb');
    });
  });

  describe('getCombinedConfidence', () => {
    it('should combine elite score with macro score', async () => {
      const result = await service.getCombinedConfidence(85);
      expect(result.eliteScore).toBe(85);
      expect(result.combined).toBeGreaterThanOrEqual(0);
      expect(result.combined).toBeLessThanOrEqual(100);
    });
  });
});
