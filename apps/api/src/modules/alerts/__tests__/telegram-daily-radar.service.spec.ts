import { TelegramDailyRadarService } from '../telegram-daily-radar.service';
import { TelegramRadarConfig } from '../telegram-daily-radar.config';
import { TelegramClient } from '../telegram-client';
import { TelegramDeliveryRepository } from '../telegram-delivery.repository';
import { OpportunityRadarSnapshot, OpportunityRadarItem } from '../../ai-early-opportunity/radar/radar.types';

function makeConfig(overrides: Partial<TelegramRadarConfig> = {}): TelegramRadarConfig {
  return {
    botToken: '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    chatId: '987654321',
    enabled: true,
    dailyRadarEnabled: true,
    dailyRadarTime: '18:30',
    timezone: 'Europe/Istanbul',
    minScore: 70,
    maxOpportunities: 10,
    includeWeakening: false,
    includeInvalidated: false,
    sendEmptyReport: false,
    cooldownMinutes: 60,
    requestTimeoutMs: 1000,
    maxRetries: 3,
    dryRun: false,
    liveSmokeTest: false,
    configVersion: '1.0.0',
    ...overrides,
  };
}

function makeItem(ticker: string, score: number, state: OpportunityRadarItem['state'], overrides: Partial<OpportunityRadarItem> = {}): OpportunityRadarItem {
  return {
    ticker,
    company: ticker,
    sector: 'Genel',
    state,
    current: {
      earlyOpportunityScore: score,
      eliteScore: 70,
      signalConvergence: 60,
      confidence: 70,
      expectedReturn: 5,
      risk: 'ORTA',
      smartMoneyScore: null,
      catalystScore: null,
      fundamentalScore: null,
      dataQualityScore: 80,
      predictionConfidence: null,
      timeframeAgreement: null,
      entryZone: null,
      decisionScore: null,
      decisionStatus: null,
      earlyOpportunity: true,
      dataTimestamp: new Date().toISOString(),
    },
    previous: null,
    scoreChange: null,
    changes: [],
    reasons: [],
    radarPriority: score,
    dataFreshness: 'güncel',
    providerStatus: 'Yahoo Finance',
    decision: null,
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSnapshot(items: OpportunityRadarItem[], overrides: Partial<OpportunityRadarSnapshot> = {}): OpportunityRadarSnapshot {
  const map: Record<string, OpportunityRadarItem> = {};
  for (const item of items) map[item.ticker] = item;
  return {
    timestamp: new Date().toISOString(),
    marketSession: 'OPEN',
    marketSessionLabel: 'Açık',
    freshnessNote: 'güncel',
    symbolsEvaluated: 25,
    activeOpportunities: items.length,
    newOpportunities: [],
    strengtheningOpportunities: [],
    weakeningOpportunities: [],
    invalidatedOpportunities: [],
    confirmedOpportunities: [],
    items: map,
    providerCallStats: { providerCalls: 1, cacheHits: 1, cheapScans: 1, deepAnalyses: 0, symbolsEvaluated: 25, candidates: items.length, skipped: 0, errors: 0 },
    dataQualitySummary: { averageScore: 80, warnings: [] },
    executionDurationMs: 100,
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

class FakeRadar {
  snapshot: OpportunityRadarSnapshot | null = null;
  runCalls = 0;

  hasSnapshot(): boolean {
    return this.snapshot != null;
  }

  getSnapshot(): OpportunityRadarSnapshot | null {
    return this.snapshot;
  }

  getCurrentSnapshot(): OpportunityRadarSnapshot | null {
    return this.snapshot;
  }

  async runRadar(): Promise<OpportunityRadarSnapshot> {
    this.runCalls++;
    if (!this.snapshot) this.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
    return this.snapshot;
  }
}

class FakeClient extends TelegramClient {
  sent: string[] = [];
  sendResult: { status: 'VERIFIED' | 'NOT_CONFIGURED' | 'AUTH_FAILED' | 'CHAT_UNAVAILABLE' | 'RATE_LIMITED' | 'SEND_FAILED'; messageId: string } = {
    status: 'VERIFIED',
    messageId: 'm1',
  };

  constructor(config: TelegramRadarConfig) {
    super(config);
  }

  override async sendMessage(text: string): Promise<{ messageId: string; status: 'VERIFIED' | 'NOT_CONFIGURED' | 'AUTH_FAILED' | 'CHAT_UNAVAILABLE' | 'RATE_LIMITED' | 'SEND_FAILED' }> {
    this.sent.push(text);
    return this.sendResult;
  }
}

describe('TelegramDailyRadarService', () => {
  let radar: FakeRadar;
  let client: FakeClient;
  let repo: TelegramDeliveryRepository;
  let config: TelegramRadarConfig;

  function build(): TelegramDailyRadarService {
    return new TelegramDailyRadarService(radar as any, repo, config, client, 60_000);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    radar = new FakeRadar();
    repo = new TelegramDeliveryRepository();
    config = makeConfig();
    client = new FakeClient(config);
  });

  describe('opportunity selection', () => {
    it('selects only CONFIRMED/STRENGTHENING/NEW above the min score', async () => {
      radar.snapshot = makeSnapshot([
        makeItem('THYAO', 87, 'CONFIRMED'),
        makeItem('AKBNK', 75, 'NEW'),
        makeItem('ASELS', 45, 'CONFIRMED'),
        makeItem('TUPRS', 80, 'WEAKENING'),
        makeItem('GARAN', 78, 'INVALIDATED'),
      ]);
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.opportunities).toBe(2); // THYAO + AKBNK
      expect(client.sent).toHaveLength(1);
      expect(client.sent[0]).toContain('THYAO');
      expect(client.sent[0]).toContain('AKBNK');
      expect(client.sent[0]).not.toContain('TUPRS');
      expect(client.sent[0]).not.toContain('GARAN');
    });

    it('includes WEAKENING only when configured', async () => {
      radar.snapshot = makeSnapshot([makeItem('TUPRS', 80, 'WEAKENING'), makeItem('THYAO', 87, 'CONFIRMED')]);
      config.includeWeakening = true;
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.opportunities).toBe(2);
      expect(client.sent[0]).toContain('TUPRS');
    });

    it('sorts deterministically by score then confidence then return', async () => {
      radar.snapshot = makeSnapshot([
        makeItem('AAA', 70, 'NEW', { current: makeItem('X', 70, 'NEW').current }),
        makeItem('BBB', 90, 'NEW'),
        makeItem('CCC', 80, 'NEW'),
      ]);
      const service = build();
      await service.runDailyRadar();
      const bIdx = client.sent[0].indexOf('BBB');
      const cIdx = client.sent[0].indexOf('CCC');
      const aIdx = client.sent[0].indexOf('AAA');
      expect(bIdx).toBeGreaterThan(-1);
      expect(cIdx).toBeGreaterThan(-1);
      expect(aIdx).toBeGreaterThan(-1);
      expect(bIdx).toBeLessThan(cIdx);
      expect(cIdx).toBeLessThan(aIdx);
    });

    it('caps opportunities at maxOpportunities', async () => {
      const items = Array.from({ length: 15 }, (_, i) => makeItem(`SYM${i}`, 90 - i, 'NEW'));
      radar.snapshot = makeSnapshot(items);
      config.maxOpportunities = 3;
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.opportunities).toBe(3);
    });
  });

  describe('deduplication', () => {
    it('skips already-delivered fingerprints', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      const first = await service.runDailyRadar();
      expect(first.status).toBe('SENT');
      const second = await service.runDailyRadar();
      expect(second.status).toBe('SKIPPED');
      expect(second.duplicatesSkipped).toBe(1);
      expect(client.sent).toHaveLength(1); // second run did not send again
    });

    it('does not reuse fingerprints across different snapshots', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      await service.runDailyRadar();
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')], { timestamp: new Date(Date.now() + 3600_000).toISOString() });
      const second = await service.runDailyRadar({ forceRefresh: true });
      expect(second.status).toBe('SENT');
    });
  });

  describe('delivery outcomes', () => {
    it('returns DRY_RUN and does not call the HTTP send when dryRun', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      config.dryRun = true;
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('DRY_RUN');
      expect(client.sent).toHaveLength(0);
    });

    it('skips empty reports by default', async () => {
      radar.snapshot = makeSnapshot([]);
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('SKIPPED_EMPTY');
      expect(client.sent).toHaveLength(0);
    });

    it('sends the empty report when TELEGRAM_SEND_EMPTY_REPORT=true', async () => {
      radar.snapshot = makeSnapshot([]);
      config.sendEmptyReport = true;
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('SENT');
      expect(client.sent).toHaveLength(1);
      expect(client.sent[0]).toContain('fırsat tespit edilmedi');
    });

    it('is SKIPPED_DISABLED when telegram is disabled', async () => {
      config.enabled = false;
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('SKIPPED_DISABLED');
    });

    it('survives a Telegram failure and reports FAILED without breaking radar', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      client.sendResult = { status: 'SEND_FAILED', messageId: '' };
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('SEND_FAILED');
    });

    it('persists a delivery record after a successful send', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      const result = await service.runDailyRadar();
      expect(result.status).toBe('SENT');
      const counts = await repo.countByStatus();
      expect(counts['SENT']).toBe(1);
    });
  });

  describe('snapshot reuse', () => {
    it('reuses a fresh cached snapshot without re-running radar', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      await service.runDailyRadar();
      await service.runDailyRadar();
      expect(radar.runCalls).toBe(0);
    });

    it('runs a fresh radar when no snapshot exists', async () => {
      radar.snapshot = null;
      const service = build();
      await service.runDailyRadar();
      expect(radar.runCalls).toBe(1);
    });

    it('forces a fresh radar run when forceRefresh is requested', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      await service.runDailyRadar();
      const before = radar.runCalls;
      await service.runDailyRadar({ forceRefresh: true });
      expect(radar.runCalls).toBe(before + 1);
    });
  });

  describe('status', () => {
    it('reports NOT_CONFIGURED when credentials missing', async () => {
      config.botToken = '';
      config.chatId = '';
      const service = build();
      const status = await service.getStatus();
      expect(status.configured).toBe(false);
      expect(status.status).toBe('NOT_CONFIGURED');
    });

    it('exposes counts without secrets', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      await service.runDailyRadar();
      const status = await service.getStatus();
      expect(status.sentCount).toBe(1);
      expect(JSON.stringify(status)).not.toContain('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      expect(JSON.stringify(status)).not.toContain('987654321');
    });
  });

  describe('preview', () => {
    it('returns the formatted message and selection without sending', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED'), makeItem('AKBNK', 45, 'CONFIRMED')]);
      const service = build();
      const preview = await service.getPreview();
      expect(preview.opportunityCount).toBe(1);
      expect(preview.formattedMessage).toContain('THYAO');
      expect(preview.snapshot.hasSnapshot).toBe(true);
      expect(client.sent).toHaveLength(0);
    });
  });

  describe('listDeliveries', () => {
    it('returns persisted deliveries and total', async () => {
      radar.snapshot = makeSnapshot([makeItem('THYAO', 87, 'CONFIRMED')]);
      const service = build();
      await service.runDailyRadar();
      const { deliveries, total } = await service.listDeliveries(50);
      expect(total).toBe(1);
      expect(deliveries[0].ticker).toBe('THYAO');
      expect(deliveries[0].messageType).toBe('daily_radar');
    });
  });
});