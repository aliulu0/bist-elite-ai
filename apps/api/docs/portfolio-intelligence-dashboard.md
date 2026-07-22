# Portfolio Intelligence Dashboard

> Enterprise-grade backend dashboard service aggregating all analysis engines into structured JSON for portfolio intelligence visualization.

## Overview

The Portfolio Intelligence Dashboard provides a unified backend that aggregates data from all analysis engines (Elite Score, Explainability, Consensus, Market Regime, Opportunity Lifecycle, Recommendation Tracker, Paper Portfolio) and serves structured JSON responses for dashboard rendering.

## Architecture

```
PortfolioIntelligenceModule
│
├── DashboardDataService (Main Orchestrator)
├── IntelligencePanelService (Opportunity Intelligence)
├── PerformanceAnalyticsService (Performance Metrics)
├── RiskCenterService (Risk Data Aggregation)
├── ExplainabilityCenterService (Explanation Data)
├── NotificationCenterService (Alert Aggregation)
├── DashboardTimelineService (Timeline Events)
├── DashboardFilterService (Filtering Logic)
├── DashboardReportGeneratorService (Turkish Reports)
└── DashboardController (REST API)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/config` | Get dashboard configuration |
| POST | `/api/dashboard/config` | Update dashboard configuration |
| GET | `/api/dashboard/filters` | Get available filter options |
| GET | `/api/dashboard/filters/active` | Get active filters |
| POST | `/api/dashboard/filters` | Add a filter |
| DELETE | `/api/dashboard/filters/:type/:value` | Remove a filter |
| DELETE | `/api/dashboard/filters` | Clear all filters |
| GET | `/api/dashboard/notifications` | Get notification center data |
| POST | `/api/dashboard/notifications/:id/read` | Mark notification as read |
| POST | `/api/dashboard/notifications/read-all` | Mark all as read |
| DELETE | `/api/dashboard/notifications/:id` | Delete a notification |
| GET | `/api/dashboard/timeline` | Get dashboard timeline |
| GET | `/api/dashboard/timeline/symbol/:symbol` | Get timeline by symbol |
| GET | `/api/dashboard/report/portfolio` | Portfolio report (Turkish) |
| GET | `/api/dashboard/report/risk` | Risk report (Turkish) |
| GET | `/api/dashboard/report/intelligence` | Intelligence report (Turkish) |
| GET | `/api/dashboard/report/performance` | Performance report (Turkish) |

## Dashboard Widgets

### Portfolio Summary
- Total value, cash balance, invested value
- Total/weekly/monthly returns with trend
- Win rate, open/closed positions
- Portfolio risk score and level
- Cash/invested allocation percentages

### Intelligence Panel
- Top opportunities ranked by elite score
- Highest confidence opportunities
- Strongest consensus opportunities
- Emerging (DETECTED/EMERGING) opportunities
- Weakening opportunities
- Current market regime and confidence

### Performance Analytics
- Overall metrics (win rate, returns, Sharpe, drawdown)
- Strategy performance breakdown
- Sector performance breakdown
- Timeframe performance breakdown
- Historical performance series
- Benchmark comparison with alpha

### Risk Center
- Overall risk score and level
- Risk metrics (portfolio, drawdown, volatility, liquidity, conflicts, regime)
- Sector concentration analysis
- Risk alerts

### Explainability Center
- Elite score and confidence
- Positive/negative factor breakdowns
- Risk factor analysis
- Consensus and regime context summaries
- Generated explanation text

### Notification Center
- Alert counts (total, unread, high priority)
- Alert list with category/priority
- Alert history
- Mark read/delete operations

### Timeline
- Opportunity events (detected, transitions)
- Recommendation events (created, executed)
- Portfolio events (positions opened/closed)
- Regime events (transitions)

## Filter Types

| Filter | Description |
|--------|-------------|
| SECTOR | Filter by sector (Bankacilik, Teknoloji, etc.) |
| INDUSTRY | Filter by industry |
| ELITE_SCORE | Filter by elite score range |
| CONFIDENCE | Filter by confidence level |
| MARKET_REGIME | Filter by market regime |
| OPPORTUNITY_STAGE | Filter by lifecycle stage |
| TIMEFRAME | Filter by analysis timeframe |
| RISK_LEVEL | Filter by risk level |
| STRATEGY | Filter by strategy type |

## Configuration

```typescript
const config: DashboardConfig = {
  refreshIntervals: {
    portfolioSummary: 30000,     // 30s
    intelligencePanel: 60000,    // 60s
    performanceAnalytics: 300000, // 5min
    riskCenter: 60000,           // 60s
    notifications: 15000,        // 15s
    timeline: 120000,            // 2min
  },
  defaultFilters: [],
  widgets: {
    enabled: Object.values(DashboardWidget),
    layout: 'grid',
  },
  maxAlerts: 50,
  maxTimelineEvents: 100,
  maxOpportunities: 20,
};
```

## Test Coverage

- 192 unit tests across 12 test suites
- All services individually tested
- Turkish terminology verified
- Report generation tested
- Filter operations tested
- Alert lifecycle tested
- Timeline operations tested
