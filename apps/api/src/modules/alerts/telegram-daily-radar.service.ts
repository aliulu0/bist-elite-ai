import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { RadarService } from '../ai-early-opportunity/radar/radar.service';
import {
  OpportunityRadarSnapshot,
  OpportunityRadarItem,
  RadarState,
  RadarRunOptions,
} from '../ai-early-opportunity/radar/radar.types';
import { TelegramClient, TelegramClientStatus, TelegramMeResult } from './telegram-client';
import { TelegramMessageFormatter, TelegramOpportunityView } from './telegram-message.formatter';
import {
  TelegramDeliveryRepository,
  TelegramDeliveryRecord,
  TelegramDeliveryState,
  notificationFingerprint,
} from './telegram-delivery.repository';
import { TelegramRadarConfig, getTelegramRadarConfig } from './telegram-daily-radar.config';
import { isTradingDay, todayTrDate } from '../market-data/historical/bist-trading-calendar';

/**
 * R2-051 — Telegram Daily Opportunity Radar.
 *
 * Telegram is a DELIVERY CHANNEL only. This service never recomputes scores,
 * returns, stops or targets — it consumes the existing Radar snapshot and the
 * existing Decision outputs, selects deterministic qualifying opportunities,
 * formats a Turkish report and delivers it through the official Bot API.
 */
export interface TelegramRadarRunResult {
  status: 'SENT' | 'SKIPPED' | 'SKIPPED_EMPTY' | 'SKIPPED_DISABLED' | 'SKIPPED_COOLDOWN' | 'FAILED' | 'DRY_RUN';
  opportunities: number;
  opportunitiesSent: number;
  duplicatesSkipped: number;
  messagesSent: number;
  telegramMessageIds: string[];
  error?: string;
  dryRun: boolean;
}

export interface TelegramPreviewResult {
  generatedAt: string;
  opportunityCount: number;
  selectedOpportunities: TelegramOpportunityView[];
  formattedMessage: string;
  chunks: string[];
  dryRun: boolean;
  configurationStatus: string;
  snapshot: {
    hasSnapshot: boolean;
    symbolsEvaluated: number;
    marketSessionLabel: string | null;
    timestamp: string | null;
  };
}

export interface TelegramStatusResult {
  configured: boolean;
  enabled: boolean;
  dailyRadarEnabled: boolean;
  authenticated: boolean;
  botUsername: string | null;
  botId: number | null;
  status: TelegramClientStatus;
  timezone: string;
  schedule: string;
  minScore: number;
  maxOpportunities: number;
  dryRun: boolean;
  lastRunAt: string | null;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: TelegramDeliveryState | null;
  lastError: string | null;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
}

const RADAR_SNAPSHOT_REUSE_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class TelegramDailyRadarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramDailyRadarService.name);
  private readonly config: TelegramRadarConfig;
  private readonly client: TelegramClient;
  private readonly formatter = new TelegramMessageFormatter();
  private readonly repository: TelegramDeliveryRepository;
  private readonly radar: RadarService | null;
  private readonly snapshotReuseTtlMs: number;

  private lastRunAt: string | null = null;
  private lastDeliveryAt: string | null = null;
  private lastDeliveryStatus: TelegramDeliveryState | null = null;
  private lastError: string | null = null;
  private meResult: TelegramMeResult | null = null;
  private meStatus: TelegramClientStatus = 'NOT_CONFIGURED';
  private lastMeCheckedAt: number = 0;
  private lastCooldownKey: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private dryRunOverride: boolean | null = null;
  private lastSnapshot: OpportunityRadarSnapshot | null = null;
  private lastSnapshotAt: number = 0;

  constructor(
    @Optional() radar?: RadarService,
    @Optional() repository?: TelegramDeliveryRepository,
    @Optional() config?: TelegramRadarConfig,
    @Optional() client?: TelegramClient,
    @Optional() snapshotReuseTtlMs?: number,
  ) {
    this.radar = radar ?? null;
    this.repository = repository ?? new TelegramDeliveryRepository();
    this.config = config ?? getTelegramRadarConfig();
    this.client = client ?? new TelegramClient(this.config);
    this.snapshotReuseTtlMs = snapshotReuseTtlMs ?? RADAR_SNAPSHOT_REUSE_TTL_MS;
  }

  onModuleInit(): void {
    this.logger.log('TelegramDailyRadarService initialized');
    if (this.config.enabled && this.config.dailyRadarEnabled) {
      this.startScheduler();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ─────────────────────────── Status ───────────────────────────

  async getStatus(): Promise<TelegramStatusResult> {
    const now = Date.now();
    if (now - this.lastMeCheckedAt > 60_000) {
      const { result, status } = await this.client.getMe();
      this.meResult = result;
      this.meStatus = status;
      this.lastMeCheckedAt = now;
    }
    const counts = await this.repository.countByStatus();
    return {
      configured: this.client.isConfigured(),
      enabled: this.config.enabled,
      dailyRadarEnabled: this.config.dailyRadarEnabled,
      authenticated: this.meStatus === 'VERIFIED',
      botUsername: this.meResult?.botUsername ?? null,
      botId: this.meResult?.botId ?? null,
      status: this.client.isConfigured()
        ? this.config.enabled
          ? this.meStatus
          : 'READY'
        : 'NOT_CONFIGURED',
      timezone: this.config.timezone,
      schedule: this.config.dailyRadarTime,
      minScore: this.config.minScore,
      maxOpportunities: this.config.maxOpportunities,
      dryRun: this.config.dryRun,
      lastRunAt: this.lastRunAt,
      lastDeliveryAt: this.lastDeliveryAt,
      lastDeliveryStatus: this.lastDeliveryStatus,
      lastError: this.lastError,
      pendingCount: counts['PENDING'] ?? 0,
      sentCount: counts['SENT'] ?? 0,
      failedCount: (counts['FAILED'] ?? 0) + (counts['RATE_LIMITED'] ?? 0),
    };
  }

  // ─────────────────────────── Snapshot ───────────────────────────

  private hasFreshSnapshot(snapshot: OpportunityRadarSnapshot | null): boolean {
    if (!snapshot) return false;
    const timestamp = Date.parse(snapshot.timestamp ?? snapshot.generatedAt ?? '');
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp <= this.snapshotReuseTtlMs;
  }

  /** Load the current cached radar snapshot, or run a fresh one when absent/stale. */
  private async obtainSnapshot(options?: RadarRunOptions): Promise<{ snapshot: OpportunityRadarSnapshot | null; reused: boolean }> {
    if (!this.radar) return { snapshot: null, reused: false };
    // Prefer the radar engine's own in-memory snapshot (provider-budget friendly).
    const radarSnapshot = this.radar.getCurrentSnapshot();
    const fresh = !options?.forceRefresh && this.hasFreshSnapshot(radarSnapshot ?? this.lastSnapshot);
    if (fresh) {
      this.lastSnapshot = radarSnapshot ?? this.lastSnapshot;
      this.lastSnapshotAt = Date.now();
      return { snapshot: this.lastSnapshot, reused: true };
    }
    try {
      const snapshot = await this.radar.runRadar({
        forceRefresh: options?.forceRefresh,
        maxSymbols: options?.maxSymbols,
        minScore: this.config.minScore,
      });
      this.lastSnapshot = snapshot;
      this.lastSnapshotAt = Date.now();
      return { snapshot, reused: false };
    } catch (error) {
      this.logger.warn(`Radar run failed for Telegram: ${error instanceof Error ? error.message : String(error)}`);
      return { snapshot: null, reused: false };
    }
  }

  // ─────────────────────────── Selection ───────────────────────────

  /**
   * Deterministic selection from the radar snapshot. Default qualifying states:
   * CONFIRMED, STRENGTHENING, NEW. WEAKENING only when configured; INVALIDATED
   * only when explicitly configured. Sorted by score, confidence, expected
   * return, then signal strength, then ticker (stable tie-break).
   */
  private selectOpportunities(snapshot: OpportunityRadarSnapshot | null): OpportunityRadarItem[] {
    if (!snapshot || !snapshot.items) return [];
    const items = Object.values(snapshot.items);
    const includeStates = new Set<RadarState>(['CONFIRMED', 'STRENGTHENING', 'NEW']);
    if (this.config.includeWeakening) includeStates.add('WEAKENING');
    if (this.config.includeInvalidated) includeStates.add('INVALIDATED');

    return items
      .filter((item) => includeStates.has(item.state))
      .filter((item) => (item.current?.earlyOpportunityScore ?? 0) >= this.config.minScore)
      .sort((a, b) => {
        const scoreDelta = (b.current?.earlyOpportunityScore ?? 0) - (a.current?.earlyOpportunityScore ?? 0);
        if (scoreDelta !== 0) return scoreDelta;
        const confidenceDelta = (b.current?.confidence ?? 0) - (a.current?.confidence ?? 0);
        if (confidenceDelta !== 0) return confidenceDelta;
        const returnDelta = (b.current?.expectedReturn ?? 0) - (a.current?.expectedReturn ?? 0);
        if (returnDelta !== 0) return returnDelta;
        const signalDelta = (b.current?.signalConvergence ?? 0) - (a.current?.signalConvergence ?? 0);
        if (signalDelta !== 0) return signalDelta;
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, this.config.maxOpportunities);
  }

  private toView(item: OpportunityRadarItem): TelegramOpportunityView {
    return this.formatter.formatOpportunity(item);
  }

  // ─────────────────────────── Fingerprint & dedup ───────────────────────────

  private scoreBucket(score: number): string {
    return String(Math.floor(score / 10));
  }

  private buildFingerprint(ticker: string, snapshotId: string, state: string, score: number): string {
    return notificationFingerprint(ticker, snapshotId, state, this.scoreBucket(score), this.config.configVersion);
  }

  // ─────────────────────────── Delivery ───────────────────────────

  async runDailyRadar(options?: RadarRunOptions): Promise<TelegramRadarRunResult> {
    if (!this.config.enabled) {
      return this.result('SKIPPED_DISABLED', 0, 0, 0, 0, []);
    }
    if (!this.config.dailyRadarEnabled) {
      return this.result('SKIPPED_DISABLED', 0, 0, 0, 0, []);
    }
    if (!this.client.isConfigured()) {
      return this.result('SKIPPED_DISABLED', 0, 0, 0, 0, []);
    }

    const { snapshot } = await this.obtainSnapshot(options);
    const selected = this.selectOpportunities(snapshot);

    if (selected.length === 0) {
      if (this.config.sendEmptyReport) {
        const message = this.formatter.buildEmptyReport(snapshot);
        return this.deliver(message, [], snapshot, [], []);
      }
      return this.result('SKIPPED_EMPTY', 0, 0, 0, 0, []);
    }

    const views = selected.map((item) => this.toView(item));
    const snapshotId = snapshot?.timestamp ?? snapshot?.generatedAt ?? new Date().toISOString();

    // Dedup against previously delivered fingerprints for this identity.
    const kept: OpportunityRadarItem[] = [];
    const keptViews: TelegramOpportunityView[] = [];
    let duplicatesSkipped = 0;
    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      const fingerprint = this.buildFingerprint(item.ticker, snapshotId, item.state, item.current?.earlyOpportunityScore ?? 0);
      const existing = await this.repository.findByFingerprint(fingerprint);
      if (existing && existing.status === 'SENT') {
        duplicatesSkipped++;
      } else {
        kept.push(item);
        keptViews.push(views[i]);
      }
    }

    if (kept.length === 0) {
      return this.result('SKIPPED', selected.length, 0, 0, duplicatesSkipped, []);
    }

    const message = this.formatter.buildDailyReport(snapshot, keptViews, { timezone: this.config.timezone });
    return this.deliver(message, kept, snapshot, keptViews, []);
  }

  private async deliver(
    message: string,
    opportunities: OpportunityRadarItem[],
    snapshot: OpportunityRadarSnapshot | null,
    views: TelegramOpportunityView[],
    telegramMessageIds: string[],
  ): Promise<TelegramRadarRunResult> {
    const snapshotId = snapshot?.timestamp ?? snapshot?.generatedAt ?? new Date().toISOString();
    const chunks = this.formatter.chunk(message);
    const dryRun = this.dryRunOverride ?? this.config.dryRun;

    if (dryRun) {
      await this.persistDeliveries(opportunities, views, snapshotId, 'SENT', null);
      this.lastRunAt = new Date().toISOString();
      return this.result('DRY_RUN', opportunities.length, opportunities.length, chunks.length, 0, []);
    }

    let deliveredCount = 0;
    let failed = false;
    for (const chunk of chunks) {
      const sendResult = await this.client.sendMessage(chunk);
      if (sendResult.status === 'VERIFIED' && sendResult.messageId) {
        telegramMessageIds.push(sendResult.messageId);
        deliveredCount++;
        this.lastDeliveryAt = new Date().toISOString();
        this.lastDeliveryStatus = 'SENT';
        this.lastError = null;
      } else {
        this.lastDeliveryStatus = sendResult.status === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED';
        this.lastError = `Telegram delivery ${sendResult.status}`;
        this.logger.error(`Telegram send failed: ${sendResult.status}`);
        failed = true;
        break;
      }
    }

    if (deliveredCount > 0) {
      await this.persistDeliveries(opportunities, views, snapshotId, 'SENT', telegramMessageIds[0] ?? null);
    }

    this.lastRunAt = new Date().toISOString();
    if (failed) {
      return this.result('FAILED', opportunities.length, deliveredCount, deliveredCount, 0, telegramMessageIds, this.lastError ?? undefined);
    }
    return this.result('SENT', opportunities.length, opportunities.length, chunks.length, 0, telegramMessageIds);
  }

  private async persistDeliveries(
    opportunities: OpportunityRadarItem[],
    views: TelegramOpportunityView[],
    snapshotId: string,
    status: TelegramDeliveryState,
    telegramMessageId: string | null,
  ): Promise<void> {
    const chatIdHash = this.repository.hashChatId(this.config.chatId);
    for (let i = 0; i < opportunities.length; i++) {
      const item = opportunities[i];
      const score = item.current?.earlyOpportunityScore ?? views[i]?.score ?? 0;
      const fingerprint = this.buildFingerprint(item.ticker, snapshotId, item.state, score);
      const record: TelegramDeliveryRecord = {
        id: `telegram_radar_${Date.now()}_${i}`,
        fingerprint,
        ticker: item.ticker,
        snapshotId,
        messageType: 'daily_radar',
        status,
        telegramMessageId,
        chatIdHash,
        attemptCount: 1,
        lastAttemptAt: new Date().toISOString(),
        deliveredAt: status === 'SENT' ? new Date().toISOString() : null,
        errorCode: null,
        errorMessageSanitized: null,
        createdAt: new Date().toISOString(),
      };
      await this.repository.save(record);
    }
  }

  private result(
    status: TelegramRadarRunResult['status'],
    opportunities: number,
    opportunitiesSent: number,
    messagesSent: number,
    duplicatesSkipped: number,
    telegramMessageIds: string[],
    error?: string,
  ): TelegramRadarRunResult {
    return {
      status,
      opportunities,
      opportunitiesSent,
      duplicatesSkipped,
      messagesSent,
      telegramMessageIds,
      error,
      dryRun: this.dryRunOverride ?? this.config.dryRun,
    };
  }

  // ─────────────────────────── Preview / manual ───────────────────────────

  async getPreview(): Promise<TelegramPreviewResult> {
    const { snapshot } = await this.obtainSnapshot();
    const selected = this.selectOpportunities(snapshot);
    const views = selected.map((item) => this.toView(item));
    const message = this.formatter.buildDailyReport(snapshot, views, { timezone: this.config.timezone });
    return {
      generatedAt: new Date().toISOString(),
      opportunityCount: views.length,
      selectedOpportunities: views,
      formattedMessage: message,
      chunks: this.formatter.chunk(message),
      dryRun: this.config.dryRun,
      configurationStatus: this.client.isConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      snapshot: {
        hasSnapshot: snapshot != null,
        symbolsEvaluated: snapshot?.symbolsEvaluated ?? 0,
        marketSessionLabel: snapshot?.marketSessionLabel ?? null,
        timestamp: snapshot?.timestamp ?? null,
      },
    };
  }

  async sendNow(options?: RadarRunOptions): Promise<TelegramRadarRunResult> {
    return this.runDailyRadar(options);
  }

  /** One-off dry-run override used by the manual endpoint (never persisted). */
  forceDryRun(value: boolean): void {
    this.dryRunOverride = value;
  }

  async listDeliveries(limit: number, status?: string, ticker?: string): Promise<{ deliveries: TelegramDeliveryRecord[]; total: number }> {
    const deliveries = await this.repository.list(limit, { status, ticker });
    const total = await this.repository.countAll();
    return { deliveries, total };
  }

  // ─────────────────────────── Scheduler ───────────────────────────

  /**
   * Lightweight daily scheduler using the existing BIST trading calendar. The
   * daily report runs only on trading days at the configured local time.
   */
  private startScheduler(): void {
    if (this.timer) return;
    const check = async () => {
      try {
        await this.tick();
      } catch (error) {
        this.logger.error(`Telegram scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    this.timer = setInterval(() => void check(), 60_000);
    this.timer.unref?.();
    this.logger.log(`Telegram daily radar scheduler started (${this.config.dailyRadarTime}, ${this.config.timezone}, trading days only)`);
  }

  private async tick(): Promise<void> {
    if (!this.config.enabled || !this.config.dailyRadarEnabled) return;
    if (!isTradingDay(todayTrDate())) return;

    const now = new Date();
    const nowParts = this.toLocalTimeParts(now);
    const target = this.config.dailyRadarTime.split(':').map((p) => parseInt(p, 10));
    if (nowParts[0] !== target[0] || nowParts[1] !== target[1]) return;

    const todayKey = todayTrDate();
    if (this.lastCooldownKey === todayKey) return;
    this.lastCooldownKey = todayKey;

    this.logger.log(`Executing scheduled Telegram daily radar (${todayKey})`);
    await this.runDailyRadar();
  }

  private toLocalTimeParts(date: Date): [number, number] {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.config.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '0';
    return [parseInt(hour, 10), parseInt(minute, 10)];
  }

  getConfig(): TelegramRadarConfig {
    return { ...this.config };
  }
}