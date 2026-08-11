# 04. MODULES

Full inventory of the 56 code-bearing modules under `apps/api/src/modules/`, with wiring status and controller routes.

**Global prefix:** `/api` (health excluded). All routes below are relative to `/api`.

## 4.1 Wired feature modules (all imported into AppModule)

| Module | Controller prefix | Routes (GET unless noted) | Engine(s) | Registry | Spec |
|---|---|---|---|---|---|
| **scanner** | `scanner` | `/`(overview), `/list`, `/run`, `/strategy/:strategy`, `/top`, `/filter` | `ScannerEngine`, `EliteScannerEngine` | `ScannerRegistry`, `StrategyRegistry` (9 strategies) | ✅ 3 files |
| **decision** | `decision` | `/top`, `/all`, `/:ticker`, `POST /batch` | `DecisionEngine` | `DecisionRegistry` | ✅ 26 tests |
| **ai-opportunity** | `opportunity` | `/`, `/top`, `/:ticker`, `POST /batch` | `OpportunityEngine` | `OpportunityRegistry` | ✅ |
| **opportunity** (engine-only) | — | — | `OpportunityEngine` (different) | — | ✅ |
| **opportunity-center** | `opportunity-center` | `/`, `/top10`, `/top20`, `/today`, `/tomorrow`, `/momentum`, `/value`, `/smart-money`, `/elite-score` | `OpportunityCenterService` | `OpportunityCenterRegistry` | ✅ |
| **elite-score** (pipeline) | — | — | `EliteScoreEngine` | — | ✅ |
| **ai-elite-score** | `elite-score` | `/top`, `/daily`, `/weekly`, `/monthly`, `/3m`, `/6m`, `/:ticker`, `POST /batch` | `EliteScoreEngine` | `EliteScoreRegistry` | ✅ |
| **tomorrow** | `tomorrow` | `/`, `/top10`, `/top20`, `/:ticker`, `POST /batch` | `TomorrowOpportunityEngine` | `TomorrowRegistry` | ✅ |
| **analyst** | `analysis` | `/top`, `/batch`, `/:ticker`, `POST /batch` | `AnalystEngine` | `AnalystRegistry` | ✅ 47 tests |
| **entry** | `entry` | `/top`, `/batch`, `/:ticker`, `POST /calculate` | `EntryZoneEngine` | `EntryRegistry` | ✅ |
| **portfolio** | `portfolio` | `/`, `/metrics`, `/:id`, `/:id/summary`, `/:id/positions`, `/:id/transactions`, `/:id/risk`, `/:id/allocation`, `/:id/performance`, `/:id/report`, `POST /`, `POST /:id/transactions` | `PortfolioEngine` | — | ✅ 8 files |
| **portfolio-optimization** | `portfolio` | `/optimize/:ticker`, `/top`, `POST /optimize` | `PortfolioOptimizationEngine` | `PortfolioOptimizationRegistry` | ✅ 24 tests |
| **market-data** | `market-data` | `/providers/dashboard`, `/:symbol/latest`, `/:symbol/history`, `/timeframes`, `/providers` | `MarketDataService`, `MarketDataOrchestrator` | `MarketDataProviderRegistry` | ✅ |
| **market-scanner** | (none — `controllers: []`) | — | `MarketScannerEngine` | — | ✅ |
| **indicators** | — | — | `IndicatorEngine.calculateAll` | — | ✅ per-category |
| **historical-data** | — | — | `HistoricalDataPipeline.process` | — | ✅ |
| **scoring** | — | — | `ScoreCalculator`, `ScoreEngine`, `ScorePipeline` | `ScoreRegistry` | ✅ |
| **research** | `research` | `/news`, `/news/company/:ticker`, `/news/sector/:sector`, `/news/economic`, `/status` | `VerificationEngine`, `CatalystDetectionService`, `ResearchIntelligenceService` | — | partial |
| **research/intelligence** | `research/intelligence` | `/`, `/providers`, `/:ticker`, `POST /refresh` | `ResearchIntelligenceService` | — | ✅ |
| **macro** | — | — | `MacroDataService`, `TCMBDecisionCapture` | `TCMBDecisionStore` | — |
| **market-structure** | — | — | `MarketStructureEngine` | — | ✅ |
| **smart-money** | — | — | `SmartMoneyEngine` | — | — |
| **technical-analysis / technical-rules / technical-score / technical-summary** | — | — | indicator-based engines | — | — |
| **financial-rules** | — | — | `FinancialRulesEngine` (+ controller/service) | — | — |
| **confluence / candidate / opportunity-detection / ai-analysis** | — | — | multi-factor engines | — | — |
| **ranking** | — | — | `RankingEngine` | — | — |
| **backtest** | — | — | backtest engine (page-level) | — | — |
| **backtest-validation** | — | — | validation engine | — | — |
| **benchmark** | — | — | benchmark engine | — | — |
| **rule-analytics** | — | — | rule analytics | — | — |
| **weight-optimizer** | — | — | weight optimizer | — | ✅ |
| **scheduler** | — | — | `SchedulerEngine` (started by main-scheduler) | — | — |
| **pipeline-orchestrator** | — | — | pipeline orchestration | — | — |
| **workflow / workflow-queue / workflow-integration** | — | — | workflow engines | — | — |
| **persistence** | — | — | Prisma persistence (F11-005) | — | — |
| **provider-health-monitor** | `providers` | `/health`, `/health/:provider`, `/history/:provider`, `POST /reset...` | `ProviderHealthMonitorEngine` | — | — |
| **audit-log** | — | — | audit logging | — | — |
| **system-diagnostics** | — | — | diagnostics | — | — |
| **configuration** | — | — | config management | — | — |
| **alerts** | — | — | alert engine + services | — | — |
| **ai-assistant** | — | — | assistant engine | — | — |
| **openapi / sdk-generator / contract-validator** | — | — | API tooling | — | — |
| **event-bus** | — | — | event bus | — | — |
| **multi-market** | — | — | multi-market engine | — | — |
| **websocket-gateway** | — | WS `/socket.io` | realtime gateway | — | — |
| **performance-monitor** | — | — | metrics | — | — |
| **analysis-pipeline** | — | — | pipeline | — | — |

## 4.2 Empty module dirs (no code)

`auth/`, `portfolios/`, `stocks/`.

## 4.3 Dead / orphan classes

- `research/catalyst-engine.service.ts` → `CatalystEngineService` (unwired)
- `research/catalyst-repository.service.ts` → `CatalystRepository` (unwired)
- `scheduler/jobs/catalyst-refresh.job.ts` → `CatalystRefreshJob` (missing from `JOB_CLASSES`)
- `market-scanner/scanner.controller.ts` → `controllers: []`

## 4.4 Module-level findings

1. **Duplicate module registration:** `PortfolioOptimizationModule` twice in `app.module.ts` (lines 207, 231).
2. **Route-prefix collision:** `portfolio` used by both `PortfolioController` and `PortfolioOptimizationController` — works only because sub-paths differ; fragile.
3. **Two `elite-score` engines and two `opportunity` engines** with the same class names in different module trees — a naming hazard for maintainers.
4. **`strategy` has no dedicated module** — lives inside `scanner` (`strategy-registry.service.ts`), and common `strategy-validation/` handles validation. Not an orphan, but documentation calls it a standalone engine.
5. **Verification & Catalyst engines have no dedicated spec files** (only engine code within `research/`).
6. All 56 code-bearing modules are wired → **zero orphan modules** (only orphan classes).
