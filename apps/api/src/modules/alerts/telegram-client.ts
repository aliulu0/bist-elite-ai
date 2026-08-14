import { Logger, Optional } from '@nestjs/common';
import { getTelegramRadarConfig, TelegramRadarConfig } from './telegram-daily-radar.config';

/**
 * R2-051 — Minimal official Telegram Bot API client.
 *
 * Implements only the operations the daily radar needs:
 *   - getMe        (authentication/connectivity check)
 *   - sendMessage  (delivery)
 *
 * Token is used only inside the Authorization-scoped URL and is never logged.
 */
export type TelegramClientStatus =
  | 'NOT_CONFIGURED'
  | 'READY'
  | 'AUTH_FAILED'
  | 'CHAT_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'SEND_FAILED'
  | 'VERIFIED';

export interface TelegramMeResult {
  botId: number | null;
  botUsername: string | null;
}

export interface TelegramSendResult {
  messageId: string;
  status: TelegramClientStatus;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
}

export class TelegramClient {
  private readonly logger = new Logger(TelegramClient.name);
  private readonly config: TelegramRadarConfig;

  constructor(
    @Optional() config?: TelegramRadarConfig,
    @Optional() private readonly sleepImpl: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.config = config ?? getTelegramRadarConfig();
  }

  isConfigured(): boolean {
    return this.config.botToken.length > 0 && this.config.chatId.length > 0;
  }

  /** Masked token suitable for logs/status endpoints. Never exposes the full token. */
  maskToken(): string {
    const token = this.config.botToken;
    if (!token) return '';
    const sep = token.indexOf(':');
    if (sep > 0) {
      const head = token.slice(0, sep);
      const tail = token.slice(sep + 1);
      const visibleTail = tail.length > 4 ? tail.slice(-4) : tail;
      return `${head}:****${visibleTail}`;
    }
    return token.length > 4 ? `****${token.slice(-4)}` : '****';
  }

  /**
   * Bot authentication / connectivity check. Safe: read-only, never sends a
   * message. Returns null on failure (status classified by caller).
   */
  async getMe(): Promise<{ result: TelegramMeResult | null; status: TelegramClientStatus }> {
    if (!this.config.botToken) {
      return { result: null, status: 'NOT_CONFIGURED' };
    }
    try {
      const response = await this.request('getMe', {});
      if (!response.ok) {
        return { result: null, status: this.classifyAuthFailure(response) };
      }
      return {
        result: {
          botId: response.result?.id ?? null,
          botUsername: response.result?.username ?? null,
        },
        status: 'VERIFIED',
      };
    } catch (error) {
      this.logger.warn(`getMe failed: ${this.sanitizeError(error)}`);
      return { result: null, status: 'AUTH_FAILED' };
    }
  }

  /**
   * Send a text message with bounded retries for transient failures.
   * Permanent errors (invalid token/chat, malformed request) are never retried.
   */
  async sendMessage(text: string): Promise<TelegramSendResult> {
    if (!this.isConfigured()) {
      return { messageId: '', status: 'NOT_CONFIGURED' };
    }
    let attempt = 0;
    while (attempt <= this.config.maxRetries) {
      attempt++;
      try {
        const response = await this.request('sendMessage', {
          chat_id: this.config.chatId,
          text,
          disable_web_page_preview: true,
        });
        if (!response.ok) {
          const status = this.classifySendFailure(response);
          if ((status === 'RATE_LIMITED' || status === 'SEND_FAILED') && attempt <= this.config.maxRetries) {
            await this.delay(this.retryDelayMs(response, attempt));
            continue;
          }
          return { messageId: '', status };
        }
        const messageId = response.result?.message_id;
        return { messageId: messageId != null ? String(messageId) : '', status: 'VERIFIED' };
      } catch (error) {
        const status = this.classifyTransportError(error);
        if (attempt <= this.config.maxRetries && (status === 'RATE_LIMITED' || status === 'SEND_FAILED')) {
          await this.delay(this.retryDelayMs(undefined, attempt));
          continue;
        }
        return { messageId: '', status };
      }
    }
    return { messageId: '', status: 'SEND_FAILED' };
  }

  private async request(method: string, payload: Record<string, unknown>): Promise<TelegramApiResponse> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/${method}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let body: TelegramApiResponse | null = null;
      try {
        body = (await response.json()) as TelegramApiResponse;
      } catch {
        body = null;
      }
      if (!response.ok) {
        return (
          body ?? {
            ok: false,
            description: `HTTP ${response.status}`,
            error_code: response.status,
          }
        );
      }
      return body ?? { ok: true, result: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  private classifyAuthFailure(response: TelegramApiResponse): TelegramClientStatus {
    if (response.error_code === 401 || response.error_code === 404) return 'AUTH_FAILED';
    if (response.error_code === 429) return 'RATE_LIMITED';
    return 'AUTH_FAILED';
  }

  private classifySendFailure(response: TelegramApiResponse): TelegramClientStatus {
    if (response.error_code === 401) return 'AUTH_FAILED';
    if (response.error_code === 429) return 'RATE_LIMITED';
    if (response.error_code === 400 || response.error_code === 403) return 'CHAT_UNAVAILABLE';
    return 'SEND_FAILED';
  }

  private classifyTransportError(error: unknown): TelegramClientStatus {
    const message = error instanceof Error ? error.message : String(error);
    if (/abort|timeout/i.test(message)) return 'SEND_FAILED';
    return 'SEND_FAILED';
  }

  private retryDelayMs(response: TelegramApiResponse | undefined, attempt: number): number {
    const retryAfter = response?.parameters?.retry_after;
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      return Math.min(retryAfter * 1000, 60000);
    }
    return Math.min(2000 * attempt, 10000);
  }

  private sanitizeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    // The token never appears in exception messages because it is embedded in
    // the URL only; this is an extra defensive mask.
    return message.replace(/bot[\dA-Za-z_:-]+/g, 'bot****');
  }

  private delay(ms: number): Promise<void> {
    return this.sleepImpl(ms);
  }
}
