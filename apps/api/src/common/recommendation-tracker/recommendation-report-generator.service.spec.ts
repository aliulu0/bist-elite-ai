import { RecommendationReportGeneratorService } from './recommendation-report-generator.service';
import {
  SuccessAnalytics,
  PerformanceDashboard,
  EliteScoreAnalysis,
  SectorPerformanceAnalysis,
  StrategyPerformanceAnalysis,
  FailureAnalysis,
  RecommendationRecord,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
} from './types';

describe('RecommendationReportGeneratorService', () => {
  let service: RecommendationReportGeneratorService;

  beforeEach(() => {
    service = new RecommendationReportGeneratorService();
  });

  function createAnalytics(overrides: Partial<SuccessAnalytics> = {}): SuccessAnalytics {
    return {
      totalRecommendations: 100,
      winRate: 60,
      lossRate: 40,
      avgGain: 8.5,
      avgLoss: -4.2,
      profitFactor: 2.0,
      sharpeRatio: 1.5,
      sortinoRatio: 1.8,
      precision: 0.65,
      recall: 0.7,
      f1Score: 0.67,
      evaluatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function createDashboard(): PerformanceDashboard {
    return {
      summary: createAnalytics(),
      windowPerformance: {},
      topPerformers: [
        { symbol: 'THYAO', return_: 25, eliteScore: 85 },
        { symbol: 'GARAN', return_: 18, eliteScore: 75 },
      ],
      worstPerformers: [
        { symbol: 'KCHOL', return_: -15, eliteScore: 40 },
      ],
      strategyBreakdown: [],
      sectorBreakdown: [],
      recentRecommendations: [
        {
          id: 'rec-1',
          stockSymbol: 'THYAO',
          stockName: 'Turk Hava Yollari',
          status: RecommendationStatus.FINAL_OUTCOME,
          outcome: RecommendationOutcome.WINNER,
          entryPrice: 100,
          entryDate: '2026-01-01T00:00:00.000Z',
          entryEliteScore: 75,
          entryConfidence: 0.8,
          entryConsensusScore: 70,
          strategyUsed: 'elite-score',
          marketRegime: MarketRegime.BULL,
          timeframeConsensus: 'balanced',
          actualReturn: 15,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        },
      ],
      generatedAt: new Date().toISOString(),
      disclaimer: 'Test disclaimer',
    };
  }

  describe('generateSummaryReport', () => {
    it('should generate summary report', () => {
      const analytics = createAnalytics();
      const dashboard = createDashboard();
      const report = service.generateSummaryReport(analytics, dashboard);
      expect(report).toContain('ONERI PERFORMANS OZET RAPORU');
      expect(report).toContain('100');
      expect(report).toContain('%60.00');
      expect(report).toContain('THYAO');
      expect(report).toContain('bilgilendirme');
    });
  });

  describe('generatePerformanceDashboard', () => {
    it('should generate performance dashboard', () => {
      const dashboard = createDashboard();
      const report = service.generatePerformanceDashboard(dashboard);
      expect(report).toContain('PERFORMANS PANELI');
      expect(report).toContain('THYAO');
    });
  });

  describe('generateAccuracyReport', () => {
    it('should generate accuracy report', () => {
      const analyses: EliteScoreAnalysis[] = [
        {
          recommendationId: 'rec-1',
          stockSymbol: 'THYAO',
          scoreAccuracy: 0.8,
          confidenceAccuracy: 0.75,
          scoreStability: 0.9,
          scoreDrift: 0.1,
          predictionQuality: 0.85,
          brierScore: 0.15,
          calibrationError: 0.1,
          scoreDistribution: { mean: 70, median: 70, stdDev: 5 },
          analyzedAt: new Date().toISOString(),
        },
      ];
      const report = service.generateAccuracyReport(analyses);
      expect(report).toContain('SKOR DOGRULUK RAPORU');
      expect(report).toContain('THYAO');
    });

    it('should handle empty analyses', () => {
      const report = service.generateAccuracyReport([]);
      expect(report).toContain('Henuz');
    });
  });

  describe('generateSectorReport', () => {
    it('should generate sector report', () => {
      const sectors: SectorPerformanceAnalysis[] = [
        {
          sector: 'Turizm',
          totalRecommendations: 20,
          winRate: 65,
          avgReturn: 8.5,
          profitFactor: 2.0,
          avgEliteScore: 72,
          analyzedAt: new Date().toISOString(),
        },
      ];
      const report = service.generateSectorReport(sectors);
      expect(report).toContain('SEKTOR PERFORMANS RAPORU');
      expect(report).toContain('Turizm');
    });

    it('should handle empty sectors', () => {
      const report = service.generateSectorReport([]);
      expect(report).toContain('Henuz');
    });
  });

  describe('generateStrategyReport', () => {
    it('should generate strategy report', () => {
      const strategies: StrategyPerformanceAnalysis[] = [
        {
          strategy: 'elite-score',
          totalRecommendations: 50,
          winRate: 62,
          avgReturn: 7.5,
          profitFactor: 1.8,
          sharpeRatio: 1.4,
          maxDrawdown: 12,
          bestPerformance: { symbol: 'THYAO', return_: 25 },
          worstPerformance: { symbol: 'KCHOL', return_: -10 },
          analyzedAt: new Date().toISOString(),
        },
      ];
      const report = service.generateStrategyReport(strategies);
      expect(report).toContain('STRATEJI PERFORMANS RAPORU');
      expect(report).toContain('elite-score');
    });

    it('should handle empty strategies', () => {
      const report = service.generateStrategyReport([]);
      expect(report).toContain('Henuz');
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly report', () => {
      const recs: RecommendationRecord[] = [
        {
          id: 'rec-1',
          stockSymbol: 'THYAO',
          stockName: 'Turk Hava Yollari',
          status: RecommendationStatus.FINAL_OUTCOME,
          outcome: RecommendationOutcome.WINNER,
          entryPrice: 100,
          entryDate: '2026-07-01T00:00:00.000Z',
          entryEliteScore: 75,
          entryConfidence: 0.8,
          entryConsensusScore: 70,
          strategyUsed: 'elite-score',
          marketRegime: MarketRegime.BULL,
          timeframeConsensus: 'balanced',
          actualReturn: 10,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-15T00:00:00.000Z',
        },
      ];
      const report = service.generateMonthlyReport(recs, 2026, 7);
      expect(report).toContain('AYLIK ONERI RAPORU');
      expect(report).toContain('THYAO');
    });
  });

  describe('generateFailureReport', () => {
    it('should generate failure report', () => {
      const failures: FailureAnalysis[] = [
        {
          recommendationId: 'rec-1',
          stockSymbol: 'THYAO',
          failures: [
            {
              type: 'LATE_SIGNAL' as any,
              severity: 'CRITICAL' as any,
              description: 'Test failure',
              descriptionTr: 'Test hatasi',
              impact: 0.9,
              indicators: ['holdingPeriod'],
            },
          ],
          overallRiskScore: 0.9,
          analyzedAt: new Date().toISOString(),
        },
      ];
      const report = service.generateFailureReport(failures);
      expect(report).toContain('HATA ANALIZI RAPORU');
      expect(report).toContain('THYAO');
    });

    it('should handle empty failures', () => {
      const report = service.generateFailureReport([]);
      expect(report).toContain('Henuz');
    });
  });
});
