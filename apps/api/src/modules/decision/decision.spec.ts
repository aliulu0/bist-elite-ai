import { DecisionEngine } from './decision-engine.service';
import { DecisionExplanationService } from './decision-explanation.service';
import { DecisionRegistry } from './decision-registry.service';
import { DecisionController } from './decision.controller';
import {
  DECISION_RULES,
  evaluateDecision,
  getDecisionLabel,
  getDecisionStrength,
} from './decision-rules';
import {
  DECISION_IDS,
  DecisionDimensionScores,
  DecisionId,
  DecisionInput,
} from './decision.types';

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

function makeEngine(): DecisionEngine {
  return new DecisionEngine(new DecisionExplanationService());
}

describe('Decision Rules (deterministic)', () => {
  it('should expose all 7 decision ids', () => {
    expect(DECISION_IDS).toEqual(['GÜÇLÜ_AL', 'AL', 'İZLE', 'BEKLE', 'RİSKLİ', 'SAT', 'GÜÇLÜ_SAT']);
    expect(DECISION_RULES).toHaveLength(7);
  });

  it('should evaluate GÜÇLÜ_AL when all strong conditions are met', () => {
    const input = makeInput({
      aiScore: 95,
      aiConfidence: 90,
      dimensions: makeDimensions({ verification: 85, catalyst: 80, risk: 70 }),
    });
    expect(evaluateDecision(input).decision).toBe('GÜÇLÜ_AL');
  });

  it('should evaluate GÜÇLÜ_AL at exact threshold (90/85/80/75)', () => {
    const input = makeInput({
      aiScore: 90,
      aiConfidence: 85,
      dimensions: makeDimensions({ verification: 80, catalyst: 75 }),
    });
    expect(evaluateDecision(input).decision).toBe('GÜÇLÜ_AL');
  });

  it('should evaluate AL for strong score without verification/catalyst', () => {
    const input = makeInput({
      aiScore: 80,
      aiConfidence: 70,
      dimensions: makeDimensions({ verification: 50, catalyst: 50 }),
    });
    expect(evaluateDecision(input).decision).toBe('AL');
  });

  it('should evaluate İZLE for moderate score', () => {
    const input = makeInput({
      aiScore: 70,
      aiConfidence: 70,
      dimensions: makeDimensions({ verification: 50, catalyst: 50 }),
    });
    expect(evaluateDecision(input).decision).toBe('İZLE');
  });

  it('should evaluate BEKLE for neutral score', () => {
    const input = makeInput({
      aiScore: 50,
      aiConfidence: 50,
      dimensions: makeDimensions({ verification: 50, catalyst: 50 }),
    });
    expect(evaluateDecision(input).decision).toBe('BEKLE');
  });

  it('should evaluate RİSKLİ when risk safety score is very low', () => {
    const input = makeInput({
      aiScore: 50,
      aiConfidence: 50,
      dimensions: makeDimensions({ risk: 20, verification: 50, catalyst: 50 }),
    });
    expect(evaluateDecision(input).decision).toBe('RİSKLİ');
  });

  it('should evaluate SAT for weak score', () => {
    const input = makeInput({ aiScore: 30 });
    expect(evaluateDecision(input).decision).toBe('SAT');
  });

  it('should evaluate GÜÇLÜ_SAT for very weak score', () => {
    const input = makeInput({ aiScore: 15 });
    expect(evaluateDecision(input).decision).toBe('GÜÇLÜ_SAT');
  });

  it('should fall back to BEKLE when AI score is missing', () => {
    const input = makeInput({ aiScore: null, aiConfidence: null });
    expect(evaluateDecision(input).decision).toBe('BEKLE');
  });

  it('should keep strength ordering for ranking', () => {
    const strengths = DECISION_IDS.map((d) => getDecisionStrength(d));
    expect(getDecisionStrength('GÜÇLÜ_AL')).toBeGreaterThan(getDecisionStrength('AL'));
    expect(getDecisionStrength('AL')).toBeGreaterThan(getDecisionStrength('İZLE'));
    expect(getDecisionStrength('İZLE')).toBeGreaterThan(getDecisionStrength('BEKLE'));
    expect(getDecisionStrength('BEKLE')).toBeGreaterThan(getDecisionStrength('RİSKLİ'));
    expect(getDecisionStrength('RİSKLİ')).toBeGreaterThan(getDecisionStrength('SAT'));
    expect(getDecisionStrength('SAT')).toBeGreaterThan(getDecisionStrength('GÜÇLÜ_SAT'));
    expect(strengths).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('should provide Turkish labels for every decision', () => {
    expect(getDecisionLabel('GÜÇLÜ_AL')).toBe('GÜÇLÜ AL');
    expect(getDecisionLabel('GÜÇLÜ_SAT')).toBe('GÜÇLÜ SAT');
    expect(getDecisionLabel('RİSKLİ')).toBe('RİSKLİ');
    expect(getDecisionLabel('İZLE')).toBe('İZLE');
    expect(getDecisionLabel('BEKLE')).toBe('BEKLE');
  });
});

describe('DecisionEngine', () => {
  it('should produce a full deterministic result for GÜÇLÜ_AL', () => {
    const engine = makeEngine();
    const input = makeInput({
      aiScore: 95,
      aiConfidence: 90,
      dimensions: makeDimensions({ verification: 85, catalyst: 80, risk: 70 }),
    });
    const result = engine.evaluate(input);
    expect(result.decision).toBe('GÜÇLÜ_AL');
    expect(result.decisionLabel).toBe('GÜÇLÜ AL');
    expect(result.confidence).toBe(93);
    expect(result.reasons).toContain('Tüm göstergeler güçlü alım yönünde hizalanıyor');
    expect(result.reasons).toContain('AI skoru çok güçlü (95)');
    expect(result.reasons).toContain('Yüksek model güveni (90%)');
    expect(result.reasons).toContain('Doğrulama puanı güçlü (85)');
    expect(result.reasons).toContain('Katalizör desteği mevcut (80)');
    expect(result.positiveSignals).toContain('Düşük risk profili');
    expect(result.overview.ratings).toHaveLength(7);
    expect(result.overview.maxStars).toBe(35);
    expect(result.strategyId).toBe('value-hunter');
  });

  it('should be deterministic for identical inputs', () => {
    const engine = makeEngine();
    const a = engine.evaluate(makeInput({ aiScore: 72, aiConfidence: 70 }));
    const b = engine.evaluate(makeInput({ aiScore: 72, aiConfidence: 70 }));
    const { evaluatedAt: _ea, ...aCore } = a;
    const { evaluatedAt: _eb, ...bCore } = b;
    expect(aCore).toEqual(bCore);
  });

  it('should compute decision score as weighted average', () => {
    const engine = makeEngine();
    const result = engine.evaluate(makeInput());
    expect(result.decisionScore).toBeGreaterThanOrEqual(0);
    expect(result.decisionScore).toBeLessThanOrEqual(100);
  });

  it('should flag missing dimension data in warnings', () => {
    const engine = makeEngine();
    const result = engine.evaluate(
      makeInput({ dimensions: makeDimensions({ verification: null, catalyst: null }) }),
    );
    expect(result.warnings.some((w) => w.includes('Veri eksikliği'))).toBe(true);
  });

  it('should add positive signals for strong dimensions', () => {
    const engine = makeEngine();
    const result = engine.evaluate(
      makeInput({
        aiScore: 95,
        aiConfidence: 90,
        dimensions: makeDimensions({
          technical: 80,
          momentum: 85,
          trend: 90,
          verification: 85,
          catalyst: 80,
          risk: 75,
        }),
      }),
    );
    expect(result.positiveSignals).toContain('Güçlü teknik görünüm');
    expect(result.positiveSignals).toContain('Güçlü momentum');
    expect(result.positiveSignals).toContain('Güçlü trend');
    expect(result.positiveSignals).toContain('Güçlü doğrulama');
  });

  it('should add negative signals for weak dimensions', () => {
    const engine = makeEngine();
    const result = engine.evaluate(
      makeInput({ aiScore: 30, dimensions: makeDimensions({ technical: 20, trend: 30, risk: 25 }) }),
    );
    expect(result.negativeSignals).toContain('Zayıf teknik görünüm');
    expect(result.negativeSignals).toContain('Zayıf trend');
    expect(result.negativeSignals).toContain('Yüksek risk profili');
  });

  it('should evaluate many inputs', () => {
    const engine = makeEngine();
    const results = engine.evaluateMany([
      makeInput({ ticker: 'THYAO', aiScore: 95, aiConfidence: 90, dimensions: makeDimensions({ verification: 85, catalyst: 80 }) }),
      makeInput({ ticker: 'GARAN', aiScore: 50 }),
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].decision).toBe('GÜÇLÜ_AL');
    expect(results[1].decision).toBe('BEKLE');
  });
});

describe('DecisionOverview stars', () => {
  it('should map scores to 1-5 stars', () => {
    const explanation = new DecisionExplanationService();
    const input = makeInput({
      dimensions: makeDimensions({ trend: 90, momentum: 60, risk: 85, verification: 40, catalyst: 10, liquidity: 55, quality: 25 }),
    });
    const overview = explanation.buildOverview(input);
    expect(overview.ratings).toHaveLength(7);
    const trend = overview.ratings.find((r) => r.dimension === 'trend')!;
    expect(trend.stars).toBe(5);
    expect(trend.starString).toBe('★★★★★');
    const catalyst = overview.ratings.find((r) => r.dimension === 'catalyst')!;
    expect(catalyst.stars).toBe(1);
    expect(catalyst.starString).toBe('★☆☆☆☆');
    expect(overview.totalStars).toBe(overview.ratings.reduce((s, r) => s + r.stars, 0));
  });
});

describe('DecisionRegistry', () => {
  it('should set, get and count entries', () => {
    const registry = new DecisionRegistry();
    const engine = makeEngine();
    const result = engine.evaluate(makeInput({ ticker: 'THYAO' }));
    registry.set({ ticker: 'THYAO', input: makeInput({ ticker: 'THYAO' }), result, evaluatedAt: result.evaluatedAt });
    expect(registry.count()).toBe(1);
    expect(registry.get('THYAO')?.result.decision).toBe('BEKLE');
    expect(registry.has('THYAO')).toBe(true);
  });

  it('should rank top results by decision strength then AI score then confidence', () => {
    const registry = new DecisionRegistry();
    const engine = makeEngine();
    const strong = engine.evaluate(makeInput({ ticker: 'A', aiScore: 95, aiConfidence: 90, dimensions: makeDimensions({ verification: 85, catalyst: 80 }) }));
    const mid = engine.evaluate(makeInput({ ticker: 'B', aiScore: 80, aiConfidence: 70 }));
    const weak = engine.evaluate(makeInput({ ticker: 'C', aiScore: 30 }));
    for (const r of [strong, mid, weak]) {
      registry.set({ ticker: r.ticker, input: makeInput({ ticker: r.ticker }), result: r, evaluatedAt: r.evaluatedAt });
    }
    const top = registry.top(3).map((e) => e.result.ticker);
    expect(top).toEqual(['A', 'B', 'C']);
    expect(registry.top(1)).toHaveLength(1);
  });
});

describe('DecisionController', () => {
  function makeController() {
    const registry = new DecisionRegistry();
    const controller = new DecisionController(makeEngine(), registry);
    return { controller, registry };
  }

  it('should evaluate a batch and store results', () => {
    const { controller, registry } = makeController();
    const response = controller.evaluateBatch({
      items: [
        {
          ticker: 'THYAO',
          company: 'Türk Hava Yolları',
          strategyId: 'value-hunter',
          aiScore: 95,
          aiConfidence: 90,
          dimensions: { verification: 85, catalyst: 80 },
        },
      ],
    });
    expect(response.islenen).toBe(1);
    expect(response.sonuclar[0].decision).toBe('GÜÇLÜ_AL');
    expect(registry.count()).toBe(1);
  });

  it('should return a stored decision by ticker', () => {
    const { controller } = makeController();
    controller.evaluateBatch({
      items: [
        { ticker: 'THYAO', company: 'Türk Hava Yolları', strategyId: 'value-hunter', aiScore: 50 },
      ],
    });
    const result = controller.getByTicker({ ticker: 'THYAO' });
    expect(result.ticker).toBe('THYAO');
    expect(result.decision).toBeDefined();
  });

  it('should throw NotFoundException for unknown ticker', () => {
    const { controller } = makeController();
    expect(() => controller.getByTicker({ ticker: 'YOK' })).toThrow();
  });

  it('should return top decisions', () => {
    const { controller } = makeController();
    controller.evaluateBatch({
      items: [
        { ticker: 'THYAO', company: 'A', strategyId: 'value-hunter', aiScore: 95, aiConfidence: 90, dimensions: { verification: 85, catalyst: 80 } },
        { ticker: 'GARAN', company: 'B', strategyId: 'value-hunter', aiScore: 50 },
      ],
    });
    const top = controller.getTop('10');
    expect(top.sonuclar[0].ticker).toBe('THYAO');
  });
});
