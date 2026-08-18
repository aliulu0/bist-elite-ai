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
      {
        symbol: 'vix',
        value: 30,
        change: 2,
        changePercent: 7.1,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
      {
        symbol: 'dxy',
        value: 110,
        change: 1,
        changePercent: 0.9,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
      {
        symbol: 'us10y',
        value: 6.0,
        change: 0.1,
        changePercent: 1.7,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
      {
        symbol: 'us2y',
        value: 4.8,
        change: 0.05,
        changePercent: 1.0,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
      {
        symbol: 'gold',
        value: 2350,
        change: -10,
        changePercent: -0.4,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
      {
        symbol: 'brent',
        value: 82,
        change: -1.5,
        changePercent: -1.8,
        timestamp: new Date().toISOString(),
        source: 'tcmb',
      },
    ]),
    fetchTcmbInterestDecisions: jest.fn().mockResolvedValue([]),
    getProviderStatus: jest.fn().mockResolvedValue([]),
    fetchCompany: jest.fn().mockResolvedValue(null),
    fetchFinancials: jest.fn().mockResolvedValue(null),
    fetchBalanceSheet: jest.fn().mockResolvedValue(null),
    fetchIncomeStatement: jest.fn().mockResolvedValue(null),
    fetchCashFlow: jest.fn().mockResolvedValue(null),
    fetchSector: jest.fn().mockResolvedValue(null),
    fetchDisclosures: jest.fn().mockResolvedValue(null),
    getAvailableProviders: jest.fn().mockReturnValue([]),
    getProviderHealth: jest.fn().mockResolvedValue({}),
  } as any;
}

describe('MacroService', () => {
  let service: MacroService;
  let analysis: MacroAnalysisService;

  function makeService(earlyOpportunity?: any) {
    const orchestrator = createMockOrchestrator();
    const data = new MacroDataService(orchestrator);
    const store = new TCMBDecisionStoreService();
    const a = new MacroAnalysisService(
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
    return {
      service: new MacroService(a, data, elite, combined, capture, store, earlyOpportunity),
      analysis: a,
    };
  }

  function createMockEarlyOpportunity(rows: any[] = []) {
    return {
      getEarlyOpportunities: jest.fn().mockResolvedValue(rows),
    } as any;
  }

  beforeEach(() => {
    const created = makeService();
    service = created.service;
    analysis = created.analysis;
  });

  describe('getFullAnalysis', () => {
    it('should return the full analysis', async () => {
      const result = await service.getFullAnalysis();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('regime');
      expect(result).toHaveProperty('score');
    });
  });

  describe('getData', () => {
    it('should return macro data snapshot', async () => {
      const result = await service.getData();
      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('fetchedAt');
      expect(result.sourceCount).toBeGreaterThan(0);
    });
  });

  describe('getMacroScore', () => {
    it('should return macro score', async () => {
      const result = await service.getMacroScore();
      expect(result).toHaveProperty('macroScore');
    });
  });

  describe('getRegime', () => {
    it('should return regime', async () => {
      const result = await service.getRegime();
      expect(result).toHaveProperty('regime');
    });
  });

  describe('getCentralBankAnalysis', () => {
    it('should return analysis for a given bank', async () => {
      const result = await service.getCentralBankAnalysis('tcmb');
      expect(result.bank).toBe('tcmb');
    });
  });

  describe('getCombinedConfidence', () => {
    it('should return combined confidence', async () => {
      const result = await service.getCombinedConfidence(80);
      expect(result.eliteScore).toBe(80);
    });
  });

  describe('getSectorImpacts', () => {
    it('should return 10 sector impacts', async () => {
      const result = await service.getSectorImpacts();
      expect(result.length).toBe(10);
    });
  });

  describe('getAlerts', () => {
    it('should return alert array', async () => {
      const result = await service.getAlerts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getOpportunities', () => {
    it('should return real opportunities mapped from the early-opportunity pipeline', async () => {
      const early = createMockEarlyOpportunity([
        {
          ticker: 'THYAO',
          company: 'Türk Hava Yolları',
          sector: 'Transportation',
          eliteScore: 71,
          earlyOpportunityScore: 85,
          confidence: 80,
        },
        {
          ticker: 'AKBNK',
          company: 'Akbank',
          sector: 'Banking',
          eliteScore: 78,
          earlyOpportunityScore: 80,
          confidence: 75,
        },
      ]);
      const { service } = makeService(early);
      const result = await service.getOpportunities(80);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].ticker).toBe('THYAO');
      expect(result[0].eliteScore).toBe(71);
      expect(result[0]).toHaveProperty('macroScore');
      expect(result[0]).toHaveProperty('combinedConfidence');
      expect(result[0]).toHaveProperty('priority');
    });

    it('should use default elite score when not provided', async () => {
      const early = createMockEarlyOpportunity([
        {
          ticker: 'THYAO',
          company: 'Türk Hava Yolları',
          sector: 'Transportation',
          eliteScore: 71,
          earlyOpportunityScore: 85,
          confidence: 80,
        },
      ]);
      const { service } = makeService(early);
      const result = await service.getOpportunities();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should map combined confidence to priority levels', async () => {
      const early = createMockEarlyOpportunity([
        {
          ticker: 'LOWTK',
          company: 'Low Co',
          sector: 'Banking',
          eliteScore: 20,
          earlyOpportunityScore: 25,
          confidence: 20,
        },
      ]);
      const { service } = makeService(early);
      const result = await service.getOpportunities(20);
      expect(result[0].priority).toBe('low');
    });

    it('should return an empty array when the early-opportunity source is unavailable', async () => {
      const { service } = makeService();
      const result = await service.getOpportunities(80);
      expect(result).toEqual([]);
    });
  });

  describe('getRisk', () => {
    it('should return macro risk items array', async () => {
      const result = await service.getRisk();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have risk type and description on each item', async () => {
      const result = await service.getRisk();
      expect(result[0]).toHaveProperty('riskType');
      expect(result[0]).toHaveProperty('riskDescription');
      expect(result[0]).toHaveProperty('severity');
    });
  });

  describe('getMacroEliteScore', () => {
    it('should return an elite score within 0-100 with full result shape', async () => {
      const result = await service.getMacroEliteScore();
      expect(result.eliteScore).toBeGreaterThanOrEqual(0);
      expect(result.eliteScore).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('trend');
      expect(result.risk).toHaveProperty('level');
      expect(result.recommendation).toHaveProperty('action');
      expect(result.components.length).toBeGreaterThan(0);
    });
  });

  describe('getMacroTrend', () => {
    it('should return a trend result with change', async () => {
      const result = await service.getMacroTrend();
      expect(['improving', 'stable', 'deteriorating']).toContain(result.trend);
      expect(typeof result.change).toBe('number');
      expect(result).toHaveProperty('currentScore');
      expect(Array.isArray(result.drivers)).toBe(true);
    });
  });

  describe('getCombinedMacroConfidence', () => {
    it('should return combined confidence within 0-100 without merging scores', async () => {
      const result = await service.getCombinedMacroConfidence(80);
      expect(result.combined).toBeGreaterThanOrEqual(0);
      expect(result.combined).toBeLessThanOrEqual(100);
      expect(result.eliteConfidence).toBe(80);
      expect(result).not.toHaveProperty('macroScore');
      expect(result).not.toHaveProperty('eliteScore');
    });

    it('should use default elite confidence when not provided', async () => {
      const result = await service.getCombinedMacroConfidence();
      expect(result.eliteConfidence).toBe(70);
    });
  });

  describe('getMacroRecommendation', () => {
    it('should return a recommendation with an action', async () => {
      const result = await service.getMacroRecommendation();
      expect(['opportunistic', 'selective', 'defensive', 'cash']).toContain(result.action);
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });

  describe('getDecisionHistory', () => {
    it('should return decision history collection', async () => {
      const result = await service.getDecisionHistory(5);
      expect(Array.isArray(result.decisions)).toBe(true);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('getDashboard', () => {
    it('should return the full dashboard bundle', async () => {
      const result = await service.getDashboard();
      expect(result.snapshot).toBeDefined();
      expect(result.elite).toHaveProperty('score');
      expect(result.trendCard).toHaveProperty('trend');
      expect(result.riskCard).toHaveProperty('level');
      expect(result.combinedConfidence).toHaveProperty('combined');
      expect(result.observability).toHaveProperty('providers');
      expect(Array.isArray(result.sectors)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.opportunities)).toBe(true);
    });
  });
});
