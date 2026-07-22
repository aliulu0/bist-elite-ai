import { Bot } from 'grammy';
import { apiClient } from '../utils/api-client';
import { formatPrice, formatPercent, formatScore } from '../utils/format';
import { logger } from '../utils/logger';

interface NotificationPreferences {
  enabled: boolean;
  eliteOpportunities: boolean;
  portfolioAlerts: boolean;
  riskAlerts: boolean;
  priceAlerts: boolean;
  dailySummary: boolean;
  minScore: number;
  minConfidence: number;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  eliteOpportunities: true,
  portfolioAlerts: true,
  riskAlerts: true,
  priceAlerts: false,
  dailySummary: true,
  minScore: 70,
  minConfidence: 0.6,
};

export class NotificationService {
  private bot: Bot;
  private intervals: NodeJS.Timeout[] = [];

  constructor(bot: Bot) {
    this.bot = bot;
  }

  start() {
    this.intervals.push(
      setInterval(() => this.checkEliteOpportunities(), 5 * 60 * 1000),
      setInterval(() => this.checkRiskAlerts(), 15 * 60 * 1000),
      setInterval(() => this.sendDailySummary(), 24 * 60 * 60 * 1000),
    );
    logger.info('Notification service started');
  }

  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    logger.info('Notification service stopped');
  }

  private async checkEliteOpportunities() {
    try {
      const opportunities = await apiClient.getOpportunities({
        timeframe: 'D1',
        limit: 5,
      });

      if (opportunities && opportunities.length > 0) {
        for (const opp of opportunities) {
          if (opp.score >= defaultPreferences.minScore) {
            await this.broadcast(
              `Elite Opportunity: ${opp.symbol} - Score: ${formatScore(opp.score)}`,
            );
          }
        }
      }
    } catch (err) {
      logger.error('Failed to check elite opportunities:', err);
    }
  }

  private async checkRiskAlerts() {
    try {
      const risk = await apiClient.getRiskIndicator();
      if (risk && risk.overallRisk === 'VERY_HIGH') {
        await this.broadcast(`Risk Alert: Portfolio risk level is VERY HIGH`);
      }
    } catch (err) {
      logger.error('Failed to check risk alerts:', err);
    }
  }

  private async sendDailySummary() {
    try {
      const [summary, regime] = await Promise.all([
        apiClient.getMarketSummary(),
        apiClient.getMarketRegime(),
      ]);

      const lines = [
        '*Daily Summary*',
        '',
        `Market: ${summary?.xuu100?.value || '--'} (${formatPercent(summary?.xuu100?.changePercent || 0)})`,
        `Regime: ${regime?.regime || '--'}`,
      ];

      await this.broadcast(lines.join('\n'));
    } catch (err) {
      logger.error('Failed to send daily summary:', err);
    }
  }

  private async broadcast(message: string) {
    try {
      logger.info(`Broadcasting: ${message}`);
    } catch (err) {
      logger.error('Failed to broadcast:', err);
    }
  }
}
