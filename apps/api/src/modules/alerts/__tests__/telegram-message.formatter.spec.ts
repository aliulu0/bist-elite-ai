import { TelegramMessageFormatter, STATE_LABELS, TelegramOpportunityView } from '../telegram-message.formatter';
import { OpportunityRadarItem, OpportunityRadarSnapshot } from '../../ai-early-opportunity/radar/radar.types';

function makeItem(overrides: Partial<OpportunityRadarItem> = {}): OpportunityRadarItem {
  return {
    ticker: 'THYAO',
    company: 'Türk Hava Yolları',
    sector: 'Havacılık',
    state: 'CONFIRMED',
    current: {
      earlyOpportunityScore: 87,
      eliteScore: 80,
      signalConvergence: 82,
      confidence: 85,
      expectedReturn: 12.4,
      risk: 'ORTA',
      smartMoneyScore: 75,
      catalystScore: 70,
      fundamentalScore: null,
      dataQualityScore: 90,
      predictionConfidence: null,
      timeframeAgreement: null,
      entryZone: { min: 294, max: 304 },
      decisionScore: 82,
      decisionStatus: 'CONFIRMED',
      earlyOpportunity: true,
      dataTimestamp: '2026-08-14T12:00:00.000Z',
    },
    previous: null,
    scoreChange: null,
    changes: [],
    reasons: ['Smart Money güçleniyor', 'Teknik sinyal yakınsaması yüksek', 'Katalizör desteği mevcut'],
    radarPriority: 90,
    dataFreshness: '2dk',
    providerStatus: 'Yahoo Finance',
    decision: {
      entryZone: { min: 294, max: 304 },
      stop: 288.84,
      target1: 330,
      target2: 343.3,
      expectedReturn: 12.4,
    } as unknown as OpportunityRadarItem['decision'],
    evaluatedAt: '2026-08-14T12:00:00.000Z',
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<OpportunityRadarSnapshot> = {}): OpportunityRadarSnapshot {
  return {
    timestamp: '2026-08-14T12:00:00.000Z',
    marketSession: 'OPEN',
    marketSessionLabel: 'Açık',
    freshnessNote: 'güncel',
    symbolsEvaluated: 25,
    activeOpportunities: 4,
    newOpportunities: [],
    strengtheningOpportunities: [],
    weakeningOpportunities: [],
    invalidatedOpportunities: [],
    confirmedOpportunities: ['THYAO'],
    items: {},
    providerCallStats: { providerCalls: 10, cacheHits: 5, cheapScans: 3, deepAnalyses: 2, symbolsEvaluated: 25, candidates: 8, skipped: 0, errors: 0 },
    dataQualitySummary: { averageScore: 80, warnings: [] },
    executionDurationMs: 1200,
    generatedAt: '2026-08-14T12:00:00.000Z',
    ...overrides,
  };
}

describe('TelegramMessageFormatter', () => {
  let formatter: TelegramMessageFormatter;

  beforeEach(() => {
    formatter = new TelegramMessageFormatter();
  });

  it('maps an opportunity to a presentation view using existing radar values', () => {
    const view = formatter.formatOpportunity(makeItem());
    expect(view.ticker).toBe('THYAO');
    expect(view.score).toBe(87);
    expect(view.confidence).toBe(85);
    expect(view.state).toBe('CONFIRMED');
    expect(view.expectedReturn).toBe(12.4);
    expect(view.stop).toBe(288.84);
    expect(view.target1).toBe(330);
    expect(view.target2).toBe(343.3);
  });

  it('builds a Turkish daily report with the opportunity details', () => {
    const item = makeItem();
    const view = formatter.formatOpportunity(item);
    const message = formatter.buildDailyReport(makeSnapshot(), [view], { timezone: 'Europe/Istanbul' });
    expect(message).toContain('BIST ELITE AI');
    expect(message).toContain('GÜNLÜK FIRSAT RADARI');
    expect(message).toContain('THYAO');
    expect(message).toContain('Skor: 87/100');
    expect(message).toContain('Giriş: 294 – 304');
    expect(message).toContain('Stop: 288.84');
    expect(message).toContain('Hedef 1: 330');
    expect(message).toContain('Hedef 2: 343.3');
    expect(message).toContain('+12.4%');
    expect(message).toContain('Bu rapor yatırım tavsiyesi değildir.');
    expect(message).toContain('Taranan: 25');
  });

  it('renders the state labels correctly', () => {
    expect(STATE_LABELS.NEW).toBe('YENİ');
    expect(STATE_LABELS.CONFIRMED).toBe('GÜÇLÜ FIRSAT');
    expect(STATE_LABELS.WEAKENING).toBe('ZAYIFLIYOR');
    expect(STATE_LABELS.INVALIDATED).toBe('GEÇERSİZ');
  });

  it('renders an empty report when no opportunities qualify', () => {
    const message = formatter.buildDailyReport(makeSnapshot(), [], { timezone: 'Europe/Istanbul' });
    expect(message).toContain('fırsat tespit edilmedi');
    expect(message).toContain('Taranan: 25');
  });

  it('builds an empty-report variant matching the spec', () => {
    const message = formatter.buildEmptyReport(makeSnapshot());
    expect(message).toContain('Günlük Fırsat Radarı');
    expect(message).toContain('fırsat tespit edilmedi');
  });

  it('does not invent market values that are absent', () => {
    const item = makeItem();
    item.decision = null;
    item.current.entryZone = null;
    item.current.expectedReturn = 0;
    const view = formatter.formatOpportunity(item);
    const message = formatter.buildDailyReport(makeSnapshot(), [view], { timezone: 'Europe/Istanbul' });
    expect(message).toContain('+0.0%');
    expect(message).not.toContain('Giriş:');
  });

  it('chunks long messages deterministically preserving order', () => {
    const longReason = 'A'.repeat(5000);
    const view: TelegramOpportunityView = {
      ticker: 'TEST',
      company: 'X',
      score: 90,
      confidence: 90,
      state: 'NEW',
      expectedReturn: 10,
      risk: 'DÜŞÜK',
      entryZone: null,
      stop: null,
      target1: null,
      target2: null,
      reasons: [longReason, longReason, longReason, longReason],
      providerStatus: null,
      dataFreshness: '',
    };
    const message = formatter.buildDailyReport(makeSnapshot(), [view], { timezone: 'Europe/Istanbul' });
    const chunks = formatter.chunk(message, 1000);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 1000)).toBe(true);
    expect(chunks.join('').replace(/…/g, '')).toContain('TEST');
  });

  it('truncates an over-long single message to the hard cap', () => {
    const view: TelegramOpportunityView = {
      ticker: 'BIG',
      company: 'X',
      score: 90,
      confidence: 90,
      state: 'NEW',
      expectedReturn: 10,
      risk: 'DÜŞÜK',
      entryZone: null,
      stop: null,
      target1: null,
      target2: null,
      reasons: ['Z'.repeat(5000)],
      providerStatus: null,
      dataFreshness: '',
    };
    const message = formatter.buildDailyReport(makeSnapshot(), [view], { timezone: 'Europe/Istanbul' });
    expect(message.length).toBeLessThanOrEqual(4096);
  });

  it('builds a smoke test message that is not market advice', () => {
    const message = formatter.buildSmokeTestMessage();
    expect(message).toContain('Telegram bağlantısı başarıyla doğrulandı');
    expect(message).not.toContain('THYAO');
  });
});