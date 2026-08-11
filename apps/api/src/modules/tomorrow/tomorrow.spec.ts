import { DecisionEngine } from '../decision/decision-engine.service';
import { DecisionExplanationService } from '../decision/decision-explanation.service';
import { OpportunityEngine } from '../ai-opportunity/opportunity-engine.service';
import { OpportunityExplanationService } from '../ai-opportunity/opportunity-explanation.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityRankingService } from '../ai-opportunity/opportunity-ranking.service';
import { OPPORTUNITY_LEVEL_META, OpportunityLevel, OpportunityInput, OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreEngine } from '../ai-elite-score/elite-score.engine';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { EliteScoreService } from '../ai-elite-score/elite-score.service';
import { ELITE_SCORE_HORIZONS, EliteScoreHorizonResult, EliteScoreResult } from '../ai-elite-score/elite-score.types';
import { TOMORROW_CATEGORIES } from './tomorrow.config';
import { TomorrowOpportunityEngine } from './tomorrow.engine';
import { TomorrowRegistry } from './tomorrow.registry';
import { TomorrowService } from './tomorrow.service';
import { TomorrowController } from './tomorrow.controller';
import { TomorrowCandidateResult, TomorrowInput } from './tomorrow.types';

function makeResult(
  ticker: string,
  opts: Partial<Pick<OpportunityResult, 'aiScore' | 'aiConfidence' | 'decisionScore' | 'decisionConfidence' | 'opportunityScore' | 'confidence' | 'strategyScore' | 'verification' | 'catalyst' | 'level'>> = {},
): OpportunityResult {
  const level: OpportunityLevel = opts.level ?? 'İZLEME_LISTESI';
  const meta = OPPORTUNITY_LEVEL_META[level];
  const d = (v: number | null | undefined, fallback: number) => v ?? fallback;
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    level,
    levelLabel: meta.label,
    levelEmoji: meta.emoji,
    opportunityScore: d(opts.opportunityScore, 60),
    confidence: d(opts.confidence, 60),
    decision: 'AL',
    decisionLabel: 'AL',
    decisionScore: d(opts.decisionScore, 60),
    decisionConfidence: d(opts.decisionConfidence, 60),
    aiScore: d(opts.aiScore, 60),
    aiConfidence: d(opts.aiConfidence, 60),
    strategyId: 'value-hunter',
    strategyName: 'Değer Avcısı',
    strategyScore: d(opts.strategyScore, 60),
    verification: d(opts.verification, 60),
    catalyst: d(opts.catalyst, 60),
    momentum: 60,
    trend: 60,
    risk: 60,
    liquidity: 60,
    technical: 60,
    fundamental: 60,
    quality: 60,
    reasons: ['Gerekçe'],
    warnings: [],
    positiveSignals: ['Momentum güçlü'],
    negativeSignals: [],
    tags: [],
    evaluatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeElite(ticker: string, daily: number, weekly: number, confidence = 60): EliteScoreResult {
  const horizon = (horizon: string, skor: number): EliteScoreHorizonResult => ({
    horizon: horizon as (typeof ELITE_SCORE_HORIZONS)[number],
    etiket: horizon,
    skor,
    confidence,
    reasons: [`${horizon} Elite Skor: ${skor}/100`],
    warnings: [],
  });
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    horizons: [
      horizon('GUNLUK', daily),
      horizon('HAFTALIK', weekly),
      horizon('AYLIK', weekly),
      horizon('UC_AYLIK', weekly),
      horizon('ALTI_AYLIK', weekly),
    ],
    dominantStrategyId: 'value-hunter',
    dominantStrategyName: 'Değer Avcısı',
    dominantSignals: [],
    decision: 'AL',
    decisionLabel: 'AL',
    opportunityLevel: 'İZLEME_LISTESI',
    evaluatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeInput(ticker: string, daily = 60, weekly = 60): TomorrowInput {
  return { opportunity: makeResult(ticker), elite: makeElite(ticker, daily, weekly) };
}

function makeEngine(): TomorrowOpportunityEngine {
  return new TomorrowOpportunityEngine();
}

function inputOf(ticker: string): OpportunityInput {
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    sector: null,
    price: null,
    aiScore: 60,
    aiConfidence: 60,
    strategyId: 'value-hunter',
    strategyName: 'Değer Avcısı',
    strategyScore: 60,
    strategyConfidence: null,
    dimensions: {
      technical: null,
      fundamental: null,
      momentum: null,
      trend: null,
      liquidity: null,
      risk: null,
      volume: null,
      quality: null,
      verification: null,
      catalyst: null,
    },
  };
}

function makeService() {
  const decisionEngine = new DecisionEngine(new DecisionExplanationService());
  const opportunityEngine = new OpportunityEngine(decisionEngine, new OpportunityExplanationService());
  const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
  const eliteScoreEngine = new EliteScoreEngine();
  const eliteScoreRegistry = new EliteScoreRegistry();
  const eliteScoreService = new EliteScoreService(eliteScoreEngine, eliteScoreRegistry, opportunityRegistry, opportunityEngine);
  const engine = makeEngine();
  const registry = new TomorrowRegistry();
  const service = new TomorrowService(
    engine,
    registry,
    opportunityRegistry,
    eliteScoreService,
    eliteScoreRegistry,
    opportunityEngine,
    eliteScoreEngine,
  );
  return { service, registry, opportunityRegistry };
}

describe('TomorrowOpportunityEngine (deterministic)', () => {
  it('should expose 5 categories in order with stars', () => {
    expect(TOMORROW_CATEGORIES.map((c) => c.category)).toEqual([
      'VERY_HIGH',
      'HIGH',
      'MEDIUM',
      'WATCH',
      'WEAK',
    ]);
    expect(TOMORROW_CATEGORIES.map((c) => c.stars)).toEqual([
      '★★★★★',
      '★★★★☆',
      '★★★☆☆',
      '★★☆☆☆',
      '★☆☆☆☆',
    ]);
  });

  it('should evaluate all-60 input to tomorrow score 60 and MEDIUM category', () => {
    const r = makeEngine().evaluate(makeInput('THYAO'));
    expect(r.tomorrowScore).toBe(60);
    expect(r.category).toBe('MEDIUM');
    expect(r.categoryLabel).toBe('Orta Fırsat');
    expect(r.eliteDaily).toBe(60);
    expect(r.eliteWeekly).toBe(60);
  });

  it('should be deterministic for identical inputs', () => {
    const engine = makeEngine();
    const a = engine.evaluate(makeInput('THYAO'));
    const b = engine.evaluate(makeInput('THYAO'));
    const { evaluatedAt: _ea, ...aCore } = a;
    const { evaluatedAt: _eb, ...bCore } = b;
    expect(aCore).toEqual(bCore);
  });

  it('should be VERY_HIGH when all inputs are 95', () => {
    const input: TomorrowInput = {
      opportunity: makeResult('THYAO', {
        aiScore: 95,
        aiConfidence: 95,
        decisionScore: 95,
        decisionConfidence: 95,
        opportunityScore: 95,
        confidence: 95,
        strategyScore: 95,
        verification: 95,
        catalyst: 95,
      }),
      elite: makeElite('THYAO', 95, 95, 95),
    };
    const r = makeEngine().evaluate(input);
    expect(r.tomorrowScore).toBeGreaterThanOrEqual(85);
    expect(r.category).toBe('VERY_HIGH');
  });

  it('should rank tomorrow score as weighted average', () => {
    const input: TomorrowInput = {
      opportunity: makeResult('THYAO', { opportunityScore: 100, aiScore: 0, decisionScore: 0, verification: 0, catalyst: 0, confidence: 0 }),
      elite: makeElite('THYAO', 0, 0, 0),
    };
    const r = makeEngine().evaluate(input);
    expect(r.tomorrowScore).toBe(20);
  });

  it('should include Turkish reasons and warnings', () => {
    const withWarnings: TomorrowInput = {
      opportunity: { ...makeResult('THYAO'), warnings: ['Likidite zayıf'], verification: 10 },
      elite: makeElite('THYAO', 60, 60),
    };
    const r = makeEngine().evaluate(withWarnings);
    expect(r.reasons[0]).toBe('Yarın Skoru: 56/100');
    expect(r.reasons.some((x) => x.startsWith('Karar:'))).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('Fırsat:'))).toBe(true);
    expect(r.warnings).toContain('Likidite zayıf');
    expect(r.warnings.some((x) => x.includes('Doğrulama zayıf'))).toBe(true);
  });

  it('should propagate signals and tags', () => {
    const r = makeEngine().evaluate(makeInput('THYAO'));
    expect(r.positiveSignals).toContain('Momentum güçlü');
    expect(r.negativeSignals).toEqual([]);
  });

  it('should handle a null verification dimension without NaN', () => {
    const input: TomorrowInput = {
      opportunity: { ...makeResult('THYAO'), verification: null, catalyst: null },
      elite: makeElite('THYAO', 60, 60),
    };
    const r = makeEngine().evaluate(input);
    expect(Number.isNaN(r.tomorrowScore)).toBe(false);
    expect(r.tomorrowScore).toBeGreaterThan(0);
  });
});

describe('TomorrowRegistry', () => {
  function seed() {
    const registry = new TomorrowRegistry();
    const engine = makeEngine();
    const a = engine.evaluate(makeInput('A', 90, 90));
    const b = engine.evaluate(makeInput('B', 40, 40));
    registry.set({ ticker: 'A', input: makeInput('A'), result: a, evaluatedAt: a.evaluatedAt });
    registry.set({ ticker: 'B', input: makeInput('B'), result: b, evaluatedAt: b.evaluatedAt });
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

  it('should top-sort by tomorrow score then elite daily then ai score then confidence', () => {
    const { registry } = seed();
    expect(registry.top(10).map((r) => r.ticker)).toEqual(['A', 'B']);
  });

  it('should respect the limit', () => {
    const { registry } = seed();
    expect(registry.top(1).map((r) => r.ticker)).toEqual(['A']);
  });
});

describe('TomorrowService', () => {
  it('should sync from OpportunityRegistry + EliteScoreRegistry', () => {
    const { service, registry, opportunityRegistry } = makeService();
    const opportunity = makeResult('THYAO');
    opportunityRegistry.set({
      ticker: 'THYAO',
      input: inputOf('THYAO'),
      result: opportunity,
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    });
    service.sync();
    expect(registry.count()).toBe(1);
    expect(service.getByTicker('THYAO').ticker).toBe('THYAO');
    expect(service.getByTicker('THYAO').category).toBeDefined();
  });

  it('should throw NotFoundException for unknown ticker', () => {
    const { service } = makeService();
    expect(() => service.getByTicker('YOK')).toThrow();
  });

  it('should evaluate a batch through Opportunity + EliteScore engines', () => {
    const { service, registry } = makeService();
    const results = service.evaluateBatch([
      { ticker: 'THYAO', company: 'Türk Hava Yolları', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 80 } },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('THYAO');
    expect(results[0].category).toBe('VERY_HIGH');
    expect(registry.count()).toBe(1);
  });

  it('should expose the night analysis window (architecture only, no scheduler)', () => {
    const { service } = makeService();
    const w = service.nightAnalysisWindow();
    expect(w.baslik).toBe('Gece Analizi');
    expect(w.saatler).toEqual(['22:00', '23:00', '00:00']);
    expect(w.durum).toBe('mimari-hazir');
  });
});

describe('TomorrowController', () => {
  function makeController() {
    const decisionEngine = new DecisionEngine(new DecisionExplanationService());
    const opportunityEngine = new OpportunityEngine(decisionEngine, new OpportunityExplanationService());
    const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
    opportunityRegistry.set({
      ticker: 'THYAO',
      input: inputOf('THYAO'),
      result: makeResult('THYAO'),
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    });
    const eliteScoreEngine = new EliteScoreEngine();
    const eliteScoreRegistry = new EliteScoreRegistry();
    const eliteScoreService = new EliteScoreService(eliteScoreEngine, eliteScoreRegistry, opportunityRegistry, opportunityEngine);
    const service = new TomorrowService(
      makeEngine(),
      new TomorrowRegistry(),
      opportunityRegistry,
      eliteScoreService,
      eliteScoreRegistry,
      opportunityEngine,
      eliteScoreEngine,
    );
    return { controller: new TomorrowController(service) };
  }

  it('GET /tomorrow should return ranked results with night analysis meta', () => {
    const { controller } = makeController();
    const res = controller.getAll();
    expect(res.baslik).toBe('Yarın Fırsatları');
    expect(res.geceAnalizi.baslik).toBe('Gece Analizi');
  });

  it('GET /tomorrow/top10 should return limited results', () => {
    const { controller } = makeController();
    const res = controller.top10();
    expect(res.baslik).toBe('Top 10 Yarın Fırsatları');
    expect(Array.isArray(res.sonuclar)).toBe(true);
  });

  it('GET /tomorrow/top20 should return limited results', () => {
    const { controller } = makeController();
    const res = controller.top20();
    expect(res.baslik).toBe('Top 20 Yarın Fırsatları');
  });

  it('GET /tomorrow/:ticker should return the single result', () => {
    const { controller } = makeController();
    const res = controller.getByTicker({ ticker: 'THYAO' });
    expect(res.ticker).toBe('THYAO');
    expect(res.eliteDaily).toBeDefined();
  });

  it('POST /tomorrow/batch should evaluate items', () => {
    const { controller } = makeController();
    const res = controller.evaluateBatch({
      items: [
        { ticker: 'GARAN', company: 'Garanti', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 85 } },
      ],
    });
    expect(res.islenen).toBe(1);
    expect(res.sonuclar[0].ticker).toBe('GARAN');
    expect(res.sonuclar[0].categoryStars).toBe('★★★★★');
  });
});
