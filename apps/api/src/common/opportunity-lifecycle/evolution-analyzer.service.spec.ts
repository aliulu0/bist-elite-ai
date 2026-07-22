import { EvolutionAnalyzerService } from './evolution-analyzer.service';
import { OpportunityRecord, OpportunityStage, EvolutionTrend } from './types';

function createRecord(snapshots: Array<{ eliteScore: number; confidence: number }>): OpportunityRecord {
  return {
    id: 'test',
    stockSymbol: 'THYAO',
    stockName: 'Test',
    stage: OpportunityStage.DETECTED,
    stageHistory: [],
    snapshots: snapshots.map((s, i) => ({
      timestamp: new Date(Date.now() + i * 3600000).toISOString(),
      eliteScore: s.eliteScore,
      confidence: s.confidence,
      consensusScore: 0.5,
      riskScore: 0.3,
      momentumScore: 0.5,
      volumeScore: 0.5,
      volatilityScore: 0.5,
      healthIndex: 50,
      stage: OpportunityStage.DETECTED,
      currentPrice: 100,
    })),
    healthIndex: { overall: 50, stability: 0.7, momentum: 0.5, riskLevel: 0.3, quality: 0.5, level: 'FAIR' as any, factors: [], calculatedAt: '' },
    earlyDetection: { firstDetectionTime: '', confirmationDelay: 0, leadTime: 0, signalPersistence: 1, earlyDetectionSuccess: true, result: 'EARLY' as any, timeToConfirm: 0, timeToMature: 0, signalFreshness: 1, description: '' },
    failures: [],
    marketContext: { regime: 'BULL', regimeConfidence: 0.7, sector: '', industry: '', timeframe: 'D1', sectorMomentum: 0.5, marketPhase: '' },
    currentPrice: 100,
    entryPrice: 100,
    detectedAt: new Date().toISOString(),
    signalDirection: 'NEUTRAL' as any,
    overallScore: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('EvolutionAnalyzerService', () => {
  let service: EvolutionAnalyzerService;

  beforeEach(() => {
    service = new EvolutionAnalyzerService();
  });

  describe('analyzeEvolution', () => {
    it('should analyze all 7 metrics', () => {
      const record = createRecord([
        { eliteScore: 50, confidence: 0.5 },
        { eliteScore: 60, confidence: 0.6 },
        { eliteScore: 70, confidence: 0.7 },
      ]);
      const evolution = service.analyzeEvolution(record);
      expect(evolution.length).toBe(7);
      expect(evolution.map((e) => e.metric)).toContain('Elite Skor');
    });

    it('should detect improving trend', () => {
      const record = createRecord([
        { eliteScore: 40, confidence: 0.4 },
        { eliteScore: 50, confidence: 0.5 },
        { eliteScore: 60, confidence: 0.6 },
        { eliteScore: 70, confidence: 0.7 },
      ]);
      const evolution = service.analyzeEvolution(record);
      const scoreEvo = evolution.find((e) => e.metric === 'Elite Skor');
      expect(scoreEvo!.trend).toBe(EvolutionTrend.IMPROVING);
    });

    it('should detect degrading trend', () => {
      const record = createRecord([
        { eliteScore: 80, confidence: 0.8 },
        { eliteScore: 70, confidence: 0.7 },
        { eliteScore: 60, confidence: 0.6 },
        { eliteScore: 50, confidence: 0.5 },
      ]);
      const evolution = service.analyzeEvolution(record);
      const scoreEvo = evolution.find((e) => e.metric === 'Elite Skor');
      expect(scoreEvo!.trend).toBe(EvolutionTrend.DEGRADING);
    });
  });

  describe('analyzeMetric', () => {
    it('should return INSUFFICIENT_DATA for single snapshot', () => {
      const record = createRecord([{ eliteScore: 50, confidence: 0.5 }]);
      const evo = service.analyzeMetric(record, 'eliteScore', 'Test');
      expect(evo.trend).toBe(EvolutionTrend.INSUFFICIENT_DATA);
      expect(evo.change).toBe(0);
    });

    it('should calculate change percent correctly', () => {
      const record = createRecord([
        { eliteScore: 50, confidence: 0.5 },
        { eliteScore: 75, confidence: 0.5 },
      ]);
      const evo = service.analyzeMetric(record, 'eliteScore', 'Test');
      expect(evo.change).toBe(25);
      expect(evo.changePercent).toBe(50);
    });
  });

  describe('calculateVolatility', () => {
    it('should return 0 for single value', () => {
      expect(service.calculateVolatility([50])).toBe(0);
    });

    it('should return 0 for identical values', () => {
      expect(service.calculateVolatility([50, 50, 50])).toBe(0);
    });

    it('should return positive for varying values', () => {
      const vol = service.calculateVolatility([50, 60, 40, 70, 30]);
      expect(vol).toBeGreaterThan(0);
    });
  });

  describe('getOverallTrend', () => {
    it('should return INSUFFICIENT_DATA when all are insufficient', () => {
      const evolution = [{ trend: EvolutionTrend.INSUFFICIENT_DATA } as any];
      expect(service.getOverallTrend(evolution)).toBe(EvolutionTrend.INSUFFICIENT_DATA);
    });

    it('should return IMPROVING when majority improving', () => {
      const evolution = [
        { trend: EvolutionTrend.IMPROVING },
        { trend: EvolutionTrend.IMPROVING },
        { trend: EvolutionTrend.DEGRADING },
      ] as any[];
      expect(service.getOverallTrend(evolution)).toBe(EvolutionTrend.IMPROVING);
    });
  });

  describe('detectDivergence', () => {
    it('should detect divergences between improving and degrading', () => {
      const evolution = [
        { metric: 'Skor', trend: EvolutionTrend.IMPROVING },
        { metric: 'Risk', trend: EvolutionTrend.DEGRADING },
      ] as any[];
      const div = service.detectDivergence(evolution);
      expect(div.length).toBe(1);
      expect(div[0].metric1).toBe('Skor');
    });

    it('should return empty for no divergences', () => {
      const evolution = [
        { metric: 'Skor', trend: EvolutionTrend.IMPROVING },
        { metric: 'Risk', trend: EvolutionTrend.IMPROVING },
      ] as any[];
      expect(service.detectDivergence(evolution)).toEqual([]);
    });
  });
});
