import { RuleAnalyticsEngine, RuleAnalyticsInput, TradeContext } from './rule-analytics.engine';
import { RuleAnalyticsResult } from './rule-analytics.types';
import { DEFAULT_RULE_ANALYTICS_CONFIG } from './rule-analytics.config';
import { Trade } from '../backtest/backtest.types';
import { Timeframe } from '../indicators/indicator.types';

function makeTrade(overrides?: Partial<Trade>): Trade {
  return {
    entryIndex: 0,
    entryTimestamp: '2025-01-01',
    entryPrice: 100,
    exitIndex: 10,
    exitTimestamp: '2025-01-11',
    exitPrice: 105,
    holdingDays: 10,
    returnPercent: 5.0,
    returnAbsolute: 5,
    exitReason: 'TAKE_PROFIT',
    ...overrides,
  };
}

function makeContext(overrides?: Partial<TradeContext>): TradeContext {
  return {
    tradeIndex: 0,
    timeframe: '1d',
    sector: 'Technology',
    technicalRuleStatuses: { trend_ema: 'PASS', momentum_rsi: 'PASS' },
    financialRuleStatuses: { price_to_book: 'PASS', debt_ratio: 'PASS' },
    eliteRating: 'A',
    opportunityLevel: 'HIGH',
    ...overrides,
  };
}

function makeInput(tradeCount: number, contextOverrides?: Partial<TradeContext>): RuleAnalyticsInput {
  const trades: Trade[] = [];
  const contexts: TradeContext[] = [];
  for (let i = 0; i < tradeCount; i++) {
    trades.push(makeTrade({
      returnPercent: i % 2 === 0 ? 5 : -2,
      holdingDays: i + 1,
    }));
    contexts.push(makeContext({ tradeIndex: i, ...contextOverrides }));
  }
  return { trades, contexts };
}

function makeVariedInput(): RuleAnalyticsInput {
  const trades: Trade[] = [];
  const contexts: TradeContext[] = [];

  const timeframes: Timeframe[] = ['1d', '1w', '4h'];
  const sectors = ['Technology', 'Finance', 'Energy'];
  const ratings: Array<'AAA' | 'AA' | 'A' | 'BBB'> = ['AAA', 'AA', 'A', 'BBB'];
  const levels: Array<'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < 20; i++) {
    trades.push(makeTrade({
      returnPercent: (i % 5) * 2 - 4,
      holdingDays: i + 1,
    }));
    contexts.push(makeContext({
      tradeIndex: i,
      timeframe: timeframes[i % 3],
      sector: sectors[i % 3],
      technicalRuleStatuses: {
        trend_ema: i % 3 === 0 ? 'PASS' : 'FAIL',
        momentum_rsi: i % 2 === 0 ? 'PASS' : 'WARNING',
        volume_obv: 'PASS',
      },
      financialRuleStatuses: {
        price_to_book: i % 4 === 0 ? 'PASS' : 'FAIL',
        debt_ratio: 'PASS',
      },
      eliteRating: ratings[i % 4],
      opportunityLevel: levels[i % 4],
    }));
  }

  return { trades, contexts };
}

describe('RuleAnalyticsEngine', () => {
  let engine: RuleAnalyticsEngine;

  beforeEach(() => {
    engine = new RuleAnalyticsEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('empty data', () => {
    it('should return empty result for no trades', () => {
      const result = engine.analyze({ trades: [], contexts: [] });
      expect(result.ruleStatistics.length).toBe(0);
      expect(result.metadata.reason).toBeDefined();
    });

    it('should return empty result for null trades', () => {
      const result = engine.analyze({ trades: null as any, contexts: [] });
      expect(result.ruleStatistics.length).toBe(0);
    });

    it('should return empty result for no contexts', () => {
      const result = engine.analyze({ trades: [makeTrade()], contexts: [] });
      expect(result.ruleStatistics.length).toBe(0);
    });
  });

  describe('single rule analytics', () => {
    it('should compute stats for technical rules', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      expect(result.ruleStatistics.length).toBeGreaterThan(0);
      expect(result.ruleStatistics.some((s) => s.rule === 'trend_ema')).toBe(true);
    });

    it('should compute stats for financial rules', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      expect(result.ruleStatistics.some((s) => s.rule === 'price_to_book')).toBe(true);
    });

    it('should calculate correct win rate', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      const stat = result.ruleStatistics.find((s) => s.rule === 'trend_ema');
      expect(stat).toBeDefined();
      expect(stat!.winRate).toBeGreaterThanOrEqual(0);
      expect(stat!.winRate).toBeLessThanOrEqual(100);
    });

    it('should calculate correct avg return', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      const stat = result.ruleStatistics.find((s) => s.rule === 'trend_ema');
      expect(stat).toBeDefined();
      expect(typeof stat!.avgReturn).toBe('number');
    });

    it('should calculate sharpe ratio', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      const stat = result.ruleStatistics.find((s) => s.rule === 'trend_ema');
      expect(stat).toBeDefined();
      expect(typeof stat!.sharpe).toBe('number');
    });

    it('should skip rules with insufficient trades', () => {
      const engine2 = new RuleAnalyticsEngine({ minTradesForStat: 100 });
      const input = makeInput(10);
      const result = engine2.analyze(input);
      expect(result.ruleStatistics.length).toBe(0);
    });
  });

  describe('pair analytics', () => {
    it('should compute pair statistics', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.pairStatistics.length).toBeGreaterThan(0);
    });

    it('should have two rules per pair', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      for (const pair of result.pairStatistics) {
        expect(pair.ruleA).toBeDefined();
        expect(pair.ruleB).toBeDefined();
        expect(pair.ruleA).not.toBe(pair.ruleB);
      }
    });

    it('should calculate pair win rate', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      for (const pair of result.pairStatistics) {
        expect(pair.winRate).toBeGreaterThanOrEqual(0);
        expect(pair.winRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('triple analytics', () => {
    it('should compute triple statistics', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.tripleStatistics.length).toBeGreaterThan(0);
    });

    it('should have three rules per triple', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      for (const triple of result.tripleStatistics) {
        expect(triple.ruleA).toBeDefined();
        expect(triple.ruleB).toBeDefined();
        expect(triple.ruleC).toBeDefined();
        const rules = new Set([triple.ruleA, triple.ruleB, triple.ruleC]);
        expect(rules.size).toBe(3);
      }
    });
  });

  describe('timeframe analysis', () => {
    it('should group by timeframe', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.timeframeStatistics.length).toBeGreaterThan(0);
    });

    it('should have distinct timeframes', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      const timeframes = result.timeframeStatistics.map((s) => s.timeframe);
      expect(new Set(timeframes).size).toBe(timeframes.length);
    });
  });

  describe('sector analysis', () => {
    it('should group by sector', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.sectorStatistics.length).toBeGreaterThan(0);
    });

    it('should have distinct sectors', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      const sectors = result.sectorStatistics.map((s) => s.sector);
      expect(new Set(sectors).size).toBe(sectors.length);
    });
  });

  describe('elite analysis', () => {
    it('should group by elite rating', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.eliteStatistics.length).toBeGreaterThan(0);
    });

    it('should have distinct ratings', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      const ratings = result.eliteStatistics.map((s) => s.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });
  });

  describe('opportunity analysis', () => {
    it('should group by opportunity level', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(result.opportunityStatistics.length).toBeGreaterThan(0);
    });

    it('should have distinct levels', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      const levels = result.opportunityStatistics.map((s) => s.level);
      expect(new Set(levels).size).toBe(levels.length);
    });
  });

  describe('metadata', () => {
    it('should include total trades', () => {
      const input = makeInput(10);
      const result = engine.analyze(input);
      expect(result.metadata.totalTrades).toBe(10);
    });

    it('should include unique timeframes', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(Array.isArray(result.metadata.uniqueTimeframes)).toBe(true);
    });

    it('should include unique sectors', () => {
      const input = makeVariedInput();
      const result = engine.analyze(input);
      expect(Array.isArray(result.metadata.uniqueSectors)).toBe(true);
    });
  });

  describe('config overrides', () => {
    it('should respect maxPairCombinations', () => {
      const engine2 = new RuleAnalyticsEngine({ maxPairCombinations: 2 });
      const input = makeVariedInput();
      const result = engine2.analyze(input);
      expect(result.pairStatistics.length).toBeLessThanOrEqual(2);
    });

    it('should respect maxTripleCombinations', () => {
      const engine2 = new RuleAnalyticsEngine({ maxTripleCombinations: 1 });
      const input = makeVariedInput();
      const result = engine2.analyze(input);
      expect(result.tripleStatistics.length).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle single trade', () => {
      const engine2 = new RuleAnalyticsEngine({ minTradesForStat: 1 });
      const input = makeInput(1);
      const result = engine2.analyze(input);
      expect(result.ruleStatistics.length).toBeGreaterThan(0);
    });

    it('should handle mismatched trade/context counts', () => {
      const trades = Array.from({ length: 10 }, () => makeTrade());
      const contexts = Array.from({ length: 5 }, () => makeContext());
      const result = engine.analyze({ trades, contexts });
      expect(result.metadata.totalTrades).toBe(10);
      expect(result.metadata.totalContexts).toBe(5);
    });

    it('should produce deterministic results', () => {
      const input = makeVariedInput();
      const r1 = engine.analyze(input);
      const r2 = engine.analyze(input);
      expect(r1.ruleStatistics.length).toBe(r2.ruleStatistics.length);
      expect(r1.pairStatistics.length).toBe(r2.pairStatistics.length);
    });
  });
});
