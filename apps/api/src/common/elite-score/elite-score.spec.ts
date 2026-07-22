import { EliteScoreOrchestrator } from './elite-score.service';
import {
  EliteScoreInput,
  ScoringProfile,
  Timeframe,
  TrendDirection,
  IndicatorData,
  TechnicalScoreInput,
  TimeframeScoreData,
} from './types';

describe('EliteScoreOrchestrator', () => {
  let orchestrator: EliteScoreOrchestrator;

  beforeEach(() => {
    orchestrator = new EliteScoreOrchestrator();
  });

  describe('calculate', () => {
    it('should calculate elite score with minimal input', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'THYAO',
        stockName: 'Türk Hava Yolları',
        currentPrice: 280.50,
      });

      expect(result.stockSymbol).toBe('THYAO');
      expect(result.stockName).toBe('Türk Hava Yolları');
      expect(result.overallEliteScore).toBeGreaterThanOrEqual(0);
      expect(result.overallEliteScore).toBeLessThanOrEqual(100);
      expect(result.profile).toBe(ScoringProfile.BALANCED);
      expect(result.generatedAt).toBeDefined();
      expect(result.evidenceMatrix.length).toBeGreaterThan(0);
      expect(result.componentScores).toBeDefined();
    });

    it('should use specified profile', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'GARAN',
        stockName: 'Garanti Bankası',
        currentPrice: 120.00,
        profile: ScoringProfile.AGGRESSIVE,
      });
      expect(result.profile).toBe(ScoringProfile.AGGRESSIVE);
    });

    it('should calculate with technical scores', async () => {
      const technicalScores: TechnicalScoreInput[] = [
        {
          timeframe: Timeframe.D1,
          trend: 75,
          momentum: 65,
          volume: 60,
          volatility: 45,
        },
        {
          timeframe: Timeframe.W1,
          trend: 80,
          momentum: 70,
          volume: 55,
          volatility: 50,
        },
      ];

      const result = await orchestrator.calculate({
        stockSymbol: 'ASELS',
        stockName: 'Aselsan',
        currentPrice: 65.80,
        technicalScores,
      });

      expect(result.componentScores.technical).toBeGreaterThan(50);
      expect(result.componentScores.trend).toBeGreaterThan(50);
    });

    it('should calculate with indicators', async () => {
      const indicators: IndicatorData[] = [
        { name: 'RSI', value: 65, signal: 'bullish', weight: 1.5, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'MACD', value: 5.2, signal: 'bullish', weight: 1.2, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'EMA', value: 70, signal: 'bullish', weight: 1.0, isPositive: true, timeframe: Timeframe.D1 },
        { name: 'ADX', value: 28, signal: 'trending', weight: 0.8, isPositive: true, timeframe: Timeframe.D1 },
      ];

      const result = await orchestrator.calculate({
        stockSymbol: 'KCHOL',
        stockName: 'Koç Holding',
        currentPrice: 185.30,
        indicators,
      });

      expect(result.componentScores.technical).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    });

    it('should calculate with historical reliability', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'BIMAS',
        stockName: 'BİM Mağazalar',
        currentPrice: 520.00,
        historicalReliability: {
          winRate: 72,
          maxDrawdown: 8,
          avgReturn: 18,
          sharpeRatio: 2.1,
          profitFactor: 2.8,
        },
      });

      expect(result.componentScores.historicalReliability).toBeGreaterThan(60);
    });

    it('should calculate with early opportunity data', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'TUPRS',
        stockName: 'Tüpraş',
        currentPrice: 190.00,
        earlyOpportunity: {
          signalFreshness: 0.9,
          confirmationLevel: 0.8,
          timeSinceDetection: 6,
          competitorConfirmation: 0.1,
        },
      });

      expect(result.componentScores.earlyOpportunity).toBeGreaterThan(60);
    });

    it('should apply risk adjustment for high volatility', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'VAKBN',
        stockName: 'Vakıfbank',
        currentPrice: 18.50,
        riskAdjustment: {
          volatility: 85,
          liquidity: 50,
          timeframeConflictCount: 0,
          indicatorDisagreement: 0.1,
          historicalReliability: 60,
        },
      });

      expect(result.riskAdjustment.penalties.length).toBeGreaterThan(0);
      expect(result.riskAdjustment.adjustmentFactor).toBeLessThan(1);
    });

    it('should calculate evidence matrix', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'SISE',
        stockName: 'Şişecam',
        currentPrice: 48.20,
      });

      expect(result.evidenceMatrix.length).toBeGreaterThan(0);
      expect(result.evidenceMatrix[0].component).toBeDefined();
      expect(result.evidenceMatrix[0].weight).toBeGreaterThan(0);
      expect(result.evidenceMatrix[0].contribution).toBeDefined();
    });

    it('should include metadata', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'KRDMD',
        stockName: 'Kardemir',
        currentPrice: 15.80,
        metadata: { source: 'test' },
      });

      expect(result.metadata.source).toBe('test');
      expect(result.metadata.calculationTimeMs).toBeDefined();
      expect(result.metadata.componentCount).toBeGreaterThan(0);
    });

    it('should calculate confidence score', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'EREGL',
        stockName: 'Ereğli Demir Çelik',
        currentPrice: 52.40,
      });

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateBatch', () => {
    it('should calculate scores for multiple stocks', async () => {
      const inputs: EliteScoreInput[] = [
        { stockSymbol: 'THYAO', stockName: 'Türk Hava Yolları', currentPrice: 280.50 },
        { stockSymbol: 'GARAN', stockName: 'Garanti Bankası', currentPrice: 120.00 },
        { stockSymbol: 'ASELS', stockName: 'Aselsan', currentPrice: 65.80 },
      ];

      const results = await orchestrator.calculateBatch(inputs);

      expect(results).toHaveLength(3);
      expect(results[0].rank).toBe(1);

      for (const result of results) {
        expect(result.rank).toBeDefined();
        expect(result.overallEliteScore).toBeGreaterThanOrEqual(0);
      }
    });

    it('should rank by overall score descending', async () => {
      const inputs: EliteScoreInput[] = [
        {
          stockSymbol: 'LOW',
          stockName: 'Low Stock',
          currentPrice: 10,
          technicalScores: [{ timeframe: Timeframe.D1, trend: 30, momentum: 30 }],
        },
        {
          stockSymbol: 'HIGH',
          stockName: 'High Stock',
          currentPrice: 100,
          technicalScores: [{ timeframe: Timeframe.D1, trend: 85, momentum: 80 }],
        },
      ];

      const results = await orchestrator.calculateBatch(inputs);
      expect(results[0].stockSymbol).toBe('HIGH');
      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
    });

    it('should handle empty batch', async () => {
      const results = await orchestrator.calculateBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('risk adjustment', () => {
    it('should penalize high volatility', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'VOL',
        stockName: 'Volatile Stock',
        currentPrice: 50,
        riskAdjustment: { volatility: 90, liquidity: 50, timeframeConflictCount: 0, indicatorDisagreement: 0, historicalReliability: 50 },
      });
      expect(result.riskAdjustment.adjustmentFactor).toBeLessThan(1);
    });

    it('should penalize low liquidity', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'ILLIQ',
        stockName: 'Illiquid Stock',
        currentPrice: 50,
        riskAdjustment: { volatility: 50, liquidity: 10, timeframeConflictCount: 0, indicatorDisagreement: 0, historicalReliability: 50 },
      });
      expect(result.riskAdjustment.adjustmentFactor).toBeLessThan(1);
    });

    it('should penalize timeframe conflicts', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'CONFLICT',
        stockName: 'Conflicting Stock',
        currentPrice: 50,
        riskAdjustment: { volatility: 50, liquidity: 50, timeframeConflictCount: 3, indicatorDisagreement: 0, historicalReliability: 50 },
      });
      expect(result.riskAdjustment.penalties.length).toBeGreaterThan(0);
    });

    it('should not penalize when risk is low', async () => {
      const result = await orchestrator.calculate({
        stockSymbol: 'SAFE',
        stockName: 'Safe Stock',
        currentPrice: 50,
        riskAdjustment: { volatility: 30, liquidity: 70, timeframeConflictCount: 0, indicatorDisagreement: 0, historicalReliability: 80 },
      });
      expect(result.riskAdjustment.adjustmentFactor).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('conservative vs aggressive profile', () => {
    it('conservative should weight risk more heavily', async () => {
      const conservative = await orchestrator.calculate({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 50,
        profile: ScoringProfile.CONSERVATIVE,
        riskAdjustment: { volatility: 80, liquidity: 50, timeframeConflictCount: 0, indicatorDisagreement: 0, historicalReliability: 50 },
      });

      const aggressive = await orchestrator.calculate({
        stockSymbol: 'TEST',
        stockName: 'Test',
        currentPrice: 50,
        profile: ScoringProfile.AGGRESSIVE,
        riskAdjustment: { volatility: 80, liquidity: 50, timeframeConflictCount: 0, indicatorDisagreement: 0, historicalReliability: 50 },
      });

      expect(conservative.overallEliteScore).not.toBe(aggressive.overallEliteScore);
    });
  });
});
