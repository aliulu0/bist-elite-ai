import { Injectable } from '@nestjs/common';
import {
  DashboardAlert,
  DashboardConfig,
  DASHBOARD_CONFIG_DEFAULTS,
  AlertCategory,
  AlertPriority,
  NotificationCenterWidget,
} from './types';

@Injectable()
export class NotificationCenterService {
  private alerts: DashboardAlert[] = [];
  private config: DashboardConfig = { ...DASHBOARD_CONFIG_DEFAULTS };

  setConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addAlert(alert: Omit<DashboardAlert, 'id' | 'timestamp' | 'read'>): DashboardAlert {
    const newAlert: DashboardAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.alerts.unshift(newAlert);
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.config.maxAlerts);
    }
    return newAlert;
  }

  markAsRead(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(): void {
    this.alerts.forEach(a => { a.read = true; });
  }

  getAlerts(category?: AlertCategory, priority?: AlertPriority, unreadOnly?: boolean): DashboardAlert[] {
    let filtered = [...this.alerts];
    if (category) filtered = filtered.filter(a => a.category === category);
    if (priority) filtered = filtered.filter(a => a.priority === priority);
    if (unreadOnly) filtered = filtered.filter(a => !a.read);
    return filtered;
  }

  deleteAlert(alertId: string): boolean {
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    return this.alerts.length < before;
  }

  getWidget(): NotificationCenterWidget {
    const highPriority = this.alerts.filter(a => a.priority === AlertPriority.HIGH || a.priority === AlertPriority.CRITICAL);
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const history = this.alerts.filter(a => new Date(a.timestamp).getTime() < cutoffTime);
    return {
      totalAlerts: this.alerts.length,
      unreadAlerts: this.alerts.filter(a => !a.read).length,
      highPriorityAlerts: highPriority.length,
      alerts: this.alerts.slice(0, 20),
      alertHistory: history.slice(0, this.config.maxAlerts),
      lastUpdated: new Date().toISOString(),
    };
  }

  clearAll(): void {
    this.alerts = [];
  }

  getCount(): number {
    return this.alerts.length;
  }

  getUnreadCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }

  generatePortfolioAlert(symbol: string, message: string, priority: AlertPriority): DashboardAlert {
    return this.addAlert({
      category: AlertCategory.PORTFOLIO,
      priority,
      title: `Portfoy Uyarisi: ${symbol}`,
      message,
      symbol,
    });
  }

  generateRiskAlert(message: string, priority: AlertPriority): DashboardAlert {
    return this.addAlert({
      category: AlertCategory.RISK,
      priority,
      title: 'Risk Uyarisi',
      message,
    });
  }

  generateOpportunityAlert(symbol: string, message: string, priority: AlertPriority): DashboardAlert {
    return this.addAlert({
      category: AlertCategory.OPPORTUNITY,
      priority,
      title: `Firsat Uyarisi: ${symbol}`,
      message,
      symbol,
    });
  }
}
