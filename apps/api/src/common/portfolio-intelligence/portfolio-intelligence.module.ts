import { Module } from '@nestjs/common';
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

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardDataService,
    IntelligencePanelService,
    PerformanceAnalyticsService,
    RiskCenterService,
    ExplainabilityCenterService,
    NotificationCenterService,
    DashboardTimelineService,
    DashboardFilterService,
    DashboardReportGeneratorService,
  ],
  exports: [
    DashboardDataService,
    IntelligencePanelService,
    PerformanceAnalyticsService,
    RiskCenterService,
    ExplainabilityCenterService,
    NotificationCenterService,
    DashboardTimelineService,
    DashboardFilterService,
    DashboardReportGeneratorService,
  ],
})
export class PortfolioIntelligenceModule {}
