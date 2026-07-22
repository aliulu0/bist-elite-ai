import { LifecycleReportGeneratorService } from './lifecycle-report-generator.service';
import {
  OpportunityRecord,
  OpportunityTimeline,
  LifecycleSummary,
  OpportunityStage,
  HealthLevel,
  ScoreEvolution,
  EvolutionTrend,
} from './types';

describe('LifecycleReportGeneratorService', () => {
  let service: LifecycleReportGeneratorService;

  beforeEach(() => {
    service = new LifecycleReportGeneratorService();
  });

  function createRecord(): OpportunityRecord {
    return {
      id: 'test',
      stockSymbol: 'THYAO',
      stockName: 'Test',
      stage: OpportunityStage.CONFIRMED,
      stageHistory: [],
      snapshots: [{
        timestamp: new Date().toISOString(),
        eliteScore: 72,
        confidence: 0.8,
        consensusScore: 0.7,
        riskScore: 0.3,
        momentumScore: 0.6,
        volumeScore: 0.5,
        volatilityScore: 0.4,
        healthIndex: 68,
        stage: OpportunityStage.CONFIRMED,
        currentPrice: 280,
      }],
      healthIndex: {
        overall: 68, stability: 0.8, momentum: 0.6, riskLevel: 0.3, quality: 0.72,
        level: HealthLevel.GOOD,
        factors: [{ factor: 'Test', value: 0.7, weight: 0.3, contribution: 0.21, impact: 'STRENGTHENING' as any, description: 'Test factor' }],
        calculatedAt: new Date().toISOString(),
      },
      earlyDetection: {
        firstDetectionTime: new Date().toISOString(),
        confirmationDelay: 4,
        leadTime: 68,
        signalPersistence: 0.85,
        earlyDetectionSuccess: true,
        result: 'EARLY' as any,
        timeToConfirm: 4,
        timeToMature: 0,
        signalFreshness: 0.9,
        description: 'Erken tespit edildi',
      },
      failures: [],
      marketContext: { regime: 'BULL', regimeConfidence: 0.7, sector: 'Havacilik', industry: '', timeframe: 'D1', sectorMomentum: 0.6, marketPhase: '' },
      currentPrice: 280,
      entryPrice: 275,
      detectedAt: new Date().toISOString(),
      signalDirection: 'STRENGTHENING' as any,
      overallScore: 72,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  describe('generateTimelineReport', () => {
    it('should generate timeline with stages', () => {
      const timeline: OpportunityTimeline = {
        id: 'test',
        stockSymbol: 'THYAO',
        stages: [
          { stage: OpportunityStage.DETECTED, enteredAt: '2026-01-01', duration: 1, reason: 'Ilk tespit' },
          { stage: OpportunityStage.EMERGING, enteredAt: '2026-01-02', exitedAt: '2026-01-03', duration: 1 },
          { stage: OpportunityStage.CONFIRMED, enteredAt: '2026-01-03', duration: 2 },
        ],
        totalDuration: 4,
        detectedAt: '2026-01-01',
      };
      const report = service.generateTimelineReport(timeline);
      expect(report).toContain('THYAO');
      expect(report).toContain('Tespit Edildi');
      expect(report).toContain('Dogrulandi');
    });
  });

  describe('generateLifecycleSummaryReport', () => {
    it('should include key metrics', () => {
      const summary: LifecycleSummary = {
        totalOpportunities: 50,
        activeOpportunities: 30,
        completedOpportunities: 15,
        cancelledOpportunities: 5,
        stageDistribution: {
          DETECTED: 10, EMERGING: 8, CONFIRMED: 7, STRENGTHENING: 5,
          MATURE: 3, WEAKENING: 2, EXPIRED: 10, CANCELLED: 5,
        },
        avgHealthIndex: 62,
        avgLifetime: 7,
        successRate: 0.65,
        avgLeadTime: 12,
        generatedAt: new Date().toISOString(),
      };
      const report = service.generateLifecycleSummaryReport(summary);
      expect(report).toContain('50');
      expect(report).toContain('%65.0');
      expect(report).toContain('62.00');
    });
  });

  describe('generateEvolutionReport', () => {
    it('should include all evolution metrics', () => {
      const evolution: ScoreEvolution[] = [
        { metric: 'Elite Skor', snapshots: [], trend: EvolutionTrend.IMPROVING, currentValue: 75, startValue: 60, change: 15, changePercent: 25, volatility: 0.05 },
        { metric: 'Risk', snapshots: [], trend: EvolutionTrend.STABLE, currentValue: 0.3, startValue: 0.35, change: -0.05, changePercent: -14.3, volatility: 0.02 },
      ];
      const report = service.generateEvolutionReport(evolution);
      expect(report).toContain('Elite Skor');
      expect(report).toContain('Iyilesiyor');
      expect(report).toContain('Kararli');
    });
  });

  describe('generateHealthReport', () => {
    it('should include health details', () => {
      const record = createRecord();
      const report = service.generateHealthReport(record);
      expect(report).toContain('THYAO');
      expect(report).toContain('68/100');
      expect(report).toContain('Iyi');
      expect(report).toContain('Faktorler');
    });
  });

  describe('generateEarlyDetectionReport', () => {
    it('should include detection details', () => {
      const record = createRecord();
      const report = service.generateEarlyDetectionReport(record);
      expect(report).toContain('THYAO');
      expect(report).toContain('Erken Tespit');
      expect(report).toContain('4.0 saat');
    });
  });

  describe('all reports contain header and footer', () => {
    it('should contain header and footer', () => {
      const record = createRecord();
      const timeline: OpportunityTimeline = {
        id: 'test', stockSymbol: 'THYAO', stages: [], totalDuration: 0, detectedAt: '',
      };
      const summary: LifecycleSummary = {
        totalOpportunities: 0, activeOpportunities: 0, completedOpportunities: 0,
        cancelledOpportunities: 0, stageDistribution: {
          DETECTED: 0, EMERGING: 0, CONFIRMED: 0, STRENGTHENING: 0,
          MATURE: 0, WEAKENING: 0, EXPIRED: 0, CANCELLED: 0,
        },
        avgHealthIndex: 0, avgLifetime: 0, successRate: 0, avgLeadTime: 0, generatedAt: '',
      };
      const reports = [
        service.generateTimelineReport(timeline),
        service.generateLifecycleSummaryReport(summary),
        service.generateEvolutionReport([]),
        service.generateHealthReport(record),
        service.generateEarlyDetectionReport(record),
      ];
      for (const report of reports) {
        expect(report).toContain('Firsat Yasam Dongusu Raporu');
        expect(report).toContain('Rapor Sonu');
      }
    });
  });
});
