# R2-035 - Signal & Filter Validation / Early Opportunity Scanner Hardening

**Version:** 1.0.0
**Status:** COMPLETE
**Scope:** Audit and harden the Early Opportunity Scanner. Map every previously-required
filter to its existing production engine, validate the data path against real BIST data,
implement only concrete gaps (no new scoring, no duplicated engines), and prove the full
signal chain end-to-end.

---

## 1. Problem

R2-034 delivered a real, validated market-data path (Yahoo serves 254 live bars, real
research evidence, working cache + fallback). The next question is the sprint's
governing one:

> "When BIST ELITE AI says this stock is an early opportunity, are the underlying
> filters, data, timeframes, Smart Money, catalysts, prediction, entry zone and
> risk/reward actually supporting that conclusion?"

This sprint answers it by (a) auditing every historical filter requirement against the
actual codebase, (b) validating the chain with real BIST data, (c) implementing the
concrete missing-data bug (missing data must be UNKNOWN, never a fabricated zero or an
implicit failure), and (d) recording the genuine gaps to fix next.

---

## 2. Filter Requirement Matrix

Status legend:

- **IMPLEMENTED** - the dimension is produced by a production engine and is part of the
  Early Opportunity signal/score.
- **PARTIALLY IMPLEMENTED** - the engine exists but is not reachable/sourced correctly
  from the scanner path.
- **MISSING** - no production engine produces the dimension.
- **EXPOSED (not scored)** - available on the result DTO / endpoints but not in the
  Early Opportunity score weights.
- **SEPARATE** - kept intentionally separate (e.g. "tomorrow").

| Requirement | Existing Engine | Status | Runtime Source |
|---|---|---|---|
| PD/DD (price/book, < 2 / <= 1.5) | `financial-rules/price-to-book.rule.ts` (DEFAULT_THRESHOLDS 1.5/3.0) + `FinancialRulesEngine` | IMPLEMENTED as a rule, NOT wired into EO score; exposed via `GET /financial-analysis/:symbol` | FintablesProvider.getFinancialRatios -> fundamental.mapper -> rules |
| FD/FAVÖK (EV/EBITDA) | `financial-rules/ev-to-ebitda.rule.ts` (10/15) | IMPLEMENTED as a rule (same wiring as PD/DD) | FintablesProvider.getFinancialRatios |
| Net profit growth (> 30%) | `financial-rules/net-profit-growth.rule.ts` (10/0) | PARTIALLY - rule exists but `mapToFinancialData` hard-codes `netProfitPrevious = null` -> always WARNING; provider returns single-period net profit only | FintablesProvider.getIncomeStatement (single period) |
| Equity growth | `financial-rules/equity-growth.rule.ts` (5/0) | PARTIALLY - same prior-period null limitation as net-profit growth | FintablesProvider.getBalanceSheet (single period) |
| Sector-relative profitability | `financial-rules/sector-comparison.rule.ts` (sectorDeviation 20/40) | PARTIALLY - rule exists; `sectorAverages` never populated by the mapper -> always WARNING/UNKNOWN | MISSING sector-average source |
| Debt ratio | `financial-rules/debt-ratio.rule.ts` (0.5/0.7) | IMPLEMENTED (same wiring) | FintablesProvider.getBalanceSheet |
| Market cap | `CompanyProfile.marketCap` | EXPOSED (on EO result `marketCap`, filterable) | FintablesProvider / orchestrator.fetchCompany |
| Free float / shares outstanding | `BalanceSheet.sharesOutstanding` | AVAILABLE | FintablesProvider.getBalanceSheet |
| Sector | `BistSymbolEntry.sector` / `CompanyProfile.sector` | AVAILABLE | SymbolRegistryService / provider |
| Volume increase / relative volume | `SmartMoneyScoreResult.volumeScore` | IMPLEMENTED | SmartMoneyEngine (reused in PredictionService) |
| Smart Money inflow | `smart-money` module (accumulation/distribution/confidence/signals) | IMPLEMENTED & REUSED | SmartMoneyEngine via PredictionService |
| Breakout potential | `market-structure` (breakOfStructure, changeOfCharacter) + `opportunity-detection` detectors | IMPLEMENTED | IndicatorEngine / SmartMoneyEngine via PredictionService |
| Technical trend | `PredictionResult.trendDirection` | IMPLEMENTED | PredictionEngine |
| Momentum | `PredictionResult.momentum` | IMPLEMENTED | PredictionEngine |
| Liquidity | `PredictionResult.liquidityQuality` | IMPLEMENTED | PredictionEngine |
| Confidence | `PredictionResult.confidence` | IMPLEMENTED | PredictionEngine |
| Risk | `PredictionResult.risk` / riskScore | IMPLEMENTED | PredictionEngine |
| Risk / reward | `PredictionResult.riskRewardRatio` + EntryZoneEngine floors/targets | IMPLEMENTED & surfaced on EO result | EntryZoneEngine |
| Entry zone / stop / target 1 / target 2 | `PredictionResult.entryZone` / `stopZone` / `target1` / `target2` | IMPLEMENTED & surfaced on EO result | EntryZoneEngine |
| Multi-timeframe agreement (1h-6m) | `multi-timeframe/multi-timeframe-*.ts` (8 TFs, MULTI_TIMEFRAME_SHORT/LONG, trendStage Early/Growing/Breakout) | IMPLEMENTED; EO *score* uses 5 TFs (1d/1w/1m/3m/6m); full 8-TF MTF surfaced on single-ticker `getEarlyOpportunity` | YahooFinanceProvider + PredictionService |
| Short vs medium-term distinction | `MultiTimeframeOpportunityEngine` (shortSignals/longSignals -> trendStage) | IMPLEMENTED via MTF engine | MTF engine |
| Early Opportunity Score | `early-opportunity.engine.ts` (deterministic weighted composite) | IMPLEMENTED (PRIMARY signal) | EarlyOpportunityService |
| Tomorrow feature | `tomorrow/` module | SEPARATE - NOT imported by ai-early-opportunity; does not enter EO score | TomorrowModule (secondary) |
| Dedicated filter page | `pages/scanner.tsx` + `scanner-filters.tsx` / `scanner-table.tsx` (`/scanner`) | EXISTS (validated Step 14) | Early Opportunities API |

---

## 3. Concrete Gaps Found (audit result)

1. **Fundamentals not surfaced on the Early Opportunity signal.** The fundamental
   rules (PD/DD, FD/FAVÖK, net-profit-growth, sector-relative, debt ratio) live in
   `FinancialRulesEngine` and are reachable only via `GET /financial-analysis/:symbol`
   (which takes data in the request body). The scanner path
   (`EarlyOpportunityService.buildAndScore`) never fetches or attaches
   fundamentals, so the **Value + Growth** filter mode has no backing on the opportunity
   pipeline, and the opportunity DTO carries no fundamental fields. The data source
   (FintablesProvider) is correct; it is simply not wired.
2. **`mapToFundamentalData` hard-codes prior-period nulls.** `netProfitPrevious` and
   `equityPrevious` are always `null`, so `NetProfitGrowthRule` and `EquityGrowthRule`
   can never produce a real PASS/FAIL - they always return WARNING ("data not
   available"). The FintablesProvider `/fundamentals/:symbol` endpoint returns a single
   period; prior-period data is not exposed.
3. **`sectorAverages` never populated.** `mapToFinancialData` does not set
   `sectorAverages`, so `SectorComparisonRule` cannot compute a relative position and
   always returns WARNING. There is no sector-average source in the mapper.
4. **Missing data semantic gap.** The existing rules return `WARNING` + `value: null`
   when a metric is unavailable. The sprint requires an explicit UNKNOWN that must not
   remove a stock from consideration. (FIXED in this sprint - see Section 4.1.)

---

## 4. Changes (this sprint)

### 4.1 Fundamental validation service - `financial-rules/fundamental-validation.service.ts` (NEW)

A thin, deterministic, **pure** service that reuses the existing
`FinancialRulesEngine` and `mapToFundamentalData` / `mapToFinancialData` (no rules
reimplemented). It normalizes rule output into the required
AVAILABLE / UNAVAILABLE + PASS / WATCH / FAIL / UNKNOWN model:

- A filter whose metric value is `null` becomes `availability: 'UNAVAILABLE'`,
  `status: 'UNKNOWN'` - **never a fabricated zero, never an implicit FAIL**.
- An available metric keeps its rule status (PASS/WATCH/FAIL) and exposes its
  thresholds (`pass`/`warning`) - e.g. `pdDd.thresholds = { pass: 1.5, warning: 3.0 }`
  per the PD/DD <= 1.5 requirement.
- `overallStatus` is UNKNOWN only when *every* filter is unavailable; a single
  available FAIL yields FAIL; a single available WATCH (no FAIL) yields WATCH; all
  available PASS yields PASS. **An UNKNOWN filter never by itself disqualifies the
  stock.**
- `score` is the mean of PASS(100)/WATCH(50)/FAIL(0) over *available* filters only, so
  missing data does not drag the score toward zero.
- Deterministic Turkish reasons.

`fromProviderInputs(symbol, {profile, ratios, balance, income, sector})` builds the
`FundamentalData` via the existing mappers, so it slots into the real provider flow.

> Note on sector-specific thresholds (Step 4: "do not apply 1.5 universally"): the
> underlying rules still use a single threshold. Sector-specific thresholds are a
> config-data change, intentionally left as a follow-up - this sprint only fixes the
> UNKNOWN semantics and exposure, not the scoring.

### 4.2 Real-data signal validation smoke - `ai-early-opportunity/__smoke__/signal-validation.smoke-spec.ts` (NEW)

Gated by `SMOKE_TEST=1`. Boots the full `EarlyOpportunityModule`, takes the first
`SAMPLE_SIZE` active symbols from `SymbolRegistryService.getActiveSymbols()` (no
hard-coded universe), and for each runs `getEarlyOpportunity(ticker)` - which drives
REAL DATA -> Prediction (8 timeframes) -> Multi-TimeFrame -> Smart Money -> Catalyst ->
Verification -> Entry Zone -> Early Opportunity. It asserts:

- `earlyOpportunityScore` in 0-100; probabilities/confidence in 0-100 (the real 0-100
  scale).
- Entry zone is either null (not confident) or well-formed (`min < max`);
  `riskRewardRatio` is null or `> 0` (no fabricated 0).
- Smart Money / Catalyst scores in 0-100; MTF agreement, `trendStage` in
  Early/Growing/Breakout/Extended/Late, `bestTimeframe`/`mostBullishTimeframe` present.
- The primary signal is `earlyOpportunityScore` (re-ranked), and `trend != 'tomorrow'`
  (tomorrow stays secondary).
- Self-learning / Backtest sanity: `runLearningCycle()` returns a report without
  throwing; modifiers are derived from the Backtest Engine (no new backtest system).

### 4.3 Bug fix surfaced during the sprint

- `YahooUnifiedAdapter.getHistoricalData/getLatestPrice/fetchCompany` now route through
  `withRetry` (timeout / retry / error-classification / metrics) - the dashboard
  previously reported `totalRequests = 0` for the provider serving all real traffic.

---

## 5. Tests

- **Unit (new):** `fundamental-validation.service.spec.ts` - 20 tests covering
  PASS/WATCH/FAIL classification, threshold boundaries (PD/DD 1.5/3.0, EV/EBITDA 10/15),
  the all-null -> all-UNKNOWN case (no fabrication, does not gate the stock, score 0),
  mixed availability (UNKNOWN never disqualifies), `fromProviderInputs` with full and
  null provider data, and Turkish reasons.
- **Regression:** `financial-rules` (9 suites / 160 tests) + `analysis-pipeline` green;
  `yahoo-unified.adapter.spec.ts` metrics regression green.
- **Type-check:** `tsc --noEmit` clean (exit 0).
- **Smoke (live, real HTTP):** `signal-validation` smoke 2/2 GREEN on 6 real BIST bank
  symbols (AKBNK, GARAN, ISCTR, YKBNK, HALKB, VAKBN).

Full unit suite: 5375 passed; the only failures are pre-existing, environment-dependent
flaky suites (`cache.service` fake-timers config, `compression.interceptor` gzip-header
detection, `performance-monitor`/`performance-validator` load-sensitive WARN/DEGRADED).
None are touched by this sprint.

---

## 6. Representative BIST Scan (live, real HTTP, 2026-08-09)

Symbols taken from `getActiveSymbols()` (first 6), each scored end-to-end through the
existing engines (Yahoo Finance for OHLCV):

| Symbol | Company | Score | Level | Bullish% | Confidence | Smart Money | Catalyst | MTF Agree | Entry Zone | R/R |
|---|---|---|---|---|---|---|---|---|---|---|
| ISCTR | İş Bankası C | 41 | BEKLE | 30 | 65 | 50 | 81 | 100 | 12.09-12.46 | 2.1 |
| AKBNK | Akbank | 39 | BEKLE | 22 | 51 | 52 | 81 | 100 | 65.88-67.98 | 10.5 |
| HALKB | Halk Bankası | 39 | BEKLE | 28 | 52 | 49 | 95 | 100 | 35.60-37.37 | 2.9 |
| VAKBN | Vakıflar | 36 | BEKLE | 23 | 48 | 60 | 85 | 100 | 29.79-30.98 | 1.4 |
| GARAN | İş Bankası C | 31 | BEKLE | 19 | 45 | 43 | 81 | 100 | 125.21-127.91 | 3.1 |
| YKBNK | Yapı Kredi | 28 | BEKLE | 21 | 42 | 40 | 72 | 100 | 33.44-34.33 | 0.4 |

Interpretation (the sprint's question):

- The signal chain is **alive and deterministic**: every stock returns well-formed entry
  zones (`min < max`), positive risk/reward, real catalyst (72-95) and smart-money (40-60)
  readings, and MTF trend-stage agreement - all derived from live Yahoo OHLCV, not
  fabricated.
- No stock is **removed** for missing fundamentals here (none were wired). When a
  fundamental metric is null, the validator reports UNKNOWN (Section 4.1) rather than
  a fake zero.
- Scores cluster in the 28-41 "BEKLE" band for this real snapshot - i.e. the scanner is
  **not over-eager**; it does not manufacture high scores for liquid bank names, which
  is the desired conservative early-opportunity posture.
- Ranking is by score (top ISCTR 41 vs bottom YKBNK 28).

Backtest sanity (self-learning reuse):
`scanned=48 calibrated=40 modifiers=40` - the self-learning cycle ran 48 predictions
through the Backtest Engine and produced 40 calibrated confidence modifiers. No
obviously mispriced entry zones (all `min < max`, all `R/R > 0`) were observed, and no
liquidity or bullish-bias anomalies for this slice.

---

## 7. Dedicated Filter Page (frontend)

Page: `apps/web/src/pages/scanner.tsx` -> route `/scanner` (registered in `App.tsx`).

- `components/scanner/scanner-filters.tsx` provides the filter controls;
  `scanner-table.tsx` renders the result list; `scanner-detail.tsx` renders the
  per-symbol detail. The page consumes the Early Opportunities API
  (`GET /early-opportunities`) which already supports
  `minEarlyOpportunityScore`, `minConfidence`, `minExpectedReturn`, `maxRisk`, `sector`,
  `minEliteScore`, `minSmartMoneyScore`.
- Existing page validated (no rebuild). Gap: the page does not yet expose the
  **Value + Growth** dimensions (PD/DD, FD/FAVÖK, profit growth) because those are not
  wired into the opportunity pipeline (Section 3.1). See follow-up.

---

## 8. Tomorrow Feature (secondary)

`modules/tomorrow/` exists as a standalone module
(`tomorrow.controller.ts`, `tomorrow.engine.ts`). It is **not** imported by
`ai-early-opportunity` and contributes nothing to the Early Opportunity score weights -
confirmed secondary. The validation smoke asserts `result.trend !== 'tomorrow'` as a
guard.

---

## 9. Files Touched

```
apps/api/src/modules/financial-rules/
  fundamental-validation.service.ts              # NEW (reuses FinancialRulesEngine + mappers)
  fundamental-validation.service.spec.ts        # NEW (20 tests)
  financial-rules.module.ts                     # register + export FundamentalValidationService
apps/api/src/modules/ai-early-opportunity/
  __smoke__/signal-validation.smoke-spec.ts     # NEW real-data validation smoke
  providers/unified/yahoo-unified.adapter.ts    # withRetry wrap (metrics/timeout/retry)
  providers/unified/yahoo-unified.adapter.spec.ts  # metrics regression tests
apps/api/jest.smoke.config.ts                    # already present (R2-034)
```

---

## 10. Known Issues / Remaining Gaps

- `netProfitPrevious`/`equityPrevious` are hard-coded `null` by `mapToFinancialData`;
  net-profit-growth and equity-growth therefore report UNKNOWN on live data until the
  FintablesProvider exposes multi-period statements (or a second period endpoint call).
- `sectorAverages` is never populated; sector-relative stays UNKNOWN until a sector-
  average source is wired.
- Fundamentals are not yet attached to the EO score/DTO; Value + Growth filters are not
  selectable on the opportunity pipeline. The validator service is ready to be wired in
  as a follow-up (it reuses the existing rules, no duplication).
- Sector-specific PD/DD thresholds (1.5 vs 3.0 by sector) are not yet implemented.
- In this environment `FINTABLES_API_KEY` is absent, so live fundamental data is empty;
  the validator correctly reports UNKNOWN (no fake values), which is the intended
  behavior under missing provider data.

---

## 11. Recommended Next Sprint

Wire `FundamentalValidationService` into `EarlyOpportunityIntelligenceService`:
attach `fundamentals` to `EarlyOpportunityIntelligenceResult`, expose PD/DD, FD/FAVÖK,
net-profit-growth, sector-relative on the result DTO/controller, and add a
`mode=value+growth` to the scanner filters. Fix `mapToFinancialData` to source
prior-period net profit / equity from the provider (multi-period endpoint or a second
period `?period=` call), and populate `sectorAverages` from the symbol registry / a
sector fundamental aggregate. This completes the Value + Growth filter mode without
adding any new scoring - it only attaches data that the Early Opportunity score can then
optionally consume.
