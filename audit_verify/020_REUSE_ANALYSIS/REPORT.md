# 020 — REUSE ANALYSIS AUDIT

## Verdict: EXCELLENT INTELLIGENCE REUSE, BUT 5 REAL DUPLICATIONS FOUND (75/100)

## Verified Duplications

| # | Duplication | Location | Risk |
|---|---|---|---|
| 1 | **Triple Elite Score implementation** | `modules/ai-elite-score/` + `modules/elite-score/` + `common/elite-score/` | Duplicate calc; inconsistency drift |
| 2 | **Dual Yahoo provider** | `providers/yahoo-finance.provider.ts` (legacy) vs `providers/unified/yahoo-unified.adapter.ts` | Dual stack; drift (D012 partial migration) |
| 3 | **RSI in Backtest Engine** | `backtest.engine.ts` `rsiSeries` vs centralized IndicatorEngine RSI | Violates D004 single-source-of-truth |
| 4 | **Duplicate `watchlist` controller** | `alerts/watchlist.controller.ts` (real) vs `ai-early-opportunity/watchlist.controller.ts` (stub) | Route collision; stub shadows real |
| 5 | **Duplicate `portfolio` / `dashboard` / `analysis` / `scanner` prefixes** | Multiple modules | Route collisions |

## What Is Correctly Reused (the norm)

- **Early Opportunity chain** reuses 11 engines — verified, zero duplication.
- **Multi-Timeframe** reuses 14 engines across 9 alignments — zero duplication.
- **Elite Score** composes Catalyst, Smart Money, Verification, Macro, MTF.
- **Portfolio** composes Analyst/EliteScore/Decision/Opportunity/Tomorrow/Entry/Verification/Catalyst (D006).
- **Backtest** reuses Historical/Indicator/Strategy/Portfolio (D007).
- **Indicator Engine is the single source of truth** (D004) — except the backtest RSI exception above.

## Methodology

Searched for duplicate indicator calculations (RSI/EMA/MACD), duplicate provider wrappers, duplicate scoring logic across modules. The 5 items above are the material findings. No duplicated API calls found beyond the legacy/unified provider dual-stack.

## STATUS: STRONG COMPOSITION CULTURE / CONSOLIDATE THE 5 DUPLICATIONS
