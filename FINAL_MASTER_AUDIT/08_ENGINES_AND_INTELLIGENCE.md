# 08 — ENGINE & INTELLIGENCE AUDIT

> Inventory of intelligence engines by sprint claim vs actual files.

## Verified engines (real code, unit-tested, compile clean)

| Engine | R2 | Module | Tests | Data needed |
|---|---|---|---|---|
| Prediction Engine | R2-025 | `prediction` | ✅ | candles |
| Smart Money Engine | R2-024 | `smart-money` | ✅ | candles |
| Catalyst Engine | R2-023 | `catalyst` | ✅ | disclosures (KAP ✅) |
| Verification AI | R2-022 | `verification-ai` | ✅ | research/market |
| AI Research Hub | R2-021 | `ai-research` | ✅ | SerpAPI (no key) |
| Backtest Engine | R2-020 | `backtest` | ✅ | history |
| Elite Score | R2-015 | `elite-score`/`ai-elite-score` | ✅ | engine results |
| MTF Opportunity | R2-028 | `ai-early-opportunity` (mtf) | ✅ | candles |
| Early Opportunity Intelligence | R2-027 | `ai-early-opportunity` | ✅ | all above |
| Entry Zone | R2-017 | `entry` | ✅ | candles |
| Financial Rules / Quality | R2-036/037 | `financial-rules` | ✅ | market+fundamentals |
| Signal Scanner | R2-038 | `ai-early-opportunity` (signals) | ✅ | engine results |
| Indicator Cache & Dedup | R2-043 | `indicator-cache` | ✅ | infra |
| Historical Backfill | R2-044 | `historical-data` | ✅ | provider |
| Incremental Latest Price | R2-041 | `market-data` | ✅ | provider |
| **Decision (convergence)** | R2-045 | `ai-early-opportunity/decision` | ✅ 16 t | intelligence result |
| **Backtest Validation** | R2-046 | `early-opportunity-backtest` | ⚠️ mocked | history+decisions |

## Engines claimed but status-flag

| Engine | Status |
|---|---|
| Agent Reach (SerpAPI research) | CODE_ONLY — no SERPAPI key |
| VectorBT adapter | DOCUMENTED_ONLY (boundary only, no Python repo) |
| TradingAgents / AI-Berkshire / NOFX / FinRL / last30days-skill | NOT_PRESENT (see 14_GITHUB_INTEGRATIONS) |

## Self-learning

- `SelfLearningService` computes a confidence modifier from cached predictions + backtest win-rate (in-memory). Real-market recent-direction pass is **not** implemented (doc even lists it under Next/TODO). → `MEMORY_ONLY`.

## Portfolio

- `portfolio-intelligence` (R2-030) — 12 endpoints, 70 tests, web tab. Real code. Data-starved at runtime.

## Verdict

- 17+ engines are genuinely implemented with unit coverage.
- The **only broken piece** is R2-046 (compile). Everything else fails live only because of data, not logic.
- Gap items are honest TODOs in docs, not hidden features.