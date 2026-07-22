import { NotificationCenterService } from './notification-center.service';
import { AlertCategory, AlertPriority } from './types';

describe('NotificationCenterService', () => {
  let service: NotificationCenterService;

  beforeEach(() => {
    service = new NotificationCenterService();
  });

  describe('addAlert', () => {
    it('should add alert with id and timestamp', () => {
      const alert = service.addAlert({
        category: AlertCategory.PORTFOLIO,
        priority: AlertPriority.MEDIUM,
        title: 'Test Alert',
        message: 'Test message',
      });

      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeDefined();
      expect(alert.read).toBe(false);
      expect(alert.title).toBe('Test Alert');
    });

    it('should add symbol to alert', () => {
      const alert = service.addAlert({
        category: AlertCategory.OPPORTUNITY,
        priority: AlertPriority.HIGH,
        title: 'Opportunity',
        message: 'New opportunity',
        symbol: 'THYAO',
      });

      expect(alert.symbol).toBe('THYAO');
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', () => {
      const alert = service.addAlert({
        category: AlertCategory.PORTFOLIO,
        priority: AlertPriority.LOW,
        title: 'Test',
        message: 'Test',
      });

      const result = service.markAsRead(alert.id);
      expect(result).toBe(true);
      expect(service.getAlerts(undefined, undefined, true)).toHaveLength(0);
    });

    it('should return false for unknown id', () => {
      expect(service.markAsRead('unknown')).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', () => {
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.RISK, priority: AlertPriority.HIGH, title: 'B', message: 'b' });

      service.markAllAsRead();
      expect(service.getUnreadCount()).toBe(0);
    });
  });

  describe('getAlerts', () => {
    it('should filter by category', () => {
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.RISK, priority: AlertPriority.HIGH, title: 'B', message: 'b' });

      const portfolio = service.getAlerts(AlertCategory.PORTFOLIO);
      expect(portfolio).toHaveLength(1);
      expect(portfolio[0].category).toBe(AlertCategory.PORTFOLIO);
    });

    it('should filter by priority', () => {
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.CRITICAL, title: 'B', message: 'b' });

      const critical = service.getAlerts(undefined, AlertPriority.CRITICAL);
      expect(critical).toHaveLength(1);
      expect(critical[0].priority).toBe(AlertPriority.CRITICAL);
    });

    it('should filter unread only', () => {
      const alert = service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'B', message: 'b' });
      service.markAsRead(alert.id);

      const unread = service.getAlerts(undefined, undefined, true);
      expect(unread).toHaveLength(1);
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert by id', () => {
      const alert = service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      expect(service.deleteAlert(alert.id)).toBe(true);
      expect(service.getCount()).toBe(0);
    });

    it('should return false for unknown id', () => {
      expect(service.deleteAlert('unknown')).toBe(false);
    });
  });

  describe('getWidget', () => {
    it('should return widget with correct counts', () => {
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.RISK, priority: AlertPriority.HIGH, title: 'B', message: 'b' });

      const widget = service.getWidget();
      expect(widget.totalAlerts).toBe(2);
      expect(widget.unreadAlerts).toBe(2);
      expect(widget.highPriorityAlerts).toBe(1);
    });

    it('should have alerts and alertHistory arrays', () => {
      const widget = service.getWidget();
      expect(Array.isArray(widget.alerts)).toBe(true);
      expect(Array.isArray(widget.alertHistory)).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all alerts', () => {
      service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: 'A', message: 'a' });
      service.addAlert({ category: AlertCategory.RISK, priority: AlertPriority.HIGH, title: 'B', message: 'b' });
      service.clearAll();
      expect(service.getCount()).toBe(0);
    });
  });

  describe('generatePortfolioAlert', () => {
    it('should create portfolio alert with symbol', () => {
      const alert = service.generatePortfolioAlert('THYAO', 'Fiyat dustu', AlertPriority.HIGH);
      expect(alert.category).toBe(AlertCategory.PORTFOLIO);
      expect(alert.symbol).toBe('THYAO');
      expect(alert.priority).toBe(AlertPriority.HIGH);
    });
  });

  describe('generateRiskAlert', () => {
    it('should create risk alert', () => {
      const alert = service.generateRiskAlert('Cekilme siniri', AlertPriority.CRITICAL);
      expect(alert.category).toBe(AlertCategory.RISK);
      expect(alert.priority).toBe(AlertPriority.CRITICAL);
    });
  });

  describe('generateOpportunityAlert', () => {
    it('should create opportunity alert', () => {
      const alert = service.generateOpportunityAlert('GARAN', 'Yeni firsat', AlertPriority.MEDIUM);
      expect(alert.category).toBe(AlertCategory.OPPORTUNITY);
      expect(alert.symbol).toBe('GARAN');
    });
  });

  describe('max alerts limit', () => {
    it('should respect maxAlerts config', () => {
      for (let i = 0; i < 60; i++) {
        service.addAlert({ category: AlertCategory.PORTFOLIO, priority: AlertPriority.LOW, title: `Alert ${i}`, message: `msg ${i}` });
      }
      expect(service.getCount()).toBe(50);
    });
  });
});
