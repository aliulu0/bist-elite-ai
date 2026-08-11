import { SmartMoneyRegistry } from './smart-money-registry';
import { SmartMoneyScoreResult } from './smart-money.types';

function makeResult(ticker: string): SmartMoneyScoreResult {
  return {
    ticker,
    timeframe: '1d',
    smartMoneyScore: 93,
    liquidityScore: 78,
    volumeScore: 85,
    accumulationScore: 90,
    distributionScore: 15,
    relativeVolume: 2.4,
    volumeSpike: 2.1,
    volumeSmaTrend: 0.35,
    moneyFlow: 'strong_positive',
    moneyFlowScore: 82,
    institutionalActivity: 'accumulating',
    confidence: 91,
    risk: 'low',
    riskScore: 22,
    liquidity: 'high',
    accumulationLevel: 'very_strong',
    distributionLevel: 'low',
    avgDailyVolume: 2_500_000,
    accumulationDays: 8,
    distributionDays: 2,
    breakoutVolume: true,
    signals: [],
    verification: 'TRUE',
    catalystScore: 90,
    metadata: {},
    generatedAt: new Date().toISOString(),
    isValid: true,
  };
}

describe('SmartMoneyRegistry', () => {
  let registry: SmartMoneyRegistry;

  beforeEach(() => {
    registry = new SmartMoneyRegistry();
  });

  it('saves and retrieves results case-insensitively', () => {
    registry.save(makeResult('ASELS.IS'));

    expect(registry.get('asels.is')).toBeDefined();
    expect(registry.has('ASELS.IS')).toBe(true);
  });

  it('orders by recency on re-save', () => {
    registry.save(makeResult('THYAO.IS'));
    registry.save(makeResult('ASELS.IS'));
    registry.save(makeResult('THYAO.IS'));

    const top = registry.getTop(2);
    expect(top[0].ticker).toBe('THYAO.IS');
    expect(top[1].ticker).toBe('ASELS.IS');
  });

  it('returns top results limited', () => {
    registry.save(makeResult('THYAO.IS'));
    registry.save(makeResult('ASELS.IS'));
    registry.save(makeResult('TUPRS.IS'));

    expect(registry.getTop(2)).toHaveLength(2);
    expect(registry.getTop()).toHaveLength(3);
  });

  it('evicts least recently used at capacity', () => {
    for (let i = 0; i < 205; i++) {
      registry.save(makeResult(`SYM${i}.IS`));
    }

    expect(registry.size).toBe(200);
    expect(registry.get('SYM0.IS')).toBeUndefined();
    expect(registry.get('SYM204.IS')).toBeDefined();
  });

  it('clears all entries', () => {
    registry.save(makeResult('ASELS.IS'));
    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.get('ASELS.IS')).toBeUndefined();
  });
});
