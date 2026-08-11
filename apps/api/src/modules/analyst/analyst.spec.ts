import { Test, TestingModule } from '@nestjs/testing';
import { AnalystEngine } from './analyst.engine';
import { AnalystExplanationEngine } from './analyst-explanation.engine';
import { AnalystRegistry } from './analyst.registry';
import { AnalystService } from './analyst.service';
import { AnalystController } from './analyst.controller';
import { AnalystInput, AnalystResult } from './analyst.types';
import { EntryService } from '../entry/entry.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { TomorrowRegistry } from '../tomorrow/tomorrow.registry';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { VerificationRepository } from '../research/verification-repository.service';
import { ResearchIntelligenceService } from '../research/research-intelligence.service';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { MarketStructureEngine } from '../market-structure/market-structure.engine';
import { MarketDataService } from '../market-data/market-data.service';
import { MarketDataCacheService } from '../market-data/cache/market-data-cache.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';

describe('AnalystExplanationEngine', () => {
  let engine: AnalystExplanationEngine;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AnalystExplanationEngine],
    }).compile();
    engine = module.get<AnalystExplanationEngine>(AnalystExplanationEngine);
  });

  it('should generate all 13 explanation sections', () => {
    const input = makeInput();
    const result = engine.generate(input);
    expect(typeof result.genelAnaliz).toBe('string');
    expect(typeof result.teknikAnaliz).toBe('string');
    expect(typeof result.temelAnaliz).toBe('string');
    expect(typeof result.riskAnalizi).toBe('string');
    expect(typeof result.momentumAnalizi).toBe('string');
    expect(typeof result.trendAnalizi).toBe('string');
    expect(typeof result.likiditeAnalizi).toBe('string');
    expect(typeof result.verificationAnalizi).toBe('string');
    expect(typeof result.catalystAnalizi).toBe('string');
    expect(typeof result.entryYorumu).toBe('string');
    expect(typeof result.stopYorumu).toBe('string');
    expect(typeof result.targetYorumu).toBe('string');
  });

  it('should produce deterministic output for identical inputs', () => {
    const input = makeInput();
    const r1 = engine.generate(input);
    const r2 = engine.generate(input);
    expect(r1.genelAnaliz).toBe(r2.genelAnaliz);
    expect(r1.teknikAnaliz).toBe(r2.teknikAnaliz);
    expect(r1.strengths).toEqual(r2.strengths);
    expect(r1.weaknesses).toEqual(r2.weaknesses);
    expect(r1.warnings).toEqual(r2.warnings);
  });

  it('should include trend label in genel analiz', () => {
    const input = makeInput({ trendDirection: 'uptrend' });
    const result = engine.generate(input);
    expect(result.genelAnaliz).toContain('yükseliş');
  });

  it('should include downtrend label', () => {
    const input = makeInput({ trendDirection: 'downtrend' });
    const result = engine.generate(input);
    expect(result.genelAnaliz).toContain('düşüş');
  });

  it('should include sideways label', () => {
    const input = makeInput({ trendDirection: 'sideways' });
    const result = engine.generate(input);
    expect(result.genelAnaliz).toContain('yan');
  });

  it('should report MACD positive when histogram is positive', () => {
    const input = makeInput({ macdHistogram: 1.5 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('MACD pozitif');
  });

  it('should report MACD negative when histogram is negative', () => {
    const input = makeInput({ macdHistogram: -1.5 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('MACD negatif');
  });

  it('should report RSI overbought when > 75', () => {
    const input = makeInput({ rsi: 80 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('aşırı alım');
  });

  it('should report RSI oversold when < 30', () => {
    const input = makeInput({ rsi: 25 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('aşırı satım');
  });

  it('should report RSI neutral when between 30 and 75', () => {
    const input = makeInput({ rsi: 55 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('aşırı alımda değil');
  });

  it('should report EMA20 above when price > EMA20', () => {
    const input = makeInput({ price: 100, ema20: 95 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('EMA20 üzerinde');
  });

  it('should report EMA20 below when price < EMA20', () => {
    const input = makeInput({ price: 95, ema20: 100 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('EMA20 altında');
  });

  it('should report SMA50 above when price > SMA50', () => {
    const input = makeInput({ price: 100, sma50: 95 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('SMA50 üzerinde');
  });

  it('should report Bollinger band position', () => {
    const input = makeInput({ price: 110, bbUpper: 105, bbLower: 95 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('üst bant');
  });

  it('should report Bollinger band inside when price within bands', () => {
    const input = makeInput({ price: 100, bbUpper: 105, bbLower: 95 });
    const result = engine.generate(input);
    expect(result.teknikAnaliz).toContain('bant içinde');
  });

  it('should report strong momentum when score >= 70', () => {
    const input = makeInput({ momentumScore: 80 });
    const result = engine.generate(input);
    expect(result.momentumAnalizi).toContain('kuvvetli');
  });

  it('should report weak momentum when score < 40', () => {
    const input = makeInput({ momentumScore: 30 });
    const result = engine.generate(input);
    expect(result.momentumAnalizi).toContain('zayıf');
  });

  it('should report high liquidity when score >= 70', () => {
    const input = makeInput({ liquidityScore: 80 });
    const result = engine.generate(input);
    expect(result.likiditeAnalizi).toContain('yüksek');
  });

  it('should report low liquidity when score < 40', () => {
    const input = makeInput({ liquidityScore: 30 });
    const result = engine.generate(input);
    expect(result.likiditeAnalizi).toContain('düşük');
  });

  it('should report high relative volume', () => {
    const input = makeInput({ relativeVolume: 2.0 });
    const result = engine.generate(input);
    expect(result.likiditeAnalizi).toContain('yıllık ortalamanın üzerinde');
  });

  it('should report verified when verification has high verified ratio', () => {
    const input = makeInput({
      verification: {
        ticker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        totalEvidence: 10,
        verifiedCount: 7,
        likelyCount: 2,
        unverifiedCount: 1,
        conflictingCount: 0,
        falseCount: 0,
        averageConfidence: 80,
        conflicts: [],
        evidence: [],
        verifiedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.verificationAnalizi).toContain('doğrulanmış');
  });

  it('should report conflicts when verification has conflicts', () => {
    const input = makeInput({
      verification: {
        ticker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        totalEvidence: 10,
        verifiedCount: 3,
        likelyCount: 2,
        unverifiedCount: 3,
        conflictingCount: 2,
        falseCount: 0,
        averageConfidence: 50,
        conflicts: [{ statement: 'test', sourceA: 'A', sourceB: 'B', detectedAt: '2026-01-01' }],
        evidence: [],
        verifiedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.verificationAnalizi).toContain('çelişki');
  });

  it('should report bullish catalyst when direction is Bullish', () => {
    const input = makeInput({
      catalysts: [
        {
          id: '1',
          ticker: 'THYAO',
          companyName: 'Türk Hava Yolları',
          type: 'new_investment',
          direction: 'Bullish',
          strength: { score: 80, officialSource: true, verificationScore: 70, freshnessDays: 5, multipleConfirmation: false, historicalImportance: 0.5 },
          title: 'Yeni yatırım',
          statement: 'Yeni yatırım duyurusu yapıldı',
          source: 'Bloomberg',
          sourceType: 'news',
          detectedAt: '2026-01-01T00:00:00.000Z',
          verifiedAt: '2026-01-01T00:00:00.000Z',
          verifiedBy: 'system',
        },
      ],
    });
    const result = engine.generate(input);
    expect(result.catalystAnalizi).toContain('Pozitif katalizör');
  });

  it('should report bearish catalyst when direction is Bearish', () => {
    const input = makeInput({
      catalysts: [
        {
          id: '1',
          ticker: 'THYAO',
          companyName: 'Türk Hava Yolları',
          type: 'ceo_change',
          direction: 'Bearish',
          strength: { score: 60, officialSource: true, verificationScore: 50, freshnessDays: 3, multipleConfirmation: false, historicalImportance: 0.3 },
          title: 'CEO değişikliği',
          statement: 'CEO değişikliği duyurusu',
          source: 'Bloomberg',
          sourceType: 'news',
          detectedAt: '2026-01-01T00:00:00.000Z',
          verifiedAt: '2026-01-01T00:00:00.000Z',
          verifiedBy: 'system',
        },
      ],
    });
    const result = engine.generate(input);
    expect(result.catalystAnalizi).toContain('Negatif katalizör');
  });

  it('should report no catalyst when catalysts array is empty', () => {
    const input = makeInput({ catalysts: [] });
    const result = engine.generate(input);
    expect(result.catalystAnalizi).toBe('Katalizör mevcut değil.');
  });

  it('should include entry zone range in entry yorumu', () => {
    const input = makeInput({
      entryZone: {
        ticker: 'THYAO',
        company: null,
        price: 315,
        idealEntryZone: { min: 315, max: 318 },
        aggressiveEntry: 318,
        conservativeEntry: 315,
        support1: 310,
        support2: 305,
        resistance1: 325,
        resistance2: 330,
        stopLoss: 304,
        target1: 330,
        target2: 338,
        target3: 345,
        riskRewardRatio: 3.4,
        riskRewardLabel: '1 : 3.4',
        entryConfidence: 85,
        trendDirection: 'UPTREND',
        entryQuality: { level: 'PERFECT', label: 'Mükemmel', stars: '★★★★★' },
        reasons: [],
        warnings: [],
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.entryYorumu).toContain('315-318');
  });

  it('should include stop loss in stop yorumu', () => {
    const input = makeInput({
      entryZone: {
        ticker: 'THYAO',
        company: null,
        price: 315,
        idealEntryZone: { min: 315, max: 318 },
        aggressiveEntry: 318,
        conservativeEntry: 315,
        support1: 310,
        support2: 305,
        resistance1: 325,
        resistance2: 330,
        stopLoss: 304,
        target1: 330,
        target2: 338,
        target3: 345,
        riskRewardRatio: 3.4,
        riskRewardLabel: '1 : 3.4',
        entryConfidence: 85,
        trendDirection: 'UPTREND',
        entryQuality: { level: 'PERFECT', label: 'Mükemmel', stars: '★★★★★' },
        reasons: [],
        warnings: [],
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.stopYorumu).toContain('304');
  });

  it('should include targets in target yorumu', () => {
    const input = makeInput({
      entryZone: {
        ticker: 'THYAO',
        company: null,
        price: 315,
        idealEntryZone: { min: 315, max: 318 },
        aggressiveEntry: 318,
        conservativeEntry: 315,
        support1: 310,
        support2: 305,
        resistance1: 325,
        resistance2: 330,
        stopLoss: 304,
        target1: 330,
        target2: 338,
        target3: 345,
        riskRewardRatio: 3.4,
        riskRewardLabel: '1 : 3.4',
        entryConfidence: 85,
        trendDirection: 'UPTREND',
        entryQuality: { level: 'PERFECT', label: 'Mükemmel', stars: '★★★★★' },
        reasons: [],
        warnings: [],
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.targetYorumu).toContain('330');
    expect(result.targetYorumu).toContain('338');
  });

  it('should include decision positive signals in strengths', () => {
    const input = makeInput({
      decision: {
        ticker: 'THYAO',
        company: 'Türk Hava Yolları',
        decision: 'GÜÇLÜ_AL',
        decisionLabel: 'Güçlü Al',
        decisionScore: 85,
        confidence: 90,
        reasons: ['Güçlü sinyal'],
        warnings: [],
        positiveSignals: ['Güçlü al sinyali'],
        negativeSignals: [],
        overview: { ratings: [], totalStars: 0, maxStars: 0 },
        aiScore: 80,
        aiConfidence: 85,
        strategyId: 'momentum',
        strategyName: 'Momentum',
        strategyScore: 80,
        dimensionScores: { technical: 80, fundamental: 70, momentum: 85, trend: 80, liquidity: 75, risk: 70, volume: 65, quality: 80, verification: 75, catalyst: 70 },
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.strengths).toContain('Güçlü al sinyali');
  });

  it('should include decision negative signals in weaknesses', () => {
    const input = makeInput({
      decision: {
        ticker: 'THYAO',
        company: 'Türk Hava Yolları',
        decision: 'SAT',
        decisionLabel: 'Sat',
        decisionScore: 20,
        confidence: 75,
        reasons: ['Zayıf sinyal'],
        warnings: ['Düşüş riski'],
        positiveSignals: [],
        negativeSignals: ['Zayıf sat sinyali'],
        overview: { ratings: [], totalStars: 0, maxStars: 0 },
        aiScore: 30,
        aiConfidence: 60,
        strategyId: 'value',
        strategyName: 'Değer Avcısı',
        strategyScore: 40,
        dimensionScores: { technical: 30, fundamental: 40, momentum: 25, trend: 30, liquidity: 50, risk: 60, volume: 45, quality: 35, verification: 40, catalyst: 30 },
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.weaknesses).toContain('Zayıf sat sinyali');
  });

  it('should include entry zone warnings in warnings', () => {
    const input = makeInput({
      entryZone: {
        ticker: 'THYAO',
        company: null,
        price: 315,
        idealEntryZone: { min: 315, max: 318 },
        aggressiveEntry: 318,
        conservativeEntry: 315,
        support1: 310,
        support2: 305,
        resistance1: 325,
        resistance2: 330,
        stopLoss: 304,
        target1: 330,
        target2: 338,
        target3: 345,
        riskRewardRatio: 3.4,
        riskRewardLabel: '1 : 3.4',
        entryConfidence: 85,
        trendDirection: 'UPTREND',
        entryQuality: { level: 'PERFECT', label: 'Mükemmel', stars: '★★★★★' },
        reasons: [],
        warnings: ['Risk/ödül zayıf (1 : 1.2)'],
        evaluatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should include verification positive signal', () => {
    const input = makeInput({
      verification: {
        ticker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        totalEvidence: 10,
        verifiedCount: 7,
        likelyCount: 2,
        unverifiedCount: 1,
        conflictingCount: 0,
        falseCount: 0,
        averageConfidence: 80,
        conflicts: [],
        evidence: [],
        verifiedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.positiveSignals).toContain('Doğrulanmış veri mevcut');
  });

  it('should include negative signal when conflicts exist', () => {
    const input = makeInput({
      verification: {
        ticker: 'THYAO',
        companyName: 'Türk Hava Yolları',
        totalEvidence: 10,
        verifiedCount: 3,
        likelyCount: 2,
        unverifiedCount: 3,
        conflictingCount: 2,
        falseCount: 0,
        averageConfidence: 50,
        conflicts: [{ statement: 'test', sourceA: 'A', sourceB: 'B', detectedAt: '2026-01-01' }],
        evidence: [],
        verifiedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const result = engine.generate(input);
    expect(result.negativeSignals).toContain('Çelişkili veri tespit edildi');
  });

  it('should include bullish catalyst in positive signals', () => {
    const input = makeInput({
      catalysts: [
        {
          id: '1',
          ticker: 'THYAO',
          companyName: 'Türk Hava Yolları',
          type: 'new_investment',
          direction: 'Bullish',
          strength: { score: 80, officialSource: true, verificationScore: 70, freshnessDays: 5, multipleConfirmation: false, historicalImportance: 0.5 },
          title: 'Yeni yatırım',
          statement: 'Yeni yatırım duyurusu',
          source: 'Bloomberg',
          sourceType: 'news',
          detectedAt: '2026-01-01T00:00:00.000Z',
          verifiedAt: '2026-01-01T00:00:00.000Z',
          verifiedBy: 'system',
        },
      ],
    });
    const result = engine.generate(input);
    expect(result.positiveSignals).toContain('Pozitif katalizör mevcut');
  });

  it('should include bearish catalyst in negative signals', () => {
    const input = makeInput({
      catalysts: [
        {
          id: '1',
          ticker: 'THYAO',
          companyName: 'Türk Hava Yolları',
          type: 'ceo_change',
          direction: 'Bearish',
          strength: { score: 60, officialSource: true, verificationScore: 50, freshnessDays: 3, multipleConfirmation: false, historicalImportance: 0.3 },
          title: 'CEO değişikliği',
          statement: 'CEO değişikliği duyurusu',
          source: 'Bloomberg',
          sourceType: 'news',
          detectedAt: '2026-01-01T00:00:00.000Z',
          verifiedAt: '2026-01-01T00:00:00.000Z',
          verifiedBy: 'system',
        },
      ],
    });
    const result = engine.generate(input);
    expect(result.negativeSignals).toContain('Negatif katalizör mevcut');
  });

  it('should return evaluatedAt timestamp', () => {
    const input = makeInput();
    const result = engine.generate(input);
    expect(typeof result.evaluatedAt).toBe('string');
    expect(new Date(result.evaluatedAt).getTime()).not.toBeNaN();
  });
});

describe('AnalystEngine', () => {
  let engine: AnalystEngine;
  let explanationEngine: AnalystExplanationEngine;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AnalystExplanationEngine, AnalystEngine],
    }).compile();
    explanationEngine = module.get<AnalystExplanationEngine>(AnalystExplanationEngine);
    engine = module.get<AnalystEngine>(AnalystEngine);
  });

  it('should evaluate input and return AnalystResult', () => {
    const input = makeInput();
    const result = engine.evaluate(input);
    expect(result.ticker).toBe('THYAO');
    expect(typeof result.genelAnaliz).toBe('string');
    expect(typeof result.teknikAnaliz).toBe('string');
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.positiveSignals).toBeInstanceOf(Array);
    expect(result.negativeSignals).toBeInstanceOf(Array);
  });

  it('should be deterministic for identical inputs', () => {
    const input = makeInput();
    const r1 = engine.evaluate(input);
    const r2 = engine.evaluate(input);
    expect(r1.genelAnaliz).toBe(r2.genelAnaliz);
    expect(r1.teknikAnaliz).toBe(r2.teknikAnaliz);
    expect(r1.strengths).toEqual(r2.strengths);
  });
});

describe('AnalystRegistry', () => {
  let registry: AnalystRegistry;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AnalystRegistry],
    }).compile();
    registry = module.get<AnalystRegistry>(AnalystRegistry);
  });

  it('should set, get, has, count and clear', () => {
    const result = makeAnalystResult('THYAO');
    registry.set({ ticker: 'THYAO', input: makeInput(), result, evaluatedAt: result.evaluatedAt });
    expect(registry.has('THYAO')).toBe(true);
    expect(registry.get('THYAO')).not.toBeNull();
    expect(registry.count()).toBe(1);
    expect(registry.getAll()).toHaveLength(1);
    registry.clear();
    expect(registry.count()).toBe(0);
  });

  it('should return null for missing ticker', () => {
    expect(registry.get('UNKNOWN')).toBeNull();
  });

  it('should top-sort by evaluatedAt desc', () => {
    const r1 = makeAnalystResult('A');
    const r2 = makeAnalystResult('B');
    registry.set({ ticker: 'A', input: makeInput(), result: r1, evaluatedAt: '2026-01-01T00:00:00.000Z' });
    registry.set({ ticker: 'B', input: makeInput(), result: r2, evaluatedAt: '2026-01-02T00:00:00.000Z' });
    const top = registry.top(1);
    expect(top[0].ticker).toBe('B');
  });
});

describe('AnalystService', () => {
  let service: AnalystService;
  let registry: AnalystRegistry;
  let entryService: { getCached: jest.Mock };
  let opportunityRegistry: { get: jest.Mock; getAll: jest.Mock };
  let eliteScoreRegistry: { get: jest.Mock };
  let tomorrowRegistry: { get: jest.Mock };
  let decisionRegistry: { get: jest.Mock };
  let verificationRepository: { getVerificationResult: jest.Mock };
  let researchIntelligence: { getCompanyResearch: jest.Mock };
  let indicatorEngine: { calculateAll: jest.Mock };
  let marketStructureEngine: { analyze: jest.Mock };
  let marketDataService: { fetchData: jest.Mock };
  let cacheService: { getOrSet: jest.Mock };
  let symbolRegistry: { getSymbol: jest.Mock; getActiveSymbols: jest.Mock };

  beforeEach(async () => {
    entryService = { getCached: jest.fn(() => null) };
    opportunityRegistry = { get: jest.fn(() => null), getAll: jest.fn(() => []) };
    eliteScoreRegistry = { get: jest.fn(() => null) };
    tomorrowRegistry = { get: jest.fn(() => null) };
    decisionRegistry = { get: jest.fn(() => null) };
    verificationRepository = { getVerificationResult: jest.fn(async () => null) };
    researchIntelligence = { getCompanyResearch: jest.fn(async () => ({ catalysts: [] })) };
    indicatorEngine = { calculateAll: jest.fn(() => []) };
    marketStructureEngine = { analyze: jest.fn(() => null) };
    marketDataService = { fetchData: jest.fn(async () => []) };
    cacheService = { getOrSet: jest.fn(async (_p, _t, _s, factory) => factory()) };
    symbolRegistry = { getSymbol: jest.fn(() => ({ providers: { yahoo: 'THYAO.IS' }, companyName: 'Türk Hava Yolları' })), getActiveSymbols: jest.fn(() => []) };

    const module = await Test.createTestingModule({
      providers: [
        AnalystExplanationEngine,
        AnalystEngine,
        AnalystRegistry,
        AnalystService,
        { provide: EntryService, useValue: entryService },
        { provide: OpportunityRegistry, useValue: opportunityRegistry },
        { provide: EliteScoreRegistry, useValue: eliteScoreRegistry },
        { provide: TomorrowRegistry, useValue: tomorrowRegistry },
        { provide: DecisionRegistry, useValue: decisionRegistry },
        { provide: VerificationRepository, useValue: verificationRepository },
        { provide: ResearchIntelligenceService, useValue: researchIntelligence },
        { provide: IndicatorEngine, useValue: indicatorEngine },
        { provide: MarketStructureEngine, useValue: marketStructureEngine },
        { provide: MarketDataService, useValue: marketDataService },
        { provide: MarketDataCacheService, useValue: cacheService },
        { provide: SymbolRegistryService, useValue: symbolRegistry },
      ],
    }).compile();

    service = module.get<AnalystService>(AnalystService);
    registry = module.get<AnalystRegistry>(AnalystRegistry);
  });

  it('should compute and cache an analyst result for a ticker', async () => {
    const result = await service.computeForTicker('THYAO');
    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('THYAO');
    expect(registry.has('THYAO')).toBe(true);
  });

  it('should return null when ticker has no symbol and no price', async () => {
    symbolRegistry.getSymbol.mockReturnValue(null);
    marketDataService.fetchData.mockResolvedValue([]);
    const result = await service.computeForTicker('YOK');
    expect(result).toBeNull();
  });

  it('should throw error when getByTicker finds nothing', async () => {
    symbolRegistry.getSymbol.mockReturnValue(null);
    marketDataService.fetchData.mockResolvedValue([]);
    await expect(service.getByTicker('YOK')).rejects.toThrow();
  });

  it('should return cached results from top()', async () => {
    const r1 = makeAnalystResult('THYAO');
    registry.set({ ticker: 'THYAO', input: makeInput(), result: r1, evaluatedAt: r1.evaluatedAt });
    const top = await service.top(5);
    expect(top.length).toBeGreaterThan(0);
  });

  it('should return all cached results from allCached()', async () => {
    const r1 = makeAnalystResult('THYAO');
    registry.set({ ticker: 'THYAO', input: makeInput(), result: r1, evaluatedAt: r1.evaluatedAt });
    const all = service.allCached();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should evaluate a batch of items', async () => {
    const results = await service.evaluateBatch([
      { ticker: 'THYAO', price: 100 },
      { ticker: 'GARAN', price: 200 },
    ]);
    expect(results).toBeInstanceOf(Array);
  });
});

function makeInput(overrides: Record<string, unknown> = {}): AnalystInput {
  const trendDirection = ((overrides.trendDirection as string) ?? 'uptrend').toLowerCase();
  const macdHistogram = (overrides.macdHistogram as number) ?? 0.5;
  const rsiValue = (overrides.rsi as number) ?? 55;
  const price = (overrides.price as number) ?? 315;
  const ema20 = (overrides.ema20 as number) ?? 310;
  const sma50 = (overrides.sma50 as number) ?? 305;
  const bbUpper = (overrides.bbUpper as number) ?? 325;
  const bbLower = (overrides.bbLower as number) ?? 305;
  const momentumScore = (overrides.momentumScore as number) ?? 80;
  const liquidityScore = (overrides.liquidityScore as number) ?? 80;
  const relativeVolume = (overrides.relativeVolume as number) ?? 1.2;

  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    price,
    atr: 4,
    relativeVolume,
    indicators: [
      { indicator: 'MACD', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: { macd: 1, signal: 0.5, histogram: macdHistogram }, metadata: {}, isValid: true },
      { indicator: 'RSI', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: rsiValue, metadata: {}, isValid: true },
      { indicator: 'EMA_20', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: ema20, metadata: {}, isValid: true },
      { indicator: 'SMA_50', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: sma50, metadata: {}, isValid: true },
      { indicator: 'SMA_200', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: 295, metadata: {}, isValid: true },
      { indicator: 'BollingerBands', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: { upper: bbUpper, middle: price, lower: bbLower }, metadata: {}, isValid: true },
      { indicator: 'MomentumOscillator', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: momentumScore, metadata: {}, isValid: true },
      { indicator: 'ROC', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: 3, metadata: {}, isValid: true },
      { indicator: 'ATR', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: 4, metadata: {}, isValid: true },
      { indicator: 'RelativeVolume', timeframe: '1d', timestamp: '2026-01-01T00:00:00.000Z', value: relativeVolume, metadata: {}, isValid: true },
    ],
    structure: {
      timeframe: '1d',
      trend: trendDirection as 'uptrend' | 'downtrend' | 'sideways',
      structure: [],
      swingHighs: [],
      swingLows: [],
      supportZones: [{ upper: 310, lower: 305, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] }],
      resistanceZones: [{ upper: 330, lower: 325, startIndex: 0, endIndex: 10, touches: 2, timestamps: [] }],
      breakOfStructure: [],
      changeOfCharacter: [],
      metadata: {},
      isValid: true,
    },
    opportunity: overrides.opportunity as any ?? {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      level: 'GÜÇLÜ_FIRSAT',
      levelLabel: 'Güçlü Fırsat',
      levelEmoji: '🟢',
      opportunityScore: 80,
      confidence: 85,
      decision: 'GÜÇLÜ_AL',
      decisionLabel: 'Güçlü Al',
      decisionScore: 85,
      decisionConfidence: 90,
      aiScore: 80,
      aiConfidence: 85,
      strategyId: 'momentum',
      strategyName: 'Momentum',
      strategyScore: 80,
      verification: 75,
      catalyst: 70,
      momentum: momentumScore,
      trend: 75,
      risk: 70,
      liquidity: liquidityScore,
      technical: 85,
      fundamental: 70,
      quality: 80,
      reasons: [],
      warnings: [],
      positiveSignals: ['Güçlü al sinyali'],
      negativeSignals: [],
      tags: ['Momentum', 'Güçlü Trend'],
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    },
    eliteScore: overrides.eliteScore as any ?? {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      horizons: [{ horizon: 'GUNLUK', etiket: 'Güçlü', skor: 85, confidence: 90, reasons: [], warnings: [] }],
      dominantStrategyId: 'momentum',
      dominantStrategyName: 'Momentum',
      dominantSignals: ['Güçlü yükseliş'],
      decision: 'GÜÇLÜ_AL',
      decisionLabel: 'Güçlü Al',
      opportunityLevel: 'GÜÇLÜ_FIRSAT',
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    },
    tomorrow: overrides.tomorrow as any ?? {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      tomorrowScore: 82,
      tomorrowConfidence: 88,
      category: 'HIGH',
      categoryLabel: 'Yüksek Fırsat',
      categoryStars: '★★★★☆',
      aiScore: 80,
      eliteDaily: 85,
      eliteWeekly: 80,
      decision: 'GÜÇLÜ_AL',
      decisionLabel: 'Güçlü Al',
      opportunityLevel: 'GÜÇLÜ_FIRSAT',
      opportunityScore: 80,
      strategyId: 'momentum',
      strategyName: 'Momentum',
      strategyScore: 80,
      verification: 75,
      catalyst: 70,
      reasons: [],
      warnings: [],
      positiveSignals: ['Güçlü al sinyali'],
      negativeSignals: [],
      tags: ['Momentum'],
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    },
    decision: overrides.decision as any ?? {
      ticker: 'THYAO',
      company: 'Türk Hava Yolları',
      decision: 'GÜÇLÜ_AL',
      decisionLabel: 'Güçlü Al',
      decisionScore: 85,
      confidence: 90,
      reasons: ['Güçlü sinyal'],
      warnings: [],
      positiveSignals: ['Güçlü al sinyali'],
      negativeSignals: [],
      overview: { ratings: [], totalStars: 0, maxStars: 0 },
      aiScore: 80,
      aiConfidence: 85,
      strategyId: 'momentum',
      strategyName: 'Momentum',
      strategyScore: 80,
      dimensionScores: { technical: 80, fundamental: 70, momentum: 85, trend: 80, liquidity: 75, risk: 70, volume: 65, quality: 80, verification: 75, catalyst: 70 },
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    },
    entryZone: overrides.entryZone as any ?? null,
    verification: overrides.verification as any ?? null,
    catalysts: overrides.catalysts as any ?? [],
  };
}

function makeAnalystResult(ticker: string): AnalystResult {
  return {
    ticker,
    company: null,
    genelAnaliz: 'Test',
    teknikAnaliz: 'Test',
    temelAnaliz: 'Test',
    riskAnalizi: 'Test',
    momentumAnalizi: 'Test',
    trendAnalizi: 'Test',
    likiditeAnalizi: 'Test',
    verificationAnalizi: 'Test',
    catalystAnalizi: 'Test',
    entryYorumu: 'Test',
    stopYorumu: 'Test',
    targetYorumu: 'Test',
    strengths: [],
    weaknesses: [],
    warnings: [],
    positiveSignals: [],
    negativeSignals: [],
    evaluatedAt: '2026-01-01T00:00:00.000Z',
  };
}