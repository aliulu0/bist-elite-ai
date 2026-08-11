import { Injectable, Logger } from '@nestjs/common';
import { AlertType, AlertPriority } from '../alerts.types';

interface DuplicateKey {
  alertType: AlertType;
  symbol: string;
  title: string;
}

interface DuplicateEntry {
  alertId: string;
  timestamp: number;
  priority: AlertPriority;
}

@Injectable()
export class DuplicatePrevention {
  private readonly logger = new Logger(DuplicatePrevention.name);
  private readonly recentAlerts = new Map<string, DuplicateEntry>();
  private readonly comparisonWindowMs: number;

  constructor(comparisonWindowMs: number = 5 * 60 * 1000) {
    this.comparisonWindowMs = comparisonWindowMs;
  }

  private buildKey(alertType: AlertType, symbol: string, title: string): string {
    return `${alertType}:${symbol}:${title}`;
  }

  isDuplicate(alertType: AlertType, symbol: string, title: string): boolean {
    const key = this.buildKey(alertType, symbol, title);
    const existing = this.recentAlerts.get(key);
    if (!existing) return false;
    const elapsed = Date.now() - existing.timestamp;
    if (elapsed > this.comparisonWindowMs) {
      this.recentAlerts.delete(key);
      return false;
    }
    return true;
  }

  register(alertType: AlertType, symbol: string, title: string, alertId: string, priority: AlertPriority): void {
    const key = this.buildKey(alertType, symbol, title);
    this.recentAlerts.set(key, { alertId, timestamp: Date.now(), priority });
    this.logger.debug(`Duplicate key registered: ${key}`);
  }

  getPreviousAlertId(alertType: AlertType, symbol: string, title: string): string | null {
    const key = this.buildKey(alertType, symbol, title);
    const existing = this.recentAlerts.get(key);
    if (!existing) return null;
    const elapsed = Date.now() - existing.timestamp;
    if (elapsed > this.comparisonWindowMs) {
      this.recentAlerts.delete(key);
      return null;
    }
    return existing.alertId;
  }

  clear(): void {
    this.recentAlerts.clear();
  }

  getActiveDuplicateCount(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.recentAlerts.entries()) {
      if (now - entry.timestamp <= this.comparisonWindowMs) count++;
      else this.recentAlerts.delete(key);
    }
    return count;
  }
}
