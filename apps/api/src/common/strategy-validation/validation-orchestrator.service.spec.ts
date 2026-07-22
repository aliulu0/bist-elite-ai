import { ValidationOrchestrator } from './validation-orchestrator.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { SignalQualityService } from './signal-quality.service';
import { MarketConditionAnalyzer } from './market-condition.service';
import { MultiTimeframeValidator } from './multi-timeframe-validator.service';
import { EliteScoreValidator } from './elite-score-validator.service';
import { ReportGenerator } from './report-generator.service';
import {
  StrategyValidationInput, ValidationType, ValidationStatus,
  SignalAction, Timeframe, MarketCondition, TradeRecord
} from './types';

describe('ValidationOrchestrator', () => {
  let orchestrator: ValidationOrchestrator;

  beforeEach(() => {
    orchestrator = new ValidationOrchestrator(
      new PerformanceMetricsService(),
      new SignalQualityService(),
      new MarketConditionAnalyzer(),
      new MultiTimeframeValidator(),
      new EliteScoreValidator(),
      new ReportGenerator()
    );
  });

  describe('validate', () => {
    it('should validate a strategy', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-1',
        strategyName: 'Test Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: [
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
          {
            entryDate: '2025-01-10',
            exitDate: '2025-01-15',
            entryPrice: 100,
            exitPrice: 105,
            action: SignalAction.BUY,
            quantity: 10,
            pnl: 50,
            pnlPercent: 5,
            holdingPeriodDays: 5,
            timeframe: Timeframe.D1,
            indicators: { RSI: 60 },
            marketCondition: MarketCondition.BULL_MARKET,
          },
          {
            entryDate: '2025-01-20',
            exitDate: '2025-01-25',
            entryPrice: 100,
            exitPrice: 95,
            action: SignalAction.BUY,
            quantity: 10,
            pnl: -50,
            pnlPercent: -5,
            holdingPeriodDays: 5,
            timeframe: Timeframe.D1,
            indicators: { RSI: 40 },
            marketCondition: MarketCondition.BEAR_MARKET,
          },
        ],
        signals: [
          {
            date: '2025-01-01',
            action: SignalAction.BUY,
            confidence: 0.8,
            price: 100,
            indicators: { RSI: 65 },
            timeframe: Timeframe.D1,
          },
          {
            date: '2025-01-10',
            action: SignalAction.BUY,
            confidence: 0.7,
            price: 100,
            indicators: { RSI: 60 },
            timeframe: Timeframe.D1,
          },
          {
            date: '2025-01-20',
            action: SignalAction.BUY,
            confidence: 0.6,
            price: 100,
            indicators: { RSI: 40 },
            timeframe: Timeframe.D1,
          },
        ],
        marketData: [],
      };

      const result = await orchestrator.validate(input);

      expect(result.strategyId).toBe('test-1');
      expect(result.strategyName).toBe('Test Strategy');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.status).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.signalQuality).toBeDefined();
      expect(result.marketConditionPerformance).toBeDefined();
      expect(result.timeframeValidation).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
      expect(result.improvementSuggestions).toBeDefined();
      expect(result.validatedAt).toBeDefined();
      expect(result.validationDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty trades', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-2',
        strategyName: 'Empty Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: [],
        signals: [],
        marketData: [],
      };

      const result = await orchestrator.validate(input);

      expect(result.strategyId).toBe('test-2');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.status).toBeDefined();
    });

    it('should identify strengths correctly', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-3',
        strategyName: 'Strong Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: Array.from({ length: 20 }, (_, i) => ({
          entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
          exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
          entryPrice: 100,
          exitPrice: i % 3 === 0 ? 95 : 110,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: i % 3 === 0 ? -50 : 100,
          pnlPercent: i % 3 === 0 ? -5 : 10,
          holdingPeriodDays: 1,
          timeframe: Timeframe.D1,
          indicators: { RSI: i % 3 === 0 ? 40 : 65 },
          marketCondition: MarketCondition.BULL_MARKET,
        })),
        signals: Array.from({ length: 20 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          action: SignalAction.BUY,
          confidence: 0.8,
          price: 100,
          indicators: { RSI: i % 3 === 0 ? 40 : 65 },
          timeframe: Timeframe.D1,
        })),
        marketData: [],
      };

      const result = await orchestrator.validate(input);

      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it('should identify weaknesses correctly', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-4',
        strategyName: 'Weak Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: Array.from({ length: 15 }, (_, i) => ({
          entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
          exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
          entryPrice: 100,
          exitPrice: i % 2 === 0 ? 90 : 105,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: i % 2 === 0 ? -100 : 50,
          pnlPercent: i % 2 === 0 ? -10 : 5,
          holdingPeriodDays: 1,
          timeframe: Timeframe.D1,
          indicators: { RSI: i % 2 === 0 ? 30 : 55 },
          marketCondition: MarketCondition.BEAR_MARKET,
        })),
        signals: Array.from({ length: 15 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          action: SignalAction.BUY,
          confidence: 0.5,
          price: 100,
          indicators: { RSI: i % 2 === 0 ? 30 : 55 },
          timeframe: Timeframe.D1,
        })),
        marketData: [],
      };

      const result = await orchestrator.validate(input);

      expect(result.weaknesses.length).toBeGreaterThan(0);
    });

    it('should assess risk correctly', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-5',
        strategyName: 'Risky Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: Array.from({ length: 10 }, (_, i) => ({
          entryDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
          exitDate: `2025-01-${String(i + 2).padStart(2, '0')}`,
          entryPrice: 100,
          exitPrice: i % 2 === 0 ? 85 : 115,
          action: SignalAction.BUY,
          quantity: 10,
          pnl: i % 2 === 0 ? -150 : 150,
          pnlPercent: i % 2 === 0 ? -15 : 15,
          holdingPeriodDays: 1,
          timeframe: Timeframe.D1,
          indicators: { RSI: i % 2 === 0 ? 25 : 75 },
          marketCondition: MarketCondition.HIGH_VOLATILITY,
        })),
        signals: Array.from({ length: 10 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          action: SignalAction.BUY,
          confidence: 0.6,
          price: 100,
          indicators: { RSI: i % 2 === 0 ? 25 : 75 },
          timeframe: Timeframe.D1,
        })),
        marketData: [],
      };

      const result = await orchestrator.validate(input);

      expect(result.riskAssessment.overallRisk).toBeGreaterThanOrEqual(0);
      expect(result.riskAssessment.overallRisk).toBeLessThanOrEqual(100);
      expect(result.riskAssessment.riskFactors).toBeDefined();
    });
  });

  describe('compare', () => {
    it('should compare multiple strategies', async () => {
      const inputs: StrategyValidationInput[] = [
        {
          strategyId: 's1',
          strategyName: 'Strategy 1',
          validationType: ValidationType.MULTI_STRATEGY_COMPARISON,
          timeframes: [Timeframe.D1],
          trades: [
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
              indicators: {},
              marketCondition: MarketCondition.BULL_MARKET,
            },
          ],
          signals: [
            {
              date: '2025-01-01',
              action: SignalAction.BUY,
              confidence: 0.8,
              price: 100,
              indicators: {},
              timeframe: Timeframe.D1,
            },
          ],
          marketData: [],
        },
        {
          strategyId: 's2',
          strategyName: 'Strategy 2',
          validationType: ValidationType.MULTI_STRATEGY_COMPARISON,
          timeframes: [Timeframe.D1],
          trades: [
            {
              entryDate: '2025-01-01',
              exitDate: '2025-01-05',
              entryPrice: 100,
              exitPrice: 120,
              action: SignalAction.BUY,
              quantity: 10,
              pnl: 200,
              pnlPercent: 20,
              holdingPeriodDays: 4,
              timeframe: Timeframe.D1,
              indicators: {},
              marketCondition: MarketCondition.BULL_MARKET,
            },
          ],
          signals: [
            {
              date: '2025-01-01',
              action: SignalAction.BUY,
              confidence: 0.9,
              price: 100,
              indicators: {},
              timeframe: Timeframe.D1,
            },
          ],
          marketData: [],
        },
      ];

      const result = await orchestrator.compare(inputs);

      expect(result.strategies.length).toBe(2);
      expect(result.winner).toBeDefined();
      expect(result.comparisonMetrics).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate full report', async () => {
      const input: StrategyValidationInput = {
        strategyId: 'test-report',
        strategyName: 'Report Strategy',
        validationType: ValidationType.SINGLE_STRATEGY,
        timeframes: [Timeframe.D1],
        trades: [
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
        ],
        signals: [
          {
            date: '2025-01-01',
            action: SignalAction.BUY,
            confidence: 0.8,
            price: 100,
            indicators: { RSI: 65 },
            timeframe: Timeframe.D1,
          },
        ],
        marketData: [],
      };

      const result = await orchestrator.generateReport(input);

      expect(result.summary).toBeDefined();
      expect(result.detailedAnalysis).toBeDefined();
      expect(result.detailedAnalysis.tradeAnalysis.length).toBe(1);
      expect(result.detailedAnalysis.monthlyReturns.length).toBeGreaterThan(0);
      expect(result.generatedAt).toBeDefined();
      expect(result.disclaimer).toBeDefined();
    });
  });
});
