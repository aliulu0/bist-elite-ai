import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityRankingService } from '../ai-opportunity/opportunity-ranking.service';
import { OPPORTUNITY_LEVEL_META, OpportunityLevel, OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EliteScoreEngine } from '../ai-elite-score/elite-score.engine';
import { EntryService } from '../entry/entry.service';
import { AnalystService } from '../analyst/analyst.service';
import { EntryZoneEngine } from '../entry/entry-zone.engine';
import { EntryRegistry } from '../entry/entry.registry';
import { toOpportunityCenterCard } from './opportunity-center.dto';
import { OpportunityCenterRegistry } from './opportunity-center.registry';
import { OpportunityCenterService } from './opportunity-center.service';
import { OpportunityCenterController } from './opportunity-center.controller';
import {
  ELITE_SCORE_TIMEFRAMES,
  OPPORTUNITY_CENTER_TABS,
  OpportunityCenterTabId,
} from './opportunity-center.types';

function levelMeta(level: OpportunityLevel) {
  return OPPORTUNITY_LEVEL_META[level];
}

function makeResult(
  ticker: string,
  opts: Partial<Pick<OpportunityResult, 'opportunityScore' | 'aiScore' | 'confidence' | 'strategyId' | 'strategyName' | 'level'>> = {},
): OpportunityResult {
  const level = opts.level ?? 'BEKLE';
  const meta = levelMeta(level);
  return {
    ticker,
    company: `${ticker} A.Ş.`,
    level,
    levelLabel: meta.label,
    levelEmoji: meta.emoji,
    opportunityScore: opts.opportunityScore ?? 50,
    confidence: opts.confidence ?? 60,
    decision: 'İZLE',
    decisionLabel: 'İZLE',
    decisionScore: 60,
    decisionConfidence: 60,
    aiScore: opts.aiScore ?? 60,
    aiConfidence: 60,
    strategyId: opts.strategyId ?? 'value-hunter',
    strategyName: opts.strategyName ?? 'Değer Avcısı',
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
    reasons: ['Gerekçe'],
    warnings: [],
    positiveSignals: [],
    negativeSignals: [],
    tags: [],
    evaluatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function register(registry: OpportunityRegistry, result: OpportunityResult): void {
  registry.set({
    ticker: result.ticker,
    input: {
      ticker: result.ticker,
      company: result.company,
      sector: null,
      price: null,
      aiScore: result.aiScore,
      aiConfidence: result.aiConfidence,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      strategyScore: result.strategyScore,
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
    },
    result,
    evaluatedAt: result.evaluatedAt,
  });
}

function makeService() {
  const opportunityRegistry = new OpportunityRegistry(new OpportunityRankingService());
  const ranking = new OpportunityRankingService();
  const centerRegistry = new OpportunityCenterRegistry(ranking);
  const entryService = makeEntryService();
  const analystService = makeAnalystService();
  const service = new OpportunityCenterService(
    opportunityRegistry,
    centerRegistry,
    new EliteScoreEngine(),
    entryService,
    analystService,
  );
  return { opportunityRegistry, centerRegistry, service, entryService, analystService };
}

function makeEntryService(): EntryService {
  return {
    getCached: () => null,
  } as unknown as EntryService;
}

function makeAnalystService(): AnalystService {
  return {
    getCached: () => null,
  } as unknown as AnalystService;
}

describe('toOpportunityCenterCard', () => {
  it('should preserve every production field and add a null entry area', () => {
    const result = makeResult('THYAO', { level: 'ÇOK_GÜÇLÜ_FIRSAT', opportunityScore: 90 });
    const card = toOpportunityCenterCard(result);
    expect(card.ticker).toBe('THYAO');
    expect(card.aiScore).toBe(60);
    expect(card.decision).toBe('İZLE');
    expect(card.level).toBe('ÇOK_GÜÇLÜ_FIRSAT');
    expect(card.opportunityScore).toBe(90);
    expect(card.confidence).toBe(60);    expect(card.strategyId).toBe('value-hunter');
    expect(card.verification).toBe(50);
    expect(card.catalyst).toBe(50);
    expect(card.risk).toBe(60);
    expect(card.momentum).toBe(50);
    expect(card.trend).toBe(50);
    expect(card.liquidity).toBe(50);
    expect(card.quality).toBe(50);
    expect(card.entryArea).toBeNull();
    expect(card.reasons).toEqual(['Gerekçe']);
    expect(card.warnings).toEqual([]);
    expect(card.positiveSignals).toEqual([]);
    expect(card.negativeSignals).toEqual([]);
    expect(card.tags).toEqual([]);
  });
});

describe('OpportunityCenterRegistry', () => {
  it('should set, get, has, count and clear cards', () => {
    const registry = new OpportunityCenterRegistry(new OpportunityRankingService());
    const kart = toOpportunityCenterCard(makeResult('THYAO'));
    registry.set({ ticker: 'THYAO', kart, evaluatedAt: kart.evaluatedAt });
    expect(registry.has('THYAO')).toBe(true);
    expect(registry.count()).toBe(1);
    expect(registry.get('THYAO')?.kart.ticker).toBe('THYAO');
    registry.clear();
    expect(registry.count()).toBe(0);
  });

  it('should top-sort by level strength then opportunity score', () => {
    const registry = new OpportunityCenterRegistry(new OpportunityRankingService());
    const weak = toOpportunityCenterCard(makeResult('B', { level: 'BEKLE', opportunityScore: 90 }));
    const strong = toOpportunityCenterCard(makeResult('A', { level: 'ÇOK_GÜÇLÜ_FIRSAT', opportunityScore: 40 }));
    registry.set({ ticker: 'A', kart: strong, evaluatedAt: strong.evaluatedAt });
    registry.set({ ticker: 'B', kart: weak, evaluatedAt: weak.evaluatedAt });
    expect(registry.top(10).map((c) => c.ticker)).toEqual(['A', 'B']);
  });

  it('should maintain a dedicated tomorrow sub-registry', () => {
    const registry = new OpportunityCenterRegistry(new OpportunityRankingService());
    const kart = toOpportunityCenterCard(makeResult('THYAO'));
    registry.setTomorrow({ ticker: 'THYAO', kart, evaluatedAt: kart.evaluatedAt });
    expect(registry.hasTomorrow('THYAO')).toBe(true);
    expect(registry.countTomorrow()).toBe(1);
    expect(registry.getTomorrowEntries()[0].kart.ticker).toBe('THYAO');
    registry.clearTomorrow();
    expect(registry.countTomorrow()).toBe(0);
  });
});

describe('OpportunityCenterService tabs', () => {
  it('should sync cards from the OpportunityRegistry', () => {
    const { opportunityRegistry, centerRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO'));
    service.sync();
    expect(centerRegistry.count()).toBe(1);
  });

  it('should return today cards ranked (level then score)', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('B', { level: 'GÜÇLÜ_FIRSAT', opportunityScore: 90 }));
    register(opportunityRegistry, makeResult('A', { level: 'ÇOK_GÜÇLÜ_FIRSAT', opportunityScore: 30 }));
    service.sync();
    const today = service.today();
    expect(today.map((c) => c.ticker)).toEqual(['A', 'B']);
  });

  it('should return the dedicated tomorrow registry (placeholder, no prediction)', () => {
    const { opportunityRegistry, centerRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO'));
    service.sync();
    expect(service.tomorrow()).toEqual([]);
    const kart = toOpportunityCenterCard(makeResult('YARIN'));
    centerRegistry.setTomorrow({ ticker: 'YARIN', kart, evaluatedAt: kart.evaluatedAt });
    expect(service.tomorrow()[0].ticker).toBe('YARIN');
  });

  it('should limit top10 and top20', () => {
    const { opportunityRegistry, service } = makeService();
    for (let i = 0; i < 25; i++) {
      register(opportunityRegistry, makeResult(`T${i}`));
    }
    service.sync();
    expect(service.top10()).toHaveLength(10);
    expect(service.top20()).toHaveLength(20);
  });

  it('should filter by Momentum strategy', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('M1', { strategyId: 'momentum', strategyName: 'Momentum' }));
    register(opportunityRegistry, makeResult('V1', { strategyId: 'value-hunter' }));
    service.sync();
    expect(service.momentum().map((c) => c.ticker)).toEqual(['M1']);
  });

  it('should filter by Value Hunter strategy', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('V1', { strategyId: 'value-hunter' }));
    register(opportunityRegistry, makeResult('M1', { strategyId: 'momentum' }));
    service.sync();
    expect(service.value().map((c) => c.ticker)).toEqual(['V1']);
  });

  it('should filter by Smart Money strategy', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('S1', { strategyId: 'smart-money', strategyName: 'Akıllı Para' }));
    register(opportunityRegistry, makeResult('M1', { strategyId: 'momentum' }));
    service.sync();
    expect(service.smartMoney().map((c) => c.ticker)).toEqual(['S1']);
  });

  it('should reuse the card store for weekly, monthly, 3M and 6M', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO'));
    service.sync();
    for (const method of ['weekly', 'monthly', 'threeMonth', 'sixMonth'] as const) {
      expect(service[method]().map((c) => c.ticker)).toEqual(['THYAO']);
    }
  });

  it('should return 5 elite score timeframes with real scores', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO'));
    service.sync();
    const timeframes = service.eliteScore();
    expect(timeframes).toHaveLength(5);
    expect(timeframes.map((t) => t.zaman)).toEqual(['GUNLUK', 'HAFTALIK', 'AYLIK', 'UC_AYLIK', 'ALTI_AYLIK']);
    for (const t of timeframes) {
      expect(typeof t.skor).toBe('number');
      expect(t.skor).toBeGreaterThan(0);
      expect(t.skor).toBeLessThanOrEqual(100);
      expect(t.kartlar).toHaveLength(1);
      expect(t.kartlar[0].eliteScore).toMatchObject({
        gunluk: expect.any(Number),
        haftalik: expect.any(Number),
        aylik: expect.any(Number),
        ucAylik: expect.any(Number),
        altiAylik: expect.any(Number),
      });
    }
    expect(timeframes[0].skor).toBe(timeframes[0].kartlar[0].eliteScore.gunluk);
  });
});

describe('OpportunityCenterService hub', () => {
  it('should expose all 12 tabs in order with Turkish titles and emoji', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO'));
    service.sync();
    const hub = service.hub();
    expect(hub.sekmeler).toHaveLength(12);
    expect(hub.sekmeler.map((s) => s.tabId)).toEqual(OPPORTUNITY_CENTER_TABS.map((t) => t.id));
    expect(hub.sekmeler.find((s) => s.tabId === 'BUGUNUN_FIRSATLARI')?.baslik).toBe('Bugünün Fırsatları');
    expect(hub.sekmeler.find((s) => s.tabId === 'BUGUNUN_FIRSATLARI')?.emoji).toBe('🔥');
    expect(hub.sekmeler.find((s) => s.tabId === 'YARIN_ARTACAKLAR')?.baslik).toBe('Yarın Artacaklar');
    expect(hub.sekmeler.find((s) => s.tabId === 'ELITE_SCORE')?.baslik).toBe('Elite Score');
    expect(hub.sekmeler.find((s) => s.tabId === 'MOMENTUM')?.emoji).toBe('🚀');
    expect(hub.sekmeler.find((s) => s.tabId === 'DEGER_AVCILARI')?.emoji).toBe('💰');
    expect(hub.sekmeler.find((s) => s.tabId === 'SMART_MONEY')?.emoji).toBe('🧠');
    expect(hub.sekmeler.find((s) => s.tabId === 'TOP_10')?.emoji).toBe('💎');
    expect(hub.sekmeler.find((s) => s.tabId === 'TOP_20')?.emoji).toBe('🏆');
  });

  it('should populate tab sections with cards and empty elite score', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO', { strategyId: 'momentum' }));
    service.sync();
    const hub = service.hub();
    const today = hub.sekmeler.find((s) => s.tabId === 'BUGUNUN_FIRSATLARI')!;
    expect(today.kartSayisi).toBe(1);
    expect(today.kartlar[0].ticker).toBe('THYAO');
    expect(hub.sekmeler.find((s) => s.tabId === 'ELITE_SCORE')!.kartSayisi).toBe(0);
    expect(hub.sekmeler.find((s) => s.tabId === 'ELITE_SCORE')!.kartlar).toEqual([]);
    expect(hub.sekmeler.find((s) => s.tabId === 'YARIN_ARTACAKLAR')!.kartSayisi).toBe(0);
    expect(hub.sekmeler.find((s) => s.tabId === 'MOMENTUM')!.kartSayisi).toBe(1);
  });

  it('should report total cards', () => {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('A'));
    register(opportunityRegistry, makeResult('B'));
    service.sync();
    expect(service.hub().toplamKart).toBe(2);
  });
});

describe('OpportunityCenterController', () => {
  function makeController() {
    const { opportunityRegistry, service } = makeService();
    register(opportunityRegistry, makeResult('THYAO', { level: 'ÇOK_GÜÇLÜ_FIRSAT', opportunityScore: 95, strategyId: 'momentum' }));
    register(opportunityRegistry, makeResult('GARAN', { strategyId: 'value-hunter' }));
    register(opportunityRegistry, makeResult('ASELS', { strategyId: 'smart-money' }));
    const controller = new OpportunityCenterController(service);
    return { controller };
  }

  it('GET /opportunity-center should return the full hub', () => {
    const { controller } = makeController();
    const hub = controller.hub();
    expect(hub.sekmeler).toHaveLength(12);
    expect(hub.toplamKart).toBe(3);
    expect(hub.sekmeler.find((s) => s.tabId === 'BUGUNUN_FIRSATLARI')!.kartlar[0].ticker).toBe('THYAO');
  });

  it('GET /opportunity-center/top10 should return limited ranked cards', () => {
    const { controller } = makeController();
    const res = controller.top10();
    expect(res.baslik).toBe('Top 10 Fırsatlar');
    expect(res.kartlar[0].ticker).toBe('THYAO');
    expect(res.kartlar.length).toBeLessThanOrEqual(10);
  });

  it('GET /opportunity-center/top20 should return up to 20 cards', () => {
    const { controller } = makeController();
    const res = controller.top20();
    expect(res.kartlar).toHaveLength(3);
  });

  it('GET /opportunity-center/today should return ranked today cards', () => {
    const { controller } = makeController();
    const res = controller.today();
    expect(res.kartlar[0].ticker).toBe('THYAO');
  });

  it('GET /opportunity-center/tomorrow should return the placeholder list', () => {
    const { controller } = makeController();
    const res = controller.tomorrow();
    expect(res.baslik).toBe('Yarın Artacaklar');
    expect(res.kartlar).toEqual([]);
  });

  it('GET /opportunity-center/momentum should return momentum strategy cards', () => {
    const { controller } = makeController();
    const res = controller.momentum();
    expect(res.kartlar.map((c) => c.ticker)).toEqual(['THYAO']);
  });

  it('GET /opportunity-center/value should return value-hunter cards', () => {
    const { controller } = makeController();
    const res = controller.value();
    expect(res.kartlar.map((c) => c.ticker)).toEqual(['GARAN']);
  });

  it('GET /opportunity-center/smart-money should return smart-money cards', () => {
    const { controller } = makeController();
    const res = controller.smartMoney();
    expect(res.kartlar.map((c) => c.ticker)).toEqual(['ASELS']);
  });

  it('should return 5 placeholder timeframes', () => {
    const { controller } = makeController();
    const res = controller.eliteScore();
    expect(res.baslik).toBe('Elite Score');
    expect(res.zamanlar).toHaveLength(5);
    expect(res.zamanlar.map((t) => t.etiket)).toEqual(['Günlük', 'Haftalık', 'Aylık', '3 Aylık', '6 Aylık']);
  });

  it('should return real non-null elite scores with enriched cards', () => {
    const { controller } = makeController();
    const res = controller.eliteScore();
    for (const t of res.zamanlar) {
      expect(typeof t.skor).toBe('number');
      expect(t.skor).toBeGreaterThanOrEqual(0);
      expect(t.skor).toBeLessThanOrEqual(100);
      expect(t.kartSayisi).toBe(3);
      expect(t.kartlar).toHaveLength(3);
      for (const kart of t.kartlar) {
        expect(kart.eliteScore).toEqual({
          gunluk: expect.any(Number),
          haftalik: expect.any(Number),
          aylik: expect.any(Number),
          ucAylik: expect.any(Number),
          altiAylik: expect.any(Number),
        });
      }
    }
  });

  it('should list all 12 tab ids exactly once', () => {
    const ids: OpportunityCenterTabId[] = OPPORTUNITY_CENTER_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(12);
    expect(ELITE_SCORE_TIMEFRAMES).toHaveLength(5);
  });
});
