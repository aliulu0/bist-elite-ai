import { SelfLearningService } from '../self-learning/self-learning.service';
import { SelfLearningEngine } from '../self-learning/self-learning.engine';
import { SelfLearningRegistry } from '../self-learning/self-learning.registry';
import { PredictionRegistry } from '../../prediction/prediction-registry';
import { PredictionResult } from '../../prediction/prediction.types';

function makePred(
  ticker: string,
  bullish: number,
  winRate: number,
  totalTrades: number,
  isValid = true,
): PredictionResult {
  return {
    ticker,
    timeframe: '1d',
    dataTimeframe: '1d',
    bullishProbability: bullish,
    bearishProbability: 100 - bullish,
    neutralProbability: 0,
    confidence: 80,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'bullish',
    expectedReturn: 5,
    expectedVolatility: 2,
    risk: 'low',
    riskScore: 20,
    liquidityQuality: 'high',
    expectedHoldingPeriod: { value: 4, unit: 'days' },
    entryZone: null,
    stopZone: null,
    target1: null,
    target2: null,
    riskRewardRatio: null,
    scenarios: [],
    signals: [],
    backtestAccuracy: { winRate, totalTrades, sharpeRatio: 1, isValid },
    verification: null,
    catalystScore: null,
    smartMoneyScore: 0,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid,
  } as PredictionResult;
}

describe('SelfLearningService', () => {
  let service: SelfLearningService;
  let predictionRegistry: { getAll: jest.Mock };
  let engine: SelfLearningEngine;
  let registry: SelfLearningRegistry;

  beforeEach(() => {
    predictionRegistry = { getAll: jest.fn() };
    engine = new SelfLearningEngine();
    registry = new SelfLearningRegistry();
    service = new SelfLearningService(
      predictionRegistry as unknown as PredictionRegistry,
      engine,
      registry,
    );
  });

  it('calibrates modifiers for valid predictions with enough trades', async () => {
    predictionRegistry.getAll.mockReturnValue([
      makePred('AAA', 80, 0.7, 10),
      makePred('BBB', 70, 0.85, 8),
    ]);

    const report = await service.runLearningCycle();

    expect(report.scanned).toBe(2);
    expect(report.updated).toBe(2);
    expect(report.modifiers).toHaveLength(2);
    expect(report.modifiers[0].ticker).toBe('AAA');
    expect(report.modifiers[0].predictedBullish).toBe(80);
    expect(report.modifiers[0].realizedWinRate).toBe(0.7);
    expect(registry.getModifier('AAA')).toBe(report.modifiers[0].modifier);
    expect(report.generatedAt).toBeTruthy();
  });

  it('skips invalid predictions', async () => {
    predictionRegistry.getAll.mockReturnValue([
      makePred('BAD', 80, 0.7, 10, false),
    ]);
    const report = await service.runLearningCycle();
    expect(report.updated).toBe(0);
    expect(report.modifiers).toHaveLength(0);
  });

  it('skips predictions whose backtest is invalid', async () => {
    predictionRegistry.getAll.mockReturnValue([
      makePred('INV', 80, 0.7, 10, true),
    ]);
    predictionRegistry.getAll.mockReturnValueOnce([
      { ...makePred('INV', 80, 0.7, 10, true), backtestAccuracy: { winRate: 0, totalTrades: 10, sharpeRatio: 0, isValid: false } },
    ]);
    const report = await service.runLearningCycle();
    expect(report.updated).toBe(0);
  });

  it('skips predictions with fewer than minTrades', async () => {
    predictionRegistry.getAll.mockReturnValue([
      makePred('LOW', 80, 0.7, 2),
    ]);
    const report = await service.runLearningCycle({ minTrades: 5 });
    expect(report.updated).toBe(0);
  });

  it('reports zero updated when registry is empty', async () => {
    predictionRegistry.getAll.mockReturnValue([]);
    const report = await service.runLearningCycle();
    expect(report.scanned).toBe(0);
    expect(report.updated).toBe(0);
  });

  it('returns default modifier 1 for unknown ticker', () => {
    expect(service.getModifier('UNKNOWN')).toBe(1);
  });

  it('stores entries retrievable via getAllModifiers', async () => {
    predictionRegistry.getAll.mockReturnValue([makePred('AAA', 90, 0.6, 5)]);
    await service.runLearningCycle();
    const all = service.getAllModifiers();
    expect(all).toHaveLength(1);
    expect(all[0].ticker).toBe('AAA');
    expect(all[0].modifier).toBeLessThan(1);
  });

  it('clear empties the registry', async () => {
    predictionRegistry.getAll.mockReturnValue([makePred('AAA', 80, 0.7, 10)]);
    await service.runLearningCycle();
    expect(registry.count()).toBe(1);
    service.clear();
    expect(registry.count()).toBe(0);
    expect(service.getModifier('AAA')).toBe(1);
  });

  it('modifier is clamped within 0.85-1.15', async () => {
    predictionRegistry.getAll.mockReturnValue([
      makePred('HIGH', 10, 1.0, 10),
      makePred('LOW', 100, 0.0, 10),
    ]);
    const report = await service.runLearningCycle();
    for (const m of report.modifiers) {
      expect(m.modifier).toBeGreaterThanOrEqual(0.85);
      expect(m.modifier).toBeLessThanOrEqual(1.15);
    }
  });
});
