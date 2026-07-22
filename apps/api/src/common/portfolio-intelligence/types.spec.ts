import { DashboardWidget, DashboardFilterType, AlertPriority, AlertCategory, TrendDirection, RiskLevel, DASHBOARD_CONFIG_DEFAULTS } from './types';

describe('Portfolio Intelligence Types', () => {
  describe('DashboardWidget enum', () => {
    it('should have 7 widgets', () => {
      expect(Object.keys(DashboardWidget)).toHaveLength(7);
    });

    it('should include PORTFOLIO_SUMMARY', () => {
      expect(DashboardWidget.PORTFOLIO_SUMMARY).toBe('PORTFOLIO_SUMMARY');
    });

    it('should include INTELLIGENCE_PANEL', () => {
      expect(DashboardWidget.INTELLIGENCE_PANEL).toBe('INTELLIGENCE_PANEL');
    });

    it('should include RISK_CENTER', () => {
      expect(DashboardWidget.RISK_CENTER).toBe('RISK_CENTER');
    });
  });

  describe('DashboardFilterType enum', () => {
    it('should have 9 filter types', () => {
      expect(Object.keys(DashboardFilterType)).toHaveLength(9);
    });

    it('should include SECTOR', () => {
      expect(DashboardFilterType.SECTOR).toBe('SECTOR');
    });

    it('should include STRATEGY', () => {
      expect(DashboardFilterType.STRATEGY).toBe('STRATEGY');
    });
  });

  describe('AlertPriority enum', () => {
    it('should have 4 levels', () => {
      expect(Object.keys(AlertPriority)).toHaveLength(4);
    });
  });

  describe('AlertCategory enum', () => {
    it('should have 6 categories', () => {
      expect(Object.keys(AlertCategory)).toHaveLength(6);
    });
  });

  describe('TrendDirection enum', () => {
    it('should have 3 directions', () => {
      expect(Object.keys(TrendDirection)).toHaveLength(3);
    });
  });

  describe('RiskLevel enum', () => {
    it('should have 4 risk levels', () => {
      expect(Object.keys(RiskLevel)).toHaveLength(4);
    });
  });

  describe('DASHBOARD_CONFIG_DEFAULTS', () => {
    it('should have refresh intervals', () => {
      expect(DASHBOARD_CONFIG_DEFAULTS.refreshIntervals.portfolioSummary).toBe(30000);
      expect(DASHBOARD_CONFIG_DEFAULTS.refreshIntervals.intelligencePanel).toBe(60000);
      expect(DASHBOARD_CONFIG_DEFAULTS.refreshIntervals.notifications).toBe(15000);
    });

    it('should have maxAlerts', () => {
      expect(DASHBOARD_CONFIG_DEFAULTS.maxAlerts).toBe(50);
    });

    it('should have maxOpportunities', () => {
      expect(DASHBOARD_CONFIG_DEFAULTS.maxOpportunities).toBe(20);
    });

    it('should have all widgets enabled', () => {
      expect(DASHBOARD_CONFIG_DEFAULTS.widgets.enabled).toHaveLength(7);
    });

    it('should have grid layout', () => {
      expect(DASHBOARD_CONFIG_DEFAULTS.widgets.layout).toBe('grid');
    });
  });
});
