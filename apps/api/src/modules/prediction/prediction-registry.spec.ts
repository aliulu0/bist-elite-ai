import { PredictionRegistry } from './prediction-registry';
import { PredictionResult } from './prediction.types';

function makeResult(ticker: string, bullish: number, timeframe = '1d'): PredictionResult {
  return {
    ticker,
    timeframe: timeframe as PredictionResult['timeframe'],
    dataTimeframe: '1d',
    bullishProbability: bullish,
    bearishProbability: 100 - bullish,
    neutralProbability: 0,
    confidence: 80,
    trendStrength: 'strong',
    trendDirection: 'up',
    momentum: 'bullish',
    expectedReturn: 4,
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
    backtestAccuracy: { winRate: 60, totalTrades: 10, sharpeRatio: 1, isValid: true },
    verification: null,
    catalystScore: null,
    smartMoneyScore: 80,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
  };
}

describe('PredictionRegistry', () => {
  let registry: PredictionRegistry;

  beforeEach(() => {
    registry = new PredictionRegistry();
  });

  it('saves and retrieves results case-insensitively by ticker and timeframe', () => {
    registry.save(makeResult('ASELS.IS', 80, '1d'));

    expect(registry.get('asels.is', '1d')).toBeDefined();
    expect(registry.has('ASELS.IS', '1d')).toBe(true);
  });

  it('separates entries by timeframe for the same ticker', () => {
    registry.save(makeResult('ASELS.IS', 80, '1d'));
    registry.save(makeResult('ASELS.IS', 70, '1w'));

    expect(registry.get('ASELS.IS', '1d')?.bullishProbability).toBe(80);
    expect(registry.get('ASELS.IS', '1w')?.bullishProbability).toBe(70);
    expect(registry.size).toBe(2);
  });

  it('returns top results sorted by bullish probability', () => {
    registry.save(makeResult('THYAO.IS', 40));
    registry.save(makeResult('ASELS.IS', 90));
    registry.save(makeResult('TUPRS.IS', 60));

    const top = registry.getTop(3);
    expect(top.map((r) => r.ticker)).toEqual(['ASELS.IS', 'TUPRS.IS', 'THYAO.IS']);
  });

  it('evicts least recently used at capacity', () => {
    for (let i = 0; i < 205; i++) {
      registry.save(makeResult(`SYM${i}.IS`, 50, '1d'));
    }

    expect(registry.size).toBe(200);
    expect(registry.get('SYM0.IS', '1d')).toBeUndefined();
    expect(registry.get('SYM204.IS', '1d')).toBeDefined();
  });

  it('clears all entries', () => {
    registry.save(makeResult('ASELS.IS', 80));
    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.get('ASELS.IS', '1d')).toBeUndefined();
  });
});
