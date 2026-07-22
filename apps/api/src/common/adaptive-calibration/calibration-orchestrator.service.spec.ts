import { CalibrationOrchestrator } from './calibration-orchestrator.service';
import { ScoringDiagnosticsService } from './scoring-diagnostics.service';
import { PerformanceEvaluatorService } from './performance-evaluator.service';
import { TrendAnalyzerService } from './trend-analyzer.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { CalibrationReportGeneratorService } from './calibration-report-generator.service';
import { CalibrationInput, CalibrationStatus, ScoringSnapshot } from './types';

describe('CalibrationOrchestrator', () => {
  let orchestrator: CalibrationOrchestrator;

  beforeEach(() => {
    orchestrator = new CalibrationOrchestrator(
      new ScoringDiagnosticsService(),
      new PerformanceEvaluatorService(),
      new TrendAnalyzerService(),
      new RecommendationEngineService(),
      new CalibrationReportGeneratorService()
    );
  });

  describe('calibrate', () => {
    it('should calibrate with empty snapshots', async () => {
      const input: CalibrationInput = {
        snapshots: [],
      };

      const result = await orchestrator.calibrate(input);

      expect(result.overallStatus).toBeDefined();
      expect(result.componentDiagnostics).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it('should calibrate with valid snapshots', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + (i % 2 === 0 ? 15 : -10),
        componentScores: {
          technical: 60 + (i % 3 === 0 ? 10 : -5),
          momentum: 55 + (i % 2 === 0 ? 15 : -10),
          trend: 65 + (i % 4 === 0 ? 8 : -4),
        },
        componentWeights: {
          technical: 0.10,
          momentum: 0.10,
          trend: 0.12,
        },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const input: CalibrationInput = {
        snapshots,
      };

      const result = await orchestrator.calibrate(input);

      expect(result.overallStatus).toBeDefined();
      expect(Object.values(CalibrationStatus)).toContain(result.overallStatus);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.componentDiagnostics.length).toBe(3);
      expect(result.performanceEvaluation).toBeDefined();
      expect(result.componentTrends.length).toBe(3);
      expect(result.generatedAt).toBeDefined();
      expect(result.calibrationDuration).toBeGreaterThanOrEqual(0);
    });

    it('should include validation results', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const validationResults = [
        {
          strategyId: 's1',
          overallScore: 70,
          performanceMetrics: {
            winRate: 65,
            profitFactor: 2.0,
            sharpeRatio: 1.5,
            maxDrawdown: 15,
          },
          signalQuality: {
            precision: 0.72,
            recall: 0.68,
            f1Score: 0.70,
          },
          eliteScoreValidation: {
            accuracy: 0.68,
            confidenceCalibration: 0.75,
            calibrationError: 0.15,
            brierScore: 0.18,
            componentContribution: { technical: 0.6 },
          },
        },
      ];

      const input: CalibrationInput = {
        snapshots,
        validationResults,
      };

      const result = await orchestrator.calibrate(input);

      expect(result.performanceEvaluation.profitFactor).toBe(2.0);
      expect(result.performanceEvaluation.sharpeRatio).toBe(1.5);
    });

    it('should generate recommendations', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 25 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + (i % 2 === 0 ? 10 : -10),
        componentScores: {
          technical: 40,
          momentum: 60 + (i % 2 === 0 ? 10 : -10),
        },
        componentWeights: {
          technical: 0.20,
          momentum: 0.05,
        },
        confidence: 0.6,
        actualOutcome: i % 2 === 0 ? 3 : -3,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const input: CalibrationInput = {
        snapshots,
      };

      const result = await orchestrator.calibrate(input);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should compare with previous period', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 60 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: 50 + (i % 2 === 0 ? 10 : -10),
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 4 : -4,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const input: CalibrationInput = {
        snapshots,
      };

      const result = await orchestrator.calibrate(input);

      expect(result.historicalComparison).toBeDefined();
      expect(result.historicalComparison.currentPeriod).toBeDefined();
      expect(result.historicalComparison.previousPeriod).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate report from summary', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const summary = await orchestrator.calibrate({ snapshots });
      const report = await orchestrator.generateReport(summary);

      expect(report.summary).toBe(summary);
      expect(report.detailedAnalysis).toBeDefined();
      expect(report.detailedAnalysis.componentRankings).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.disclaimer).toBeDefined();
    });
  });

  describe('generateTurkishSummary', () => {
    it('should generate Turkish summary', async () => {
      const snapshots: ScoringSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}`,
        stockSymbol: 'THYAO',
        overallScore: i % 2 === 0 ? 70 : 30,
        componentScores: { technical: 60 },
        componentWeights: { technical: 0.10 },
        confidence: 0.7,
        actualOutcome: i % 2 === 0 ? 5 : -5,
        profile: 'balanced',
        timeframe: 'D1',
      }));

      const summary = await orchestrator.calibrate({ snapshots });
      const turkishSummary = await orchestrator.generateTurkishSummary(summary);

      expect(turkishSummary).toContain('Kalibrasyon Özeti');
      expect(turkishSummary).toContain('Genel Durum');
      expect(turkishSummary).toContain('Genel Skor');
      expect(turkishSummary).toContain('Bileşen Durumları');
    });
  });
});
