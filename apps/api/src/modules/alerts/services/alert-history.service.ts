import { Injectable, Logger } from '@nestjs/common';
import { AlertEvent, AlertHistoryEntry, AlertStatus } from '../alerts.types';

@Injectable()
export class AlertHistory {
  private readonly logger = new Logger(AlertHistory.name);
  private readonly history: AlertHistoryEntry[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  record(alert: AlertEvent, channelsSent: string[], channelsFailed: string[], durationMs: number): void {
    const entry: AlertHistoryEntry = {
      alert,
      channelsSent: channelsSent as any[],
      channelsFailed: channelsFailed as any[],
      durationMs,
      timestamp: new Date().toISOString(),
    };
    this.history.push(entry);
    if (this.history.length > this.maxEntries) {
      this.history.splice(0, this.history.length - this.maxEntries);
    }
  }

  getHistory(limit?: number, offset?: number): AlertHistoryEntry[] {
    let result = [...this.history];
    if (offset !== undefined) result = result.slice(offset);
    if (limit !== undefined) result = result.slice(0, limit);
    return result;
  }

  getBySymbol(symbol: string, limit?: number): AlertHistoryEntry[] {
    return this.history
      .filter((e) => e.alert.symbol === symbol)
      .slice(0, limit ?? this.maxEntries);
  }

  getByType(alertType: string, limit?: number): AlertHistoryEntry[] {
    return this.history
      .filter((e) => e.alert.type === alertType)
      .slice(0, limit ?? this.maxEntries);
  }

  getByStatus(status: AlertStatus): AlertHistoryEntry[] {
    return this.history.filter((e) => e.alert.status === status);
  }

  getAlertById(alertId: string): AlertEvent | undefined {
    const entry = this.history.find((e) => e.alert.id === alertId);
    return entry?.alert;
  }

  updateStatus(alertId: string, status: AlertStatus): boolean {
    const entry = this.history.find((e) => e.alert.id === alertId);
    if (!entry) return false;
    entry.alert.status = status;
    if (status === 'ACKNOWLEDGED') entry.alert.acknowledgedAt = new Date().toISOString();
    if (status === 'DISMISSED') entry.alert.dismissedAt = new Date().toISOString();
    return true;
  }

  getTotalCount(): number {
    return this.history.length;
  }

  clear(): void {
    this.history.length = 0;
  }
}
