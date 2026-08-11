# BIST ELITE AI — API AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## GLOBAL PREFIX

All API routes prefixed with `/api` (configured in `main.ts`)

---

## CONTROLLER INVENTORY (38 controllers)

| Controller | Module | Routes Count |
|------------|--------|--------------|
| `HealthController` | Root | 2 |
| `EarlyOpportunityController` | ai-early-opportunity | 4 |
| `MarketOverviewController` | ai-early-opportunity | 1 |
| `SearchController` | ai-early-opportunity | 2 |
| `WatchlistController` | ai-early-opportunity | 5 |
| `TopListsController` | ai-early-opportunity | 1 |
| `DashboardPerformanceController` | ai-early-opportunity | 1 |
| `MultiTimeframeController` | ai-early-opportunity/multi-timeframe | 2 |
| `EarlyOpportunityController` | ai-early-opportunity | 4 |
| `EliteScoreController` | ai-elite-score | 2 |
| `OpportunityController` | ai-opportunity | 2 |
| `AIResearchController` | ai-research | 4 |
| `ResearchIntelligenceController` | ai-research | 3 |
| `AlertsController` | alerts | 5 |
| `WatchlistController` | alerts | 3 |
| `AnalysisController` | analysis-pipeline | 2 |
| `AnalystController` | analyst | 2 |
| `BacktestController` | backtest | 6 |
| `CatalystController` | catalyst | 4 |
| `ConfigurationController` | configuration | 3 |
| `DecisionController` | decision | 2 |
| `EntryController` | entry | 2 |
| `EventBusController` | event-bus | 2 |
| `FinancialAnalysisController` | financial-rules | 2 |
| `MacroController` | macro | 4 |
| `MarketDataController` | market-data | 8 |
| `ScannerController` | market-scanner | 4 |
| `MultiMarketController` | multi-market | 2 |
| `OpportunityCenterController` | opportunity-center | 2 |
| `PerformanceMonitorController` | performance-monitor | 2 |
| `PipelineOrchestratorController` | pipeline-orchestrator | 4 |
| `PortfolioController` | portfolio | 6 |
| `PortfolioIntelligenceController` | portfolio-intelligence | 13 |
| `PortfolioOptimizationController` | portfolio-optimization | 4 |
| `PredictionController` | prediction | 4 |
| `ProviderHealthController` | provider-health-monitor | 3 |
| `ResearchController` | research | 3 |
| `SchedulerController` | scheduler | 3 |
| `SmartMoneyController` | smart-money | 4 |
| `TechnicalAnalysisController` | technical-analysis | 4 |
| `TomorrowController` | tomorrow | 2 |
| `VerificationAIController` | verification-ai | 4 |
| `WorkflowController` | workflow | 4 |
| `WorkflowQueueController` | workflow-queue | 3 |

**Total Endpoints: ~130+**

---

## DETAILED ENDPOINT CATALOG

### 1. HEALTH & SYSTEM

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/health` | HealthController | Public | ✅ All pages | ✅ WORKING |
| GET | `/api/health/status` | HealthController | Public | ✅ All pages | ✅ WORKING |

---

### 2. EARLY OPPORTUNITY (R2-026/027/029)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/early-opportunities` | EarlyOpportunityController | Public | ✅ Dashboard Top 10 | ✅ WORKING |
| GET | `/api/early-opportunities/:ticker` | EarlyOpportunityController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/early-opportunities/explain/:ticker` | EarlyOpportunityController | Public | ✅ Quick Search | ✅ WORKING |
| GET | `/api/early-opportunities/learning/run` | EarlyOpportunityController | Public | ⚠️ Manual trigger | ✅ WORKING |
| GET | `/api/market/overview` | MarketOverviewController | Public | ✅ Dashboard Market Overview | ✅ WORKING |
| GET | `/api/search/:ticker` | SearchController | Public | ✅ Quick Search | ✅ WORKING |
| GET | `/api/search/:ticker/explain` | SearchController | Public | ✅ Quick Search | ✅ WORKING |
| GET | `/api/watchlist` | WatchlistController | Public | ✅ Dashboard Watchlist | ✅ WORKING |
| POST | `/api/watchlist` | WatchlistController | Public | ✅ Dashboard Watchlist | ✅ WORKING |
| DELETE | `/api/watchlist/:symbol` | WatchlistController | Public | ✅ Dashboard Watchlist | ✅ WORKING |
| POST | `/api/watchlist/pin/:symbol` | WatchlistController | Public | ✅ Dashboard Watchlist | ✅ WORKING |
| DELETE | `/api/watchlist/pin/:symbol` | WatchlistController | Public | ✅ Dashboard Watchlist | ✅ WORKING |
| GET | `/api/top-lists` | TopListsController | Public | ✅ Dashboard Top Lists | ✅ WORKING |
| GET | `/api/dashboard/performance` | DashboardPerformanceController | Public | ✅ Dashboard Performance | ✅ WORKING |

---

### 3. MULTI-TIMEFRAME (R2-028)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/multi-timeframe/:ticker` | MultiTimeframeController | Public | ✅ Dashboard MTF Panel | ✅ WORKING |
| GET | `/api/multi-timeframe/:ticker/explain` | MultiTimeframeController | Public | ✅ MTF Explanation | ✅ WORKING |

---

### 4. PREDICTION

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/prediction/:ticker` | PredictionController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/prediction/:ticker/history` | PredictionController | Public | ⚠️ Not used | ✅ WORKING |
| GET | `/api/prediction/:ticker/explain` | PredictionController | Public | ✅ Stock Detail | ✅ WORKING |
| POST | `/api/prediction/refresh/:ticker` | PredictionController | Public | ⚠️ Manual | ✅ WORKING |

---

### 5. ELITE SCORE

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/elite-score/:ticker` | EliteScoreController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/elite-score/:ticker/explain` | EliteScoreController | Public | ✅ Stock Detail | ✅ WORKING |

---

### 6. OPPORTUNITY

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/opportunity/:ticker` | OpportunityController | Public | ⚠️ Legacy | ✅ WORKING |
| GET | `/api/opportunity/:ticker/explain` | OpportunityController | Public | ⚠️ Legacy | ✅ WORKING |

---

### 7. AI RESEARCH

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/research/intelligence` | AIResearchController | Public | ✅ Research Intelligence | ✅ WORKING |
| GET | `/api/research/intelligence/:ticker` | AIResearchController | Public | ✅ Research Detail | ✅ WORKING |
| GET | `/api/research/intelligence/providers` | AIResearchController | Public | ✅ Providers Page | ✅ WORKING |
| POST | `/api/research/intelligence/refresh` | AIResearchController | Public | ✅ Refresh Button | ✅ WORKING |
| GET | `/api/research/consensus/:ticker` | ResearchIntelligenceController | Public | ✅ Research Detail | ✅ WORKING |
| GET | `/api/research/consensus/:ticker/explain` | ResearchIntelligenceController | Public | ✅ Research Detail | ✅ WORKING |
| GET | `/api/research/consensus/providers` | ResearchIntelligenceController | Public | ✅ Providers Page | ✅ WORKING |

---

### 8. ALERTS

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/alerts` | AlertsController | Public | ✅ Alerts Page | ✅ WORKING |
| GET | `/api/alerts/metrics` | AlertsController | Public | ✅ Alerts Page | ✅ WORKING |
| POST | `/api/alerts/:id/acknowledge` | AlertsController | Public | ✅ Alerts Page | ✅ WORKING |
| POST | `/api/alerts/:id/dismiss` | AlertsController | Public | ✅ Alerts Page | ✅ WORKING |
| GET | `/api/alerts/history` | AlertsController | Public | ✅ Alerts Page | ✅ WORKING |

---

### 9. WATCHLIST (Alerts module)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/watchlist` | WatchlistController (alerts) | Public | ✅ Watchlist Page | ✅ WORKING |
| POST | `/api/watchlist` | WatchlistController (alerts) | Public | ✅ Watchlist Page | ✅ WORKING |
| DELETE | `/api/watchlist/:name/:symbol` | WatchlistController (alerts) | Public | ✅ Watchlist Page | ✅ WORKING |

---

### 10. BACKTEST

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/backtest` | BacktestController | Public | ✅ Backtest Page | ✅ WORKING |
| GET | `/api/backtest/:id` | BacktestController | Public | ✅ Backtest Detail | ✅ WORKING |
| POST | `/api/backtest` | BacktestController | Public | ✅ Backtest Page | ✅ WORKING |
| POST | `/api/backtest/:id/run` | BacktestController | Public | ✅ Backtest Page | ✅ WORKING |
| GET | `/api/backtest/:id/results` | BacktestController | Public | ✅ Backtest Detail | ✅ WORKING |
| GET | `/api/backtest/strategies` | BacktestController | Public | ✅ Backtest Page | ✅ WORKING |

---

### 11. CATALYST

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/catalyst/:ticker` | CatalystController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/catalyst/:ticker/explain` | CatalystController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/catalyst/:ticker/history` | CatalystController | Public | ⚠️ Not used | ✅ WORKING |
| POST | `/api/catalyst/refresh/:ticker` | CatalystController | Public | ⚠️ Manual | ✅ WORKING |

---

### 12. SMART MONEY

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/smart-money/:ticker` | SmartMoneyController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/smart-money/:ticker/explain` | SmartMoneyController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/smart-money/:ticker/history` | SmartMoneyController | Public | ⚠️ Not used | ✅ WORKING |
| POST | `/api/smart-money/refresh/:ticker` | SmartMoneyController | Public | ⚠️ Manual | ✅ WORKING |

---

### 13. VERIFICATION AI

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/verification/:ticker` | VerificationAIController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/verification/:ticker/explain` | VerificationAIController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/verification/:ticker/history` | VerificationAIController | Public | ⚠️ Not used | ✅ WORKING |
| POST | `/api/verification/refresh/:ticker` | VerificationAIController | Public | ⚠️ Manual | ✅ WORKING |

---

### 14. ENTRY ZONE

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/entry/:ticker` | EntryController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/entry/:ticker/explain` | EntryController | Public | ✅ Stock Detail | ✅ WORKING |

---

### 14. TECHNICAL ANALYSIS

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/technical/:ticker` | TechnicalAnalysisController | Public | ✅ Technical Page | ✅ WORKING |
| GET | `/api/technical/:ticker/indicators` | TechnicalAnalysisController | Public | ✅ Technical Page | ✅ WORKING |
| GET | `/api/technical/:ticker/structure` | TechnicalAnalysisController | Public | ✅ Technical Page | ✅ WORKING |
| GET | `/api/technical/:ticker/summary` | TechnicalAnalysisController | Public | ✅ Technical Page | ✅ WORKING |

---

### 15. MARKET DATA

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/market-data/:ticker` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/:ticker/quote` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/:ticker/historical` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/:ticker/fundamentals` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/:ticker/company` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/:ticker/sectors` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |
| GET | `/api/market-data/providers` | MarketDataController | Public | ✅ Providers Page | ✅ WORKING |
| GET | `/api/market-data/symbols` | MarketDataController | Public | ✅ Multiple pages | ✅ WORKING |

---

### 16. MARKET SCANNER

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/scanner` | ScannerController | Public | ✅ Scanner Page | ✅ WORKING |
| POST | `/api/scanner/scan` | ScannerController | Public | ✅ Scanner Page | ✅ WORKING |
| GET | `/api/scanner/presets` | ScannerController | Public | ✅ Scanner Page | ✅ WORKING |
| GET | `/api/scanner/:id` | ScannerController | Public | ✅ Scanner Page | ✅ WORKING |

---

### 17. PORTFOLIO (Legacy)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/portfolio` | PortfolioController | Public | ✅ Portfolio Page (list) | ✅ WORKING |
| GET | `/api/portfolio/:id` | PortfolioController | Public | ✅ Portfolio Detail | ✅ WORKING |
| GET | `/api/portfolio/:id/summary` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |
| GET | `/api/portfolio/:id/positions` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |
| GET | `/api/portfolio/:id/transactions` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |
| GET | `/api/portfolio/:id/risk` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |
| POST | `/api/portfolio` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |
| POST | `/api/portfolio/:id/transactions` | PortfolioController | Public | ✅ Portfolio Page | ✅ WORKING |

---

### 18. PORTFOLIO INTELLIGENCE (R2-030)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/portfolio/analysis` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/positions` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/opportunities` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/risk` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/rebalance` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/scenarios` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/history` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| GET | `/api/portfolio/learning` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| POST | `/api/portfolio/position` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| PUT | `/api/portfolio/position/:ticker` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| DELETE | `/api/portfolio/position/:ticker` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| POST | `/api/portfolio/refresh` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |
| POST | `/api/portfolio/analyze` | PortfolioIntelligenceController | Public | ✅ Portfolio Intelligence Tab | ✅ WORKING |

---

### 19. PORTFOLIO OPTIMIZATION

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/portfolio-optimization/:id` | PortfolioOptimizationController | Public | ✅ Portfolio Page | ✅ WORKING |
| POST | `/api/portfolio-optimization` | PortfolioOptimizationController | Public | ✅ Portfolio Page | ✅ WORKING |
| GET | `/api/portfolio-optimization/strategies` | PortfolioOptimizationController | Public | ✅ Portfolio Page | ✅ WORKING |
| POST | `/api/portfolio-optimization/:id/run` | PortfolioOptimizationController | Public | ✅ Portfolio Page | ✅ WORKING |

---

### 20. PREDICTION (Additional)

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/prediction/:ticker` | PredictionController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/prediction/:ticker/history` | PredictionController | Public | ⚠️ Not used | ✅ WORKING |
| GET | `/api/prediction/:ticker/explain` | PredictionController | Public | ✅ Stock Detail | ✅ WORKING |
| POST | `/api/prediction/refresh/:ticker` | PredictionController | Public | ⚠️ Manual | ✅ WORKING |

---

### 21. MACRO

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/macro/overview` | MacroController | Public | ✅ Macro Pages | ✅ WORKING |
| GET | `/api/macro/indicators` | MacroController | Public | ✅ Macro Pages | ✅ WORKING |
| GET | `/api/macro/regime` | MacroController | Public | ✅ Macro Pages | ✅ WORKING |
| GET | `/api/macro/calendar` | MacroController | Public | ✅ Macro Pages | ✅ WORKING |

---

### 22. PIPELINE ORCHESTRATOR

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/pipeline/status` | PipelineOrchestratorController | Public | ✅ Pipeline Status | ✅ WORKING |
| POST | `/api/pipeline/run` | PipelineOrchestratorController | Public | ✅ Pipeline Status | ✅ WORKING |
| GET | `/api/pipeline/jobs` | PipelineOrchestratorController | Public | ✅ Pipeline Status | ✅ WORKING |
| POST | `/api/pipeline/jobs/:id/retry` | PipelineOrchestratorController | Public | ⚠️ Manual | ✅ WORKING |

---

### 23. SCHEDULER

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/scheduler/jobs` | SchedulerController | Public | ✅ Admin | ✅ WORKING |
| POST | `/api/scheduler/jobs/:id/trigger` | SchedulerController | Public | ✅ Admin | ✅ WORKING |
| GET | `/api/scheduler/next-runs` | SchedulerController | Public | ✅ Admin | ✅ WORKING |

---

### 24. DECISION

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/decision/:ticker` | DecisionController | Public | ✅ Stock Detail | ✅ WORKING |
| GET | `/api/decision/:ticker/explain` | DecisionController | Public | ✅ Stock Detail | ✅ WORKING |

---

### 25. TOMORROW

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/tomorrow/:ticker` | TomorrowController | Public | ⚠️ Not in frontend | ✅ WORKING |
| GET | `/api/tomorrow/:ticker/explain` | TomorrowController | Public | ⚠️ Not in frontend | ✅ WORKING |

---

### 26. AI ASSISTANT

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| POST | `/api/ai-assistant/chat` | AIAssistantController | Public | ✅ AI Assistant Page | ✅ WORKING |
| GET | `/api/ai-assistant/history` | AIAssistantController | Public | ✅ AI Assistant Page | ✅ WORKING |

---

### 27. PROVIDER HEALTH

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/providers/health` | ProviderHealthController | Public | ✅ Providers Page | ✅ WORKING |
| GET | `/api/providers/:name/status` | ProviderHealthController | Public | ✅ Providers Page | ✅ WORKING |
| POST | `/api/providers/:name/test` | ProviderHealthController | Public | ✅ Providers Page | ✅ WORKING |

---

### 28. WORKFLOW

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/workflow` | WorkflowController | Public | ✅ Workflows Page | ✅ WORKING |
| POST | `/api/workflow` | WorkflowController | Public | ✅ Workflows Page | ✅ WORKING |
| GET | `/api/workflow/:id` | WorkflowController | Public | ✅ Workflows Page | ✅ WORKING |
| POST | `/api/workflow/:id/run` | WorkflowController | Public | ✅ Workflows Page | ✅ WORKING |

---

### 29. WORKFLOW QUEUE

| Method | Route | Controller | Auth | Frontend Consumer | Status |
|--------|-------|------------|------|-------------------|--------|
| GET | `/api/workflow-queue` | WorkflowQueueController | Public | ⚠️ Not used | ✅ WORKING |
| GET | `/api/workflow-queue/:id` | WorkflowQueueController | Public | ⚠️ Not used | ✅ WORKING |
| POST | `/api/workflow-queue/:id/retry` | WorkflowQueueController | Public | ⚠️ Not used | ✅ WORKING |

---

## ROUTE CONFLICTS / DUPLICATES

| Issue | Details |
|-------|---------|
| **Duplicate `/api/portfolio`** | `PortfolioController` (legacy) has `@Get(':id')`; `PortfolioIntelligenceController` (R2-030) has static routes. **FIXED** in R2-030 by registering `PortfolioIntelligenceModule` BEFORE `PortfolioModule` in AppModule. |
| **Duplicate `@Controller('portfolio')`** | `PortfolioController` + `PortfolioOptimizationController` both use `@Controller('portfolio')` — legacy issue, not fatal due to different routes. |
| **Two Watchlist Controllers** | `ai-early-opportunity/watchlist.controller.ts` + `alerts/watchlist.controller.ts` — different modules, different routes (`/api/watchlist` vs same). **POTENTIAL CONFLICT** — both define `GET /api/watchlist`. |

---

## ENDPOINTS WITH NO FRONTEND CONSUMER

| Endpoint | Controller | Reason |
|----------|------------|--------|
| `/api/prediction/:ticker/history` | PredictionController | Not linked in UI |
| `/api/catalyst/:ticker/history` | CatalystController | Not linked in UI |
| `/api/smart-money/:ticker/history` | SmartMoneyController | Not linked in UI |
| `/api/verification/:ticker/history` | VerificationAIController | Not linked in UI |
| `/api/tomorrow/*` | TomorrowController | No frontend page |
| `/api/workflow-queue/*` | WorkflowQueueController | No frontend page |
| `/api/early-opportunities/learning/run` | EarlyOpportunityController | Manual only |
| `/api/prediction/refresh/:ticker` | PredictionController | Manual only |
| `/api/catalyst/refresh/:ticker` | CatalystController | Manual only |
| `/api/smart-money/refresh/:ticker` | SmartMoneyController | Manual only |
| `/api/verification/refresh/:ticker` | VerificationAIController | Manual only |

---

## PUBLIC vs AUTH

**ALL endpoints are `@Public()`** — No authentication required (personal app, no-login design).  
Confirmed: Every controller uses `@Public()` decorator or module-level public access.

---

## API DOCUMENTATION

- **OpenAPI/Swagger:** `apps/api/src/modules/openapi/` — Auto-generated from decorators
- **SDK Generator:** `apps/api/src/modules/sdk-generator/` — Generates TypeScript SDK for frontend
- **Frontend SDK:** `apps/web/src/lib/sdk.ts` — Generated client

---

## EVIDENCE

- Controllers: `apps/api/src/modules/**/*.controller.ts`
- AppModule: `apps/api/src/app.module.ts` (import order for route precedence)
- Frontend SDK: `apps/web/src/lib/sdk.ts`
- OpenAPI: `apps/api/src/modules/openapi/`