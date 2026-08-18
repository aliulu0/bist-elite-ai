import { EliteScannerEngine } from '../elite-scanner-engine.service';
import {
  StrategyRegistry,
  ValueHunterStrategy,
  SmartMoneyStrategy,
  MomentumStrategy,
  SwingStrategy,
  DipCollectorStrategy,
  MinerviniStrategy,
  CanslimStrategy,
  WilliamOneilStrategy,
  QullamaggieStrategy,
} from '../strategy-registry.service';
import { ScannerFilter } from '../scanner-filter.service';
import { ScannerRegistry } from '../scanner-registry.service';
import { ScannerService } from '../scanner.service';
import { DecisionEngine } from '../../decision/decision-engine.service';
import { DecisionRegistry } from '../../decision/decision-registry.service';
import { DecisionExplanationService } from '../../decision/decision-explanation.service';
import { OpportunityEngine } from '../../ai-opportunity/opportunity-engine.service';
import { OpportunityRegistry } from '../../ai-opportunity/opportunity-registry.service';
import { OpportunityExplanationService } from '../../ai-opportunity/opportunity-explanation.service';
import { OpportunityRankingService } from '../../ai-opportunity/opportunity-ranking.service';
import { EliteScoreRegistry } from '../../ai-elite-score/elite-score.registry';
import { TomorrowRegistry } from '../../tomorrow/tomorrow.registry';
import { EntryService } from '../../entry/entry.service';
import { AnalystService } from '../../analyst/analyst.service';
import { EntryZoneEngine } from '../../entry/entry-zone.engine';
import { EntryRegistry } from '../../entry/entry.registry';
import { MarketStructureEngine } from '../../market-structure/market-structure.engine';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { ScoreEngine } from '../../scoring/score-engine.service';
import { ScorePipeline } from '../../scoring/score-pipeline.service';
import { ScoreRegistry } from '../../scoring/score-registry.service';
import { ScoreCalculator } from '../../scoring/score-calculator.service';
import {
  EliteScannerStrategy,
  ScannerInstrument,
  EliteScannerContext,
  EliteScannerResult,
} from '../elite-scanner.types';
import {
  ScoreEngineInput,
  ScorePipelineInput,
  HistoricalPricePoint,
  FinancialSnapshot,
} from '../../scoring/scoring-types';

const DAY_MS = 86400000;

function iso(offset: number): string {
  return new Date(Date.UTC(2025, 0, 1) + offset * DAY_MS).toISOString();
}

function makeInstrument(ticker: string): ScannerInstrument {
  return {
    ticker,
    yahooTicker: `${ticker}.IS`,
    company: `Şirket ${ticker}`,
    sector: 'Ulaştırma',
    market: 'BIST',
    assetType: 'Equity',
    currency: 'TRY',
    isin: null,
  };
}

function makeContext(overrides: Partial<EliteScannerContext> = {}): EliteScannerContext {
  const instrument = makeInstrument('THYAO');
  return {
    instrument,
    marketData: {
      price: 300,
      volume: 1_000_000,
      marketCap: 400_000_000_000,
      provider: 'yahoo',
      lastUpdate: '2025-01-15T00:00:00.000Z',
    },
    ...overrides,
  };
}

function risingBars(n: number = 260): HistoricalPricePoint[] {
  let price = 100;
  const bars: HistoricalPricePoint[] = [];
  for (let i = 0; i < n; i++) {
    const wobble = i % 5 === 4 ? -0.006 : 0.002;
    price = price * (1 + 0.01 + wobble);
    const p = Math.round(price * 100) / 100;
    bars.push({
      date: iso(i),
      open: Math.round(p * 0.998 * 100) / 100,
      high: Math.round(p * 1.003 * 100) / 100,
      low: Math.round(p * 0.996 * 100) / 100,
      close: p,
      volume: i === n - 1 ? 2_000_000 : 1_000_000,
    });
  }
  return bars;
}

function fallingBars(n: number = 260): HistoricalPricePoint[] {
  let price = 200;
  const bars: HistoricalPricePoint[] = [];
  for (let i = 0; i < n; i++) {
    price = price * (1 - 0.008);
    const p = Math.round(price * 100) / 100;
    bars.push({
      date: iso(i),
      open: Math.round(p * 1.002 * 100) / 100,
      high: Math.round(p * 1.003 * 100) / 100,
      low: Math.round(p * 0.997 * 100) / 100,
      close: p,
      volume: 1_000_000,
    });
  }
  return bars;
}

function flatBars(n: number = 260): HistoricalPricePoint[] {
  const bars: HistoricalPricePoint[] = [];
  for (let i = 0; i < n; i++) {
    bars.push({
      date: iso(i),
      open: 100,
      high: 100.5,
      low: 99.5,
      close: 100,
      volume: 500_000,
    });
  }
  return bars;
}

const goodFinancials: FinancialSnapshot = {
  peRatio: 8,
  pbRatio: 0.8,
  debtToEquity: 0.3,
  revenueGrowth: 0.15,
  netMargin: 0.13,
  roe: 0.2,
  dividendYield: 0.02,
  revenue: 300_000_000_000,
  netIncome: 40_000_000_000,
  totalAssets: 500_000_000_000,
  totalDebt: 30_000_000_000,
  ebitda: 50_000_000_000,
  freeCashFlow: 25_000_000_000,
};

const weakFinancials: FinancialSnapshot = {
  peRatio: 60,
  pbRatio: 8,
  debtToEquity: 5,
  revenueGrowth: -0.1,
  netMargin: -0.05,
  roe: -0.02,
  dividendYield: 0,
  revenue: 10_000_000_000,
  netIncome: -500_000_000,
  totalAssets: 80_000_000_000,
  totalDebt: 70_000_000_000,
  ebitda: -1_000_000_000,
  freeCashFlow: -2_000_000_000,
};

describe('StrategyRegistry', () => {
  let registry: StrategyRegistry;

  beforeEach(() => {
    registry = new StrategyRegistry();
  });

  it('should register all 9 strategies by default', () => {
    expect(registry.list().length).toBe(9);
    expect(registry.has('value-hunter')).toBe(true);
    expect(registry.has('smart-money')).toBe(true);
    expect(registry.has('momentum')).toBe(true);
    expect(registry.has('swing')).toBe(true);
    expect(registry.has('dip-collector')).toBe(true);
    expect(registry.has('minervini')).toBe(true);
    expect(registry.has('canslim')).toBe(true);
    expect(registry.has('william-oneil')).toBe(true);
    expect(registry.has('qullamaggie')).toBe(true);
    const info = registry.listInfo();
    expect(info).toHaveLength(9);
    expect(info.every((s) => s.enabled)).toBe(true);
  });

  it('should allow registering custom strategies', () => {
    registry.register({
      id: 'custom',
      name: 'Özel Strateji',
      description: 'Test',
      enabled: true,
      evaluate: () => ({
        score: 0,
        passed: [],
        failedReasons: ['Test'],
        signals: [],
        reasons: [],
        confidence: 0,
      }),
    });
    expect(registry.get('custom')).toBeDefined();
    expect(registry.list().length).toBe(10);
  });

  it('should unregister strategies', () => {
    expect(registry.unregister('value-hunter')).toBe(true);
    expect(registry.has('value-hunter')).toBe(false);
  });
});

describe('ValueHunterStrategy', () => {
  const strategy = new ValueHunterStrategy();

  it('should have Turkish metadata', () => {
    expect(strategy.id).toBe('value-hunter');
    expect(strategy.name).toBe('Değer Avcısı');
    expect(strategy.description).toContain('değerleme');
  });

  it('should pass all rules with strong value fundamentals', () => {
    const result = strategy.evaluate(makeContext({ financials: goodFinancials }));
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.passed).toContain('P/E düşük');
    expect(result.passed).toContain('P/B düşük');
    expect(result.passed).toContain('ROE yüksek');
    expect(result.passed).toContain('Borç/Özkaynak düşük');
    expect(result.passed).toContain('PEG düşük');
    expect(result.passed).toContain('EV/EBITDA düşük');
    expect(result.failedReasons).toHaveLength(0);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should fail rules with weak fundamentals', () => {
    const result = strategy.evaluate(makeContext({ financials: weakFinancials }));
    expect(result.score).toBeLessThan(30);
    expect(result.passed.length).toBeLessThan(3);
    expect(result.failedReasons.length).toBeGreaterThan(0);
  });

  it('should be deterministic for identical input', () => {
    const a = strategy.evaluate(makeContext({ financials: goodFinancials }));
    const b = strategy.evaluate(makeContext({ financials: goodFinancials }));
    expect(a).toEqual(b);
  });

  it('should return fail reason when no financial data', () => {
    const result = strategy.evaluate(makeContext({ financials: undefined }));
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Finansal veri mevcut değil');
  });
});

describe('SmartMoneyStrategy', () => {
  const strategy = new SmartMoneyStrategy();

  it('should detect accumulation with rising prices and volume', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: risingBars() }));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toContain('OBV pozitif');
    expect(result.passed).toContain('Para akışı (MFI)');
    expect(result.passed).toContain('CMF pozitif');
    expect(result.passed).toContain('Birikim');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: risingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('MomentumStrategy', () => {
  const strategy = new MomentumStrategy();

  it('should pass trend rules with strong uptrend', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: risingBars() }));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toContain('MACD pozitif');
    expect(result.passed).toContain('ROC pozitif');
    expect(result.passed).toContain('ADX güçlü trend');
    expect(result.passed).toContain('EMA12 > EMA26');
    expect(result.passed).toContain('Fiyat > SMA50');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: risingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('SwingStrategy', () => {
  const strategy = new SwingStrategy();

  it('should pass swing rules in uptrend', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: risingBars() }));
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.passed).toContain('EMA altın kesişim');
    expect(result.passed).toContain('MACD histogram pozitif');
    expect(result.passed).toContain('Yukarı trend');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: risingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('DipCollectorStrategy', () => {
  const strategy = new DipCollectorStrategy();

  it('should detect oversold conditions in downtrend', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: fallingBars() }));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toContain('RSI aşırı satım');
    expect(result.passed).toContain('Williams %R aşırı satım');
    expect(result.passed).toContain('Bollinger alt banda yakın');
    expect(result.passed).toContain('20 günlük destek bölgesi');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: fallingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('MinerviniStrategy', () => {
  const strategy = new MinerviniStrategy();

  it('should pass stage analysis with uptrend', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: risingBars(300) }));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toContain('Fiyat > 150 SMA');
    expect(result.passed).toContain('150 SMA > 200 SMA');
    expect(result.passed).toContain('Fiyat > 200 SMA');
    expect(result.passed).toContain('52 haftalık zirveye yakınlık');
    expect(result.passed).toContain('Göreli güç (ROC)');
    expect(result.passed).toContain('Kısa vadeli trend');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: risingBars(300) });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('CanslimStrategy', () => {
  const strategy = new CanslimStrategy();

  it('should pass CANSLIM rules with strong fundamentals and trend', () => {
    const result = strategy.evaluate(
      makeContext({ financials: goodFinancials, historicalPrices: risingBars() }),
    );
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.passed).toContain('Cari kazanç pozitif');
    expect(result.passed).toContain('Yıllık kazanç büyümesi');
    expect(result.passed).toContain('Göreli güç');
    expect(result.passed).toContain('Kontrollü arz/borçluluk');
    expect(result.passed).toContain('Liderlik (gelir büyümesi)');
    expect(result.passed).toContain('Kurumsal ilgi (OBV)');
    expect(result.passed).toContain('Piyasa yönü (SMA50)');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ financials: goodFinancials, historicalPrices: risingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('WilliamOneilStrategy', () => {
  const strategy = new WilliamOneilStrategy();

  it('should pass ONeil rules with strong fundamentals and breakout', () => {
    const result = strategy.evaluate(
      makeContext({ financials: goodFinancials, historicalPrices: risingBars() }),
    );
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toContain('EPS güçlü');
    expect(result.passed).toContain('Satış büyümesi');
    expect(result.passed).toContain('Göreli güç yüksek');
    expect(result.passed).toContain('Breakout (SMA50 +%5)');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ financials: goodFinancials, historicalPrices: risingBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('QullamaggieStrategy', () => {
  const strategy = new QullamaggieStrategy();

  it('should detect contraction and tight range on flat prices', () => {
    const result = strategy.evaluate(makeContext({ historicalPrices: flatBars() }));
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.passed).toContain('Volatilite daralması');
    expect(result.passed).toContain('Sıkışık aralık');
    expect(result.failedReasons.length).toBeGreaterThan(0);
    expect(result.failedReasons.some((r) => r.includes('Breakout'))).toBe(true);
  });

  it('should fail without historical data', () => {
    const result = strategy.evaluate(makeContext());
    expect(result.score).toBe(0);
    expect(result.failedReasons[0]).toContain('Tarihsel fiyat verisi mevcut değil');
  });

  it('should be deterministic', () => {
    const ctx = makeContext({ historicalPrices: flatBars() });
    expect(strategy.evaluate(ctx)).toEqual(strategy.evaluate(ctx));
  });
});

describe('ScannerFilter', () => {
  const filter = new ScannerFilter();
  const instruments: ScannerInstrument[] = [
    {
      ticker: 'THYAO',
      yahooTicker: 'THYAO.IS',
      company: 'A',
      sector: 'Ulaştırma',
      market: 'BIST',
      assetType: 'Equity',
      currency: 'TRY',
      isin: null,
    },
    {
      ticker: 'GARAN',
      yahooTicker: 'GARAN.IS',
      company: 'B',
      sector: 'Bankacılık',
      market: 'BIST',
      assetType: 'Bank',
      currency: 'TRY',
      isin: null,
    },
    {
      ticker: 'X',
      yahooTicker: 'X.IS',
      company: 'C',
      sector: 'Ulaştırma',
      market: 'BIST',
      assetType: 'Equity',
      currency: 'TRY',
      isin: null,
    },
  ];

  it('should filter by sector', () => {
    const { filtered, applied } = filter.apply(instruments, { sector: 'Ulaştırma' });
    expect(filtered).toHaveLength(2);
    expect(applied.instrumentCount).toBe(2);
  });

  it('should filter by assetType', () => {
    const { filtered } = filter.apply(instruments, { assetType: 'Bank' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ticker).toBe('GARAN');
  });

  it('should apply limit', () => {
    const { filtered } = filter.apply(instruments, { limit: 2 });
    expect(filtered).toHaveLength(2);
  });

  it('should return all when no filter', () => {
    const { filtered } = filter.apply(instruments);
    expect(filtered).toHaveLength(3);
  });
});

describe('ScannerRegistry', () => {
  it('should count instruments from master registry', () => {
    const symbolRegistry = {
      getMasterRegistry: () =>
        [
          {
            ticker: 'THYAO',
            yahooTicker: 'THYAO.IS',
            companyName: 'Türk Hava Yolları',
            turkishName: null,
            sector: 'Ulaştırma',
            industry: null,
            market: 'BIST',
            exchange: 'IST',
            currency: 'TRY',
            status: 'active',
            assetType: 'Equity',
            dataSources: [],
            isin: null,
          },
          {
            ticker: 'GARAN',
            yahooTicker: 'GARAN.IS',
            companyName: 'Garanti',
            turkishName: null,
            sector: 'Bankacılık',
            industry: null,
            market: 'BIST',
            exchange: 'IST',
            currency: 'TRY',
            status: 'active',
            assetType: 'Bank',
            dataSources: [],
            isin: null,
          },
          {
            ticker: 'DELIST',
            yahooTicker: 'DELIST.IS',
            companyName: 'Eski',
            turkishName: null,
            sector: null,
            industry: null,
            market: 'BIST',
            exchange: 'IST',
            currency: 'TRY',
            status: 'inactive',
            assetType: 'Equity',
            dataSources: [],
            isin: null,
          },
        ] as any,
    };
    const registry = new ScannerRegistry(symbolRegistry as any);

    expect(registry.getCount()).toBe(3);
    expect(registry.getActiveCount()).toBe(2);

    const active = registry.getInstruments({ activeOnly: true });
    expect(active).toHaveLength(2);

    const all = registry.getInstruments({ activeOnly: false });
    expect(all).toHaveLength(3);

    const limited = registry.getInstruments({ activeOnly: false, limit: 2 });
    expect(limited).toHaveLength(2);
  });
});

describe('EliteScannerEngine with ScoreEngine', () => {
  function makeScoreEngineMock() {
    return {
      score: jest.fn(async (input: ScoreEngineInput) => ({
        ticker: input.ticker,
        strategyId: input.strategyId,
        strategyName: 'Test Strategy',
        scoredAt: new Date().toISOString(),
        pipeline: {
          scores: [
            { dimension: 'technical' as const, score: 75, label: 'Teknik', details: {} },
            { dimension: 'fundamental' as const, score: 80, label: 'Temel', details: {} },
            { dimension: 'momentum' as const, score: 70, label: 'Momentum', details: {} },
            { dimension: 'trend' as const, score: 65, label: 'Trend', details: {} },
            { dimension: 'liquidity' as const, score: 85, label: 'Likidite', details: {} },
            { dimension: 'risk' as const, score: 30, label: 'Risk', details: {} },
            { dimension: 'volume' as const, score: 78, label: 'Hacim', details: {} },
            { dimension: 'quality' as const, score: 82, label: 'Kalite', details: {} },
            { dimension: 'verification' as const, score: 90, label: 'Doğrulama', details: {} },
            { dimension: 'catalyst' as const, score: 55, label: 'Katalizör', details: {} },
          ],
          aiResult: {
            aiScore: 72,
            aiConfidence: 85,
            weightedScore: 70,
            scores: [],
            availableDimensionCount: 10,
            totalDimensions: 10,
          },
          pipelineDurationMs: 5,
        },
      })),
      scoreBatch: jest.fn(),
      getWeightProfile: jest.fn(() => null),
      listStrategies: jest.fn(() => []),
    };
  }

  function makeDeps() {
    const orchestrator = {
      fetchCompany: jest.fn(async (s: string) => ({
        data: { symbol: s, marketCap: 100, lastUpdated: '2025-01-15T00:00:00.000Z' },
        provider: 'yahoo',
        cached: false,
        timestamp: '2025-01-15T00:00:00.000Z',
      })),
      fetchFinancials: jest.fn(async () => null),
      fetchBalanceSheet: jest.fn(async () => null),
      fetchIncomeStatement: jest.fn(async () => null),
      fetchCashFlow: jest.fn(async () => null),
    };
    const marketDataService = {
      fetchLatest: jest.fn(async (s: string) => ({
        symbol: s,
        close: 50,
        volume: 10_000,
        timestamp: '2025-01-15T00:00:00.000Z',
      })),
      fetchData: jest.fn(async () => []),
    };
    const cacheService = {
      getOrSet: jest.fn(async (_p: string, _type: string, _s: string, factory: () => any) =>
        factory(),
      ),
    };
    const scoreEngine = makeScoreEngineMock();
    const indicatorEngine = { calculateAll: jest.fn(() => []) };
    const verificationRepository = { getVerificationResult: jest.fn(async () => undefined) };
    const researchIntelligence = { getCompanyResearch: jest.fn(async () => ({ catalysts: [] })) };
    return {
      orchestrator,
      marketDataService,
      cacheService,
      scoreEngine,
      indicatorEngine,
      verificationRepository,
      researchIntelligence,
    };
  }

  function makeEngine() {
    const deps = makeDeps();
    const engine = new EliteScannerEngine(
      deps.orchestrator as any,
      deps.marketDataService as any,
      deps.cacheService as any,
      deps.scoreEngine as any,
      deps.indicatorEngine as any,
      deps.verificationRepository as any,
      deps.researchIntelligence as any,
    );
    return { engine, deps };
  }

  it('should integrate ScoreEngine and return all 13 scoring fields', async () => {
    const { engine } = makeEngine();
    const instruments = [makeInstrument('THYAO'), makeInstrument('GARAN'), makeInstrument('ASELS')];
    const strategy: EliteScannerStrategy = new ValueHunterStrategy();

    const response = await engine.scan(instruments, strategy);
    expect(response.results).toHaveLength(3);
    expect(response.summary.scannedCount).toBe(3);
    expect(response.summary.resultCount).toBe(3);
    expect(response.summary.errorCount).toBe(0);

    const r = response.results[0];
    expect(r.ticker).toBe('THYAO');
    expect(r.price).toBe(50);
    expect(r.volume).toBe(10_000);
    expect(r.marketCap).toBe(100);

    expect(r.technicalScore).toBe(75);
    expect(r.fundamentalScore).toBe(80);
    expect(r.momentumScore).toBe(70);
    expect(r.trendScore).toBe(65);
    expect(r.liquidityScore).toBe(85);
    expect(r.riskScore).toBe(30);
    expect(r.volumeScore).toBe(78);
    expect(r.qualityScore).toBe(82);
    expect(r.verificationScore).toBe(90);
    expect(r.catalystScore).toBe(55);
    expect(r.aiScore).toBe(72);
    expect(r.aiConfidence).toBe(85);
    expect(r.strategyName).toBe('Test Strategy');

    expect(r.strategyId).toBe('value-hunter');
    expect(typeof r.strategyScore).toBe('number');
    expect(typeof r.strategyConfidence).toBe('number');
    expect(Array.isArray(r.passedRules)).toBe(true);
    expect(Array.isArray(r.failedRules)).toBe(true);
    expect(Array.isArray(r.signals)).toBe(true);
  });

  it('should sort results by AI Score DESC then AI Confidence DESC', async () => {
    const { engine, deps } = makeEngine();
    let callCount = 0;
    deps.scoreEngine.score = jest.fn(async (input: ScoreEngineInput) => {
      callCount++;
      const aiScore = input.ticker === 'THYAO' ? 90 : input.ticker === 'GARAN' ? 70 : 80;
      const aiConfidence = input.ticker === 'THYAO' ? 80 : input.ticker === 'GARAN' ? 90 : 75;
      return {
        ticker: input.ticker,
        strategyId: input.strategyId,
        strategyName: 'Test Strategy',
        scoredAt: new Date().toISOString(),
        pipeline: {
          scores: [
            { dimension: 'technical' as const, score: 75, label: 'Teknik', details: {} },
            { dimension: 'fundamental' as const, score: 80, label: 'Temel', details: {} },
            { dimension: 'momentum' as const, score: 70, label: 'Momentum', details: {} },
            { dimension: 'trend' as const, score: 65, label: 'Trend', details: {} },
            { dimension: 'liquidity' as const, score: 85, label: 'Likidite', details: {} },
            { dimension: 'risk' as const, score: 30, label: 'Risk', details: {} },
            { dimension: 'volume' as const, score: 78, label: 'Hacim', details: {} },
            { dimension: 'quality' as const, score: 82, label: 'Kalite', details: {} },
            { dimension: 'verification' as const, score: 90, label: 'Doğrulama', details: {} },
            { dimension: 'catalyst' as const, score: 55, label: 'Katalizör', details: {} },
          ],
          aiResult: {
            aiScore,
            aiConfidence,
            weightedScore: 70,
            scores: [],
            availableDimensionCount: 10,
            totalDimensions: 10,
          },
          pipelineDurationMs: 5,
        },
      };
    });

    const instruments = [makeInstrument('THYAO'), makeInstrument('GARAN'), makeInstrument('ASELS')];
    const strategy: EliteScannerStrategy = new ValueHunterStrategy();

    const response = await engine.scan(instruments, strategy);
    expect(response.results[0].ticker).toBe('THYAO');
    expect(response.results[0].aiScore).toBe(90);
    expect(response.results[1].ticker).toBe('ASELS');
    expect(response.results[1].aiScore).toBe(80);
    expect(response.results[2].ticker).toBe('GARAN');
    expect(response.results[2].aiScore).toBe(70);
  });

  it('should handle errors gracefully', async () => {
    const { engine, deps } = makeEngine();
    deps.orchestrator.fetchCompany.mockImplementation(async () => {
      throw new Error('hata');
    });
    const response = await engine.scan([makeInstrument('THYAO')], new ValueHunterStrategy());
    expect(response.summary.errorCount).toBe(1);
    expect(response.results).toHaveLength(0);
  });
});

describe('ScannerService with ScoreEngine', () => {
  function makeScoreEngineMock() {
    return {
      score: jest.fn(async (input: ScoreEngineInput) => ({
        ticker: input.ticker,
        strategyId: input.strategyId,
        strategyName: 'Test Strategy',
        scoredAt: new Date().toISOString(),
        pipeline: {
          scores: [
            { dimension: 'technical' as const, score: 75, label: 'Teknik', details: {} },
            { dimension: 'fundamental' as const, score: 80, label: 'Temel', details: {} },
            { dimension: 'momentum' as const, score: 70, label: 'Momentum', details: {} },
            { dimension: 'trend' as const, score: 65, label: 'Trend', details: {} },
            { dimension: 'liquidity' as const, score: 85, label: 'Likidite', details: {} },
            { dimension: 'risk' as const, score: 30, label: 'Risk', details: {} },
            { dimension: 'volume' as const, score: 78, label: 'Hacim', details: {} },
            { dimension: 'quality' as const, score: 82, label: 'Kalite', details: {} },
            { dimension: 'verification' as const, score: 90, label: 'Doğrulama', details: {} },
            { dimension: 'catalyst' as const, score: 55, label: 'Katalizör', details: {} },
          ],
          aiResult: {
            aiScore: 72,
            aiConfidence: 85,
            weightedScore: 70,
            scores: [],
            availableDimensionCount: 10,
            totalDimensions: 10,
          },
          pipelineDurationMs: 5,
        },
      })),
      scoreBatch: jest.fn(),
      getWeightProfile: jest.fn(() => null),
      listStrategies: jest.fn(() => []),
    };
  }

  function makeService() {
    const symbolRegistry = {
      getMasterRegistry: () => [
        {
          ticker: 'THYAO',
          yahooTicker: 'THYAO.IS',
          companyName: 'Türk Hava Yolları',
          turkishName: null,
          sector: 'Ulaştırma',
          industry: null,
          market: 'BIST',
          exchange: 'IST',
          currency: 'TRY',
          status: 'active',
          assetType: 'Equity',
          dataSources: [],
          isin: null,
        },
        {
          ticker: 'GARAN',
          yahooTicker: 'GARAN.IS',
          companyName: 'Garanti',
          turkishName: null,
          sector: 'Bankacılık',
          industry: null,
          market: 'BIST',
          exchange: 'IST',
          currency: 'TRY',
          status: 'active',
          assetType: 'Bank',
          dataSources: [],
          isin: null,
        },
      ],
    };
    const registry = new ScannerRegistry(symbolRegistry as any);
    const strategyRegistry = new StrategyRegistry();
    const orchestrator = {
      fetchCompany: jest.fn(async (s: string) => ({
        data: { marketCap: 100, lastUpdated: '2025-01-15T00:00:00.000Z' },
        provider: 'yahoo',
      })),
      fetchFinancials: jest.fn(async () => null),
      fetchBalanceSheet: jest.fn(async () => null),
      fetchIncomeStatement: jest.fn(async () => null),
      fetchCashFlow: jest.fn(async () => null),
    };
    const marketDataService = {
      fetchLatest: jest.fn(async () => ({
        close: 50,
        volume: 100,
        timestamp: '2025-01-15T00:00:00.000Z',
      })),
      fetchData: jest.fn(async () => []),
    };
    const cacheService = {
      getOrSet: jest.fn(async (_p: string, _t: string, _s: string, factory: () => any) =>
        factory(),
      ),
    };
    const scoreEngine = makeScoreEngineMock();
    const indicatorEngine = { calculateAll: jest.fn(() => []) };
    const verificationRepository = { getVerificationResult: jest.fn(async () => undefined) };
    const researchIntelligence = { getCompanyResearch: jest.fn(async () => ({ catalysts: [] })) };
    const engine = new EliteScannerEngine(
      orchestrator as any,
      marketDataService as any,
      cacheService as any,
      scoreEngine as any,
      indicatorEngine as any,
      verificationRepository as any,
      researchIntelligence as any,
    );
    const decisionEngine = new DecisionEngine(new DecisionExplanationService());
    const decisionRegistry = new DecisionRegistry();
    const opportunityEngine = new OpportunityEngine(
      decisionEngine,
      new OpportunityExplanationService(),
    );
    const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
    const entryService = new EntryService(
      new EntryZoneEngine(),
      new EntryRegistry(),
      marketDataService as any,
      cacheService as any,
      indicatorEngine as any,
      new MarketStructureEngine(),
      opportunityRegistry,
      new EliteScoreRegistry(),
      new TomorrowRegistry(),
      new SymbolRegistryService(),
    );
    const analystService = {
      computeForTicker: jest.fn(async () => null),
    } as unknown as AnalystService;
    const service = new ScannerService(
      registry,
      strategyRegistry,
      engine,
      new ScannerFilter(),
      scoreEngine as any,
      decisionEngine,
      decisionRegistry,
      opportunityEngine,
      opportunityRegistry,
      entryService,
      analystService,
    );
    return { service, registry, strategyRegistry };
  }

  it('should provide overview and run strategy with real AI scores', async () => {
    const { service } = makeService();

    const overview = service.getOverview();
    expect(overview.baslik).toBe('Taramalar');
    expect(overview.toplamHisse).toBe(2);
    expect(overview.stratejiSayisi).toBe(9);

    const scan = await service.runScan('value-hunter');
    expect(scan.results).toHaveLength(2);
    expect(scan.summary.strategyId).toBe('value-hunter');

    const r = scan.results[0];
    expect(r.aiScore).toBe(72);
    expect(r.aiConfidence).toBe(85);
    expect(r.technicalScore).toBe(75);
    expect(r.fundamentalScore).toBe(80);
    expect(r.momentumScore).toBe(70);
    expect(r.trendScore).toBe(65);
    expect(r.liquidityScore).toBe(85);
    expect(r.riskScore).toBe(30);
    expect(r.volumeScore).toBe(78);
    expect(r.qualityScore).toBe(82);
    expect(r.verificationScore).toBe(90);
    expect(r.catalystScore).toBe(55);
    expect(r.decision).toBeDefined();
    expect(r.decision!.ticker).toBe(r.ticker);
    expect(r.decision!.confidence).toBeGreaterThan(0);
    expect(r.decision!.reasons.length).toBeGreaterThan(0);
    expect(r.opportunity).toBeDefined();
    expect(r.opportunity!.ticker).toBe(r.ticker);
    expect(r.opportunity!.tags).toBeDefined();

    const results = service.getResults('value-hunter');
    expect(results).not.toBeNull();
    expect(service.getOverview().sonTarama).not.toBeNull();
  });

  it('should throw for unknown strategy', async () => {
    const symbolRegistry = { getMasterRegistry: () => [] };
    const scoreEngine = makeScoreEngineMock();
    const decisionEngine = new DecisionEngine(new DecisionExplanationService());
    const decisionRegistry = new DecisionRegistry();
    const opportunityEngine = new OpportunityEngine(
      decisionEngine,
      new OpportunityExplanationService(),
    );
    const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
    const service = new ScannerService(
      new ScannerRegistry(symbolRegistry as any),
      new StrategyRegistry(),
      null as any,
      new ScannerFilter(),
      scoreEngine as any,
      decisionEngine,
      decisionRegistry,
      opportunityEngine,
      opportunityRegistry,
      { computeForTicker: jest.fn(async () => null) } as unknown as EntryService,
      { computeForTicker: jest.fn(async () => null) } as unknown as AnalystService,
    );
    await expect(service.runScan('missing')).rejects.toThrow('Strateji bulunamadı');
  });

  it('should filter results by minAiScore, minConfidence and minStrategyScore', async () => {
    const { service } = makeService();

    await service.runScan('value-hunter');
    const filtered = service.filterResults({ minAiScore: 80, minConfidence: 80 });
    expect(filtered.filtreSonucu).toBeLessThanOrEqual(2);
    const filteredByStrategy = service.filterResults({ minStrategyScore: 50 });
    expect(filteredByStrategy.filtreSonucu).toBeLessThanOrEqual(2);
  });

  it('should return top results sorted by AI Score DESC', async () => {
    const { service } = makeService();

    await service.runScan('value-hunter');
    const top = service.getTopResults('value-hunter', 5);
    expect(top.length).toBeGreaterThan(0);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].aiScore!).toBeGreaterThanOrEqual(top[i].aiScore!);
    }
  });
});
