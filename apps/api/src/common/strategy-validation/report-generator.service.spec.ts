import { ReportGenerator } from './report-generator.service';
import {
  ValidationSummary, TradeRecord, SignalAction, Timeframe,
  MarketCondition, ValidationType, ValidationStatus
} from './types';

describe('ReportGenerator', () => {
  let service: ReportGenerator;

  beforeEach(() => {
    service = new ReportGenerator();
  });

  describe('generateReport', () => {
    it('should generate report from summary and trades', () => {
      const summary: ValidationSummary = {
        strategyId: 'test-1',
        strategyName: 'Test Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        overallScore: 75,
        status: ValidationStatus.PASSED,
        confidence: 0.8,
        performanceMetrics: {
          totalReturn: 150,
          totalReturnPercent: 15,
          annualizedReturn: 20,
          winRate: 65,
          lossRate: 35,
          profitFactor: 2.1,
          sharpeRatio: 1.5,
          sortinoRatio: 1.8,
          maxDrawdown: 12,
          maxDrawdownDuration: 5,
          avgDrawdown: 5,
          recoveryFactor: 1.25,
          avgHoldingPeriod: 4.5,
          signalFrequency: 0.1,
          volatility: 18,
          beta: 0.9,
          alpha: 5,
          treynorRatio: 0.22,
          calmarRatio: 1.67,
          expectancy: 2.5,
          kellyCriterion: 35,
        },
        signalQuality: {
          precision: 0.72,
          recall: 0.68,
          f1Score: 0.70,
          falsePositiveRate: 0.28,
          falseNegativeRate: 0.32,
          signalStability: 0.85,
          signalConsistency: 0.75,
          truePositives: 15,
          falsePositives: 6,
          trueNegatives: 8,
          falseNegatives: 7,
          totalSignals: 36,
          correctSignals: 23,
        },
        marketConditionPerformance: [
          {
            condition: MarketCondition.BULL_MARKET,
            totalTrades: 10,
            winRate: 70,
            avgReturn: 5,
            profitFactor: 2.5,
            sharpeRatio: 1.5,
            maxDrawdown: 10,
            volatility: 15,
            confidence: 0.8,
          },
        ],
        timeframeValidation: [
          {
            timeframe: Timeframe.D1,
            agreementAccuracy: 0.72,
            conflictAccuracy: 0.65,
            consensusAccuracy: 0.70,
            earlySignalAccuracy: 0.68,
            signalCount: 20,
            avgConfidence: 0.75,
            dominantDirection: 'UPTREND' as any,
            status: ValidationStatus.PASSED,
          },
        ],
        eliteScoreValidation: null,
        strengths: ['Yüksek kazanma oranı', 'Güçlü kâr faktörü'],
        weaknesses: ['Yüksek drawdown'],
        riskAssessment: {
          overallRisk: 35,
          riskFactors: [
            {
              type: 'DRAWDOWN_RISK',
              severity: 'MEDIUM',
              score: 35,
              description: 'Maksimum drawdown %12',
            },
          ],
        },
        improvementSuggestions: ['Drawdown\'u azaltın'],
        validatedAt: new Date().toISOString(),
        validationDuration: 150,
        disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır.',
      };

      const trades: TradeRecord[] = [
        {
          entryDate: '2025-01-01',
          exitDate: '2025-01-05',
          entryPrice: 100,
          exitPrice: 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: 100,
          pnlPercent: 10,
          holdingPeriodDays: 4,
          timeframe: Timeframe.D1,
          indicators: { RSI: 65 },
          marketCondition: MarketCondition.BULL_MARKET,
        },
      ];

      const result = service.generateReport(summary, trades);

      expect(result.summary).toBe(summary);
      expect(result.detailedAnalysis.tradeAnalysis.length).toBe(1);
      expect(result.detailedAnalysis.monthlyReturns.length).toBeGreaterThan(0);
      expect(result.generatedAt).toBeDefined();
      expect(result.disclaimer).toBeDefined();
    });
  });

  describe('generateComparisonSummary', () => {
    it('should generate comparison summary', () => {
      const strategies = [
        {
          strategyId: 's1',
          strategyName: 'Strategy 1',
          overallScore: 75,
          performanceMetrics: { winRate: 65 },
          signalQuality: { precision: 0.72 },
        },
        {
          strategyId: 's2',
          strategyName: 'Strategy 2',
          overallScore: 80,
          performanceMetrics: { winRate: 70 },
          signalQuality: { precision: 0.78 },
        },
        {
          strategyId: 's3',
          strategyName: 'Strategy 3',
          overallScore: 60,
          performanceMetrics: { winRate: 55 },
          signalQuality: { precision: 0.60 },
        },
      ];

      const result = service.generateComparisonSummary(strategies);

      expect(result.strategies.length).toBe(3);
      expect(result.winner.strategyId).toBe('s2');
      expect(result.winner.overallScore).toBe(80);
      expect(result.strategies[0].rank).toBe(1);
      expect(result.strategies[1].rank).toBe(2);
      expect(result.strategies[2].rank).toBe(3);
    });
  });

  describe('generateTurkishSummary', () => {
    it('should generate Turkish summary', () => {
      const summary: ValidationSummary = {
        strategyId: 'test-1',
        strategyName: 'Test Stratejisi',
        validationType: ValidationType.SINGLE_STRATEGY,
        overallScore: 75,
        status: ValidationStatus.PASSED,
        confidence: 0.8,
        performanceMetrics: {
          totalReturn: 150,
          totalReturnPercent: 15,
          annualizedReturn: 20,
          winRate: 65,
          lossRate: 35,
          profitFactor: 2.1,
          sharpeRatio: 1.5,
          sortinoRatio: 1.8,
          maxDrawdown: 12,
          maxDrawdownDuration: 5,
          avgDrawdown: 5,
          recoveryFactor: 1.25,
          avgHoldingPeriod: 4.5,
          signalFrequency: 0.1,
          volatility: 18,
          beta: 0.9,
          alpha: 5,
          treynorRatio: 0.22,
          calmarRatio: 1.67,
          expectancy: 2.5,
          kellyCriterion: 35,
        },
        signalQuality: {
          precision: 0.72,
          recall: 0.68,
          f1Score: 0.70,
          falsePositiveRate: 0.28,
          falseNegativeRate: 0.32,
          signalStability: 0.85,
          signalConsistency: 0.75,
          truePositives: 15,
          falsePositives: 6,
          trueNegatives: 8,
          falseNegatives: 7,
          totalSignals: 36,
          correctSignals: 23,
        },
        marketConditionPerformance: [],
        timeframeValidation: [],
        eliteScoreValidation: null,
        strengths: ['Yüksek kazanma oranı'],
        weaknesses: ['Yüksek drawdown'],
        riskAssessment: {
          overallRisk: 35,
          riskFactors: [],
        },
        improvementSuggestions: ['Drawdown\'u azaltın'],
        validatedAt: new Date().toISOString(),
        validationDuration: 150,
        disclaimer: 'Bu rapor yalnızca bilgilendirme amaçlıdır.',
      };

      const result = service.generateTurkishSummary(summary);

      expect(result).toContain('Test Stratejisi');
      expect(result).toContain('75.0/100');
      expect(result).toContain('Başarılı');
      expect(result).toContain('Kazanma Oranı');
      expect(result).toContain('Güçlü Yönler');
      expect(result).toContain('Zayıf Yönler');
      expect(result).toContain('İyileştirme Önerileri');
    });
  });
});
