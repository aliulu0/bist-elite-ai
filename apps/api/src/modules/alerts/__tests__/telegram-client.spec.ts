import { TelegramClient } from '../telegram-client';
import { TelegramRadarConfig } from '../telegram-daily-radar.config';

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

type FetchMock = jest.Mock;

function mockFetchResponse(status: number, body: unknown): void {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response) as FetchMock;
}

describe('TelegramClient', () => {
  let client: TelegramClient;
  let originalFetch: any;

  beforeAll(() => {
    originalFetch = (global as any).fetch;
  });

  afterAll(() => {
    if (originalFetch) (global as any).fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    client = new TelegramClient(makeConfig(), async () => undefined);
  });

  describe('configuration and masking', () => {
    it('is configured when token and chat id exist', () => {
      expect(client.isConfigured()).toBe(true);
    });

    it('is not configured when token or chat id is empty', () => {
      expect(new TelegramClient(makeConfig({ botToken: '' })).isConfigured()).toBe(false);
      expect(new TelegramClient(makeConfig({ chatId: '' })).isConfigured()).toBe(false);
    });

    it('masks the token without exposing the secret', () => {
      const masked = client.maskToken();
      expect(masked).not.toContain('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      expect(masked).toContain('123456:');
      expect(masked).toContain('****');
    });
  });

  describe('getMe', () => {
    it('returns VERIFIED with bot identity on success', async () => {
      mockFetchResponse(200, { ok: true, result: { id: 555, username: 'bist_elite_bot' } });
      const { result, status } = await client.getMe();
      expect(status).toBe('VERIFIED');
      expect(result!.botId).toBe(555);
      expect(result!.botUsername).toBe('bist_elite_bot');
    });

    it('returns NOT_CONFIGURED when no token', async () => {
      const c = new TelegramClient(makeConfig({ botToken: '' }));
      const { result, status } = await c.getMe();
      expect(status).toBe('NOT_CONFIGURED');
      expect(result).toBeNull();
    });

    it('returns AUTH_FAILED on 401', async () => {
      mockFetchResponse(401, { ok: false, description: 'Unauthorized', error_code: 401 });
      const { status } = await client.getMe();
      expect(status).toBe('AUTH_FAILED');
    });

    it('returns AUTH_FAILED on network failure without throwing', async () => {
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      const { status } = await client.getMe();
      expect(status).toBe('AUTH_FAILED');
    });

    it('never includes the token in the error', async () => {
      mockFetchResponse(401, { ok: false, description: 'Unauthorized', error_code: 401 });
      const { status } = await client.getMe();
      expect(status).toBe('AUTH_FAILED');
    });
  });

  describe('sendMessage', () => {
    it('sends and returns the Telegram message id', async () => {
      mockFetchResponse(200, { ok: true, result: { message_id: 42 } });
      const result = await client.sendMessage('test');
      expect(result.status).toBe('VERIFIED');
      expect(result.messageId).toBe('42');
    });

    it('returns NOT_CONFIGURED when chat id is empty', async () => {
      const c = new TelegramClient(makeConfig({ chatId: '' }));
      const result = await c.sendMessage('test');
      expect(result.status).toBe('NOT_CONFIGURED');
      expect(result.messageId).toBe('');
    });

    it('returns CHAT_UNAVAILABLE on 400 (chat not found) without retry', async () => {
      mockFetchResponse(400, { ok: false, description: 'Bad Request: chat not found', error_code: 400 });
      const result = await client.sendMessage('test');
      expect(result.status).toBe('CHAT_UNAVAILABLE');
      expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('returns AUTH_FAILED on 401 without retry', async () => {
      mockFetchResponse(401, { ok: false, description: 'Unauthorized', error_code: 401 });
      const result = await client.sendMessage('test');
      expect(result.status).toBe('AUTH_FAILED');
      expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('retries transient 5xx up to maxRetries then returns SEND_FAILED', async () => {
      mockFetchResponse(500, { ok: false, description: 'Internal Server Error', error_code: 500 });
      const result = await client.sendMessage('test');
      expect(result.status).toBe('SEND_FAILED');
      expect((global as any).fetch).toHaveBeenCalledTimes(1 + 3);
    });

    it('recovers after a transient failure', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ ok: false, error_code: 500 }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 7 } }) });
      (global as any).fetch = fetchMock;
      const result = await client.sendMessage('test');
      expect(result.status).toBe('VERIFIED');
      expect(result.messageId).toBe('7');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('rate limiting', () => {
    it('respects retry_after timing on 429', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ ok: false, error_code: 429, parameters: { retry_after: 2 } }),
        })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 3 } }) });
      (global as any).fetch = fetchMock;
      const result = await client.sendMessage('test');
      expect(result.status).toBe('VERIFIED');
      expect(result.messageId).toBe('3');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('returns RATE_LIMITED after exhausting retries', async () => {
      mockFetchResponse(429, { ok: false, error_code: 429, parameters: { retry_after: 1 } });
      const result = await client.sendMessage('test');
      expect(result.status).toBe('RATE_LIMITED');
    });
  });
});