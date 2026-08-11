import { MacroController } from '../macro.controller';
import { MacroService } from '../macro.service';
import { MacroAnalysisService } from '../macro-analysis.service';
import { MacroDataService } from '../macro-data.service';
import { CentralBankNlpEngine } from '../engines/central-bank-nlp.engine';
import { MarketRegimeEngine } from '../engines/market-regime.engine';
import { MacroScoreEngine } from '../engines/macro-score.engine';
import { SectorImpactEngine } from '../engines/sector-impact.engine';
import { CombinedConfidenceEngine } from '../engines/combined-confidence.engine';
import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';
import { TCMBDecisionStoreService } from '../tcmb-decision-store.service';
import { TCMBDecisionCaptureService } from '../tcmb-decision-capture.service';
import { MacroEliteScoreService } from '../macro-elite-score.service';
import { CombinedConfidenceService } from '../combined-confidence.service';

function createMockOrchestrator() {
  return {
    fetchMacroIndicators: jest.fn().mockResolvedValue([
      { symbol: 'vix', value: 30, change: 2, changePercent: 7.1, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'dxy', value: 110, change: 1, changePercent: 0.9, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'us10y', value: 6.0, change: 0.1, changePercent: 1.7, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'us2y', value: 4.8, change: 0.05, changePercent: 1.0, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'gold', value: 2350, change: -10, changePercent: -0.4, timestamp: new Date().toISOString(), source: 'finnhub' },
      { symbol: 'brent', value: 82, change: -1.5, changePercent: -1.8, timestamp: new Date().toISOString(), source: 'finnhub' },
    ]),
    fetchTcmbInterestDecisions: jest.fn().mockResolvedValue([]),
    getProviderStatus: jest.fn().mockResolvedValue([]),
  } as any;
}

function makeService() {
  const orchestrator = createMockOrchestrator();
  const data = new MacroDataService(orchestrator);
  const store = new TCMBDecisionStoreService();
  const analysis = new MacroAnalysisService(
    data,
    new CentralBankNlpEngine(),
    new MarketRegimeEngine(),
    new MacroScoreEngine(),
    new SectorImpactEngine(),
    new CombinedConfidenceEngine(),
    store,
  );
  const capture = new TCMBDecisionCaptureService(
    orchestrator,
    new TCMBDecisionAnalyzer(),
    store,
    { notify: jest.fn().mockResolvedValue(undefined) },
  );
  const elite = new MacroEliteScoreService(new MacroScoreEngine(), data, store, orchestrator);
  const combined = new CombinedConfidenceService();
  return new MacroService(analysis, data, elite, combined, capture, store);
}

describe('MacroController', () => {
  let controller: MacroController;

  beforeEach(() => {
    controller = new MacroController(makeService());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/macro', () => {
    it('should return full analysis', async () => {
      const result = await controller.getFullAnalysis();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('tcmb');
      expect(result).toHaveProperty('fed');
      expect(result).toHaveProperty('ecb');
      expect(result).toHaveProperty('regime');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('sectors');
    });
  });

  describe('GET /api/macro/data', () => {
    it('should return data snapshot', async () => {
      const result = await controller.getData();
      expect(result).toHaveProperty('points');
    });
  });

  describe('GET /api/macro/score', () => {
    it('should return macro score', async () => {
      const result = await controller.getMacroScore();
      expect(result).toHaveProperty('macroScore');
    });
  });

  describe('GET /api/macro/regime', () => {
    it('should return regime analysis', async () => {
      const result = await controller.getRegime();
      expect(result).toHaveProperty('regime');
    });
  });

  describe('GET /api/macro/central-bank/:bank', () => {
    it('should return TCMB analysis', async () => {
      const result = await controller.getCentralBankAnalysis('tcmb');
      expect(result.bank).toBe('tcmb');
    });

    it('should return FED analysis', async () => {
      const result = await controller.getCentralBankAnalysis('fed');
      expect(result.bank).toBe('fed');
    });

    it('should return ECB analysis', async () => {
      const result = await controller.getCentralBankAnalysis('ecb');
      expect(result.bank).toBe('ecb');
    });
  });

  describe('GET /api/macro/combined-confidence', () => {
    it('should return combined confidence', async () => {
      const result = await controller.getCombinedConfidence(80);
      expect(result.eliteScore).toBe(80);
      expect(result).toHaveProperty('combined');
    });
  });

  describe('GET /api/macro/sectors', () => {
    it('should return sector impacts', async () => {
      const result = await controller.getSectorImpacts();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
    });
  });

  describe('GET /api/macro/alerts', () => {
    it('should return alerts array', async () => {
      const result = await controller.getAlerts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('GET /api/macro/opportunities', () => {
    it('should return macro opportunities', async () => {
      const result = await controller.getOpportunities('80');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('ticker');
      expect(result[0]).toHaveProperty('eliteScore');
      expect(result[0]).toHaveProperty('macroScore');
    });

    it('should use default elite score when not provided', async () => {
      const result = await controller.getOpportunities();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('GET /api/macro/risk', () => {
    it('should return macro risk items', async () => {
      const result = await controller.getRisk();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('riskType');
    });
  });

  describe('GET /api/macro/elite-score', () => {
    it('should return elite score', async () => {
      const result = await controller.getMacroEliteScore();
      expect(result.eliteScore).toBeGreaterThanOrEqual(0);
      expect(result.eliteScore).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/macro/trend', () => {
    it('should return macro trend', async () => {
      const result = await controller.getMacroTrend();
      expect(['improving', 'stable', 'deteriorating']).toContain(result.trend);
    });
  });

  describe('GET /api/macro/confidence', () => {
    it('should return combined confidence from query', async () => {
      const result = await controller.getCombinedMacroConfidence({ eliteConfidence: 80 });
      expect(result.combined).toBeGreaterThanOrEqual(0);
      expect(result.eliteConfidence).toBe(80);
    });

    it('should default elite confidence when query missing', async () => {
      const result = await controller.getCombinedMacroConfidence({});
      expect(result.eliteConfidence).toBe(70);
    });
  });

  describe('GET /api/macro/recommendation', () => {
    it('should return macro recommendation', async () => {
      const result = await controller.getMacroRecommendation();
      expect(['opportunistic', 'selective', 'defensive', 'cash']).toContain(result.action);
    });
  });

  describe('GET /api/macro/decision-history', () => {
    it('should return decision history', async () => {
      const result = await controller.getDecisionHistory('10');
      expect(Array.isArray(result.decisions)).toBe(true);
    });
  });

  describe('GET /api/macro/dashboard', () => {
    it('should return dashboard bundle', async () => {
      const result = await controller.getDashboard();
      expect(result.elite).toHaveProperty('score');
      expect(result.trendCard).toHaveProperty('trend');
      expect(result.riskCard).toHaveProperty('level');
      expect(result.combinedConfidence).toHaveProperty('combined');
      expect(result.observability).toHaveProperty('providers');
    });
  });
});
