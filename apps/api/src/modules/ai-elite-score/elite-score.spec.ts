import { DecisionEngine } from '../decision/decision-engine.service';
import { DecisionExplanationService } from '../decision/decision-explanation.service';
import { OpportunityEngine } from '../ai-opportunity/opportunity-engine.service';
import { OpportunityExplanationService } from '../ai-opportunity/opportunity-explanation.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityRankingService } from '../ai-opportunity/opportunity-ranking.service';
import { OPPORTUNITY_LEVEL_META, OpportunityLevel, OpportunityInput, OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreEngine } from './elite-score.engine';
import { EliteScoreRegistry } from './elite-score.registry';
import { EliteScoreService } from './elite-score.service';
import { EliteScoreController } from './elite-score.controller';
import { ELITE_SCORE_HORIZONS, EliteScoreResult } from './elite-score.types';

function makeResult(
  ticker: string,
  opts: Partial<Pick<OpportunityResult, 'aiScore' | 'aiConfidence' | 'decisionScore' | 'decisionConfidence' | 'opportunityScore' | 'confidence' | 'strategyId' | 'strategyName' | 'strategyScore' | 'level' | 'verification' | 'catalyst' | 'momentum' | 'trend' | 'liquidity' | 'quality' | 'technical' | 'fundamental' | 'risk'>> = {},
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
    decision: 'İZLE',
    decisionLabel: 'İZLE',
    decisionScore: d(opts.decisionScore, 60),
    decisionConfidence: d(opts.decisionConfidence, 60),
    aiScore: d(opts.aiScore, 60),
    aiConfidence: d(opts.aiConfidence, 60),
    strategyId: opts.strategyId ?? 'value-hunter',
    strategyName: opts.strategyName ?? 'Değer Avcısı',
    strategyScore: d(opts.strategyScore, 60),
    verification: d(opts.verification, 60),
    catalyst: d(opts.catalyst, 60),
    momentum: d(opts.momentum, 60),
    trend: d(opts.trend, 60),
    risk: d(opts.risk, 60),
    liquidity: d(opts.liquidity, 60),
    technical: d(opts.technical, 60),
    fundamental: d(opts.fundamental, 60),
    quality: d(opts.quality, 60),
    reasons: ['Gerekçe'],
    warnings: [],
    positiveSignals: [],
    negativeSignals: [],
    tags: [],
    evaluatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeEngine(): EliteScoreEngine {
  return new EliteScoreEngine();
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
  const engine = makeEngine();
  const registry = new EliteScoreRegistry();
  const service = new EliteScoreService(engine, registry, opportunityRegistry, opportunityEngine);
  return { service, registry, opportunityRegistry };
}

function horizonOf(result: EliteScoreResult, horizon: (typeof ELITE_SCORE_HORIZONS)[number]) {
  return result.horizons.find((h) => h.horizon === horizon)!;
}

describe('EliteScoreEngine (deterministic composite)', () => {
  it('should expose exactly 5 horizons', () => {
    expect(ELITE_SCORE_HORIZONS).toEqual(['GUNLUK', 'HAFTALIK', 'AYLIK', 'UC_AYLIK', 'ALTI_AYLIK']);
  });

  it('should produce 60/100 for every horizon when all inputs are 60', () => {
    const result = makeEngine().evaluate(makeResult('THYAO'));
    for (const h of result.horizons) {
      expect(h.skor).toBe(60);
      expect(h.confidence).toBe(60);
    }
  });

  it('should be deterministic for identical inputs', () => {
    const engine = makeEngine();
    const a = engine.evaluate(makeResult('THYAO'));
    const b = engine.evaluate(makeResult('THYAO'));
    const { evaluatedAt: _ea, ...aCore } = a;
    const { evaluatedAt: _eb, ...bCore } = b;
    expect(aCore).toEqual(bCore);
  });

  it('should tilt daily score toward momentum', () => {
    const result = makeEngine().evaluate(
      makeResult('THYAO', { momentum: 95, fundamental: 20 }),
    );
    const daily = horizonOf(result, 'GUNLUK').skor;
    const sixMonth = horizonOf(result, 'ALTI_AYLIK').skor;
    expect(daily).toBeGreaterThan(sixMonth);
  });

  it('should tilt 6M score toward fundamentals', () => {
    const result = makeEngine().evaluate(
      makeResult('THYAO', { fundamental: 95, momentum: 20 }),
    );
    const daily = horizonOf(result, 'GUNLUK').skor;
    const sixMonth = horizonOf(result, 'ALTI_AYLIK').skor;
    expect(sixMonth).toBeGreaterThan(daily);
  });

  it('should include Turkish reasons per horizon', () => {
    const result = makeEngine().evaluate(makeResult('THYAO'));
    const daily = horizonOf(result, 'GUNLUK');
    expect(daily.reasons[0]).toBe('Günlük Elite Skor: 60/100');
    expect(daily.reasons.some((r) => r.startsWith('Karar:'))).toBe(true);
    expect(daily.reasons.some((r) => r.startsWith('Fırsat:'))).toBe(true);
    expect(daily.reasons.some((r) => r.includes('katkısı güçlü'))).toBe(true);
  });

  it('should report dominant strategy and signals', () => {
    const result = makeEngine().evaluate(
      makeResult('THYAO', { strategyId: 'momentum', strategyName: 'Momentum', momentum: 85 }),
    );
    expect(result.dominantStrategyId).toBe('momentum');
    expect(result.dominantStrategyName).toBe('Momentum');
    expect(result.dominantSignals.some((s) => s.includes('Momentum güçlü'))).toBe(true);
    expect(result.dominantSignals.length).toBeLessThanOrEqual(5);
  });

  it('should propagate production warnings', () => {
    const withWarnings = { ...makeResult('THYAO'), warnings: ['Likidite zayıf'] };
    const daily = horizonOf(makeEngine().evaluate(withWarnings), 'GUNLUK');
    expect(daily.warnings).toContain('Likidite zayıf');
  });
});

describe('EliteScoreRegistry', () => {
  function seed() {
    const registry = new EliteScoreRegistry();
    const engine = makeEngine();
    const a = engine.evaluate(makeResult('A', { aiScore: 90, opportunityScore: 90, decisionScore: 90, confidence: 90, aiConfidence: 90, decisionConfidence: 90, momentum: 90 }));
    const b = engine.evaluate(makeResult('B', { aiScore: 40, opportunityScore: 40, decisionScore: 40, confidence: 40, aiConfidence: 40, decisionConfidence: 40 }));
    registry.set({ ticker: 'A', input: null, result: a, evaluatedAt: a.evaluatedAt });
    registry.set({ ticker: 'B', input: null, result: b, evaluatedAt: b.evaluatedAt });
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

  it('should top-sort by daily score', () => {
    const { registry } = seed();
    expect(registry.top(10).map((r) => r.ticker)).toEqual(['A', 'B']);
  });

  it('should rank by a given horizon', () => {
    const { registry } = seed();
    const weekly = registry.rankedByHorizon('HAFTALIK', 10);
    expect(weekly.map((r) => r.ticker)).toEqual(['A', 'B']);
  });
});

describe('EliteScoreService', () => {
  it('should sync results from the OpportunityRegistry', () => {
    const { service, registry, opportunityRegistry } = makeService();
    opportunityRegistry.set({
      ticker: 'THYAO',
      input: inputOf('THYAO'),
      result: makeResult('THYAO'),
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    });
    service.sync();
    expect(registry.count()).toBe(1);
    expect(service.getByTicker('THYAO').ticker).toBe('THYAO');
  });

  it('should throw NotFoundException for unknown ticker', () => {
    const { service } = makeService();
    expect(() => service.getByTicker('YOK')).toThrow();
  });

  it('should evaluate a batch through the Opportunity Engine', () => {
    const { service, registry } = makeService();
    const results = service.evaluateBatch([
      { ticker: 'THYAO', company: 'Türk Hava Yolları', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 80 } },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('THYAO');
    expect(results[0].horizons).toHaveLength(5);
    expect(registry.count()).toBe(1);
  });
});

describe('EliteScoreController', () => {
  function makeController() {
    const decisionEngine = new DecisionEngine(new DecisionExplanationService());
    const opportunityEngine = new OpportunityEngine(decisionEngine, new OpportunityExplanationService());
    const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
    opportunityRegistry.set({
      ticker: 'THYAO',
      input: inputOf('THYAO'),
      result: makeResult('THYAO', { strategyId: 'momentum', momentum: 90 }),
      evaluatedAt: '2026-01-01T00:00:00.000Z',
    });
    const service = new EliteScoreService(
      makeEngine(),
      new EliteScoreRegistry(),
      opportunityRegistry,
      opportunityEngine,
    );
    return { controller: new EliteScoreController(service) };
  }

  it('GET /elite-score/top should return ranked results', () => {
    const { controller } = makeController();
    const res = controller.top();
    expect(res.baslik).toBe('Elite Skor Sıralaması');
    expect(res.sonuclar[0].ticker).toBe('THYAO');
    expect(res.sonuclar[0].horizons).toHaveLength(5);
  });

  it('GET /elite-score/daily should return daily ranked', () => {
    const { controller } = makeController();
    const res = controller.daily();
    expect(res.sonuclar[0].horizons.find((h) => h.horizon === 'GUNLUK')!.skor).toBeGreaterThan(0);
  });

  it('GET /elite-score/weekly should return weekly ranked', () => {
    const { controller } = makeController();
    const res = controller.weekly();
    expect(res.sonuclar[0].horizons.find((h) => h.horizon === 'HAFTALIK')!.skor).toBeGreaterThan(0);
  });

  it('GET /elite-score/monthly should return monthly ranked', () => {
    const { controller } = makeController();
    const res = controller.monthly();
    expect(res.sonuclar[0].horizons.find((h) => h.horizon === 'AYLIK')!.skor).toBeGreaterThan(0);
  });

  it('GET /elite-score/3m should return 3M ranked', () => {
    const { controller } = makeController();
    const res = controller.threeMonth();
    expect(res.sonuclar[0].horizons.find((h) => h.horizon === 'UC_AYLIK')!.skor).toBeGreaterThan(0);
  });

  it('GET /elite-score/6m should return 6M ranked', () => {
    const { controller } = makeController();
    const res = controller.sixMonth();
    expect(res.sonuclar[0].horizons.find((h) => h.horizon === 'ALTI_AYLIK')!.skor).toBeGreaterThan(0);
  });

  it('GET /elite-score/:ticker should return the single result', () => {
    const { controller } = makeController();
    const res = controller.getByTicker({ ticker: 'THYAO' });
    expect(res.ticker).toBe('THYAO');
    expect(res.dominantStrategyId).toBe('momentum');
  });

  it('POST /elite-score/batch should evaluate items', () => {
    const { controller } = makeController();
    const res = controller.evaluateBatch({
      items: [
        { ticker: 'GARAN', company: 'Garanti', strategyId: 'value-hunter', aiScore: 80, aiConfidence: 70 },
      ],
    });
    expect(res.islenen).toBe(1);
    expect(res.sonuclar[0].ticker).toBe('GARAN');
    expect(res.sonuclar[0].horizons).toHaveLength(5);
  });
});
