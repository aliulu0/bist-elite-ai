import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardDataService } from './dashboard-data.service';
import { NotificationCenterService } from './notification-center.service';
import { DashboardTimelineService } from './dashboard-timeline.service';
import { DashboardFilterService } from './dashboard-filter.service';
import { DashboardConfig, DashboardFilter, DashboardFilterType } from './types';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardData: DashboardDataService,
    private readonly notifications: NotificationCenterService,
    private readonly timeline: DashboardTimelineService,
    private readonly filters: DashboardFilterService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get dashboard configuration' })
  getConfig(): DashboardConfig {
    return this.dashboardData.getConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Update dashboard configuration' })
  updateConfig(@Body() config: Partial<DashboardConfig>): DashboardConfig {
    this.dashboardData.setConfig(config);
    return this.dashboardData.getConfig();
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get available filter options' })
  getFilterOptions(
    @Query('symbols') symbols?: string,
    @Query('sectors') sectors?: string,
    @Query('strategies') strategies?: string,
  ) {
    const symbolList = symbols ? symbols.split(',') : [];
    const sectorList = sectors ? sectors.split(',') : [];
    const strategyList = strategies ? strategies.split(',') : [];
    return this.dashboardData.getFilterOptions(symbolList, sectorList, strategyList);
  }

  @Get('filters/active')
  @ApiOperation({ summary: 'Get active filters' })
  getActiveFilters(): DashboardFilter[] {
    return this.dashboardData.getActiveFilters();
  }

  @Post('filters')
  @ApiOperation({ summary: 'Add a filter' })
  addFilter(@Body() filter: DashboardFilter): void {
    this.dashboardData.addFilter(filter);
  }

  @Delete('filters/:type/:value')
  @ApiOperation({ summary: 'Remove a filter' })
  removeFilter(@Param('type') type: DashboardFilterType, @Param('value') value: string): void {
    this.dashboardData.removeFilter(type, value);
  }

  @Delete('filters')
  @ApiOperation({ summary: 'Clear all filters' })
  clearFilters(): void {
    this.dashboardData.clearFilters();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification center data' })
  getNotifications(
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notifications.getWidget();
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markNotificationRead(@Param('id') id: string): { success: boolean } {
    return { success: this.notifications.markAsRead(id) };
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllNotificationsRead(): { success: boolean } {
    this.notifications.markAllAsRead();
    return { success: true };
  }

  @Delete('notifications/:id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string): { success: boolean } {
    return { success: this.notifications.deleteAlert(id) };
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get dashboard timeline' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(@Query('limit') limit?: number): ReturnType<DashboardTimelineService['getWidget']> {
    return this.timeline.getWidget(limit ?? 20);
  }

  @Get('timeline/symbol/:symbol')
  @ApiOperation({ summary: 'Get timeline events for a symbol' })
  getTimelineBySymbol(@Param('symbol') symbol: string) {
    return this.timeline.getEventsBySymbol(symbol);
  }

  @Post('report/portfolio')
  @ApiOperation({ summary: 'Generate portfolio report in Turkish' })
  getPortfolioReport(@Body() portfolio: any): string {
    return this.dashboardData.generatePortfolioReport(portfolio);
  }

  @Post('report/risk')
  @ApiOperation({ summary: 'Generate risk report in Turkish' })
  getRiskReport(@Body() risk: any): string {
    return this.dashboardData.generateRiskReport(risk);
  }

  @Post('report/intelligence')
  @ApiOperation({ summary: 'Generate intelligence report in Turkish' })
  getIntelligenceReport(@Body() intelligence: any): string {
    return this.dashboardData.generateIntelligenceReport(intelligence);
  }

  @Post('report/performance')
  @ApiOperation({ summary: 'Generate performance report in Turkish' })
  getPerformanceReport(@Body() performance: any): string {
    return this.dashboardData.generatePerformanceReport(performance);
  }
}
