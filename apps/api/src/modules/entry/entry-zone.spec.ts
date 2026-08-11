import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityRankingService } from '../ai-opportunity/opportunity-ranking.service';
import { OPPORTUNITY_LEVEL_META, OpportunityLevel, OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { TomorrowRegistry } from '../tomorrow/tomorrow.registry';
import { IndicatorResult } from '../indicators/indicator.types';
import { MarketStructureResult } from '../market-structure/market-structure.types';
import { ENTRY_QUALITY_LEVELS } from './entry-zone.config';
import { EntryZoneEngine } from './entry-zone.engine';
import { EntryRegistry } from './entry.registry';
import { EntryService } from './entry.service';
import { EntryController } from './entry.controller';
import { EntryZoneContext, EntryZoneInput, EntryZoneResult } from './entry-zone.types';

function baseInput(overrides: Partial<EntryZoneInput> = {}): EntryZoneInput {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    price: 100,
    atr: 4,
    bollinger: { upper: 108, middle: 100, lower: 92 },
    sma: { sma20: null, sma50: null, sma200: null },
    ema: { ema20: null, ema50: null, ema200: null },
    rsi: null,
    relativeVolume: null,
    supportZones: [],
    resistanceZones: [],
    trend: 'uptrend',
    context: null,
    ...overrides,
  };
}

function makeEngine(): EntryZoneEngine {
  return new EntryZoneEngine();
}

describe('EntryZoneEngine (deterministic)', () => {
  it('should expose 5 quality levels with stars', () => {
    expect(ENTRY_QUALITY_LEVELS.map((q) => q.level)).toEqual([
      'PERFECT',
      'VERY_GOOD',
      'GOOD',
      'AVERAGE',
      'WEAK',
    ]);
    expect(ENTRY_QUALITY_LEVELS.map((q) => q.stars)).toEqual([
      '★★★★★',
      '★★★★☆',
      '★★★☆☆',
      '★★☆☆☆',
      '★☆☆☆☆',
    ]);
  });

  it('should compute deterministic levels for a clean uptrend input', () => {
    const r = makeEngine().evaluate(baseInput());
    expect(r.price).toBe(100);
    expect(r.support1).toBe(92);
    expect(r.support2).toBe(84);
    expect(r.resistance1).toBe(108);
    expect(r.resistance2).toBe(116);
    expect(r.conservativeEntry).toBe(96);
    expect(r.aggressiveEntry).toBe(101);
    expect(r.idealEntryZone).toEqual({ min: 96, max: 101 });
    expect(r.stopLoss).toBe(89.6);
    expect(r.target1).toBe(108);
    expect(r.target2).toBe(114);
    expect(r.target3).toBe(120);
    expect(r.riskRewardRatio).toBe(1.1);
    expect(r.riskRewardLabel).toBe('1 : 1.1');
    expect(r.trendDirection).toBe('UPTREND');
  });

  it('should be deterministic for identical inputs', () => {
    const engine = makeEngine();
    const a = engine.evaluate(baseInput());
    const b = engine.evaluate(baseInput());
    const { evaluatedAt: _ea, ...aCore } = a;
    const { evaluatedAt: _eb, ...bCore } = b;
    expect(aCore).toEqual(bCore);
  });

  it('should pick nearest support/resistance zones below/above price', () => {
    const r = makeEngine().evaluate(
      baseInput({
        supportZones: [{ upper: 97, lower: 95, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
        resistanceZones: [{ upper: 109, lower: 107, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
      }),
    );
    expect(r.support1).toBe(97);
    expect(r.support2).toBe(95);
    expect(r.resistance1).toBe(107);
    expect(r.resistance2).toBe(109);
  });

  it('should keep stop loss below support and entry', () => {
    const r = makeEngine().evaluate(baseInput());
    expect(r.stopLoss).toBeLessThan(r.conservativeEntry!);
    expect(r.stopLoss).toBeLessThan(r.support1!);
  });

  it('should produce ascending targets above price', () => {
    const r = makeEngine().evaluate(baseInput());
    expect(r.target1).toBeLessThan(r.target2!);
    expect(r.target2).toBeLessThan(r.target3!);
    expect(r.target1).toBeGreaterThan(r.price!);
  });

  it('should be PERFECT with strong signals and context', () => {
    const ctx: EntryZoneContext = {
      aiScore: 95,
      decisionScore: 95,
      opportunityScore: 95,
      eliteDaily: 95,
      tomorrowScore: 95,
      risk: 90,
    };
    const r = makeEngine().evaluate(
      baseInput({
        price: 100,
        atr: 1,
        sma: { sma20: 95, sma50: 90, sma200: 80 },
        ema: { ema20: 96, ema50: 92, ema200: 90 },
        rsi: 55,
        relativeVolume: 1.6,
        supportZones: [{ upper: 99, lower: 97, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
        resistanceZones: [{ upper: 103, lower: 101, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
        context: ctx,
      }),
    );
    expect(r.entryConfidence).toBe(100);
    expect(r.entryQuality.level).toBe('PERFECT');
    expect(r.entryQuality.stars).toBe('★★★★★');
  });

  it('should warn when ATR data is missing and use a fallback', () => {
    const r = makeEngine().evaluate(baseInput({ atr: null }));
    expect(r.warnings.some((w) => w.includes('ATR verisi yok'))).toBe(true);
    expect(r.support1).toBe(96);
  });

  it('should warn when price data is missing and null the levels', () => {
    const r = makeEngine().evaluate(baseInput({ price: null, atr: null }));
    expect(r.warnings.some((w) => w.includes('Fiyat verisi yok'))).toBe(true);
    expect(r.idealEntryZone).toBeNull();
    expect(r.stopLoss).toBeNull();
    expect(r.entryConfidence).toBe(40);
    expect(r.entryQuality.level).toBe('AVERAGE');
  });

  it('should map downtrend and sideways trends', () => {
    const down = makeEngine().evaluate(baseInput({ trend: 'downtrend', price: 100, atr: 4 }));
    expect(down.trendDirection).toBe('DOWNTREND');
    expect(down.entryConfidence).toBeLessThan(50);
    const sideways = makeEngine().evaluate(
      baseInput({ trend: 'sideways', price: 100, atr: 4, sma: { sma20: 98, sma50: 99, sma200: null }, ema: { ema20: null, ema50: null, ema200: null } }),
    );
    expect(sideways.trendDirection).toBe('DOWNTREND');
  });

  it('should include Turkish reasons with all levels', () => {
    const r = makeEngine().evaluate(baseInput());
    expect(r.reasons[0]).toBe('Trend: UPTREND');
    expect(r.reasons.some((x) => x.startsWith('İdeal Giriş Bölgesi:'))).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('Stop Loss:'))).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('Hedef 1:'))).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('Risk/Ödül:'))).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('Giriş Güveni:'))).toBe(true);
  });

  it('should include context scores in reasons when present', () => {
    const r = makeEngine().evaluate(
      baseInput({ context: { aiScore: 90, eliteDaily: 88, tomorrowScore: 85 } }),
    );
    expect(r.reasons.some((x) => x === 'AI Skoru: 90')).toBe(true);
    expect(r.reasons.some((x) => x === 'Günlük Elite Skor: 88')).toBe(true);
    expect(r.reasons.some((x) => x === 'Yarın Skoru: 85')).toBe(true);
  });
});

describe('EntryRegistry', () => {
  function seed(): { registry: EntryRegistry } {
    const registry = new EntryRegistry();
    const engine = makeEngine();
    const a = engine.evaluate(baseInput({ ticker: 'A', price: 100, atr: 4, context: { aiScore: 90 } }));
    const b = engine.evaluate(baseInput({ ticker: 'B', price: 100, atr: 4, trend: 'downtrend', context: { aiScore: 30 } }));
    registry.set({ ticker: 'A', input: baseInput(), result: a, evaluatedAt: a.evaluatedAt });
    registry.set({ ticker: 'B', input: baseInput(), result: b, evaluatedAt: b.evaluatedAt });
    return { registry };
  }

  it('should set, get, has, count and clear', () => {
    const { registry } = seed();
    expect(registry.has('A')).toBe(true);
    expect(registry.count()).toBe(2);
    expect(registry.get('A')?.result.ticker).toBe('A');
    registry.clear();
    expect(registry.count()).toBe(0);
  });

  it('should top-sort by entry confidence then risk/reward', () => {
    const { registry } = seed();
    expect(registry.top(10).map((r) => r.ticker)).toEqual(['A', 'B']);
    expect(registry.top(1).map((r) => r.ticker)).toEqual(['A']);
  });
});

describe('EntryService', () => {
  function makeMarketStructure(): MarketStructureResult {
    return {
      timeframe: '1d',
      trend: 'uptrend',
      structure: [],
      swingHighs: [],
      swingLows: [],
      supportZones: [{ upper: 95, lower: 93, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
      resistanceZones: [{ upper: 108, lower: 106, startIndex: 1, endIndex: 2, touches: 3, timestamps: [] }],
      breakOfStructure: [],
      changeOfCharacter: [],
      metadata: {},
      isValid: true,
    };
  }

  function makeIndicators(): IndicatorResult[] {
    const mk = (indicator: string, value: unknown): IndicatorResult => ({
      indicator,
      timeframe: '1d',
      timestamp: '2026-01-01T00:00:00.000Z',
      value: value as never,
      metadata: {},
      isValid: true,
    });
    return [
      mk('ATR', 2.5),
      mk('BollingerBands', { upper: 110, middle: 100, lower: 90 }),
      mk('SMA_20', 98),
      mk('SMA_50', 96),
      mk('SMA_200', 90),
      mk('EMA_20', 99),
      mk('EMA_50', 97),
      mk('RSI', 55),
      mk('RelativeVolume', 1.2),
    ];
  }

  function makePoint(close: number): import('../market-data/interfaces/market-data.types').MarketDataPoint {
    return {
      symbol: 'THYAO',
      timeframe: '1d',
      open: close - 1,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1000,
      timestamp: '2026-01-01T00:00:00.000Z',
      validationStatus: 'valid',
    };
  }

  function makeService() {
    const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
    const marketDataService = {
      fetchData: jest.fn(async (symbol: string) => (symbol === 'YOK' ? [] : [makePoint(100)])),
    };
    const cacheService = {
      getOrSet: jest.fn(async (_p: unknown, _t: unknown, _s: unknown, factory: () => unknown) => factory()),
    };
    const indicatorEngine = { calculateAll: jest.fn(() => makeIndicators()) };
    const marketStructureEngine = { analyze: jest.fn(() => makeMarketStructure()) };
    const symbolRegistry = {
      getSymbol: (t: string) =>
        t === 'YOK'
          ? undefined
          : { canonicalTicker: t, companyName: `${t} A.Ş.`, sector: 'X', exchange: 'IST', isin: null, active: true, providers: { yahoo: `${t}.IS` } },
      getActiveSymbols: () => [{ canonicalTicker: 'THYAO', companyName: 'THYAO A.Ş.', sector: 'X', exchange: 'IST', isin: null, active: true, providers: { yahoo: 'THYAO.IS' } }],
    };
    const registry = new EntryRegistry();
    const service = new EntryService(
      new EntryZoneEngine(),
      registry,
      marketDataService as never,
      cacheService as never,
      indicatorEngine as never,
      marketStructureEngine as never,
      opportunityRegistry,
      new EliteScoreRegistry(),
      new TomorrowRegistry(),
      symbolRegistry as never,
    );
    return { service, registry, opportunityRegistry, marketDataService };
  }

  it('should compute and cache an entry zone for a ticker', async () => {
    const { service, registry } = makeService();
    const r = await service.computeForTicker('THYAO');
    expect(r).not.toBeNull();
    expect(r!.ticker).toBe('THYAO');
    expect(r!.price).toBe(100);
    expect(r!.support1).toBe(95);
    expect(r!.resistance1).toBe(106);
    expect(r!.trendDirection).toBe('UPTREND');
    expect(registry.count()).toBe(1);
    expect(service.getCached('THYAO')?.ticker).toBe('THYAO');
  });

  it('should throw NotFoundException when nothing is computable', async () => {
    const { service } = makeService();
    await expect(service.getByTicker('YOK')).rejects.toThrow('Giriş bölgesi hesaplanamadı');
  });

  it('should compute entry zones for the opportunity universe on top()', async () => {
    const { service, opportunityRegistry } = makeService();
    const level: OpportunityLevel = 'GÜÇLÜ_FIRSAT';
    const meta = OPPORTUNITY_LEVEL_META[level];
    const result: OpportunityResult = {
      ticker: 'THYAO',
      company: 'THYAO A.Ş.',
      level,
      levelLabel: meta.label,
      levelEmoji: meta.emoji,
      opportunityScore: 80,
      confidence: 80,
      decision: 'AL',
      decisionLabel: 'AL',
      decisionScore: 80,
      decisionConfidence: 80,
      aiScore: 80,
      aiConfidence: 80,
      strategyId: 'value-hunter',
      strategyName: 'Değer Avcısı',
      strategyScore: 80,
      verification: 70,
      catalyst: 70,
      momentum: 70,
      trend: 70,
      risk: 70,
      liquidity: 70,
      technical: 70,
      fundamental: 70,
      quality: 70,
      reasons: [],
      warnings: [],
      positiveSignals: [],
      negativeSignals: [],
      tags: [],
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    };
    opportunityRegistry.set({
      ticker: 'THYAO',
      input: {} as never,
      result,
      evaluatedAt: result.evaluatedAt,
    });
    const top = await service.top(10);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top[0].ticker).toBe('THYAO');
  });

  it('should evaluate a batch of items', async () => {
    const { service } = makeService();
    const results = await service.evaluateBatch([
      { ticker: 'THYAO', company: 'THYAO A.Ş.', strategyId: 'value-hunter', aiScore: 80 },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('THYAO');
    expect(results[0].entryQuality).toBeDefined();
  });
});

describe('EntryController', () => {
  function makeController() {
    const service = {
      top: jest.fn(async () => [{ ticker: 'THYAO' } as EntryZoneResult]),
      allCached: jest.fn(() => [] as EntryZoneResult[]),
      getByTicker: jest.fn(async (ticker: string) => ({ ticker } as EntryZoneResult)),
      evaluateBatch: jest.fn(async () => [{ ticker: 'THYAO' } as EntryZoneResult]),
    };
    return { controller: new EntryController(service as never) };
  }

  it('GET /entry/top should return ranked results', async () => {
    const { controller } = makeController();
    const res = await controller.top({ limit: 5 });
    expect(res.baslik).toBe('En Güçlü Giriş Bölgeleri');
    expect(res.sonuclar[0].ticker).toBe('THYAO');
  });

  it('GET /entry/batch should return cached results', () => {
    const { controller } = makeController();
    const res = controller.batch();
    expect(res.baslik).toBe('Giriş Bölgeleri');
    expect(res.sonuclar).toEqual([]);
  });

  it('GET /entry/:ticker should return the single result', async () => {
    const { controller } = makeController();
    const res = await controller.getByTicker({ ticker: 'THYAO' });
    expect(res.ticker).toBe('THYAO');
  });

  it('POST /entry/calculate should evaluate items', async () => {
    const { controller } = makeController();
    const res = await controller.calculate({
      items: [{ ticker: 'THYAO', company: 'THYAO A.Ş.', strategyId: 'value-hunter' }],
    });
    expect(res.islenen).toBe(1);
    expect(res.sonuclar[0].ticker).toBe('THYAO');
  });
});
