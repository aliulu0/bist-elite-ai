import { Injectable } from '@nestjs/common';
import {
  DashboardResponse,
  PortfolioSummaryWidget,
  PositionSummary,
  IntelligencePanelWidget,
  PerformanceAnalyticsWidget,
  RiskCenterWidget,
  ExplanationWidget,
  NotificationCenterWidget,
  DashboardTimelineWidget,
  DashboardConfig,
  DASHBOARD_CONFIG_DEFAULTS,
  DashboardFilter,
  DashboardFilterType,
  FilterOptions,
  RiskLevel,
  AlertPriority,
} from './types';
import { IntelligencePanelService } from './intelligence-panel.service';
import { PerformanceAnalyticsService } from './performance-analytics.service';
import { RiskCenterService } from './risk-center.service';
import { ExplainabilityCenterService } from './explainability-center.service';
import { NotificationCenterService } from './notification-center.service';
import { DashboardTimelineService } from './dashboard-timeline.service';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardReportGeneratorService } from './dashboard-report-generator.service';

@Injectable()
export class DashboardDataService {
  private config: DashboardConfig = { ...DASHBOARD_CONFIG_DEFAULTS };

  constructor(
    private readonly intelligencePanel: IntelligencePanelService,
    private readonly performanceAnalytics: PerformanceAnalyticsService,
    private readonly riskCenter: RiskCenterService,
    private readonly explainabilityCenter: ExplainabilityCenterService,
    private readonly notificationCenter: NotificationCenterService,
    private readonly timeline: DashboardTimelineService,
    private readonly filterService: DashboardFilterService,
    private readonly reportGenerator: DashboardReportGeneratorService,
  ) {}

  setConfig(config: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...config };
    this.filterService.setConfig(config);
    this.notificationCenter.setConfig(config);
  }

  getConfig(): DashboardConfig {
    return { ...this.config };
  }

  getPortfolioSummary(data: {
    totalValue: number;
    cashBalance: number;
    investedValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    todayReturn: number;
    todayReturnPercent: number;
    weekReturn: number;
    weekReturnPercent: number;
    monthReturn: number;
    monthReturnPercent: number;
    openPositionsCount: number;
    closedPositionsCount: number;
    winRate: number;
    portfolioRiskScore: number;
  }): PortfolioSummaryWidget {
    const riskLevel = this.getRiskLevelFromScore(data.portfolioRiskScore);
    const total = data.totalValue || 1;
    return {
      ...data,
      riskLevel,
      cashAllocation: (data.cashBalance / total) * 100,
      investedAllocation: (data.investedValue / total) * 100,
      lastUpdated: new Date().toISOString(),
    };
  }

  getExplainabilityCenter(): ExplainabilityCenterService {
    return this.explainabilityCenter;
  }

  getIntelligencePanel(data: {
    opportunities: Array<{
      id: string;
      symbol: string;
      stage: string;
      eliteScore: number;
      confidence: number;
      consensusScore: number;
      healthScore: number;
      detectedAt: string;
      direction: string;
      trend: string;
      sector: string;
      strategy: string;
    }>;
    marketRegime: string;
    regimeConfidence: number;
  }): IntelligencePanelWidget {
    return this.intelligencePanel.getIntelligencePanel(data);
  }

  getPerformanceAnalytics(data: {
    winRate: number;
    totalReturn: number;
    todayReturn: number;
    weekReturn: number;
    monthReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    strategyPerformance: { strategy: string; winRate: number; totalTrades: number; avgReturn: number; sharpeRatio: number; maxDrawdown: number }[];
    sectorPerformance: { sector: string; avgReturn: number; winRate: number; exposure: number; opportunityCount: number }[];
    timeframePerformance: { timeframe: string; avgReturn: number; winRate: number; signalCount: number; consensusAccuracy: number }[];
    historicalPerformance: { period: string; returnPercent: number }[];
    benchmarkReturn?: number;
  }): PerformanceAnalyticsWidget {
    return this.performanceAnalytics.getPerformanceWidget(data);
  }

  getRiskCenter(data: {
    overallRiskScore: number;
    sectorExposures: { sector: string; weight: number }[];
    maxDrawdown: number;
    currentDrawdown: number;
    volatility: number;
    liquidityRiskLevel: RiskLevel;
    timeframeConflicts: number;
    regimeRiskLevel: RiskLevel;
    riskAlerts?: string[];
  }): RiskCenterWidget {
    return this.riskCenter.getRiskWidget(data);
  }

  getNotificationCenter(): NotificationCenterWidget {
    return this.notificationCenter.getWidget();
  }

  getTimeline(limit?: number): DashboardTimelineWidget {
    return this.timeline.getWidget(limit);
  }

  getFilterOptions(allSymbols: string[], allSectors: string[], allStrategies: string[]): FilterOptions {
    return this.filterService.getFilterOptions(allSymbols, allSectors, allStrategies);
  }

  addFilter(filter: DashboardFilter): void {
    this.filterService.addFilter(filter);
  }

  removeFilter(type: DashboardFilterType, value: string): void {
    this.filterService.removeFilter(type, value);
  }

  clearFilters(): void {
    this.filterService.clearFilters();
  }

  getActiveFilters(): DashboardFilter[] {
    return this.filterService.getActiveFilters();
  }

  generateReport(
    portfolio: PortfolioSummaryWidget,
    intelligence: IntelligencePanelWidget,
    performance: PerformanceAnalyticsWidget,
    risk: RiskCenterWidget,
  ): string {
    return this.reportGenerator.generateSummaryReport(portfolio, intelligence, performance, risk);
  }

  generatePortfolioReport(portfolio: PortfolioSummaryWidget): string {
    return this.reportGenerator.generatePortfolioReport(portfolio);
  }

  generateRiskReport(risk: RiskCenterWidget): string {
    return this.reportGenerator.generateRiskReport(risk);
  }

  generateIntelligenceReport(intelligence: IntelligencePanelWidget): string {
    return this.reportGenerator.generateIntelligenceReport(intelligence);
  }

  generatePerformanceReport(performance: PerformanceAnalyticsWidget): string {
    return this.reportGenerator.generatePerformanceReport(performance);
  }

  addOpportunityAlert(symbol: string, message: string, priority: AlertPriority = AlertPriority.MEDIUM): void {
    this.notificationCenter.generateOpportunityAlert(symbol, message, priority);
  }

  addRiskAlert(message: string, priority: AlertPriority = AlertPriority.HIGH): void {
    this.notificationCenter.generateRiskAlert(message, priority);
  }

  addPortfolioAlert(symbol: string, message: string, priority: AlertPriority = AlertPriority.MEDIUM): void {
    this.notificationCenter.generatePortfolioAlert(symbol, message, priority);
  }

  private getRiskLevelFromScore(score: number): RiskLevel {
    if (score <= 30) return RiskLevel.LOW;
    if (score <= 55) return RiskLevel.MEDIUM;
    if (score <= 80) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }
}
