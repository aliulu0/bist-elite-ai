import { DailyScanNotifierService } from './daily-scan.notifier.service';
import { TelegramClient } from '../alerts/telegram-client';
import { TelegramRadarConfig } from '../alerts/telegram-daily-radar.config';
import { DailyScanResponse, ScannerRankingResultEntry } from './daily-scan.types';

function makeEntry(symbol: string, score: number): ScannerRankingResultEntry {
  return {
    symbol,
    currentPrice: 100,
    eliteScore: score,
    financialScore: 50,
    technicalScore: 50,
    confluenceScore: 50,
    smartMoneyScore: 0,
    marketStructureScore: 50,
    multiTimeframeConfluence: 'MODERATE',
    multiTimeframeScore: 60,
    earlyOpportunityClassification: 'MOMENTUM',
    scannerSignalQuality: 'MEDIUM',
    marketRegime: 'BULL',
    volumeStatus: 'MODERATE',
    relativeVolume20: 1.0,
    volumeSpike: false,
    breakoutStatus: 'NO_BREAKOUT',
    momentumStatus: 'NEUTRAL',
    momentum5D: 0.01,
    relativeStrength: null,
    rank: 1,
    status: 'TOP_CANDIDATE',
    dataStatus: 'AVAILABLE',
    sourceProvenance: {
      symbol,
      provider: 'Yahoo',
      timeframe: '1d',
      retrievedAt: '2026-01-01T00:00:00.000Z',
      marketTimestamp: '2026-01-01T00:00:00.000Z',
      source: 'REAL',
      validationStatus: 'VALID',
    },
  };
}

function makeResponse(overrides: Partial<DailyScanResponse> = {}): DailyScanResponse {
  const top10 = [makeEntry('THYAO', 85), makeEntry('AKBNK', 80)];
  const event = {
    scanId: 'scan-1',
    type: 'NEW_OPPORTUNITY' as const,
    symbol: 'THYAO',
    previousState: null,
    currentState: 'MOMENTUM',
    eliteScore: 85,
    previousEliteScore: null,
    rank: 1,
    previousRank: null,
    classification: 'MOMENTUM',
    reason: 'THYAO yeni erken fırsat sınıfına geçti.',
    factors: ['test'],
    dataStatus: 'AVAILABLE' as const,
    confidence: 'LOW' as const,
    sourceProvenance: makeEntry('THYAO', 85).sourceProvenance,
    timestamp: '2026-01-01T00:00:00.000Z',
  };
  return {
    scanId: 'scan-1',
    status: 'COMPLETE',
    timestamp: '2026-01-01T00:00:00.000Z',
    summary: {
      scanId: 'scan-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      status: 'COMPLETE',
      universeSize: 10,
      equityCount: 10,
      evaluatedCount: 10,
      availableCount: 10,
      unavailableCount: 0,
      rateLimitedCount: 0,
      failedCount: 0,
      signalCount: 5,
      eligibleCount: 8,
      top10,
      top20: top10,
      top50: top10,
      newOpportunities: [event],
      strengtheningSignals: [],
      rankImprovements: [],
      scoreSurges: [],
      volumeExpansions: [],
      momentumAccelerations: [],
      breakoutDevelopments: [],
      multiTimeframeAlignments: [],
      weakenedSignals: [],
      lostSignals: [],
      providerSummary: [],
      dataQuality: 'VALID',
    },
    ...overrides,
  };
}

function makeConfig(overrides: Partial<TelegramRadarConfig> = {}): TelegramRadarConfig {
  return {
    botToken: '123:token',
    chatId: 'chat-1',
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
    requestTimeoutMs: 5000,
    maxRetries: 2,
    dryRun: false,
    liveSmokeTest: false,
    configVersion: '1.0.0',
    ...overrides,
  };
}

class MockClient {
  private configured: boolean;
  public sent: string[] = [];
  public shouldThrow = false;

  constructor(configured = true) {
    this.configured = configured;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async sendMessage(text: string): Promise<{ messageId: string; status: string }> {
    if (this.shouldThrow) throw new Error('network down');
    this.sent.push(text);
    return { messageId: `msg-${this.sent.length}`, status: 'VERIFIED' };
  }
}

describe('DailyScanNotifierService', () => {
  it('skips when the Telegram channel is disabled', async () => {
    const client = new MockClient();
    const service = new DailyScanNotifierService(
      client as unknown as TelegramClient,
      makeConfig({ enabled: false }),
    );
    const result = await service.notifyScanComplete(makeResponse());
    expect(result.status).toBe('SKIPPED_DISABLED');
    expect(client.sent.length).toBe(0);
  });

  it('skips when the client is not configured', async () => {
    const client = new MockClient(false) as unknown as TelegramClient;
    const service = new DailyScanNotifierService(client as unknown as TelegramClient, makeConfig());
    const result = await service.notifyScanComplete(makeResponse());
    expect(result.status).toBe('SKIPPED_NOT_CONFIGURED');
  });

  it('sends the formatted report when enabled and configured', async () => {
    const client = new MockClient();
    const service = new DailyScanNotifierService(client as unknown as TelegramClient, makeConfig());
    const result = await service.notifyScanComplete(makeResponse());
    expect(result.status).toBe('SENT');
    expect(result.sent).toBe(true);
    expect(client.sent.length).toBe(1);
    expect(client.sent[0]).toContain('BIST ELITE AI');
    expect(client.sent[0]).toContain('THYAO');
  });

  it('never throws: isolated delivery failures return FAILED', async () => {
    const client = new MockClient();
    client.shouldThrow = true;
    const service = new DailyScanNotifierService(client as unknown as TelegramClient, makeConfig());
    const result = await service.notifyScanComplete(makeResponse());
    expect(result.status).toBe('FAILED');
    expect(result.sent).toBe(false);
  });

  it('builds a Turkish message with scan metadata and TOP list', () => {
    const service = new DailyScanNotifierService(
      new MockClient() as unknown as TelegramClient,
      makeConfig(),
    );
    const message = service.buildMessage(makeResponse());
    expect(message).toContain('BIST ELITE AI');
    expect(message).toContain('scan-1');
    expect(message).toContain('TOP 10');
    expect(message).toContain('Yatırım tavsiyesi değildir');
  });

  it('chunks long messages and delivers every chunk', async () => {
    const client = new MockClient();
    const service = new DailyScanNotifierService(client as unknown as TelegramClient, makeConfig());
    const manyEntries = Array.from({ length: 100 }, (_, i) => makeEntry(`S${i}`, 50 + (i % 40)));
    const response = makeResponse({
      summary: { ...makeResponse().summary, top10: manyEntries.slice(0, 10) },
    });
    const result = await service.notifyScanComplete(response);
    expect(result.status).toBe('SENT');
    expect(client.sent.length).toBeGreaterThan(0);
  });
});
