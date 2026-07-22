import { HealthIndexService } from './health-index.service';
import { OpportunityRecord, OpportunityStage, HealthLevel } from './types';

function createRecord(scores: number[]): OpportunityRecord {
  return {
    id: 'test',
    stockSymbol: 'THYAO',
    stockName: 'Test',
    stage: OpportunityStage.DETECTED,
    stageHistory: [],
    snapshots: scores.map((s, i) => ({
      timestamp: new Date(Date.now() + i * 3600000).toISOString(),
      eliteScore: s,
      confidence: 0.7,
      consensusScore: 0.6,
      riskScore: 0.3,
      momentumScore: 0.6,
      volumeScore: 0.5,
      volatilityScore: 0.4,
      healthIndex: 50,
      stage: OpportunityStage.DETECTED,
      currentPrice: 100,
    })),
    healthIndex: { overall: 0, stability: 0, momentum: 0, riskLevel: 0, quality: 0, level: HealthLevel.CRITICAL, factors: [], calculatedAt: '' },
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

describe('HealthIndexService', () => {
  let service: HealthIndexService;

  beforeEach(() => {
    service = new HealthIndexService();
  });

  describe('calculateHealth', () => {
    it('should calculate health with good scores', () => {
      const record = createRecord([75, 78, 80]);
      const health = service.calculateHealth(record);
      expect(health.overall).toBeGreaterThan(0);
      expect(health.level).toBeDefined();
      expect(health.factors.length).toBe(5);
    });

    it('should return CRITICAL health for empty snapshots', () => {
      const record = createRecord([]);
      record.snapshots = [];
      const health = service.calculateHealth(record);
      expect(health.level).toBe(HealthLevel.CRITICAL);
      expect(health.overall).toBe(0);
    });

    it('should have EXCELLENT level for very high scores', () => {
      const record = createRecord([95, 95, 95]);
      record.snapshots.forEach((s) => {
        s.confidence = 0.95;
        s.momentumScore = 0.95;
        s.riskScore = 0.05;
      });
      const health = service.calculateHealth(record);
      expect(health.overall).toBeGreaterThanOrEqual(80);
    });

    it('should include stability calculation', () => {
      const record = createRecord([50, 50, 50]);
      const health = service.calculateHealth(record);
      expect(health.stability).toBeCloseTo(1, 1);
    });

    it('should have factors with contributions', () => {
      const record = createRecord([60, 65, 70]);
      const health = service.calculateHealth(record);
      for (const f of health.factors) {
        expect(f.contribution).toBeGreaterThanOrEqual(0);
        expect(f.weight).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateStabilityScore', () => {
    it('should return 0.5 for single value', () => {
      expect(service.calculateStabilityScore([50])).toBe(0.5);
    });

    it('should return high stability for identical values', () => {
      const stability = service.calculateStabilityScore([50, 50, 50]);
      expect(stability).toBeCloseTo(1, 1);
    });

    it('should return lower stability for varying values', () => {
      const stability = service.calculateStabilityScore([10, 90, 20, 80]);
      expect(stability).toBeLessThan(0.8);
    });
  });

  describe('getHealthLevel', () => {
    it('should return EXCELLENT for >= 80', () => {
      expect(service.getHealthLevel(85)).toBe(HealthLevel.EXCELLENT);
    });

    it('should return GOOD for >= 60', () => {
      expect(service.getHealthLevel(65)).toBe(HealthLevel.GOOD);
    });

    it('should return FAIR for >= 40', () => {
      expect(service.getHealthLevel(45)).toBe(HealthLevel.FAIR);
    });

    it('should return POOR for >= 20', () => {
      expect(service.getHealthLevel(25)).toBe(HealthLevel.POOR);
    });

    it('should return CRITICAL for < 20', () => {
      expect(service.getHealthLevel(10)).toBe(HealthLevel.CRITICAL);
    });
  });
});
