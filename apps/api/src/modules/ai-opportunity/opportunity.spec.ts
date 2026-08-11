import { DecisionEngine } from '../decision/decision-engine.service';
import { DecisionExplanationService } from '../decision/decision-explanation.service';
import { DecisionInput, DecisionDimensionScores } from '../decision/decision.types';
import { OpportunityEngine } from './opportunity-engine.service';
import { OpportunityRegistry } from './opportunity-registry.service';
import { OpportunityRankingService } from './opportunity-ranking.service';
import { OpportunityExplanationService } from './opportunity-explanation.service';
import { OpportunityController } from './opportunity.controller';
import {
  evaluateOpportunityLevel,
  getOpportunityLevelStrength,
} from './opportunity-rules';
import { OPPORTUNITY_LEVELS, OPPORTUNITY_TAGS, OpportunityLevel, OpportunityResult, OpportunityTag } from './opportunity.types';

function makeDimensions(overrides: Partial<DecisionDimensionScores> = {}): DecisionDimensionScores {
  return {
    technical: 50,
    fundamental: 50,
    momentum: 50,
    trend: 50,
    liquidity: 50,
    risk: 60,
    volume: 50,
    quality: 50,
    verification: 50,
    catalyst: 50,
    ...overrides,
  };
}

function makeInput(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    sector: 'Ulaştırma',
    price: 280,
    aiScore: 50,
    aiConfidence: 50,
    strategyId: 'value-hunter',
    strategyName: 'Değer Avcısı',
    strategyScore: 60,
    strategyConfidence: 55,
    dimensions: makeDimensions(),
    ...overrides,
  };
}

function makeOpportunityEngine(): OpportunityEngine {
  const decisionEngine = new DecisionEngine(new DecisionExplanationService());
  return new OpportunityEngine(decisionEngine, new OpportunityExplanationService());
}

describe('Opportunity Level Rules (deterministic)', () => {
  it('should expose 5 levels only', () => {
    expect(OPPORTUNITY_LEVELS).toEqual(['ÇOK_GÜÇLÜ_FIRSAT', 'GÜÇLÜ_FIRSAT', 'FIRSAT', 'İZLEME_LISTESI', 'BEKLE']);
  });

  it('GÜÇLÜ_AL decision maps to Çok Güçlü Fırsat', () => {
    const level = evaluateOpportunityLevel('GÜÇLÜ_AL', 95, 90);
    expect(level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
  });

  it('AL decision maps to Güçlü Fırsat', () => {
    expect(evaluateOpportunityLevel('AL', 80, 70)).toBe('GÜÇLÜ_FIRSAT');
  });

  it('İZLE with high AI score maps to Fırsat', () => {
    expect(evaluateOpportunityLevel('İZLE', 75, 70)).toBe('FIRSAT');
  });

  it('İZLE with lower AI score maps to İzleme Listesi', () => {
    expect(evaluateOpportunityLevel('İZLE', 65, 70)).toBe('İZLEME_LISTESI');
  });

  it('BEKLE with decent AI score maps to İzleme Listesi', () => {
    expect(evaluateOpportunityLevel('BEKLE', 58, 50)).toBe('İZLEME_LISTESI');
  });

  it('BEKLE with low AI score maps to Bekle', () => {
    expect(evaluateOpportunityLevel('BEKLE', 50, 50)).toBe('BEKLE');
  });

  it('RİSKLİ, SAT and GÜÇLÜ_SAT map to Bekle', () => {
    expect(evaluateOpportunityLevel('RİSKLİ', 50, 50)).toBe('BEKLE');
    expect(evaluateOpportunityLevel('SAT', 30, 50)).toBe('BEKLE');
    expect(evaluateOpportunityLevel('GÜÇLÜ_SAT', 15, 50)).toBe('BEKLE');
  });

  it('should provide consistent level strength ordering', () => {
    const strengths = OPPORTUNITY_LEVELS.map((l) => getOpportunityLevelStrength(l));
    expect(strengths).toEqual([5, 4, 3, 2, 1]);
  });
});

describe('OpportunityEngine levels (end-to-end)', () => {
  const engine = makeOpportunityEngine();

  it('should produce Çok Güçlü Fırsat from a strong buy', () => {
    const result = engine.evaluate(
      makeInput({
        aiScore: 95,
        aiConfidence: 90,
        dimensions: makeDimensions({ verification: 85, catalyst: 80, risk: 70 }),
      }),
    );
    expect(result.level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
    expect(result.levelLabel).toBe('Çok Güçlü Fırsat');
    expect(result.levelEmoji).toBe('🔥');
    expect(result.decision).toBe('GÜÇLÜ_AL');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.opportunityScore).toBeGreaterThanOrEqual(60);
    expect(result.reasons.some((r) => r.startsWith('Karar:'))).toBe(true);
  });

  it('should produce Güçlü Fırsat from AL', () => {
    const result = engine.evaluate(
      makeInput({ aiScore: 80, aiConfidence: 70, dimensions: makeDimensions({ verification: 50, catalyst: 50 }) }),
    );
    expect(result.level).toBe('GÜÇLÜ_FIRSAT');
    expect(result.levelEmoji).toBe('🟢');
  });

  it('should produce Fırsat from İZLE with strong AI score', () => {
    const result = engine.evaluate(
      makeInput({ aiScore: 72, aiConfidence: 70, dimensions: makeDimensions({ verification: 50, catalyst: 50 }) }),
    );
    expect(result.level).toBe('FIRSAT');
    expect(result.decision).toBe('İZLE');
  });

  it('should produce İzleme Listesi from İZLE with weaker AI score', () => {
    const result = engine.evaluate(
      makeInput({ aiScore: 60, aiConfidence: 70, dimensions: makeDimensions({ verification: 50, catalyst: 50 }) }),
    );
    expect(result.level).toBe('İZLEME_LISTESI');
  });

  it('should produce Bekle for SAT decision', () => {
    const result = engine.evaluate(makeInput({ aiScore: 30 }));
    expect(result.level).toBe('BEKLE');
    expect(result.levelEmoji).toBe('⚪');
  });

  it('should reuse decision positive/negative signals', () => {
    const result = engine.evaluate(
      makeInput({
        aiScore: 95,
        aiConfidence: 90,
        dimensions: makeDimensions({ technical: 80, verification: 85, catalyst: 80, risk: 75 }),
      }),
    );
    expect(result.positiveSignals).toContain('Güçlü teknik görünüm');
    expect(result.positiveSignals).toContain('Düşük risk profili');
  });

  it('should be deterministic for identical inputs', () => {
    const a = engine.evaluate(makeInput({ aiScore: 72, aiConfidence: 70 }));
    const b = engine.evaluate(makeInput({ aiScore: 72, aiConfidence: 70 }));
    const { evaluatedAt: _ea, ...aCore } = a;
    const { evaluatedAt: _eb, ...bCore } = b;
    expect(aCore).toEqual(bCore);
  });

  it('should evaluate many inputs with precomputed decisions', () => {
    const decisionEngine = new DecisionEngine(new DecisionExplanationService());
    const input = makeInput({ ticker: 'THYAO', aiScore: 95, aiConfidence: 90, dimensions: makeDimensions({ verification: 85, catalyst: 80 }) });
    const decision = decisionEngine.evaluate(input);
    const results = engine.evaluateMany([input], new Map([[input.ticker, decision]]));
    expect(results).toHaveLength(1);
    expect(results[0].level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
  });
});

describe('Opportunity Tags', () => {
  const engine = makeOpportunityEngine();

  function tagCase(dims: Partial<DecisionDimensionScores>, extra: Partial<DecisionInput> = {}): OpportunityResult {
    return engine.evaluate(makeInput({ ...extra, aiScore: 70, aiConfidence: 70, dimensions: makeDimensions(dims) }));
  }

  it('should expose all 11 supported tags', () => {
    expect(OPPORTUNITY_TAGS).toHaveLength(11);
    expect(OPPORTUNITY_TAGS).toContain('Erken Kırılım');
    expect(OPPORTUNITY_TAGS).toContain('Yüksek Likidite');
  });

  it('should tag Erken Kırılım', () => {
    const r = tagCase({ technical: 80, momentum: 70 });
    expect(r.tags).toContain('Erken Kırılım');
  });

  it('should tag Akıllı Para for smart-money strategy', () => {
    const r = tagCase({}, { strategyId: 'smart-money', strategyScore: 75 });
    expect(r.tags).toContain('Akıllı Para');
  });

  it('should tag Dip Toplama for dip-collector strategy', () => {
    const r = tagCase({}, { strategyId: 'dip-collector', strategyScore: 75 });
    expect(r.tags).toContain('Dip Toplama');
  });

  it('should tag Trend Başlangıcı', () => {
    const r = tagCase({ trend: 80 });
    expect(r.tags).toContain('Trend Başlangıcı');
  });

  it('should tag Momentum', () => {
    const r = tagCase({ momentum: 75 });
    expect(r.tags).toContain('Momentum');
  });

  it('should tag Hacim Patlaması', () => {
    const r = tagCase({ volume: 80 });
    expect(r.tags).toContain('Hacim Patlaması');
  });

  it('should tag Doğrulanmış Haber', () => {
    const r = tagCase({ verification: 80 });
    expect(r.tags).toContain('Doğrulanmış Haber');
  });

  it('should tag Yeni Katalizör', () => {
    const r = tagCase({ catalyst: 75 });
    expect(r.tags).toContain('Yeni Katalizör');
  });

  it('should tag Güçlü Temel', () => {
    const r = tagCase({ fundamental: 80 });
    expect(r.tags).toContain('Güçlü Temel');
  });

  it('should tag Düşük Risk', () => {
    const r = tagCase({ risk: 80 });
    expect(r.tags).toContain('Düşük Risk');
  });

  it('should tag Yüksek Likidite', () => {
    const r = tagCase({ liquidity: 80 });
    expect(r.tags).toContain('Yüksek Likidite');
  });
});

describe('OpportunityRankingService', () => {
  const engine = makeOpportunityEngine();
  const ranking = new OpportunityRankingService();

  function result(level: OpportunityLevel, score: number, aiScore: number): OpportunityResult {
    return {
      ticker: 'X',
      company: 'X',
      level,
      levelLabel: level,
      levelEmoji: '🟢',
      opportunityScore: score,
      confidence: 50,
      decision: 'AL',
      decisionLabel: 'AL',
      decisionScore: 60,
      decisionConfidence: 50,
      aiScore,
      aiConfidence: 50,
      strategyId: 's',
      strategyName: 'S',
      strategyScore: 60,
      verification: 50,
      catalyst: 50,
      momentum: 50,
      trend: 50,
      risk: 60,
      liquidity: 50,
      technical: 50,
      fundamental: 50,
      quality: 50,
      reasons: [],
      warnings: [],
      positiveSignals: [],
      negativeSignals: [],
      tags: [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  it('should rank by level first', () => {
    const sorted = ranking.rank([
      result('BEKLE', 80, 80),
      result('ÇOK_GÜÇLÜ_FIRSAT', 10, 10),
      result('GÜÇLÜ_FIRSAT', 50, 50),
    ]);
    expect(sorted[0].level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
    expect(sorted[1].level).toBe('GÜÇLÜ_FIRSAT');
    expect(sorted[2].level).toBe('BEKLE');
  });

  it('should rank by opportunity score within the same level', () => {
    const sorted = ranking.rank([
      result('GÜÇLÜ_FIRSAT', 30, 80),
      result('GÜÇLÜ_FIRSAT', 90, 10),
    ]);
    expect(sorted[0].opportunityScore).toBe(90);
  });

  it('should rank by AI score within same level and score', () => {
    const sorted = ranking.rank([
      result('FIRSAT', 50, 60),
      result('FIRSAT', 50, 90),
    ]);
    expect(sorted[0].aiScore).toBe(90);
  });

  it('should apply limit', () => {
    const sorted = ranking.rank(
      [result('BEKLE', 10, 10), result('BEKLE', 20, 20)],
      1,
    );
    expect(sorted).toHaveLength(1);
  });
});

describe('OpportunityRegistry', () => {
  const engine = makeOpportunityEngine();

  function makeEntry(ticker: string, aiScore: number, conf: number): OpportunityResult {
    return engine.evaluate(
      makeInput({ ticker, aiScore, aiConfidence: conf, dimensions: makeDimensions({ verification: 50, catalyst: 50 }) }),
    );
  }

  it('should set, get and count', () => {
    const registry = new OpportunityRegistry(new OpportunityRankingService());
    const result = makeEntry('THYAO', 80, 70);
    registry.set({ ticker: 'THYAO', input: makeInput({ ticker: 'THYAO' }), result, evaluatedAt: result.evaluatedAt });
    expect(registry.count()).toBe(1);
    expect(registry.get('THYAO')?.result.level).toBe('GÜÇLÜ_FIRSAT');
    expect(registry.has('THYAO')).toBe(true);
  });

  it('should top-sort by level then score', () => {
    const registry = new OpportunityRegistry(new OpportunityRankingService());
    const strong = makeEntry('A', 95, 90);
    const weak = makeEntry('B', 30, 50);
    for (const r of [strong, weak]) {
      registry.set({ ticker: r.ticker, input: makeInput({ ticker: r.ticker }), result: r, evaluatedAt: r.evaluatedAt });
    }
    const top = registry.top(2).map((e) => e.result.ticker);
    expect(top).toEqual(['A', 'B']);
  });
});

describe('OpportunityController', () => {
  function makeController() {
    const registry = new OpportunityRegistry(new OpportunityRankingService());
    const controller = new OpportunityController(
      makeOpportunityEngine(),
      registry,
      new OpportunityRankingService(),
    );
    return { controller, registry };
  }

  it('should evaluate a batch and store ranked results', () => {
    const { controller, registry } = makeController();
    const response = controller.evaluateBatch({
      items: [
        { ticker: 'THYAO', company: 'Türk Hava Yolları', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 80, risk: 70 } },
        { ticker: 'GARAN', company: 'Garanti', strategyId: 'value-hunter', aiScore: 30 },
      ],
    });
    expect(response.toplamFirsat).toBe(2);
    expect(response.sonuclar[0].ticker).toBe('THYAO');
    expect(response.sonuclar[0].level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
    expect(registry.count()).toBe(2);
  });

  it('should return stored opportunity by ticker', () => {
    const { controller } = makeController();
    controller.evaluateBatch({
      items: [{ ticker: 'THYAO', company: 'A', strategyId: 'value-hunter', aiScore: 80, aiConfidence: 70 }],
    });
    const result = controller.getByTicker({ ticker: 'THYAO' });
    expect(result.ticker).toBe('THYAO');
    expect(result.level).toBe('GÜÇLÜ_FIRSAT');
  });

  it('should throw NotFoundException for unknown ticker', () => {
    const { controller } = makeController();
    expect(() => controller.getByTicker({ ticker: 'YOK' })).toThrow();
  });

  it('should return top opportunities', () => {
    const { controller } = makeController();
    controller.evaluateBatch({
      items: [
        { ticker: 'THYAO', company: 'A', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 80 } },
        { ticker: 'GARAN', company: 'B', strategyId: 'value-hunter', aiScore: 50 },
      ],
    });
    const top = controller.getTop('5');
    expect(top.sonuclar[0].ticker).toBe('THYAO');
  });
});
