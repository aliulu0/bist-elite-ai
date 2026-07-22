import { FailureAnalyzerService } from './failure-analyzer.service';
import { OpportunityRecord, OpportunityStage, FailureCategory, HealthLevel } from './types';

function createRecord(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return {
    id: 'test',
    stockSymbol: 'THYAO',
    stockName: 'Test',
    stage: OpportunityStage.DETECTED,
    stageHistory: [],
    snapshots: [{
      timestamp: new Date().toISOString(),
      eliteScore: 70,
      confidence: 0.7,
      consensusScore: 0.6,
      riskScore: 0.3,
      momentumScore: 0.6,
      volumeScore: 0.5,
      volatilityScore: 0.4,
      healthIndex: 65,
      stage: OpportunityStage.DETECTED,
      currentPrice: 100,
    }],
    healthIndex: { overall: 65, stability: 0.8, momentum: 0.6, riskLevel: 0.3, quality: 0.7, level: HealthLevel.GOOD, factors: [], calculatedAt: '' },
    earlyDetection: { firstDetectionTime: '', confirmationDelay: 0, leadTime: 0, signalPersistence: 1, earlyDetectionSuccess: true, result: 'EARLY' as any, timeToConfirm: 0, timeToMature: 0, signalFreshness: 1, description: '' },
    failures: [],
    marketContext: { regime: 'BULL', regimeConfidence: 0.7, sector: '', industry: '', timeframe: 'D1', sectorMomentum: 0.5, marketPhase: '' },
    currentPrice: 100,
    entryPrice: 100,
    detectedAt: new Date().toISOString(),
    signalDirection: 'NEUTRAL' as any,
    overallScore: 70,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('FailureAnalyzerService', () => {
  let service: FailureAnalyzerService;

  beforeEach(() => {
    service = new FailureAnalyzerService();
  });

  describe('analyzeFailures', () => {
    it('should return no failures for healthy record', () => {
      const record = createRecord();
      const failures = service.analyzeFailures(record);
      expect(failures.length).toBe(0);
    });

    it('should detect WEAK_OPPORTUNITY for low score', () => {
      const record = createRecord();
      record.snapshots[0].eliteScore = 10;
      const failures = service.analyzeFailures(record);
      expect(failures.some((f) => f.category === FailureCategory.WEAK_OPPORTUNITY)).toBe(true);
    });

    it('should detect HIGH_RISK_OPPORTUNITY for high risk', () => {
      const record = createRecord();
      record.snapshots[0].riskScore = 0.9;
      const failures = service.analyzeFailures(record);
      expect(failures.some((f) => f.category === FailureCategory.HIGH_RISK_OPPORTUNITY)).toBe(true);
    });

    it('should detect FALSE_OPPORTUNITY for large score decline', () => {
      const record = createRecord();
      record.snapshots = [
        { ...record.snapshots[0], eliteScore: 80 },
        { ...record.snapshots[0], eliteScore: 40, timestamp: new Date(Date.now() + 3600000).toISOString() },
      ];
      const failures = service.analyzeFailures(record);
      expect(failures.some((f) => f.category === FailureCategory.FALSE_OPPORTUNITY)).toBe(true);
    });

    it('should detect LATE_OPPORTUNITY for long holding without gain', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now - 20 * 86400000).toISOString(),
        completedAt: new Date(now).toISOString(),
        actualReturn: -0.02,
      });
      const failures = service.analyzeFailures(record);
      expect(failures.some((f) => f.category === FailureCategory.LATE_OPPORTUNITY)).toBe(true);
    });

    it('should return empty for empty snapshots', () => {
      const record = createRecord();
      record.snapshots = [];
      expect(service.analyzeFailures(record)).toEqual([]);
    });
  });

  describe('getOverallFailureScore', () => {
    it('should return 0 when no failures', () => {
      const record = createRecord();
      expect(service.getOverallFailureScore(record)).toBe(0);
    });

    it('should return max severity', () => {
      const record = createRecord();
      record.failures = [
        { category: FailureCategory.WEAK_OPPORTUNITY, severity: 0.3, reason: '', indicators: [], detectedAt: '', impact: 0 },
        { category: FailureCategory.HIGH_RISK_OPPORTUNITY, severity: 0.8, reason: '', indicators: [], detectedAt: '', impact: 0 },
      ];
      expect(service.getOverallFailureScore(record)).toBe(0.8);
    });
  });

  describe('getFailureSummary', () => {
    it('should count categories correctly', () => {
      const record = createRecord();
      record.failures = [
        { category: FailureCategory.WEAK_OPPORTUNITY, severity: 0.5, reason: '', indicators: [], detectedAt: '', impact: 0 },
        { category: FailureCategory.WEAK_OPPORTUNITY, severity: 0.3, reason: '', indicators: [], detectedAt: '', impact: 0 },
      ];
      const summary = service.getFailureSummary(record);
      expect(summary.totalFailures).toBe(2);
      expect(summary.categories[FailureCategory.WEAK_OPPORTUNITY]).toBe(2);
    });

    it('should handle empty failures', () => {
      const record = createRecord();
      const summary = service.getFailureSummary(record);
      expect(summary.totalFailures).toBe(0);
      expect(summary.avgSeverity).toBe(0);
    });
  });
});
