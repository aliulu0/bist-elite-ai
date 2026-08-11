import { Injectable, Logger } from '@nestjs/common';
import { AlertEvent, AlertChannelType, ChannelDeliveryStatus, WebSocketConfig } from '../alerts.types';
import { IAlertChannel } from '../interfaces/alert-channel.interface';
import { DEFAULT_WEBSOCKET_CONFIG } from '../alerts.config';

interface WebSocketEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type WebSocketEventHandler = (event: WebSocketEvent) => void;

@Injectable()
export class WebSocketPublisher implements IAlertChannel {
  readonly channelType: AlertChannelType = 'WEBSOCKET';
  private readonly logger = new Logger(WebSocketPublisher.name);
  private readonly config: WebSocketConfig;
  private readonly subscribers: Set<WebSocketEventHandler> = new Set();
  private rateLimitTokens: number;
  private lastRateLimitReset: number;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      channel: 'WEBSOCKET',
      enabled: true,
      rateLimitPerMinute: 60,
      retryAttempts: 2,
      retryDelayMs: 1000,
      eventPrefix: 'alert',
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

  subscribe(handler: WebSocketEventHandler): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  async send(alert: AlertEvent): Promise<ChannelDeliveryStatus> {
    const startTime = Date.now();
    const status: ChannelDeliveryStatus = {
      channel: 'WEBSOCKET',
      delivered: false,
      deliveredAt: null,
      attemptCount: 0,
      errorMessage: null,
      durationMs: 0,
    };

    if (!this.isAvailable()) {
      status.errorMessage = 'WebSocket channel is disabled';
      status.durationMs = Date.now() - startTime;
      return status;
    }

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      status.attemptCount = attempt;
      try {
        await this.ensureRateLimit();

        const eventName = this.getEventName(alert.status);
        const event: WebSocketEvent = {
          event: eventName,
          data: this.buildEventData(alert),
          timestamp: new Date().toISOString(),
        };

        this.publish(event);
        status.delivered = true;
        status.deliveredAt = new Date().toISOString();
        status.durationMs = Date.now() - startTime;
        return status;
      } catch (error: any) {
        this.logger.warn(`WebSocket publish attempt ${attempt} failed: ${error.message}`);
        status.errorMessage = error.message;
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs);
        }
      }
    }

    status.durationMs = Date.now() - startTime;
    return status;
  }

  private getEventName(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'alert.created';
      case 'ACKNOWLEDGED': return 'alert.updated';
      case 'DISMISSED': return 'alert.dismissed';
      default: return 'alert.updated';
    }
  }

  private buildEventData(alert: AlertEvent): Record<string, unknown> {
    return {
      id: alert.id,
      type: alert.type,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      symbol: alert.symbol,
      status: alert.status,
      triggerCondition: alert.triggerCondition,
      metadata: {
        duplicateSuppressed: alert.metadata.duplicateSuppressed,
        cooldownApplied: alert.metadata.cooldownApplied,
      },
      createdAt: alert.createdAt,
    };
  }

  private publish(event: WebSocketEvent): void {
    for (const handler of this.subscribers) {
      try {
        handler(event);
      } catch (error: any) {
        this.logger.error(`WebSocket subscriber error: ${error.message}`);
      }
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
