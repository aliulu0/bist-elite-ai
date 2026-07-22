import { RecommendationTrackerService, RecommendationNotFoundError } from './recommendation-tracker.service';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { EliteScoreAnalyzerService } from './elite-score-analyzer.service';
import { AIAnalysisReviewerService } from './ai-analysis-reviewer.service';
import { StrategyAnalyzerService } from './strategy-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { RecommendationReportGeneratorService } from './recommendation-report-generator.service';
import {
  TrackRecommendationInput,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
  PriceData,
} from './types';

describe('RecommendationTrackerService', () => {
  let service: RecommendationTrackerService;

  beforeEach(() => {
    service = new RecommendationTrackerService(
      new PerformanceEvaluationService(),
      new EliteScoreAnalyzerService(),
      new AIAnalysisReviewerService(),
      new StrategyAnalyzerService(),
      new FailureAnalyzerService(),
      new RecommendationReportGeneratorService(),
    );
  });

  function createInput(overrides: Partial<TrackRecommendationInput> = {}): TrackRecommendationInput {
    return {
      stockSymbol: 'THYAO',
      stockName: 'Turk Hava Yollari',
      entryPrice: 100,
      entryEliteScore: 75,
      entryConfidence: 0.8,
      entryConsensusScore: 70,
      strategyUsed: 'elite-score',
      marketRegime: MarketRegime.BULL,
      timeframeConsensus: 'balanced',
      sector: 'Turizm',
      ...overrides,
    };
  }

  function createPriceHistory(prices: number[]): PriceData[] {
    return prices.map((price, i) => ({
      date: new Date(2026, 0, i + 1).toISOString(),
      open: price - 1,
      high: price + 2,
      low: price - 2,
      close: price,
      volume: 1000000,
    }));
  }

  describe('trackRecommendation', () => {
    it('should create a new recommendation record', () => {
      const input = createInput();
      const record = service.trackRecommendation(input);
      expect(record.id).toBeDefined();
      expect(record.stockSymbol).toBe('THYAO');
      expect(record.status).toBe(RecommendationStatus.CREATED);
      expect(record.outcome).toBe(RecommendationOutcome.PENDING);
      expect(record.entryPrice).toBe(100);
      expect(record.entryEliteScore).toBe(75);
    });

    it('should assign unique IDs', () => {
      const r1 = service.trackRecommendation(createInput());
      const r2 = service.trackRecommendation(createInput({ stockSymbol: 'GARAN' }));
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('updateRecommendation', () => {
    it('should update recommendation', () => {
      const rec = service.trackRecommendation(createInput());
      const updated = service.updateRecommendation(rec.id, {
        status: RecommendationStatus.HOLDING,
      });
      expect(updated.status).toBe(RecommendationStatus.HOLDING);
      expect(updated.id).toBe(rec.id);
    });

    it('should throw for non-existent recommendation', () => {
      expect(() => service.updateRecommendation('nonexistent', {})).toThrow(RecommendationNotFoundError);
    });
  });

  describe('closeRecommendation', () => {
    it('should close with winner outcome', () => {
      const rec = service.trackRecommendation(createInput());
      const closed = service.closeRecommendation(rec.id, 115, 'target-reached');
      expect(closed.status).toBe(RecommendationStatus.FINAL_OUTCOME);
      expect(closed.outcome).toBe(RecommendationOutcome.WINNER);
      expect(closed.exitPrice).toBe(115);
      expect(closed.actualReturn).toBeCloseTo(15);
    });

    it('should close with loser outcome', () => {
      const rec = service.trackRecommendation(createInput());
      const closed = service.closeRecommendation(rec.id, 85, 'stop-loss');
      expect(closed.outcome).toBe(RecommendationOutcome.LOSER);
      expect(closed.actualReturn).toBeCloseTo(-15);
    });

    it('should close with breakeven outcome', () => {
      const rec = service.trackRecommendation(createInput());
      const closed = service.closeRecommendation(rec.id, 100.3, 'manual');
      expect(closed.outcome).toBe(RecommendationOutcome.BREAKEVEN);
    });

    it('should throw for non-existent recommendation', () => {
      expect(() => service.closeRecommendation('nonexistent', 100, 'test')).toThrow(RecommendationNotFoundError);
    });
  });

  describe('getRecommendation', () => {
    it('should return recommendation by ID', () => {
      const rec = service.trackRecommendation(createInput());
      const found = service.getRecommendation(rec.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(rec.id);
    });

    it('should return undefined for non-existent', () => {
      expect(service.getRecommendation('nonexistent')).toBeUndefined();
    });
  });

  describe('getRecommendations', () => {
    it('should query with filters', () => {
      service.trackRecommendation(createInput({ stockSymbol: 'THYAO', sector: 'Turizm' }));
      service.trackRecommendation(createInput({ stockSymbol: 'GARAN', sector: 'Bankacilik' }));

      const result = service.getRecommendations({ stockSymbol: 'THYAO' });
      expect(result.recommendations).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should support pagination', () => {
      for (let i = 0; i < 5; i++) {
        service.trackRecommendation(createInput({ stockSymbol: `SYM${i}` }));
      }
      const page1 = service.getRecommendations({ limit: 2, offset: 0 });
      expect(page1.recommendations).toHaveLength(2);
      expect(page1.hasMore).toBe(true);

      const page2 = service.getRecommendations({ limit: 2, offset: 2 });
      expect(page2.recommendations).toHaveLength(2);
    });
  });

  describe('getActiveRecommendations', () => {
    it('should return only active recommendations', () => {
      const rec = service.trackRecommendation(createInput());
      service.trackRecommendation(createInput({ stockSymbol: 'GARAN' }));
      service.closeRecommendation(rec.id, 115, 'target');

      const active = service.getActiveRecommendations();
      expect(active).toHaveLength(1);
    });
  });

  describe('getCompletedRecommendations', () => {
    it('should return only completed recommendations', () => {
      const rec = service.trackRecommendation(createInput());
      service.closeRecommendation(rec.id, 115, 'target');

      const completed = service.getCompletedRecommendations();
      expect(completed).toHaveLength(1);
    });
  });

  describe('getSuccessAnalytics', () => {
    it('should calculate success analytics', () => {
      service.trackRecommendation(createInput());
      const rec2 = service.trackRecommendation(createInput({ stockSymbol: 'GARAN' }));
      service.closeRecommendation(rec2.id, 115, 'target');

      const analytics = service.getSuccessAnalytics();
      expect(analytics.totalRecommendations).toBeGreaterThanOrEqual(1);
      expect(analytics.winRate).toBeDefined();
    });

    it('should return zeros for empty data', () => {
      const analytics = service.getSuccessAnalytics();
      expect(analytics.totalRecommendations).toBe(0);
    });
  });

  describe('getPerformanceDashboard', () => {
    it('should generate performance dashboard', () => {
      const rec = service.trackRecommendation(createInput());
      service.closeRecommendation(rec.id, 115, 'target');

      const dashboard = service.getPerformanceDashboard();
      expect(dashboard.summary).toBeDefined();
      expect(dashboard.generatedAt).toBeDefined();
      expect(dashboard.disclaimer).toBeDefined();
    });
  });

  describe('price history', () => {
    it('should update and retrieve price history', () => {
      const prices = createPriceHistory([100, 102, 105]);
      service.updatePriceHistory('THYAO', prices);
      expect(service.getPriceHistory('THYAO')).toHaveLength(3);
    });

    it('should return empty array for unknown symbol', () => {
      expect(service.getPriceHistory('UNKNOWN')).toEqual([]);
    });
  });

  describe('evaluateRecommendationPerformance', () => {
    it('should evaluate performance for existing recommendation', () => {
      const rec = service.trackRecommendation(createInput());
      const prices = createPriceHistory([100, 102, 105, 108]);
      const perf = service.evaluateRecommendationPerformance(rec.id, prices);
      expect(perf).toBeDefined();
      expect(perf!.recommendationId).toBe(rec.id);
    });

    it('should return undefined for non-existent recommendation', () => {
      expect(service.evaluateRecommendationPerformance('nonexistent', [])).toBeUndefined();
    });
  });

  describe('reports', () => {
    it('should generate summary report', () => {
      const report = service.generateSummaryReport();
      expect(report).toContain('ONERI PERFORMANS OZET RAPORU');
    });

    it('should generate performance dashboard report', () => {
      const report = service.generatePerformanceDashboardReport();
      expect(report).toContain('PERFORMANS PANELI');
    });

    it('should generate accuracy report', () => {
      const report = service.generateAccuracyReport();
      expect(report).toContain('SKOR DOGRULUK RAPORU');
    });

    it('should generate sector report', () => {
      const report = service.generateSectorReport();
      expect(report).toContain('SEKTOR PERFORMANS RAPORU');
    });

    it('should generate strategy report', () => {
      const report = service.generateStrategyReport();
      expect(report).toContain('STRATEJI PERFORMANS RAPORU');
    });

    it('should generate monthly report', () => {
      const report = service.generateMonthlyReport(2026, 7);
      expect(report).toContain('AYLIK ONERI RAPORU');
    });

    it('should generate failure report', () => {
      const report = service.generateFailureReport();
      expect(report).toContain('HATA ANALIZI RAPORU');
    });
  });

  describe('getConfig', () => {
    it('should return config', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.evaluationWindows).toHaveLength(7);
    });
  });
});
