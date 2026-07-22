import {
  DASHBOARD_WIDGET_TURKISH,
  ALERT_PRIORITY_TURKISH,
  ALERT_CATEGORY_TURKISH,
  RISK_LEVEL_TURKISH,
  TREND_DIRECTION_TURKISH,
  FILTER_TYPE_TURKISH,
  PERFORMANCE_LABELS_TURKISH,
  RISK_LABELS_TURKISH,
  OVERVIEW_LABELS_TURKISH,
  formatTurkishPercent,
  formatTurkishCurrency,
  formatTurkishScore,
} from './turkish-terms';
import { DashboardWidget, AlertPriority, AlertCategory, RiskLevel, TrendDirection, DashboardFilterType } from './types';

describe('Turkish Terms', () => {
  describe('DASHBOARD_WIDGET_TURKISH', () => {
    it('should have Turkish label for PORTFOLIO_SUMMARY', () => {
      expect(DASHBOARD_WIDGET_TURKISH[DashboardWidget.PORTFOLIO_SUMMARY]).toBe('Portfozet Ozeti');
    });

    it('should have Turkish label for INTELLIGENCE_PANEL', () => {
      expect(DASHBOARD_WIDGET_TURKISH[DashboardWidget.INTELLIGENCE_PANEL]).toBe('Zeka Paneli');
    });

    it('should have Turkish label for RISK_CENTER', () => {
      expect(DASHBOARD_WIDGET_TURKISH[DashboardWidget.RISK_CENTER]).toBe('Risk Merkezi');
    });

    it('should have Turkish label for EXPLAINABILITY_CENTER', () => {
      expect(DASHBOARD_WIDGET_TURKISH[DashboardWidget.EXPLAINABILITY_CENTER]).toBe('Aciklanabilirlik Merkezi');
    });

    it('should have Turkish label for NOTIFICATION_CENTER', () => {
      expect(DASHBOARD_WIDGET_TURKISH[DashboardWidget.NOTIFICATION_CENTER]).toBe('Bildirim Merkezi');
    });

    it('should cover all 7 widgets', () => {
      expect(Object.keys(DASHBOARD_WIDGET_TURKISH)).toHaveLength(7);
    });
  });

  describe('ALERT_PRIORITY_TURKISH', () => {
    it('should have Turkish label for LOW', () => {
      expect(ALERT_PRIORITY_TURKISH[AlertPriority.LOW]).toBe('Dusuk');
    });

    it('should have Turkish label for HIGH', () => {
      expect(ALERT_PRIORITY_TURKISH[AlertPriority.HIGH]).toBe('Yuksek');
    });

    it('should have Turkish label for CRITICAL', () => {
      expect(ALERT_PRIORITY_TURKISH[AlertPriority.CRITICAL]).toBe('Kritik');
    });
  });

  describe('ALERT_CATEGORY_TURKISH', () => {
    it('should have Turkish label for PORTFOLIO', () => {
      expect(ALERT_CATEGORY_TURKISH[AlertCategory.PORTFOLIO]).toBe('Portfoy');
    });

    it('should have Turkish label for OPPORTUNITY', () => {
      expect(ALERT_CATEGORY_TURKISH[AlertCategory.OPPORTUNITY]).toBe('Firsat');
    });

    it('should have Turkish label for RISK', () => {
      expect(ALERT_CATEGORY_TURKISH[AlertCategory.RISK]).toBe('Risk');
    });
  });

  describe('RISK_LEVEL_TURKISH', () => {
    it('should have Turkish label for LOW', () => {
      expect(RISK_LEVEL_TURKISH[RiskLevel.LOW]).toBe('Dusuk Risk');
    });

    it('should have Turkish label for CRITICAL', () => {
      expect(RISK_LEVEL_TURKISH[RiskLevel.CRITICAL]).toBe('Kritik Risk');
    });
  });

  describe('TREND_DIRECTION_TURKISH', () => {
    it('should have Turkish label for UP', () => {
      expect(TREND_DIRECTION_TURKISH[TrendDirection.UP]).toBe('Yukselis');
    });

    it('should have Turkish label for DOWN', () => {
      expect(TREND_DIRECTION_TURKISH[TrendDirection.DOWN]).toBe('Dusus');
    });

    it('should have Turkish label for FLAT', () => {
      expect(TREND_DIRECTION_TURKISH[TrendDirection.FLAT]).toBe('Yatay');
    });
  });

  describe('FILTER_TYPE_TURKISH', () => {
    it('should have 9 filter type translations', () => {
      expect(Object.keys(FILTER_TYPE_TURKISH)).toHaveLength(9);
    });

    it('should have Turkish for SECTOR', () => {
      expect(FILTER_TYPE_TURKISH[DashboardFilterType.SECTOR]).toBe('Sektor');
    });
  });

  describe('PERFORMANCE_LABELS_TURKISH', () => {
    it('should have winRate translation', () => {
      expect(PERFORMANCE_LABELS_TURKISH.winRate).toBe('Kazanma Orani');
    });

    it('should have sharpeRatio translation', () => {
      expect(PERFORMANCE_LABELS_TURKISH.sharpeRatio).toBe('Sharpe Orani');
    });
  });

  describe('RISK_LABELS_TURKISH', () => {
    it('should have portfolioRisk translation', () => {
      expect(RISK_LABELS_TURKISH.portfolioRisk).toBe('Portfoy Riski');
    });

    it('should have drawdown translation', () => {
      expect(RISK_LABELS_TURKISH.drawdown).toBe('Cekilme');
    });
  });

  describe('OVERVIEW_LABELS_TURKISH', () => {
    it('should have totalValue translation', () => {
      expect(OVERVIEW_LABELS_TURKISH.totalValue).toBe('Toplam Deger');
    });

    it('should have cashBalance translation', () => {
      expect(OVERVIEW_LABELS_TURKISH.cashBalance).toBe('Nakit Bakiye');
    });
  });

  describe('formatTurkishPercent', () => {
    it('should format positive with plus sign', () => {
      expect(formatTurkishPercent(5.5)).toBe('+%5.50');
    });

    it('should format negative without plus', () => {
      expect(formatTurkishPercent(-3.2)).toBe('%-3.20');
    });

    it('should format zero with plus sign', () => {
      expect(formatTurkishPercent(0)).toBe('+%0.00');
    });
  });

  describe('formatTurkishCurrency', () => {
    it('should format currency with TRY symbol', () => {
      const result = formatTurkishCurrency(1234567.89);
      expect(result).toContain('₺');
      expect(result).toContain('1');
    });

    it('should format zero', () => {
      const result = formatTurkishCurrency(0);
      expect(result).toContain('₺');
    });
  });

  describe('formatTurkishScore', () => {
    it('should format score with 1 decimal', () => {
      expect(formatTurkishScore(75.456)).toBe('75.5');
    });

    it('should format integer score', () => {
      expect(formatTurkishScore(80)).toBe('80.0');
    });
  });
});
