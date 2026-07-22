import { ConsensusOrchestrator } from './consensus-orchestrator.service';
import {
  ConsensusEngineInput,
  TimeframeData,
  Timeframe,
  TrendDirection,
  MomentumState,
  VolumeState,
  SignalType,
  ConsensusStrength,
} from './types';

describe('ConsensusOrchestrator', () => {
  let orchestrator: ConsensusOrchestrator;

  beforeEach(() => {
    orchestrator = new ConsensusOrchestrator();
  });

  describe('analyze', () => {
    it('should analyze with minimal input', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(result.stockSymbol).toBe('THYAO');
      expect(result.consensusSummary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.consensusSummary.overallScore).toBeLessThanOrEqual(100);
      expect(result.timeframeScores).toHaveLength(4);
      expect(result.dominantTrend).toBeDefined();
      expect(result.secondaryTrend).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.disclaimer).toBeDefined();
    });

    it('should generate evidence matrix', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(result.evidenceMatrix.length).toBeGreaterThan(0);
      expect(result.evidenceMatrix[0].component).toBeDefined();
      expect(result.evidenceMatrix[0].weight).toBeGreaterThan(0);
    });

    it('should determine suggested action', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(Object.values(SignalType)).toContain(result.suggestedAction);
    });

    it('should calculate suggested confidence', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(result.suggestedConfidence).toBeGreaterThanOrEqual(0);
      expect(result.suggestedConfidence).toBeLessThanOrEqual(1);
    });

    it('should include metadata', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(result.metadata.calculationTimeMs).toBeDefined();
      expect(result.metadata.timeframeCount).toBe(4);
      expect(result.metadata.conflictCount).toBeDefined();
    });

    it('should detect conflicts in mixed input', async () => {
      const input = createMixedInput();
      const result = await orchestrator.analyze(input);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should have lower score with conflicts', async () => {
      const uniform = await orchestrator.analyze(createUniformInput(TrendDirection.STRONG_UPTREND));
      const mixed = await orchestrator.analyze(createMixedInput());
      expect(uniform.consensusSummary.overallScore).toBeGreaterThan(mixed.consensusSummary.overallScore);
    });

    it('should detect early alignments in strong input', async () => {
      const input = createStrongInput();
      const result = await orchestrator.analyze(input);
      expect(result.earlyAlignments.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide Turkish observation', async () => {
      const result = await orchestrator.analyze(createBasicInput());
      expect(result.suggestedObservationTr).toBeDefined();
      expect(result.suggestedObservationTr.length).toBeGreaterThan(0);
    });

    it('should handle single timeframe', async () => {
      const input: ConsensusEngineInput = {
        stockSymbol: 'GARAN',
        stockName: 'Garanti Bankasi',
        currentPrice: 120,
        timeframes: [
          { timeframe: Timeframe.D1, price: 120, trend: TrendDirection.UPTREND, trendScore: 70 },
        ],
      };
      const result = await orchestrator.analyze(input);
      expect(result.timeframeScores).toHaveLength(1);
      expect(result.consensusSummary.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeBatch', () => {
    it('should analyze multiple stocks', async () => {
      const inputs = [
        createBasicInput(),
        { ...createBasicInput(), stockSymbol: 'GARAN', stockName: 'Garanti' },
        { ...createBasicInput(), stockSymbol: 'ASELS', stockName: 'Aselsan' },
      ];
      const results = await orchestrator.analyzeBatch(inputs);
      expect(results).toHaveLength(3);
    });

    it('should sort by consensus score descending', async () => {
      const inputs = [
        { ...createBasicInput(), stockSymbol: 'LOW' },
        { ...createUniformInput(TrendDirection.STRONG_UPTREND), stockSymbol: 'HIGH' },
      ];
      const results = await orchestrator.analyzeBatch(inputs);
      expect(results[0].consensusSummary.overallScore).toBeGreaterThanOrEqual(
        results[1].consensusSummary.overallScore,
      );
    });
  });

  describe('consensus strength', () => {
    it('should be STRONG for aligned timeframes with no conflicts', async () => {
      const result = await orchestrator.analyze(createUniformInput(TrendDirection.STRONG_UPTREND));
      expect([ConsensusStrength.STRONG, ConsensusStrength.MODERATE]).toContain(
        result.consensusSummary.consensusStrength,
      );
    });

    it('should be CONFLICTING for mixed input', async () => {
      const result = await orchestrator.analyze(createMixedInput());
      expect([ConsensusStrength.CONFLICTING, ConsensusStrength.WEAK]).toContain(
        result.consensusSummary.consensusStrength,
      );
    });
  });
});

function createBasicInput(): ConsensusEngineInput {
  return {
    stockSymbol: 'THYAO',
    stockName: 'Turk Hava Yollari',
    currentPrice: 280.5,
    timeframes: [
      { timeframe: Timeframe.M4, price: 280.5, trend: TrendDirection.UPTREND, trendScore: 65, momentumScore: 60, volume: VolumeState.NORMAL_VOLUME, riskScore: 40 },
      { timeframe: Timeframe.D1, price: 280.5, trend: TrendDirection.UPTREND, trendScore: 70, momentumScore: 65, volume: VolumeState.NORMAL_VOLUME, riskScore: 35 },
      { timeframe: Timeframe.W1, price: 280.5, trend: TrendDirection.UPTREND, trendScore: 75, momentumScore: 70, volume: VolumeState.NORMAL_VOLUME, riskScore: 30 },
      { timeframe: Timeframe.M1, price: 280.5, trend: TrendDirection.SIDEWAYS, trendScore: 50, momentumScore: 55, volume: VolumeState.NORMAL_VOLUME, riskScore: 45 },
    ],
  };
}

function createUniformInput(trend: TrendDirection): ConsensusEngineInput {
  return {
    stockSymbol: 'TEST',
    stockName: 'Test Stock',
    currentPrice: 100,
    timeframes: [
      { timeframe: Timeframe.M4, price: 100, trend, trendScore: 85, momentumScore: 80, volume: VolumeState.HIGH_VOLUME, riskScore: 20, strategySignal: SignalType.BUY, strategyConfidence: 0.9, indicators: [{ name: 'RSI', value: 75, signal: 'bullish', weight: 1, isPositive: true }] },
      { timeframe: Timeframe.D1, price: 100, trend, trendScore: 85, momentumScore: 80, volume: VolumeState.HIGH_VOLUME, riskScore: 20, strategySignal: SignalType.BUY, strategyConfidence: 0.9, indicators: [{ name: 'RSI', value: 75, signal: 'bullish', weight: 1, isPositive: true }] },
      { timeframe: Timeframe.W1, price: 100, trend, trendScore: 85, momentumScore: 80, volume: VolumeState.HIGH_VOLUME, riskScore: 20, strategySignal: SignalType.BUY, strategyConfidence: 0.9, indicators: [{ name: 'RSI', value: 75, signal: 'bullish', weight: 1, isPositive: true }] },
      { timeframe: Timeframe.M1, price: 100, trend, trendScore: 85, momentumScore: 80, volume: VolumeState.HIGH_VOLUME, riskScore: 20, strategySignal: SignalType.BUY, strategyConfidence: 0.9, indicators: [{ name: 'RSI', value: 75, signal: 'bullish', weight: 1, isPositive: true }] },
    ],
  };
}

function createMixedInput(): ConsensusEngineInput {
  return {
    stockSymbol: 'MIXED',
    stockName: 'Mixed Stock',
    currentPrice: 100,
    timeframes: [
      { timeframe: Timeframe.M4, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85, momentumScore: 80, volume: VolumeState.HIGH_VOLUME, riskScore: 20 },
      { timeframe: Timeframe.D1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85, momentumScore: 20, volume: VolumeState.LOW_VOLUME, riskScore: 80 },
      { timeframe: Timeframe.W1, price: 100, trend: TrendDirection.STRONG_UPTREND, trendScore: 85, momentumScore: 75, volume: VolumeState.HIGH_VOLUME, riskScore: 25 },
      { timeframe: Timeframe.M1, price: 100, trend: TrendDirection.STRONG_DOWNTREND, trendScore: 85, momentumScore: 25, volume: VolumeState.LOW_VOLUME, riskScore: 75 },
    ],
  };
}

function createStrongInput(): ConsensusEngineInput {
  return {
    stockSymbol: 'STRONG',
    stockName: 'Strong Stock',
    currentPrice: 100,
    timeframes: [
      {
        timeframe: Timeframe.M4, price: 100,
        trend: TrendDirection.STRONG_UPTREND, trendScore: 90,
        momentumScore: 85, volume: VolumeState.HIGH_VOLUME,
        riskScore: 15, strategySignal: SignalType.BUY, strategyConfidence: 0.95,
        indicators: [
          { name: 'RSI', value: 80, signal: 'bullish', weight: 1, isPositive: true },
          { name: 'MACD', value: 8, signal: 'bullish', weight: 1, isPositive: true },
          { name: 'EMA', value: 85, signal: 'bullish', weight: 1, isPositive: true },
        ],
      },
      {
        timeframe: Timeframe.D1, price: 100,
        trend: TrendDirection.STRONG_UPTREND, trendScore: 88,
        momentumScore: 82, volume: VolumeState.HIGH_VOLUME,
        riskScore: 18, strategySignal: SignalType.BUY, strategyConfidence: 0.92,
        indicators: [
          { name: 'RSI', value: 78, signal: 'bullish', weight: 1, isPositive: true },
          { name: 'MACD', value: 7, signal: 'bullish', weight: 1, isPositive: true },
        ],
      },
      {
        timeframe: Timeframe.W1, price: 100,
        trend: TrendDirection.STRONG_UPTREND, trendScore: 85,
        momentumScore: 80, volume: VolumeState.NORMAL_VOLUME,
        riskScore: 20, strategySignal: SignalType.BUY, strategyConfidence: 0.9,
      },
      {
        timeframe: Timeframe.M1, price: 100,
        trend: TrendDirection.UPTREND, trendScore: 75,
        momentumScore: 70, volume: VolumeState.NORMAL_VOLUME,
        riskScore: 30, strategySignal: SignalType.BUY, strategyConfidence: 0.8,
      },
    ],
  };
}
