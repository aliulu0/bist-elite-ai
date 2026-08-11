import {
  AlertConfig,
  AlertCooldownConfig,
  AlertChannelConfig,
  TriggerCondition,
} from './alerts.types';

export const DEFAULT_COOLDOWN_CONFIG: AlertCooldownConfig = {
  periodMinutes: 15,
  perAlertType: {
    OPPORTUNITY: 30,
    RANKING_CHANGE: 15,
    STRONG_BUY: 60,
    STRONG_SELL: 60,
    CONFIDENCE_INCREASE: 30,
    CONFIDENCE_DROP: 15,
    WATCHLIST: 5,
    PRICE_BREAKOUT: 30,
    VOLUME_SPIKE: 15,
    RISK: 5,
    PORTFOLIO: 60,
    SCHEDULER: 5,
  },
  perSymbol: true,
  perChannel: true,
};

export const DEFAULT_TELEGRAM_CONFIG: AlertChannelConfig = {
  channel: 'TELEGRAM',
  enabled: true,
  rateLimitPerMinute: 20,
  retryAttempts: 3,
  retryDelayMs: 2000,
};

export const DEFAULT_WEBSOCKET_CONFIG: AlertChannelConfig = {
  channel: 'WEBSOCKET',
  enabled: true,
  rateLimitPerMinute: 60,
  retryAttempts: 2,
  retryDelayMs: 1000,
};

export const DEFAULT_APPLICATION_CONFIG: AlertChannelConfig = {
  channel: 'APPLICATION',
  enabled: true,
  rateLimitPerMinute: 100,
  retryAttempts: 1,
  retryDelayMs: 500,
};

export const DEFAULT_TRIGGERS: TriggerCondition[] = [
  { type: 'RANKING_CHANGE', rankTopN: 10, strongBuyOnly: false },
  { type: 'RANKING_CHANGE', rankPositionIncrease: 5, strongBuyOnly: false },
  { type: 'CONFIDENCE_INCREASE', minConfidence: 80, strongBuyOnly: false },
  { type: 'STRONG_BUY', strongBuyOnly: true },
  { type: 'RISK', criticalRiskOnly: true },
  { type: 'WATCHLIST', watchlistOnly: true, watchlistNames: ['FAVORITES', 'PORTFOLIO'] },
  { type: 'OPPORTUNITY', minOpportunityScore: 75 },
  { type: 'CONFIDENCE_DROP', minConfidence: 60 },
];

export const DEFAULT_ALERTS_CONFIG: AlertConfig = {
  enabled: true,
  cooldown: DEFAULT_COOLDOWN_CONFIG,
  channels: [
    DEFAULT_TELEGRAM_CONFIG,
    DEFAULT_WEBSOCKET_CONFIG,
    DEFAULT_APPLICATION_CONFIG,
  ],
  triggers: DEFAULT_TRIGGERS,
  maxAlertsPerRun: 50,
  historyMaxEntries: 1000,
  metricsWindowSize: 100,
  version: '1.0.0',
};
