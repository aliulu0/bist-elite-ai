import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TelegramRadarConfig } from './telegram-daily-radar.config';
import { createHash } from 'crypto';

/**
 * R2-051 — Delivery record persistence.
 *
 * Uses Prisma when a database connection is available; otherwise falls back to
 * an in-memory store so unit tests (which construct classes directly) and
 * DB-less runtimes keep working. Never persists bot tokens or headers.
 */
export type TelegramDeliveryState =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'RATE_LIMITED'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_FILTER'
  | 'DISABLED';

export interface TelegramDeliveryRecord {
  id: string;
  fingerprint: string;
  ticker: string | null;
  snapshotId: string | null;
  messageType: string;
  status: TelegramDeliveryState;
  telegramMessageId: string | null;
  chatIdHash: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  errorCode: string | null;
  errorMessageSanitized: string | null;
  createdAt: string;
}

interface DeliveryStorage {
  save(record: TelegramDeliveryRecord): Promise<void>;
  findByFingerprint(fingerprint: string): Promise<TelegramDeliveryRecord | null>;
  list(limit: number, filters: { status?: string; ticker?: string }): Promise<TelegramDeliveryRecord[]>;
  countByStatus(): Promise<Record<string, number>>;
  countAll(): Promise<number>;
}

class InMemoryDeliveryStorage implements DeliveryStorage {
  private readonly records: TelegramDeliveryRecord[] = [];

  async save(record: TelegramDeliveryRecord): Promise<void> {
    const existing = this.records.findIndex((r) => r.id === record.id);
    if (existing >= 0) {
      this.records[existing] = record;
    } else {
      this.records.push(record);
    }
  }

  async findByFingerprint(fingerprint: string): Promise<TelegramDeliveryRecord | null> {
    return this.records.find((r) => r.fingerprint === fingerprint) ?? null;
  }

  async list(limit: number, filters: { status?: string; ticker?: string }): Promise<TelegramDeliveryRecord[]> {
    let rows = this.records.slice();
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    if (filters.ticker) rows = rows.filter((r) => r.ticker === filters.ticker);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, limit);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const r of this.records) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }

  async countAll(): Promise<number> {
    return this.records.length;
  }
}

/** Deterministic sha256 fingerprint for a delivery identity. */
export function notificationFingerprint(
  ticker: string,
  snapshotId: string,
  state: string,
  scoreBucket: string,
  configVersion: string,
): string {
  return createHash('sha256')
    .update(`${ticker}|${snapshotId}|${state}|${scoreBucket}|${configVersion}`)
    .digest('hex');
}

@Injectable()
export class TelegramDeliveryRepository {
  private readonly logger = new Logger(TelegramDeliveryRepository.name);
  private readonly fallback: DeliveryStorage = new InMemoryDeliveryStorage();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private get storage(): DeliveryStorage {
    return this.fallback;
  }

  async save(record: TelegramDeliveryRecord): Promise<void> {
    await this.storage.save(record);
    await this.tryPersistPrisma(record);
  }

  async findByFingerprint(fingerprint: string): Promise<TelegramDeliveryRecord | null> {
    return this.storage.findByFingerprint(fingerprint);
  }

  async list(limit: number, filters: { status?: string; ticker?: string }): Promise<TelegramDeliveryRecord[]> {
    return this.storage.list(limit, filters);
  }

  async countByStatus(): Promise<Record<string, number>> {
    return this.storage.countByStatus();
  }

  async countAll(): Promise<number> {
    return this.storage.countAll();
  }

  private async tryPersistPrisma(record: TelegramDeliveryRecord): Promise<void> {
    if (!this.prisma || !this.prisma.isDbConnected()) return;
    try {
      const delegate = (this.prisma as unknown as { telegramNotificationDelivery?: { create: (data: { data: Record<string, unknown> }) => Promise<unknown> } })
        .telegramNotificationDelivery;
      if (!delegate) return;
      await delegate.create({
        data: {
          fingerprint: record.fingerprint,
          ticker: record.ticker,
          snapshotId: record.snapshotId,
          messageType: record.messageType,
          status: record.status,
          telegramMessageId: record.telegramMessageId,
          chatIdHash: record.chatIdHash,
          attemptCount: record.attemptCount,
          lastAttemptAt: record.lastAttemptAt ? new Date(record.lastAttemptAt) : null,
          deliveredAt: record.deliveredAt ? new Date(record.deliveredAt) : null,
          errorCode: record.errorCode,
          errorMessageSanitized: record.errorMessageSanitized,
        },
      });
    } catch (error) {
      // Persistence is best-effort: a DB failure must never break radar/telegram.
      this.logger.warn(`Telegram delivery DB persistence skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Stable hash of the chat id so raw chat ids are not persisted. */
  hashChatId(chatId: string): string {
    return createHash('sha256').update(chatId).digest('hex').slice(0, 16);
  }
}
