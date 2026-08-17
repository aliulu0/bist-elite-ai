# R2-073 Status Report: Real Fundamentals & Financial Truth Integration

**Generated**: 2026-08-17 (runtime probes 19:14 UTC)  
**Typecheck**: PASSED (0 errors, `apps/api`)  
**Tests**: affected-module regression 83 suites / 1266 passed; financial-rules suite 8 suites / 128 passed (incl. new truth semantics tests)  
**Scope**: eliminate fabricated/neutral financial scores; enforce technical ≠ fundamental; explicit UNAVAILABLE/PARTIALLY_AVAILABLE with provenance; point-in-time integrity; keep weights and thresholds unchanged; no second pipeline.

---

## Verdict

**COMPLETE** — every R2-073 phase is either implemented or covered by an explicit audit finding. The one honest limitation is a data-availability one, not a code one: **Fintables (the only fundamental provider) is NOT_CONFIGURED**, so the production financial dimension is `UNAVAILABLE` until credentials are supplied and runtime-verified. The system now reports that absence truthfully instead of fabricating a neutral 50.

## 1. Fundamental Data Model (Phase 1)

- `FundamentalData` (`historical-data.types.ts`) and `FundamentalProfile` (`unified-domain.types.ts`) extended with **nullable** provenance/metadata: `provider`, `retrievedAt`, `availableAt`, `periodEndDate`, `announcementDate`, `currency`, `dataStatus`, `confidence`.
- `mapToFundamentalData` populates `provider`, `retrievedAt`, `availableAt`, `dataStatus`, `confidence` from real provider inputs; date/currency fields are `null` until a provider exposes them (no fabrication).
- Fintables adapter sets the same metadata on `FundamentalProfile` (`dataStatus` from present-count).
- No existing model was duplicated; the existing types were extended in place.

## 2. Missing Data → Explicit UNAVAILABLE (Phases 8/9)

- `RuleStatus` gained `'UNAVAILABLE'`. All six rules (`price_to_book`, `ev_to_ebitda`, `net_profit_growth`, `equity_growth`, `debt_ratio`, `sector_comparison`) now return `UNAVAILABLE` (not `WARNING`) when their inputs are null/zero — previously missing data earned a **50% WARNING credit** (a fabricated neutral).
- `FinancialScoreEngine`:
  - `UNAVAILABLE` rules contribute 0 **and are excluded from `totalWeight`** (absence is never penalized, never credited).
  - `dataStatus`: `UNAVAILABLE` (no available rules), `PARTIALLY_AVAILABLE` (some rules missing), `AVAILABLE` (all present).
  - `isValid` = `totalWeight > 0`; added `unavailableRules` count.
  - Weights/thresholds **unchanged** (`DEFAULT_SCORE_CONFIG`, `DEFAULT_THRESHOLDS` untouched).
- `FinancialSummaryGenerator` skips `UNAVAILABLE` rules from strengths/weaknesses/risks and returns an explicit "financial data unavailable — no opinion" text instead of a fabricated grade opinion.

## 3. No Substitution Fabrication (Phase 6)

- Removed `totalAssets: fundamentals.totalAssets ?? fundamentals.marketCap` from `mapToFinancialData` — market cap is **not** total assets. Missing `totalAssets` is now `null`.
- `netProfitPrevious`/`equityPrevious` remain `null` (Fintables single-period endpoint doesn't provide them).

## 4. Downstream Engines Exclude Unavailable Financial Dimension (Phase 10)

The financial dimension (weight 20 in `opportunity.config`) is now **excluded, not zeroed**, when `dataStatus === 'UNAVAILABLE'`:

- `OpportunityEngine.evaluateFinancial` → `available: false`, weight 0; composite normalizes over available dimensions (`contribution/availableWeight*100`); financial excluded from confidence averaging.
- `EliteScoreEngine` → financial breakdown `{score:0, weight:0, contribution:0}` when unavailable; elite composite normalized over available weights; confidence excludes it.
- `CandidateEngine` → unavailable financial is vacuous-pass (`available:false`), excluded from the weighted candidate score and confidence (technical+confluence carry the score); candidacy no longer silently fails on missing fundamentals.
- `ConfluenceEngine` → financial alignment becomes `{score:0, direction:'neutral', confidence:0, factors:['Financial data unavailable']}` (previously score 0 mapped to **bearish** via `scoreToDirection`); confluence score and confidence exclude it; `dataCompleteness` counts financial only when not `UNAVAILABLE`.
- All composites are mathematically identical to before when financial data IS available (normalization factor = 1.0), so weights are unchanged.

## 5. Technical ≠ Fundamental (Phase 12)

- `historical-backtest.service.ts` previously set `financialScore = { score: rsi14 ?? 50, grade:'C', ... }` — **RSI is a technical indicator, never a fundamental**. Replaced with explicit `{ score:0, grade:'D', dataStatus:'UNAVAILABLE', isValid:false }` and `financialAlignment {score:0, neutral, confidence:0, factors:['Financial data unavailable']}`.
- `analysis.service.ts` four per-dimension response builders (`analyzeTechnical/SmartMoney/Opportunity/EliteScore`) now mark their placeholder financialScore as `dataStatus:'UNAVAILABLE', isValid:false` instead of a silent `0/'D'`.
- Grep sweep found no remaining `rsi`→financial or `score:50` financial fabrications in production code.

## 6. Point-in-Time Integrity (Phase 13)

- `availableAt` now carried on both `FundamentalData` and `FundamentalProfile`; usage rule documented: **fundamental data is usable only when `availableAt <= signalTimestamp`**.
- `HistoricalBacktestEngine.getDataAt(t)` already filters `timestamp <= t` for candles; fundamentals in backtest are `UNAVAILABLE`, so no PIT leak exists.
- `point-in-time-data.service.ts` (`filterCandles` / `filterByTimestamp` / `verifyNoFutureData`) verified present. No look-ahead found.

## 7. Smart Money (Phase 11)

- Live: computed from real OHLCV; empty result = zeros with `isValid:false`. No hardcoded 50/30 defaults. Already truthful — no change needed.
- Backtest: explicit `null` (UNAVAILABLE). Already truthful — no change needed.

## 8. Runtime Evidence (Phases 3/4)

Probe `r2-073-probe` (2026-08-17 19:14:39 UTC), evidence in `docs/R2-073_FUNDAMENTAL_DATA_MATRIX.json`:

- **Fintables NOT_CONFIGURED**: no `FINTABLES_API_KEY`/`FINTABLES_EMAIL`/`FINTABLES_PASSWORD`/`FINTABLES_BASE_URL` in `.env`; live unauthenticated `GET https://fintables.com/api/v1/health` returned **HTTP 403**. `FintablesUnifiedAdapter.validateConnection()` returns false without a key.
- **KAP**: company + disclosures only — **no fundamentals** (`kap.adapter.ts`).
- **Orchestrator**: only `yahoo` is on the public-endpoint whitelist; yahoo's `getFinancialRatios/getBalanceSheet/getIncomeStatement` all return `null` (price/OHLCV only).
- **Net runtime outcome**: `fetchFundamentalData` yields `data: null` → financial dimension `UNAVAILABLE` — which the pipeline now reports explicitly.

## 9. No Second Pipeline / No New Engine (Phase 14)

- Zero new pipelines, caches, opportunity engines, or backtest engines were created. All changes extend existing types/engines and their tests.

## 10. Source Hierarchy (Phase 15)

1. Fintables — _only if runtime-verified_ (currently NOT_CONFIGURED, 403).
2. KAP / official disclosures — disclosure-only today.
3. Other verified integrated source — none present.
4. Public research (SerpAPI/agent-reach) — **never** promoted to authoritative financial truth.

Yahoo remains the price/OHLCV source only.

## 11. Fake-Data Audit (Phase 16)

| Location                                                             | Status                          | Scope                                                                      |
| -------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `portfolio-optimization.service.ts` `simulateReturns()`              | PRE-EXISTING FLAG, not modified | statistical fallback when `holdings[].returns` absent; out of R2-073 scope |
| `market-overview.controller.ts:68` "simple average for demo" comment | PRE-EXISTING FLAG, not modified | comment only; the average is computed from real prices                     |
| `bist-index.service.ts` `SYNTHETIC_PROXY`                            | EXPLICITLY LABELED              | BIST100/30 computed from real Yahoo constituents, typed `SYNTHETIC_PROXY`  |

No mock/simulated financial data exists in the market-data pipeline.

## 12. Architecture Audit (Phase 17)

- Only one market-data pipeline (orchestrator + fallback); one financial-rules engine; one score engine; one opportunity/elite/candidate/confluence chain. No duplication introduced.
- `fundamental-integration.service.ts` keeps a single `fetchFundamentalData` call per symbol (ONE fetch per symbol convention preserved).
- Data-quality statuses (`financial-data-quality.types.ts`: VERIFIED/ACCEPTABLE/WARNING thresholds) unchanged; `FundamentalValidationService` `UNKNOWN` never gates.

## 13. Regression (Phase 20)

- `tsc --noEmit` (apps/api): **0 errors**.
- Affected-module Jest regression: **83 suites / 1266 tests passed** (financial-rules, analysis-pipeline, opportunity, candidate, confluence, elite-score, explainability, ai-early-opportunity, early-opportunity-backtest, scoring, market-data providers).
- New truth tests added: score-engine (`UNAVAILABLE`/`PARTIALLY_AVAILABLE`/`AVAILABLE`, exclusion from `totalWeight`), opportunity engine (financial exclusion + normalization), elite-score engine (exclusion + normalization + confidence).
- Full API suite: see Phase 20 run in the sprint log (all suites green except the pre-existing flaky `error-handling.integration.spec.ts`).

## 14. Open Items (not blockers)

- **Enable Fintables**: supply `FINTABLES_API_KEY` in `.env`, then re-probe live; on success the financial dimension becomes `PARTIALLY_AVAILABLE`/`AVAILABLE` automatically (no code change expected).
- **Period metadata**: `periodEndDate`/`announcementDate`/`currency` stay `null` until the provider exposes them; PIT guards then become fully active for fundamentals.
- **Candidate gating note**: when financial is unavailable, candidacy is decided by technical+confluence only (documented, deliberate).

---

### Verdict: **COMPLETE**

R2-073 delivers real-financials-or-explicit-absence semantics throughout the financial scoring chain, removes the last technical-as-fundamental fabrication, keeps all weights/thresholds and the single-pipeline architecture intact, and is fully verified by 1266 passing tests plus live runtime probes.
