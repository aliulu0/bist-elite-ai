import { OpportunityResult } from '../opportunity-detection/opportunity-detection.types';
import { ScannerResult } from '../scanner/scanner.types';
import { RankedOpportunity } from '../ranking/ranking.types';

export const ALERTS_VERSION = '1.0.0';

export type AlertType =
  | 'OPPORTUNITY'
  | 'RANKING_CHANGE'
  | 'STRONG_BUY'
  | 'STRONG_SELL'
  | 'CONFIDENCE_INCREASE'
  | 'CONFIDENCE_DROP'
  | 'WATCHLIST'
  | 'PRICE_BREAKOUT'
  | 'VOLUME_SPIKE'
  | 'RISK'
  | 'PORTFOLIO'
  | 'SCHEDULER';

export type AlertPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type AlertChannelType = 'TELEGRAM' | 'APPLICATION' | 'WEBSOCKET' | 'EMAIL' | 'SMS' | 'PUSH' | 'DISCORD' | 'SLACK';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED' | 'EXPIRED';

export type DailyRadarState =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DISABLED';

export interface DailyRadarConfig {
  enabled: boolean;
  dailyRadarEnabled: boolean;
  dailyRadarTime: string;
  dailyRadarTimezone: string;
  minScore: number;
  maxOpportunities: number;
  includeWeakening: boolean;
  includeInvalidated: boolean;
  sendEmptyReport: boolean;
  cooldownMinutes: number;
  dryRun: boolean;
}

export type WatchlistName =
  | 'FAVORITES'
  | 'PORTFOLIO'
  | 'LONG_TERM'
  | 'SHORT_TERM'
  | 'GROWTH'
  | 'DIVIDEND'
  | 'CUSTOM';

export type CooldownPeriod = 5 | 15 | 30 | 60;

export interface AlertCooldownConfig {
  periodMinutes: CooldownPeriod;
  perAlertType: Partial<Record<AlertType, CooldownPeriod>>;
  perSymbol: boolean;
  perChannel: boolean;
}

export interface TriggerCondition {
  type: AlertType;
  rankTopN?: number;
  rankPositionIncrease?: number;
  minConfidence?: number;
  minOpportunityScore?: number;
  minScannerScore?: number;
  strongBuyOnly?: boolean;
  criticalRiskOnly?: boolean;
  watchlistOnly?: boolean;
  watchlistNames?: WatchlistName[];
  symbol?: string;
  customCheck?: string;
}

export interface AlertChannelConfig {
  channel: AlertChannelType;
  enabled: boolean;
  rateLimitPerMinute: number;
  retryAttempts: number;
  retryDelayMs: number;
  dailyRadarEnabled?: boolean;
  dailyRadarTime?: string;
  dailyRadarTimezone?: string;
  minScore?: number;
  maxOpportunities?: number;
  includeWeakening?: boolean;
  includeInvalidated?: boolean;
  sendEmptyReport?: boolean;
  cooldownMinutes?: number;
  dryRun?: boolean;
}

export interface TelegramConfig extends AlertChannelConfig {
  channel: 'TELEGRAM';
  botToken: string;
  chatId: string;
  parseMode: 'Markdown' | 'HTML';
  maxMessageLength: number;
  enableButtons: boolean;
  enableNotifications: boolean;
  dailyRadarEnabled?: boolean;
  dailyRadarTime: string;
  dailyRadarTimezone: string;
  minScore: number;
  maxOpportunities: number;
  includeWeakening: boolean;
  includeInvalidated: boolean;
  sendEmptyReport: boolean;
  cooldownMinutes: number;
  dryRun: boolean;
}

export interface WebSocketConfig extends AlertChannelConfig {
  channel: 'WEBSOCKET';
  eventPrefix: string;
}

export interface ApplicationConfig extends AlertChannelConfig {
  channel: 'APPLICATION';
  maxInAppNotifications: number;
  retentionDays: number;
}

export interface AlertConfig {
  enabled: boolean;
  cooldown: AlertCooldownConfig;
  channels: AlertChannelConfig[];
  triggers: TriggerCondition[];
  maxAlertsPerRun: number;
  historyMaxEntries: number;
  metricsWindowSize: number;
  version: string;
}

export interface AlertEvent {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol: string;
  channels: AlertChannelType[];
  status: AlertStatus;
  triggerCondition: TriggerCondition;
  source: AlertSource;
  metadata: AlertMetadata;
  createdAt: string;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  expiresAt: string | null;
}

export interface AlertSource {
  type: 'SCANNER' | 'RANKING' | 'OPPORTUNITY' | 'SCHEDULER' | 'MANUAL';
  engine: AlertType;
  scannerResult?: ScannerResult;
  rankedOpportunity?: RankedOpportunity;
  opportunityResult?: OpportunityResult;
  rawData?: Record<string, unknown>;
}

export interface AlertMetadata {
  alertDurationMs: number;
  channelDeliveries: ChannelDeliveryStatus[];
  duplicateSuppressed: boolean;
  cooldownApplied: boolean;
  cooldownRemainingMs: number | null;
  previousAlertId: string | null;
  deliveryAttempts: number;
  errorMessage: string | null;
}

export interface ChannelDeliveryStatus {
  channel: AlertChannelType;
  delivered: boolean;
  deliveredAt: string | null;
  attemptCount: number;
  errorMessage: string | null;
  durationMs: number;
}

export interface AlertsMetrics {
  totalAlertsCreated: number;
  totalAlertsDelivered: number;
  totalAlertsFailed: number;
  totalDuplicatesSuppressed: number;
  totalCooldownsApplied: number;
  alertsByType: Record<AlertType, number>;
  alertsByPriority: Record<AlertPriority, number>;
  alertsByStatus: Record<AlertStatus, number>;
  channelDeliveryStats: Record<AlertChannelType, { attempted: number; succeeded: number; failed: number }>;
  averageDeliveryDurationMs: number;
  timestamp: string;
}

export interface AlertHistoryEntry {
  alert: AlertEvent;
  channelsSent: AlertChannelType[];
  channelsFailed: AlertChannelType[];
  durationMs: number;
  timestamp: string;
}
