# 03. DEPENDENCY GRAPH

## 3.1 Workspace dependency map

```
                      ┌─────────────────────┐
                      │       turbo         │
                      └─────────┬───────────┘
        ┌───────────────┬───────┴───────┬───────────────┐
        ▼               ▼               ▼               ▼
   @bist-elite/api  @bist-elite/web @bist-elite/telegram @bist-elite/ui
        │               │               │                │  (peer: react 18)
        │               │               └─ @bist-elite/shared
        │               └───────────────┬────────────────┘
        │                               ▼
        │                       @bist-elite/shared
        │              (zod, date-fns; types, validation, i18n, utils)
        │
        ├── @bist-elite/database ─── @prisma/client
        ├── @bist-elite/config  ───→ re-export of shared
        └── @bist-elite/types    ───→ re-export of shared
```

- `apps/worker` (Python) has **no package.json** — turbo effectively ignores it; it is a workspace glob member but not buildable by turbo.
- `pnpm-workspace.yaml` globs `apps/*`, `packages/*`; `allowBuilds` whitelist includes prisma/esbuild/etc.

## 3.2 Backend module dependency graph (feature level)

```
MarketDataModule ──► providers (Yahoo, Finnhub, SerpAPI, AlphaVantage, TCMB, KAP, MKK, Fintables)
     │                    │
     ▼                    ▼
MarketDataOrchestrator (UNIFIED_ORCHESTRATOR)
     ▲
     │ (consumed by)
     ├── AggregationModule ─► market-data aggregator, quality-scorer, conflict-resolver
     ├── MacroModule ───────► TCMBDecisionCapture
     └── scanner/elite-scanner

ResearchModule ──► providers (SerpApiResearch, AgentReach, GoogleNews/RSS)
     │
     ├── ResearchIntelligenceService ──► VerificationEngine, CatalystDetectionService
     ├── NewsAggregationService
     └── research-cache

ScoringModule (ScoreCalculator, ScoreEngine, ScorePipeline)
     ▲
DecisionModule ──► DecisionEngine, DecisionRegistry
     ▲
AiOpportunityModule ──► OpportunityEngine, OpportunityRegistry, Ranking, Explanation
     ▲
AiEliteScoreModule ──► EliteScoreEngine, EliteScoreRegistry
     ▲
TomorrowModule ──► TomorrowOpportunityEngine, TomorrowRegistry
     ▲
EntryModule ──► EntryZoneEngine, EntryRegistry
     ▲
AnalystModule ──► AnalystEngine (+ AnalystExplanationEngine), AnalystRegistry
     ▲
PortfolioOptimizationModule ──► PortfolioOptimizationEngine, Registry, Service
                                (composes Analyst+Decision+Opportunity+EliteScore+
                                 Tomorrow+Verification+Catalyst results)
PortfolioModule ──► PortfolioEngine + repositories/services (standalone DB-backed)
BacktestModule ──► backtest engine (page-level only)
ScannerModule ──► ScannerEngine, EliteScannerEngine, StrategyRegistry, ScannerRegistry
```

## 3.3 Circular dependency check

- **No circular `@Module` imports found** in the NestJS graph. All modules import top-down (decision ← opportunity ← elite-score ← tomorrow ← analyst ← portfolio-optimization).
- `modules/elite-score` and `modules/ai-elite-score` are **two distinct modules** with separate engines; `ai-elite-score` depends on `ai-opportunity` (which depends on `decision`); `modules/elite-score` (pipeline) is standalone. No cycle.
- No `forwardRef()` usage detected.

## 3.4 Redundancies in the dependency graph

1. **`common/portfolio-optimization/`** exists but is NOT imported; `modules/portfolio-optimization/` is the wired one → duplicate tree.
2. **Provider duplication creates virtual cycles:** `YahooUnifiedAdapter` depends on legacy `YahooFinanceProvider`; `SerpApiAdapter` calls Finnhub directly.
3. **`packages/config` and `packages/types`** are indirection with no added value (both re-export shared).
4. **`AppModule` re-imports `PortfolioOptimizationModule` twice.**

## 3.5 Orphaned / dead graph nodes

- `CatalystEngineService`, `CatalystRepository`, `CatalystRefreshJob` — not instantiated by any provider.
- `market-scanner/ScannerController` — `controllers: []`.
- Python `backend/` and `apps/worker` — outside the NestJS graph entirely.
- Legacy `frontend/` (Next.js) — outside the Vite graph.

## 3.6 Verdict

Dependency graph is largely a clean DAG with strong engine reuse. Deductions for the dual market-data stack, duplicated provider classes, dead nodes, and the duplicate module registration.
