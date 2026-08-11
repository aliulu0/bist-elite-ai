import { Injectable } from '@nestjs/common';
import {
  AlertType,
  AlertPriority,
  AlertStatus,
  AlertChannelType,
  AlertsMetrics,
} from '../alerts.types';

@Injectable()
export class AlertMetricsCollector {
  private totalCreated = 0;
  private totalDelivered = 0;
  private totalFailed = 0;
  private totalDuplicates = 0;
  private totalCooldowns = 0;
  private deliveryDurations: number[] = [];
  private readonly maxWindow: number;

  private byType: Record<string, number> = {};
  private byPriority: Record<string, number> = {};
  private byStatus: Record<string, number> = {};
  private channelStats: Record<string, { attempted: number; succeeded: number; failed: number }> = {};

  constructor(maxWindow: number = 100) {
    this.maxWindow = maxWindow;
  }

  recordCreated(type: AlertType, priority: AlertPriority): void {
    this.totalCreated++;
    this.byType[type] = (this.byType[type] ?? 0) + 1;
    this.byPriority[priority] = (this.byPriority[priority] ?? 0) + 1;
    this.byStatus['ACTIVE'] = (this.byStatus['ACTIVE'] ?? 0) + 1;
  }

  recordDelivered(channel: AlertChannelType, durationMs: number): void {
    this.totalDelivered++;
    if (!this.channelStats[channel]) {
      this.channelStats[channel] = { attempted: 0, succeeded: 0, failed: 0 };
    }
    this.channelStats[channel].attempted++;
    this.channelStats[channel].succeeded++;
    this.deliveryDurations.push(durationMs);
    if (this.deliveryDurations.length > this.maxWindow) {
      this.deliveryDurations.splice(0, this.deliveryDurations.length - this.maxWindow);
    }
  }

  recordFailed(channel: AlertChannelType): void {
    this.totalFailed++;
    if (!this.channelStats[channel]) {
      this.channelStats[channel] = { attempted: 0, succeeded: 0, failed: 0 };
    }
    this.channelStats[channel].attempted++;
    this.channelStats[channel].failed++;
  }

  recordDuplicateSuppressed(): void {
    this.totalDuplicates++;
  }

  recordCooldownApplied(): void {
    this.totalCooldowns++;
  }

  recordStatusChange(from: AlertStatus, to: AlertStatus): void {
    this.byStatus[from] = Math.max(0, (this.byStatus[from] ?? 1) - 1);
    this.byStatus[to] = (this.byStatus[to] ?? 0) + 1;
  }

  getMetrics(): AlertsMetrics {
    const durations = this.deliveryDurations;
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalAlertsCreated: this.totalCreated,
      totalAlertsDelivered: this.totalDelivered,
      totalAlertsFailed: this.totalFailed,
      totalDuplicatesSuppressed: this.totalDuplicates,
      totalCooldownsApplied: this.totalCooldowns,
      alertsByType: { ...this.byType } as Record<AlertType, number>,
      alertsByPriority: { ...this.byPriority } as Record<AlertPriority, number>,
      alertsByStatus: { ...this.byStatus } as Record<AlertStatus, number>,
      channelDeliveryStats: { ...this.channelStats } as Record<AlertChannelType, { attempted: number; succeeded: number; failed: number }>,
      averageDeliveryDurationMs: Math.round(avgDuration * 100) / 100,
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    this.totalCreated = 0;
    this.totalDelivered = 0;
    this.totalFailed = 0;
    this.totalDuplicates = 0;
    this.totalCooldowns = 0;
    this.deliveryDurations = [];
    this.byType = {};
    this.byPriority = {};
    this.byStatus = {};
    this.channelStats = {};
  }
}
