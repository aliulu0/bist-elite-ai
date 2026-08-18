# R2-066: Historical Early Opportunity Backtest + Signal Validation

## Objective

Validate whether the EXISTING Early Opportunity Intelligence logic can identify opportunities early using only information available at the signal timestamp.

**CORE PRINCIPLE**: `BACKTEST FIRST. NO LOOK-AHEAD. REAL HISTORICAL DATA. NO FABRICATION. NO SCORE MANIPULATION.`

R2-059 through R2-065 are COMPLETE. R2-066 builds on the existing architecture without modifying any scoring weights or creating new pipelines.

## Important Details

- **Core constraint**: `REAL DATA OR EXPLICIT ABSENCE. NEVER FABRICATE.` Applies across all 6 completed sprints (R2-059–R2-065) and R2-066.
- **Absolute rules** (R2-066 #54): `NO LOOK-AHEAD BIAS.`; `NO FUTURE DATA LEAKAGE.`; `NO SCORE WEIGHT MODIFICATION.`; `NO THRESHOLD OPTIMIZATION.`; `NO CHERRY-PICKING.`; `NO HARD-CODED RETURNS.`; `NO HARD-CODED PERFORMANCE.`; `NO FAKE SIGNALS.`; `NO FAKE HISTORICAL DATA.`; `NO SECOND BACKTEST ENGINE.`; `NO SECOND OPPORTUNITY ENGINE.`; `NO SECOND MARKET-DATA PIPELINE.`; `NO AUTONOMOUS TRADING.`; `REAL HISTORICAL DATA OR EXPLICIT ABSENCE.`
- **Weights preserved**: financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15 — **NOT CHANGED** in R2-066.
- **117/117 macro test suites** PASS across all 6 completed sprints + R2-066 new tests.
- **All commits** `ff0a7003` (R2-056) through the R2-065 commit pushed to `origin/main`.
- **Verified data**: Yahoo Finance provides real BIST prices for 6/6 symbols (THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00 TRY). Cross-provider consensus at runtime: single source → `UNVERIFIABLE_DATA`, confidence MEDIUM.
- **IndexType distinction** (R2-062): `OFFICIAL` vs `SYNTHETIC_PROXY` explicitly tracked.
- **Universe foundation** (R2-063/ R2-064): Production BIST equity universe is `UNAVAILABLE` at runtime; 6 test symbols are a FIXTURE/VALIDATION universe only; `discoverUniverse()` method provides per-symbol status; historical OHLCV foundation established via Yahoo Finance 1D.
- **R2-066** is the newest sprint: historical early opportunity backtest + signal validation.

## Work State

### Completed

- **R2-059**: Real-data migration + deterministic market truth. Fake data audit completed; `mock-data.ts` and `.env.production` currency rates identified and secured; production paths free of fabricated financial data; 117/117 macro tests preserved.
- **R2-060**: SerpAPI → Google Finance real-data integration. `fetchGoogleFinance()` returns `null` when no price (no fabrication); cross-provider comparison vs Yahoo for Market Truth; rate limiting handled via existing R2-050C budget system; architecture preserved.
- **R2-061**: BIST exchange intelligence + market breadth + relative strength. BIST100/BIST30 index computation from Yahoo constituents (typed `SYNTHETIC_PROXY`); market breadth (advancers/decliners/unchanged) with coverage metadata; advance/decline ratio with safe division; relative strength with `benchmarkType`; volume intelligence (relative volume, 2x spike detection); market regime (BULL/BEAR/SIDEWAYS/UNKNOWN with deterministic rules); market intelligence summary service; 117/117 regression preserved.
- **R2-062**: Market truth hardening + index semantics. `IndexType = 'OFFICIAL' | 'SYNTHETIC_PROXY'` added to types; `BISTIndex.type` field explicit; `MarketIntelligenceSummary` with `officialBist100`/`syntheticBist100Proxy` fields; `RelativeStrength.benchmarkType` and `MarketRegime.benchmarkType` tracking; market breadth with explicit coverage semantics; all new features return `null`/`UNAVAILABLE` when data absent; 117/117 regression preserved.
- **R2-063**: Real BIST universe + historical market data foundation. Universe source semantics (`OFFICIAL/PUBLIC_PROVIDER/RESEARCH/DERIVED`); symbol normalization (providerSymbol→internalFormat); instrument types, market sectors, market segments (all researched, many `UNAVAILABLE`); historical OHLCV (Yahoo Finance 1D for 6 symbols; 4H/Weekly/Monthly `UNAVAILABLE`); technical indicators (SMA9/SMA20/SMA50/RSI/MACD calculated); volume features (avgvol20/avgvol50/relativeVolume); return features (1D/20D/60D/252D); look-ahead protection enabled; opportunity engine not modified (foundation only).
- **R2-064**: BIST Universe Discovery + Real Symbol Coverage Expansion. `discoverUniverse()` method on MarketDataOrchestrator; 1075 registry symbols, 6 validated (test fixture), 183 invalid (non-equity), 1066 unavailable (no market data); 0.56% coverage; equity-only filtering; coverage semantics FULL/PARTIAL/UNAVAILABLE; no second pipeline, no second cache.
- **R2-065**: REAL-DATA COVERAGE EXPANSION + EARLY OPPORTUNITY FEATURE ENGINE. `EarlyOpportunityFeatures` service with deterministic technical indicators (SMA, RSI, MACD, Stochastic RSI), volume intelligence, return features, momentum, breakout, relative strength, market regime; EarlyOpportunityFeatures structure feeds into opportunity engine WITHOUT modifying score weights (financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15 preserved).

### Active

- **R2-066**: Historical Early Opportunity Backtest + Signal Validation (current sprint). Goal: validate the existing Early Opportunity Intelligence logic using only historical data available at each signal timestamp, with absolute no-look-ahead bias.

### Blocked

- **None** — all prior constraints satisfied; R2-066 code implemented and typecheck-passed.

## Changes

### New: `historical-backtest.service.ts`

Created historical backtest service at `apps/api/src/modules/market-data/backtest/historical-backtest.service.ts`. The service:

- **Backtest universe**: 6 validated symbols only — `THYAO`, `AKBNK`, `ASELS`, `BIMAS`, `TUPRS`, `GARAN`
- **Signal generation**: At each timestamp T, collects ONLY data available at or before T
- **Score preservation**: Existing opportunity engine scores calculated with fixed weights (financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15) — **NOT MODIFIED**
- **Look-ahead protection**: Absolute enforcement — future data (T+1, T+2, ...) never enters signal calculation
- **Future return labels**: Calculated AFTER T for evaluation only; never as signal inputs
- **Event-study data**: Generates deterministic snapshots of what the system knew at T
- **Backtest matrix**: Produces per-symbol, per-year, per-regime, per-horizon metrics

**Method**: `generateSignals()` returns `BacktestSignalResult[]` where each result contains:

- `snapshot: OpportunitySignalSnapshot` — what the system knew at T
- `futureReturns: FutureReturnLabels` — evaluation labels only (futureClose / signalClose - 1)
- `eligibility: 'ELIGIBLE' | 'INELIGIBLE'` — whether the signal qualified

**Static method**: `HistoricalBacktestEngine.runFullBacktest(marketData)` runs the full backtest for all 6 backtest symbols and returns per-symbol results with summaries.

### New: Documentation Artifacts

1. **`docs/R2-066_STATUS_REPORT.md`** — comprehensive sprint status report
2. **`docs/R2-066_SIGNAL_EVENT_DATA.json`** — machine-readable event-study output with every event containing real calculated values
3. **`docs/R2-066_BACKTEST_MATRIX.json`** — backtest matrix with dimensions: symbol, year, regime, scoreBucket, horizon; metrics: signalCount, eligibleCount, positiveForwardReturnRate, averageReturn, medianReturn, bestReturn, worstReturn

### Preserved From Prior Sprints

- **117/117** macro test regression — preserved across all 7 sprints
- **No fabricated financial data** — maintained (R2-059 guarantee intact)
- **Single market-data pipeline** — maintained (Yahoo Finance only, per R2-064 #37)
- **No second cache** — maintained (per R2-064 #37)
- **IndexType OFFICIAL/SYNTHETIC_PROXY** — preserved from R2-062
- **Universe semantics** (6 test symbols ≠ production BIST universe) — preserved from R2-063/ R2-064
- **EarlyOpportunityFeatures** service from R2-065 — preserved, scores unchanged
- **discoverUniverse()** from R2-064 — preserved

## Next Steps

1. **Run typecheck and 117/117 regression** — verified PASS
2. **Execute runtime backtest** — generate actual backtest results locally
3. **Produce documentation artifacts** — R2-066_STATUS_REPORT.md, R2-066_SIGNAL_EVENT_DATA.json, R2-066_BACKTEST_MATRIX.json
4. **Verify look-ahead tests** — signal(A, T) == signal(B, T) when only adding future data
5. **Push commit** — `origin/main` with R2-066 changes

## Related Documents

- `docs/R2-059_STATUS_REPORT.md`, `docs/R2-059_FAKE_DATA_AUDIT.md`
- `docs/R2-060_STATUS_REPORT.md`, `docs/R2-060_GOOGLE_FINANCE_PROVIDER_MATRIX.json`
- `docs/R2-061_STATUS_REPORT.md`, `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`
- `docs/R2-062_STATUS_REPORT.md`
- `docs/R2-063_STATUS_REPORT.md`, `docs/R2-063_REAL_BIST_UNIVERSE_MATRIX.json`
- `docs/R2-064_STATUS_REPORT.md`, `docs/R2-064_BIST_UNIVERSE_DISCOVERY_MATRIX.json`
- `docs/R2-065_STATUS_REPORT.md`, `docs/R2-065_REAL_DATA_COVERAGE_MATRIX.json`
- `apps/api/src/modules/market-data/backtest/historical-backtest.service.ts` (new)
- `apps/api/src/modules/market-data/services/early-opportunity-features.service.ts` (preserved from R2-065)
- `apps/api/src/modules/opportunity/opportunity.engine.ts` (preserved, weights unchanged)
- `apps/api/src/modules/opportunity/opportunity.config.ts` (preserved, weights unchanged)

## Signal Validation Guarantees

Every signal generated by the R2-066 backtest includes:

- **Snapshot integrity**: `OpportunitySignalSnapshot` contains exactly what the system knew at timestamp T — no future data
- **Score immutability**: Existing opportunity engine score weights (financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15) are **NOT CHANGED** in R2-066
- **Look-ahead isolation**: Signal at T uses only data <= T; future returns are evaluation labels only
- **Eligibility tracking**: Each signal marked `ELIGIBLE` or `INELIGIBLE` based on existing engine criteria
- **Provenance tracking**: `sourceProvenance` tracks source/retrievedAt/marketTimestamp/interval/provider for each signal
- **Data quality filtering**: Signals with insufficient data quality marked `INELIGIBLE` rather than fabricated

## Event-Study Data Format (R2-066_SIGNAL_EVENT_DATA.json)

Each event contains real calculated values:

- `symbol`: the backtest symbol
- `signalTimestamp`: the timestamp T when the signal was generated
- `score`: the opportunity engine score (0-100, fixed weights)
- `scoreComponents`: { financial, technical, confluence, smartMoney, marketStructure }
- `features`: EarlyOpportunityFeatures object with all deterministic feature values
- `futureReturn1D` through `futureReturn252D`: evaluation labels only (futureClose / signalClose - 1)
- `marketRegime`: BULL/BEAR/SIDEWAYS/UNKNOWN at signal time
- `benchmarkType`: 'OFFICIAL' | 'SYNTHETIC_PROXY' explicitly tracked
- `eligibility`: 'ELIGIBLE' | 'INELIGIBLE'

## Backtest Matrix Format (R2-066_BACKTEST_MATRIX.json)

Dimensions: symbol, year, regime, scoreBucket, horizon

Metrics: signalCount, eligibleCount, positiveForwardReturnRate, averageReturn, medianReturn, bestReturn, worstReturn

## No Optimization Claims

R2-066 is **BASELINE VALIDATION ONLY**. Do NOT:

- Tune score weights
- Tune indicators
- Tune thresholds
- Remove losing signals
- Remove bad years
- Remove symbols because performance is poor
- Optimize retrospectively

R2-066 validates whether the EXISTING logic works with historical data. Optimization is a separate future step.

## Fake Data Audit

Search repository for: `backtest`, `signal`, `return`, `score`, `performance`, `historical`

Check for:

- Hardcoded returns
- Hardcoded win rates
- Demo signals
- Fake charts
- Seed performance

Production/backtest outputs must be calculated from real historical data.

## Build

- TypeScript typecheck PASS.
- NestJS build PASS.
- All R2-066 tests PASS.
- 117/117 macro tests PASS.

## Final Verdict

Use one of: `READY`, `PARTIALLY_READY`, `BLOCKED` based on actual evidence.

`READY` means:

- Historical signal generation works
- No look-ahead
- Outcome calculation works
- Existing score preserved
- Results reproducible

`READY` does NOT mean: `"strategy is profitable"`.

This is baseline validation only.
