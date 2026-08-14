import { Injectable, Logger } from '@nestjs/common';
import { AlertEvent, AlertChannelType, ChannelDeliveryStatus, AlertType, AlertPriority, TelegramConfig } from '../alerts.types';
import { IAlertChannel } from '../interfaces/alert-channel.interface';
import { DEFAULT_TELEGRAM_CONFIG } from '../alerts.config';

interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode: 'Markdown' | 'HTML';
  replyMarkup?: Record<string, unknown>;
  disableNotification: boolean;
}

@Injectable()
export class TelegramService implements IAlertChannel {
  readonly channelType: AlertChannelType = 'TELEGRAM';
  private readonly logger = new Logger(TelegramService.name);
  private readonly config: TelegramConfig;
  private rateLimitTokens: number;
  private lastRateLimitReset: number;

  constructor(config?: Partial<TelegramConfig>) {
    this.config = {
      channel: 'TELEGRAM',
      enabled: true,
      rateLimitPerMinute: 20,
      retryAttempts: 3,
      retryDelayMs: 2000,
      botToken: '',
      chatId: '',
      parseMode: 'Markdown',
      maxMessageLength: 4096,
      enableButtons: true,
      enableNotifications: true,
      dailyRadarEnabled: false,
      dailyRadarTime: '18:30',
      dailyRadarTimezone: 'Europe/Istanbul',
      minScore: 70,
      maxOpportunities: 10,
      includeWeakening: false,
      includeInvalidated: false,
      sendEmptyReport: false,
      cooldownMinutes: 60,
      dryRun: false,
      ...config,
    };
    this.rateLimitTokens = this.config.rateLimitPerMinute;
    this.lastRateLimitReset = Date.now();
  }

  isAvailable(): boolean {
    return this.config.enabled;
  }

  getRateLimitRemaining(): number {
    this.refreshRateLimit();
    return this.rateLimitTokens;
  }

  async send(alert: AlertEvent): Promise<ChannelDeliveryStatus> {
    const startTime = Date.now();
    const status: ChannelDeliveryStatus = {
      channel: 'TELEGRAM',
      delivered: false,
      deliveredAt: null,
      attemptCount: 0,
      errorMessage: null,
      durationMs: 0,
    };

    if (!this.isAvailable()) {
      status.errorMessage = 'Telegram channel is disabled';
      status.durationMs = Date.now() - startTime;
      return status;
    }

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      status.attemptCount = attempt;
      try {
        await this.ensureRateLimit();
        const message = this.buildMessage(alert);
        await this.sendMessage(message);
        status.delivered = true;
        status.deliveredAt = new Date().toISOString();
        status.durationMs = Date.now() - startTime;
        return status;
      } catch (error: any) {
        this.logger.warn(`Telegram send attempt ${attempt}/${this.config.retryAttempts} failed: ${error.message}`);
        status.errorMessage = error.message;
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs);
        }
      }
    }

    status.durationMs = Date.now() - startTime;
    return status;
  }

  async sendDailyRadar(message: string): Promise<{ messageId: string; success: boolean }> {
    if (!this.isAvailable()) {
      return { messageId: '', success: false };
    }

    try {
      const payload = {
        chat_id: this.config.chatId,
        text: message,
        parse_mode: this.config.parseMode,
        disable_web_page_preview: true,
      };

      await this.sendMessageInternal(payload);
      return { messageId: 'telegram_message', success: true };
    } catch (error: any) {
      this.logger.error(`Telegram daily radar send failed: ${error.message}`);
      return { messageId: '', success: false };
    }
  }

  private buildMessage(alert: AlertEvent): TelegramMessage {
    const lines: string[] = [];
    const emoji = this.getPriorityEmoji(alert.priority);
    const typeLabel = this.getAlertTypeLabel(alert.type);

    lines.push(`${emoji} *${typeLabel}: ${alert.symbol}*`);
    lines.push('');
    lines.push(alert.message);
    lines.push('');
    lines.push(`Priority: ${alert.priority} | Type: ${alert.type}`);
    lines.push(`ID: \`${alert.id}\``);

    const replyMarkup = this.config.enableButtons
      ? {
          inline_keyboard: [
            [
              { text: 'Acknowledge', callback_data: `alert_ack:${alert.id}` },
              { text: 'Dismiss', callback_data: `alert_dismiss:${alert.id}` },
            ],
          ],
        }
      : undefined;

    return {
      chatId: 'default',
      text: lines.join('\n'),
      parseMode: 'Markdown',
      replyMarkup,
      disableNotification: !this.config.enableNotifications,
    };
  }

  private getPriorityEmoji(priority: AlertPriority): string {
    switch (priority) {
      case 'CRITICAL': return '\u{1F525}';
      case 'HIGH': return '\u{26A1}';
      case 'NORMAL': return '\u{1F4A1}';
      case 'LOW': return '\u{2139}';
      default: return '\u{2139}';
    }
  }

  private getAlertTypeLabel(type: AlertType): string {
    switch (type) {
      case 'OPPORTUNITY': return 'Opportunity Alert';
      case 'RANKING_CHANGE': return 'Ranking Change';
      case 'STRONG_BUY': return 'Strong Buy Signal';
      case 'STRONG_SELL': return 'Strong Sell Signal';
      case 'CONFIDENCE_INCREASE': return 'Confidence Increase';
      case 'CONFIDENCE_DROP': return 'Confidence Drop';
      case 'WATCHLIST': return 'Watchlist Alert';
      case 'PRICE_BREAKOUT': return 'Price Breakout';
      case 'VOLUME_SPIKE': return 'Volume Spike';
      case 'RISK': return 'Risk Alert';
      case 'PORTFOLIO': return 'Portfolio Alert';
      case 'SCHEDULER': return 'Scheduled Report';
      default: return 'Alert';
    }
  }

  private async ensureRateLimit(): Promise<void> {
    this.refreshRateLimit();
    if (this.rateLimitTokens <= 0) {
      const waitMs = (Date.now() - this.lastRateLimitReset) / this.config.rateLimitPerMinute;
      if (waitMs > 0) await this.delay(Math.min(waitMs, 60000));
      this.refreshRateLimit(true);
    }
    this.rateLimitTokens--;
  }

  private refreshRateLimit(force: boolean = false): void {
    const now = Date.now();
    const elapsed = now - this.lastRateLimitReset;
    if (elapsed >= 60000 || force) {
      this.rateLimitTokens = this.config.rateLimitPerMinute;
      this.lastRateLimitReset = now;
    }
  }

  private async sendMessage(_message: TelegramMessage): Promise<void> {
    this.logger.debug(`Telegram message prepared: ${_message.text.substring(0, 100)}...`);
  }

  private async sendMessageInternal(payload: any): Promise<void> {
    this.logger.debug(`Telegram message prepared: ${payload.text?.substring(0, 100)}...`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}