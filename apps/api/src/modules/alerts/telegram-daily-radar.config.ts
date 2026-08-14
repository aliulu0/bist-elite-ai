/**
 * R2-051 — Telegram Daily Opportunity Radar configuration.
 *
 * All values are environment-driven (TELEGRAM_*) so the delivery layer behaves
 * the same in any clean runtime. Follows the deterministic env pattern used by
 * the radar (radar.config.ts) and market-data (market-data.config.ts).
 */
export interface TelegramRadarConfig {
  /** Bot token (masked everywhere outside the HTTP client). */
  botToken: string;
  /** Destination chat id. */
  chatId: string;
  /** Master switch for the Telegram channel. */
  enabled: boolean;
  /** Whether the daily radar report is scheduled. */
  dailyRadarEnabled: boolean;
  /** Local report time in HH:MM (Europe/Istanbul). */
  dailyRadarTime: string;
  /** IANA timezone for the scheduled report. */
  timezone: string;
  /** Minimum opportunity score to include in the report. */
  minScore: number;
  /** Maximum opportunities included per report. */
  maxOpportunities: number;
  /** Include WEAKENING opportunities. */
  includeWeakening: boolean;
  /** Include INVALIDATED opportunities. */
  includeInvalidated: boolean;
  /** Send a "no opportunities" report when none qualify. */
  sendEmptyReport: boolean;
  /** Cooldown (minutes) between identical daily reports. */
  cooldownMinutes: number;
  /** Per-request HTTP timeout. */
  requestTimeoutMs: number;
  /** Bounded retry count for transient delivery failures. */
  maxRetries: number;
  /** Build + preview the exact message but do not send. */
  dryRun: boolean;
  /** Opt-in live smoke test (never runs during ordinary CI). */
  liveSmokeTest: boolean;
  /** Config surface version used in notification fingerprints. */
  configVersion: string;
}

function num(value: string | undefined, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value !== 'false' && value !== '0' && value !== '';
}

export function getTelegramRadarConfig(): TelegramRadarConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    enabled: bool(process.env.TELEGRAM_ENABLED, false),
    dailyRadarEnabled: bool(process.env.TELEGRAM_DAILY_RADAR_ENABLED, false),
    dailyRadarTime: process.env.TELEGRAM_DAILY_RADAR_TIME || '18:30',
    timezone: process.env.TELEGRAM_TIMEZONE || 'Europe/Istanbul',
    minScore: num(process.env.TELEGRAM_MIN_SCORE, 70),
    maxOpportunities: num(process.env.TELEGRAM_MAX_OPPORTUNITIES, 10),
    includeWeakening: bool(process.env.TELEGRAM_INCLUDE_WEAKENING, false),
    includeInvalidated: bool(process.env.TELEGRAM_INCLUDE_INVALIDATED, false),
    sendEmptyReport: bool(process.env.TELEGRAM_SEND_EMPTY_REPORT, false),
    cooldownMinutes: num(process.env.TELEGRAM_COOLDOWN_MINUTES, 60),
    requestTimeoutMs: num(process.env.TELEGRAM_REQUEST_TIMEOUT_MS, 15000),
    maxRetries: num(process.env.TELEGRAM_MAX_RETRIES, 3),
    dryRun: bool(process.env.TELEGRAM_DRY_RUN, false),
    liveSmokeTest: bool(process.env.TELEGRAM_LIVE_SMOKE_TEST, false),
    configVersion: '1.0.0',
  };
}

export const DEFAULT_TELEGRAM_RADAR_CONFIG = getTelegramRadarConfig();
