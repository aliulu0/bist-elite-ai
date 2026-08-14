import { TelegramDeliveryRepository, notificationFingerprint, TelegramDeliveryRecord } from '../telegram-delivery.repository';

describe('notificationFingerprint', () => {
  it('is deterministic for identical inputs', () => {
    const a = notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.0.0');
    const b = notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.0.0');
    expect(a).toBe(b);
  });

  it('changes when the state, snapshot or score bucket changes', () => {
    const base = notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.0.0');
    expect(notificationFingerprint('THYAO', 'snap-1', 'NEW', '8', '1.0.0')).not.toBe(base);
    expect(notificationFingerprint('THYAO', 'snap-2', 'CONFIRMED', '8', '1.0.0')).not.toBe(base);
    expect(notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '9', '1.0.0')).not.toBe(base);
    expect(notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.1.0')).not.toBe(base);
  });

  it('is a sha256 hex digest', () => {
    const fp = notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.0.0');
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('TelegramDeliveryRepository', () => {
  let repo: TelegramDeliveryRepository;

  beforeEach(() => {
    repo = new TelegramDeliveryRepository();
  });

  function record(overrides: Partial<TelegramDeliveryRecord> = {}): TelegramDeliveryRecord {
    return {
      id: 'rec-1',
      fingerprint: notificationFingerprint('THYAO', 'snap-1', 'CONFIRMED', '8', '1.0.0'),
      ticker: 'THYAO',
      snapshotId: 'snap-1',
      messageType: 'daily_radar',
      status: 'SENT',
      telegramMessageId: '123',
      chatIdHash: 'abc123',
      attemptCount: 1,
      lastAttemptAt: '2026-08-14T12:00:00.000Z',
      deliveredAt: '2026-08-14T12:00:00.000Z',
      errorCode: null,
      errorMessageSanitized: null,
      createdAt: '2026-08-14T12:00:00.000Z',
      ...overrides,
    };
  }

  it('saves and finds a delivery by fingerprint', async () => {
    const rec = record();
    await repo.save(rec);
    const found = await repo.findByFingerprint(rec.fingerprint);
    expect(found).toBeDefined();
    expect(found!.ticker).toBe('THYAO');
    expect(found!.status).toBe('SENT');
  });

  it('lists deliveries with status and ticker filters', async () => {
    await repo.save(record({ id: '1', ticker: 'THYAO', status: 'SENT', fingerprint: notificationFingerprint('THYAO', 's1', 'CONFIRMED', '8', '1.0.0'), createdAt: '2026-08-14T12:00:00.000Z' }));
    await repo.save(record({ id: '2', ticker: 'AKBNK', status: 'FAILED', fingerprint: notificationFingerprint('AKBNK', 's1', 'CONFIRMED', '8', '1.0.0'), createdAt: '2026-08-14T13:00:00.000Z' }));

    const byStatus = await repo.list(50, { status: 'FAILED' });
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].ticker).toBe('AKBNK');

    const byTicker = await repo.list(50, { ticker: 'THYAO' });
    expect(byTicker).toHaveLength(1);

    const all = await repo.list(50, {});
    expect(all).toHaveLength(2);
    expect(all[0].ticker).toBe('AKBNK'); // newest first
  });

  it('counts deliveries by status', async () => {
    await repo.save(record({ id: '1', status: 'SENT' }));
    await repo.save(record({ id: '2', status: 'SENT' }));
    await repo.save(record({ id: '3', status: 'FAILED' }));
    const counts = await repo.countByStatus();
    expect(counts['SENT']).toBe(2);
    expect(counts['FAILED']).toBe(1);
  });

  it('hashes chat ids without exposing the raw value', async () => {
    const hash = repo.hashChatId('123456789');
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(hash).not.toContain('123456789');
  });

  it('persists only sanitized data (no token or headers)', async () => {
    const rec = record({ errorMessageSanitized: 'rate limited', status: 'RATE_LIMITED' });
    await repo.save(rec);
    const found = await repo.findByFingerprint(rec.fingerprint);
    expect(found).toBeDefined();
    expect(JSON.stringify(found)).not.toContain('api.telegram.org/bot');
    expect(JSON.stringify(found)).not.toContain('authorization');
  });
});