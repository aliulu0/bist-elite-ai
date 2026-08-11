import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  AlertEvent,
  AlertConfig,
  AlertType,
  AlertPriority,
  AlertChannelType,
  AlertStatus,
  AlertSource,
  AlertsMetrics,
  ALERTS_VERSION,
} from '../alerts.types';
import { DEFAULT_ALERTS_CONFIG } from '../alerts.config';
import { RankedOpportunity } from '../../ranking/ranking.types';
import { CooldownEngine } from '../services/cooldown.service';
import { DuplicatePrevention } from '../services/duplicate-prevention.service';
import { AlertHistory } from '../services/alert-history.service';
import { AlertMetricsCollector } from '../services/alert-metrics.service';
import { TelegramService } from '../services/telegram.service';
import { WebSocketPublisher } from '../services/websocket.service';
import { TriggerEvaluator, TriggerMatch } from '../services/trigger-evaluator.service';
import { WatchlistManager } from '../services/watchlist-manager.service';
import { IAlertChannel } from '../interfaces/alert-channel.interface';

@Injectable()
export class AlertEngine {
  private readonly logger = new Logger(AlertEngine.name);
  private readonly config: AlertConfig;
  private readonly channels: Map<AlertChannelType, IAlertChannel>;

  constructor(
    readonly cooldownEngine: CooldownEngine,
    readonly duplicatePrevention: DuplicatePrevention,
    readonly alertHistory: AlertHistory,
    readonly metricsCollector: AlertMetricsCollector,
    readonly telegramService: TelegramService,
    readonly webSocketPublisher: WebSocketPublisher,
    readonly triggerEvaluator: TriggerEvaluator,
    readonly watchlistManager: WatchlistManager,
    @Optional() config?: Partial<AlertConfig>,
  ) {
    this.config = { ...DEFAULT_ALERTS_CONFIG, ...config };
    this.channels = new Map<AlertChannelType, IAlertChannel>();
    this.channels.set('TELEGRAM', this.telegramService);
    this.channels.set('WEBSOCKET', this.webSocketPublisher);
  }

  async processRankedOpportunities(rankedList: RankedOpportunity[]): Promise<AlertEvent[]> {
    if (!this.config.enabled || !rankedList.length) return [];

    const startTime = Date.now();
    const createdAlerts: AlertEvent[] = [];

    for (const ranked of rankedList) {
      if (createdAlerts.length >= this.config.maxAlertsPerRun) break;

      const matches = this.triggerEvaluator.evaluate(ranked);
      const matchedTriggers = matches.filter((m) => m.matched);

      if (matchedTriggers.length === 0) continue;

      const alert = await this.createAlert(ranked, matchedTriggers, startTime);
      if (alert) {
        createdAlerts.push(alert);
      }
    }

    this.logger.log(`Processed ${rankedList.length} ranked opportunities, created ${createdAlerts.length} alerts`);
    return createdAlerts;
  }

  private async createAlert(
    ranked: RankedOpportunity,
    matches: TriggerMatch[],
    startTime: number,
  ): Promise<AlertEvent | null> {
    const primaryMatch = matches[0];
    const alertType = this.matchTypeToAlertType(primaryMatch.condition.type);
    const priority = this.determinePriority(ranked, matches);
    const channels = this.determineChannels(alertType, priority);

    for (const channel of channels) {
      if (this.cooldownEngine.isOnCooldown(alertType, ranked.symbol, channel)) {
        this.metricsCollector.recordCooldownApplied();
        return null;
      }
    }

    const title = this.buildTitle(alertType, ranked);
    const keyTitle = `${ranked.recommendation}:${ranked.investmentGrade}`;

    if (this.duplicatePrevention.isDuplicate(alertType, ranked.symbol, keyTitle)) {
      this.metricsCollector.recordDuplicateSuppressed();
      return null;
    }

    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const source: AlertSource = {
      type: 'RANKING',
      engine: alertType,
      rankedOpportunity: ranked,
    };

    const alert: AlertEvent = {
      id: alertId,
      type: alertType,
      priority,
      title,
      message: this.buildMessage(ranked, matches),
      symbol: ranked.symbol,
      channels,
      status: 'ACTIVE',
      triggerCondition: primaryMatch.condition,
      source,
      metadata: {
        alertDurationMs: 0,
        channelDeliveries: [],
        duplicateSuppressed: false,
        cooldownApplied: false,
        cooldownRemainingMs: null,
        previousAlertId: this.duplicatePrevention.getPreviousAlertId(alertType, ranked.symbol, keyTitle),
        deliveryAttempts: 0,
        errorMessage: null,
      },
      createdAt: now,
      acknowledgedAt: null,
      dismissedAt: null,
      expiresAt: null,
    };

    this.duplicatePrevention.register(alertType, ranked.symbol, keyTitle, alertId, priority);

    for (const channel of channels) {
      this.cooldownEngine.setCooldown(alertType, ranked.symbol, channel, alertId);
    }

    await this.deliverAlert(alert);

    alert.metadata.alertDurationMs = Date.now() - startTime;
    this.alertHistory.record(alert, [], [], alert.metadata.alertDurationMs);
    this.metricsCollector.recordCreated(alertType, priority);

    return alert;
  }

  private async deliverAlert(alert: AlertEvent): Promise<void> {
    const channelsToTry = alert.channels.filter((ch) => this.channels.has(ch));

    for (const channelType of channelsToTry) {
      const channel = this.channels.get(channelType)!;
      if (!channel.isAvailable()) continue;

      const status = await channel.send(alert);
      alert.metadata.channelDeliveries.push(status);

      if (status.delivered) {
        this.metricsCollector.recordDelivered(channelType, status.durationMs);
      } else {
        this.metricsCollector.recordFailed(channelType);
      }
    }
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const result = this.alertHistory.updateStatus(alertId, 'ACKNOWLEDGED');
    if (result) {
      this.metricsCollector.recordStatusChange('ACTIVE', 'ACKNOWLEDGED');
      const alert = this.alertHistory.getAlertById(alertId);
      if (alert) {
        await this.deliverStatusUpdate(alert, 'ACKNOWLEDGED');
      }
    }
    return result;
  }

  async dismissAlert(alertId: string): Promise<boolean> {
    const result = this.alertHistory.updateStatus(alertId, 'DISMISSED');
    if (result) {
      this.metricsCollector.recordStatusChange('ACTIVE', 'DISMISSED');
      const alert = this.alertHistory.getAlertById(alertId);
      if (alert) {
        await this.deliverStatusUpdate(alert, 'DISMISSED');
      }
    }
    return result;
  }

  private async deliverStatusUpdate(alert: AlertEvent, _newStatus: string): Promise<void> {
    const wsChannel = this.channels.get('WEBSOCKET');
    if (wsChannel?.isAvailable()) {
      await wsChannel.send(alert);
    }
  }

  async expireAlerts(): Promise<number> {
    const expired = this.alertHistory.getByStatus('ACTIVE');
    const now = Date.now();
    let count = 0;
    for (const entry of expired) {
      if (entry.alert.expiresAt && new Date(entry.alert.expiresAt).getTime() <= now) {
        if (this.alertHistory.updateStatus(entry.alert.id, 'EXPIRED')) {
          this.metricsCollector.recordStatusChange('ACTIVE', 'EXPIRED');
          count++;
        }
      }
    }
    return count;
  }

  getMetrics(): AlertsMetrics {
    return this.metricsCollector.getMetrics();
  }

  getHistory(limit?: number, offset?: number) {
    return this.alertHistory.getHistory(limit, offset);
  }

  private matchTypeToAlertType(triggerType: AlertType): AlertType {
    return triggerType;
  }

  private determinePriority(ranked: RankedOpportunity, matches: TriggerMatch[]): AlertPriority {
    const maxScore = Math.max(...matches.map((m) => m.score));

    if (ranked.recommendation === 'STRONG_BUY' || ranked.priority === 'CRITICAL' || maxScore >= 90) {
      return 'CRITICAL';
    }
    if (ranked.priority === 'HIGH' || maxScore >= 70) {
      return 'HIGH';
    }
    if (maxScore >= 40) {
      return 'NORMAL';
    }
    return 'LOW';
  }

  private determineChannels(type: AlertType, priority: AlertPriority): AlertChannelType[] {
    const channels: AlertChannelType[] = ['APPLICATION'];

    if (priority === 'CRITICAL' || priority === 'HIGH') {
      channels.push('TELEGRAM');
    }
    if (type === 'WATCHLIST') {
      channels.push('TELEGRAM');
    }
    channels.push('WEBSOCKET');

    return [...new Set(channels)];
  }

  private buildTitle(type: AlertType, ranked: RankedOpportunity): string {
    const prefix = this.getTypePrefix(type);
    return `${prefix} ${ranked.symbol}: ${ranked.recommendation} (Grade: ${ranked.investmentGrade})`;
  }

  private getTypePrefix(type: AlertType): string {
    switch (type) {
      case 'OPPORTUNITY': return '[Opportunity]';
      case 'RANKING_CHANGE': return '[Rank Change]';
      case 'STRONG_BUY': return '[Strong Buy]';
      case 'STRONG_SELL': return '[Strong Sell]';
      case 'CONFIDENCE_INCREASE': return '[Confidence Up]';
      case 'CONFIDENCE_DROP': return '[Confidence Down]';
      case 'WATCHLIST': return '[Watchlist]';
      case 'PRICE_BREAKOUT': return '[Breakout]';
      case 'VOLUME_SPIKE': return '[Volume]';
      case 'RISK': return '[Risk]';
      case 'PORTFOLIO': return '[Portfolio]';
      case 'SCHEDULER': return '[Scheduled]';
      default: return '[Alert]';
    }
  }

  private buildMessage(ranked: RankedOpportunity, matches: TriggerMatch[]): string {
    const reasons = matches.map((m) => m.reason).filter(Boolean);
    return [
      `${ranked.symbol} - Rank #${ranked.rank}`,
      `Score: ${ranked.rankingScore} | Confidence: ${ranked.confidence} | Risk: ${ranked.risk}`,
      `Grade: ${ranked.investmentGrade} | Recommendation: ${ranked.recommendation}`,
      `Reasons: ${reasons.join(' | ')}`,
      ranked.recommendationExplanation ? `\n${ranked.recommendationExplanation}` : '',
    ].join('\n');
  }
}
