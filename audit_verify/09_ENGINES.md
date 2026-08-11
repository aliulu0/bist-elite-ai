# 09. ENGINES

## 9.1 Engine inventory (core domain logic)

| Engine | Module | Purpose | Reuses | Tests |
|---|---|---|---|---|
| `IndicatorEngine` | indicators | calculates all technical indicators | — | per-category ✓ |
| `ScannerEngine` | scanner | multi-factor scanning | indicators | ✓ |
| `EliteScannerEngine` | scanner | elite filtering | scanner | ✓ |
| `DecisionEngine` | decision | BUY/SELL/HOLD decision | scoring, indicators | 26 ✓ |
| `OpportunityEngine` (ai) | ai-opportunity | opportunity ranking | decision | ✓ |
| `OpportunityEngine` (opportunity) | opportunity | distinct legacy engine | — | ✓ |
| `EliteScoreEngine` (pipeline) | elite-score | pipeline scoring | scoring | ✓ |
| `EliteScoreEngine` (ai-elite-score) | ai-elite-score | elite score computation | opportunity | ✓ |
| `TomorrowOpportunityEngine` | tomorrow | next-day forecast | elite-score | ✓ |
| `AnalystEngine` | analyst | analyst commentary | tomorrow | 47 ✓ |
| `AnalystExplanationEngine` | analyst | explanation text | analyst | ✓ |
| `EntryZoneEngine` | entry | entry/exit zones | analyst | ✓ |
| `PortfolioOptimizationEngine` | portfolio-optimization | allocation/weight suggestions | analyst+decision+opportunity+elite+tomorrow+verification+catalyst | 24 ✓ |
| `PortfolioEngine` | portfolio | portfolio CRUD/metrics | — | ✓ |
| `MarketStructureEngine` | market-structure | structure regime | indicators | ✓ |
| `SmartMoneyEngine` | smart-money | smart-money flow | — | — |
| `VerificationEngine` | research | cross-source verification | providers | — |
| `CatalystDetectionService` | research | catalyst events | providers | — |
| `RankingEngine` | ranking | ranking | — | — |
| `BacktestEngine` | backtest | backtest execution | indicators | page-level |
| `FinancialRulesEngine` | financial-rules | rule engine | — | — |
| `ConfluenceEngine`, `CandidateEngine`, `OpportunityDetectionEngine` | respective | multi-factor | — | — |

## 9.2 Architecture quality

1. **Chain composition is real and correct.** The documented AI_HANDOFF chain `Research → Verification → Catalyst → Consensus → Elite Score → Portfolio Optimization → Backtest → Telegram` maps to actual dependencies: `decision ← opportunity ← elite-score ← tomorrow ← analyst ← portfolio-optimization`. Each higher engine reads the lower registry/service rather than re-implementing. This is the strongest architectural property in the codebase.
2. **Pure-domain engines:** `IndicatorEngine`, `FinancialRulesEngine`, `ScoreCalculator` are pure functions / pure classes with no I/O — easily unit-tested and reused.
3. **I/O confined to services/registries:** engines are deterministic; providers/services do the I/O. Good separation.
4. **Named engines duplicate** (two `EliteScoreEngine`, two `OpportunityEngine`) in different module trees — naming hazard, no behavioral collision.
5. **Some engines lack dedicated specs** (Verification, Catalyst, SmartMoney, Ranking) — coverage gap.

## 9.3 Orchestration

- `analysis-pipeline` / `pipeline-orchestrator` wire the chain for batch jobs.
- Scheduler (`main-scheduler.ts` + `SchedulerEngine`) runs the chain on a cron from the same `AppModule`.
- Telegram consumers the final analyst output.

## 9.4 Verdict

The engine layer is the best-in-audit component: deterministic, reusable, chained correctly per documented architecture, and heavily tested. Gaps: a few engines untested, and engine output is memory-only until persistence runs.
