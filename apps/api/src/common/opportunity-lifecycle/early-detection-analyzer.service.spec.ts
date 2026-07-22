import { EarlyDetectionAnalyzerService } from './early-detection-analyzer.service';
import { OpportunityRecord, OpportunityStage, EarlyDetectionResult, HealthLevel } from './types';

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
    earlyDetection: {
      firstDetectionTime: new Date().toISOString(),
      confirmationDelay: 2,
      leadTime: 70,
      signalPersistence: 0.9,
      earlyDetectionSuccess: true,
      result: EarlyDetectionResult.EARLY,
      timeToConfirm: 2,
      timeToMature: 0,
      signalFreshness: 0.95,
      description: 'Test',
    },
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

describe('EarlyDetectionAnalyzerService', () => {
  let service: EarlyDetectionAnalyzerService;

  beforeEach(() => {
    service = new EarlyDetectionAnalyzerService();
  });

  describe('analyzeDetection', () => {
    it('should return the early detection metrics from record', () => {
      const record = createRecord();
      const result = service.analyzeDetection(record);
      expect(result.result).toBe(EarlyDetectionResult.EARLY);
    });
  });

  describe('recalculateDetection', () => {
    it('should classify as EARLY when detected and confirmed quickly', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now).toISOString(),
        confirmedAt: new Date(now + 3 * 3600000).toISOString(),
      });
      const result = service.recalculateDetection(record);
      expect(result.result).toBe(EarlyDetectionResult.EARLY);
      expect(result.timeToConfirm).toBeCloseTo(3, 0);
    });

    it('should classify as ON_TIME for moderate delay', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now).toISOString(),
        confirmedAt: new Date(now + 12 * 3600000).toISOString(),
      });
      const result = service.recalculateDetection(record);
      expect(result.result).toBe(EarlyDetectionResult.ON_TIME);
    });

    it('should classify as LATE for large delay', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now).toISOString(),
        confirmedAt: new Date(now + 48 * 3600000).toISOString(),
      });
      const result = service.recalculateDetection(record);
      expect(result.result).toBe(EarlyDetectionResult.LATE);
    });

    it('should classify as MISSED when no confirmation', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now - 100 * 3600000).toISOString(),
        confirmedAt: undefined,
      });
      const result = service.recalculateDetection(record);
      expect(result.result).toBe(EarlyDetectionResult.MISSED);
    });

    it('should calculate signal persistence', () => {
      const record = createRecord();
      const result = service.recalculateDetection(record);
      expect(result.signalPersistence).toBeGreaterThanOrEqual(0);
      expect(result.signalPersistence).toBeLessThanOrEqual(1);
    });

    it('should calculate lead time', () => {
      const now = Date.now();
      const record = createRecord({
        detectedAt: new Date(now).toISOString(),
        confirmedAt: new Date(now + 5 * 3600000).toISOString(),
      });
      const result = service.recalculateDetection(record);
      expect(result.leadTime).toBeGreaterThan(0);
    });
  });
});
