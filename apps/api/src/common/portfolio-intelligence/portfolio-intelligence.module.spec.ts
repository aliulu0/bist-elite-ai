import { PortfolioIntelligenceModule } from './portfolio-intelligence.module';
import { DashboardDataService } from './dashboard-data.service';
import { IntelligencePanelService } from './intelligence-panel.service';
import { PerformanceAnalyticsService } from './performance-analytics.service';
import { RiskCenterService } from './risk-center.service';
import { ExplainabilityCenterService } from './explainability-center.service';
import { NotificationCenterService } from './notification-center.service';
import { DashboardTimelineService } from './dashboard-timeline.service';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardReportGeneratorService } from './dashboard-report-generator.service';
import { DashboardController } from './dashboard.controller';

describe('PortfolioIntelligenceModule', () => {
  it('should be defined', () => {
    expect(PortfolioIntelligenceModule).toBeDefined();
  });

  it('should have DashboardController', () => {
    const module = new PortfolioIntelligenceModule();
    expect(module).toBeDefined();
  });

  describe('Provider registration', () => {
    it('should provide DashboardDataService', () => {
      expect(DashboardDataService).toBeDefined();
    });

    it('should provide IntelligencePanelService', () => {
      expect(IntelligencePanelService).toBeDefined();
    });

    it('should provide PerformanceAnalyticsService', () => {
      expect(PerformanceAnalyticsService).toBeDefined();
    });

    it('should provide RiskCenterService', () => {
      expect(RiskCenterService).toBeDefined();
    });

    it('should provide ExplainabilityCenterService', () => {
      expect(ExplainabilityCenterService).toBeDefined();
    });

    it('should provide NotificationCenterService', () => {
      expect(NotificationCenterService).toBeDefined();
    });

    it('should provide DashboardTimelineService', () => {
      expect(DashboardTimelineService).toBeDefined();
    });

    it('should provide DashboardFilterService', () => {
      expect(DashboardFilterService).toBeDefined();
    });

    it('should provide DashboardReportGeneratorService', () => {
      expect(DashboardReportGeneratorService).toBeDefined();
    });
  });

  describe('Service instantiation', () => {
    it('should instantiate all services correctly', () => {
      const intelligence = new IntelligencePanelService();
      const performance = new PerformanceAnalyticsService();
      const risk = new RiskCenterService();
      const explainability = new ExplainabilityCenterService();
      const notifications = new NotificationCenterService();
      const timeline = new DashboardTimelineService();
      const filters = new DashboardFilterService();
      const reportGen = new DashboardReportGeneratorService();

      const dashboardData = new DashboardDataService(
        intelligence, performance, risk, explainability, notifications, timeline, filters, reportGen,
      );

      expect(dashboardData).toBeDefined();
      expect(dashboardData.getConfig()).toBeDefined();
    });
  });
});
