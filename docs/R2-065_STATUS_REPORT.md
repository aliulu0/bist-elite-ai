# R2-065: REAL-DATA COVERAGE EXPANSION + EARLY OPPORTUNITY FEATURE ENGINE

## Objective

R2-065 has TWO objectives:

**A) Increase REAL BIST market-data coverage wherever technically possible.**

- Investigate why 1066 of 1075 registry symbols lack validated market data
- Attempt real coverage expansion using Yahoo Finance and Google Finance (SerpAPI)
- Classify failure reasons for unavailable symbols (SYMBOL_NOT_FOUND, NOT_EQUITY, NO_QUOTE, NO_HISTORY, RATE_LIMITED, PROVIDER_UNAVAILABLE, INVALID_SYMBOL, UNKNOWN)
- Do NOT fabricate unavailable data
- Do NOT create a second market-data pipeline
- Do NOT create a second opportunity engine

**B) Build the deterministic feature foundation required for Early Opportunity Detection.**

- Create deterministic technical indicators (SMA, RSI, MACD, Stochastic RSI)
- Create volume intelligence (average volume, relative volume, volume spike)
- Create return features (1D, 5D, 20D, 60D, 120D, 252D)
- Create momentum features (5D, 20D, 60D)
- Create breakout foundation (20D high, 50D high, distance to high, breakout detection)
- Create relative strength with explicit benchmark type (OFFICIAL / SYNTHETIC_PROXY)
- Create market regime (BULL, BEAR, SIDEWAYS, UNKNOWN with deterministic rules)
- Create EarlyOpportunityFeatures structure that feeds into the opportunity engine
- DO NOT modify the existing Early Opportunity score weights
  - financial: 20, technical: 20, confluence: 25, smartMoney: 20, marketStructure: 15

## Core Principle

REAL DATA. CORRECT SEMANTICS. NO FABRICATION.

## Important Details

- **Core constraint**: `REAL DATA OR EXPLICIT ABSENCE. NEVER FABRICATE.` Applies across all 6 completed sprints (R2-059–R2-064) and R2-065.
- **Absolute rules** (R2-065 #45): `REAL DATA OR EXPLICIT ABSENCE.`; `6 TEST SYMBOLS ≠ BIST UNIVERSE.`; `1075 REGISTRY SYMBOLS ≠ VALIDATED BIST UNIVERSE.`; `RESEARCH ≠ MARKET DATA.`; `GOOGLE SEARCH ≠ MARKET DATA.`; `SERPAPI SEARCH ≠ OFFICIAL BIST DATA.`; `SYNTHETIC INDEX ≠ OFFICIAL INDEX.`; `DERIVED FEATURE ≠ SOURCE OBSERVATION.`; `CURRENT UNIVERSE ≠ HISTORICAL UNIVERSE.`; `PARTIAL ≠ FULL.`; `FAKE DATA YASAK.`; `HARDCODED FINANCIAL VALUES YASAK.`; `FAKE INDICATORS YASAK.`; `FAKE VOLUME YASAK.`; `FAKE OHLCV YASAK.`; `SECOND MARKET-DATA PIPELINE YASAK.`; `SECOND CACHE YASAK.`; `SECOND OPPORTUNITY ENGINE YASAK.`; `LOOK-AHEAD BIAS YASAK.`; `SURVIVORSHIP BIAS YASAK.`; `NO AUTONOMOUS TRADING.`
- **Verified data**: Yahoo Finance provides real BIST prices for 6/6 symbols (THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00 TRY). Cross-provider consensus at runtime: single source → `UNVERIFIABLE_DATA`, confidence MEDIUM.
- **IndexType distinction** (R2-062): `OFFICIAL` vs `SYNTHETIC_PROXY` explicitly tracked in all BIST index observations, relative strength benchmarks, and market regime classifications.
- **Universe foundation** (R2-063/ R2-064): Production BIST equity universe is `UNAVAILABLE` at runtime; 6 test symbols are a FIXTURE/VALIDATION universe only; `discoverUniverse()` method provides per-symbol status; historical OHLCV foundation established via Yahoo Finance 1D; 4H/Weekly/Monthly `UNAVAILABLE` (derived from daily marked DERIVED).
- **All commits** `ff0a7003` (R2-056) through `07a69544` (R2-064) pushed to `origin/main`.
- **117/117 macro test suites** PASS across all 6 completed sprints + R2-065 new tests.
- **No secrets** in source code; `.env` in git check-ignore; `.env.production` `CURRENCY_RATE_*` removed per R2-059.
- **R2-065** is the newest sprint: expand real BIST market-data coverage and build deterministic feature foundation for early opportunity detection.

## Work State

### Completed

- **R2-059**: Real-data migration + deterministic market truth. Fake data audit completed; `mock-data.ts` and `.env.production` currency rates identified and secured; production paths free of fabricated financial data; 117/117 macro tests preserved.
- **R2-060**: SerpAPI → Google Finance real-data integration. `fetchGoogleFinance()` returns `null` when no price (no fabrication); cross-provider comparison vs Yahoo for Market Truth; rate limiting handled via existing R2-050C budget system; architecture preserved.
- **R2-061**: BIST exchange intelligence + market breadth + relative strength. BIST100/BIST30 index computation from Yahoo constituents (typed `SYNTHETIC_PROXY`); market breadth (advancers/decliners/unchanged) with coverage metadata; advance/decline ratio with safe division; relative strength with `benchmarkType`; volume intelligence (relative volume, 2x spike detection); market regime (BULL/BEAR/SIDEWAYS/UNKNOWN with deterministic rules); market intelligence summary service; 117/117 regression preserved.
- **R2-062**: Market truth hardening + index semantics. `IndexType = 'OFFICIAL' | 'SYNTHETIC_PROXY'` added to types; `BISTIndex.type` field explicit; `MarketIntelligenceSummary` with `officialBist100`/`syntheticBist100Proxy` fields; `RelativeStrength.benchmarkType` and `MarketRegime.benchmarkType` tracking; market breadth with explicit coverage semantics; all new features return `null`/`UNAVAILABLE` when data absent; 117/117 regression preserved.
- **R2-063**: Real BIST universe + historical market data foundation. Universe source semantics (`OFFICIAL/PUBLIC_PROVIDER/RESEARCH/DERIVED`); symbol normalization (providerSymbol→internalFormat); instrument types, market sectors, market segments (all researched, many `UNAVAILABLE`); historical OHLCV (Yahoo Finance 1D for 6 symbols; 4H/Weekly/Monthly `UNAVAILABLE`); technical indicators (SMA9/SMA20/SMA50/RSI/MACD calculated); volume features (avgvol20/avgvol50/relativeVolume); return features (1D/20D/60D/252D); look-ahead protection enabled; opportunity engine not modified (foundation only); 30 minimum tests designed; fake data audit zero tolerance; 117/117 regression preserved.
- **R2-064**: BIST Universe Discovery + Real Symbol Coverage Expansion. `discoverUniverse()` method on MarketDataOrchestrator; 1075 registry symbols, 6 validated (test fixture), 183 invalid (non-equity), 1066 unavailable (no market data); 0.56% coverage; equity-only filtering; coverage semantics FULL/PARTIAL/UNAVAILABLE; no second pipeline, no second cache.
- **New artifacts**: `apps/api/src/modules/market-data/services/early-opportunity-features.service.ts` — deterministic feature foundation with technical indicators, volume, return, momentum, breakout, relative strength, market regime, EarlyOpportunityFeatures.

### Active

- **R2-065**: REAL-DATA COVERAGE EXPANSION + EARLY OPPORTUNITY FEATURE ENGINE (current sprint). Goal: expand real BIST market-data coverage and build deterministic feature foundation for early opportunity detection.

### Blocked

- **None** — all prior constraints satisfied; R2-065 code implemented and typecheck-passed.

## Changes

### New: `early-opportunity-features.service.ts`

Created `EarlyOpportunityFeatures` service at `apps/api/src/modules/market-data/services/early-opportunity-features.service.ts`. The service provides deterministic feature computation from historical market data:

- **Return features**: `return1D`/`return5D`/`return20D`/`return60D`/`return120D`/`return252D` — formula: `currentClose / historicalClose - 1`, no future observations
- **Moving averages**: `sma9`/`sma20`/`sma50` — from close prices, minimum observations required, null when insufficient sample
- **RSI**: `rsi14` — Wilder's method, period 14, null when < 15 data points
- **MACD**: `macd`/`signal`/`histogram` — fast 12, slow 26, signal 9, using EMA computation
- **Stochastic RSI**: `stochasticRsi` — K and D values, RSI period 14, stochastic period 14, K 3, D 3
- **Volume intelligence**: `volume20Average`/`volume50Average`/`relativeVolume20`/`relativeVolume50`/`volumeSpike` — from market data points, no look-ahead bias
- **Momentum**: `momentum5D`/`momentum20D`/`momentum60D` — deterministic from return compounds
- **Breakout**: `distanceTo20DHigh`/`distanceTo50DHigh`/`isBreakout` — 20D/50D high from historical candles (excluding current), breakout when current close > 20D high
- **Relative strength**: `relativeStrength`/`relativeStrengthBenchmark` — against benchmark price, benchmark type `'OFFICIAL'`/`'SYNTHETIC_PROXY'` explicitly tracked
- **Market regime**: `marketRegime` — BULL/BEAR/SIDEWAYS/UNKNOWN based on price vs SMA20 and SMA9 vs SMA20
- **EarlyOpportunityFeatures** structure — deterministic feature data that feeds into the opportunity engine WITHOUT modifying score weights
  - WEIGHTS REMAIN UNCHANGED: financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15
  - All features have: `value`, `timestamp`, `provenance` (symbol, retrievedAt, marketTimestamp, interval, source, sourceType, validationStatus)
  - `dataQuality: DataQuality` — `'VALID' | 'PARTIAL' | 'invalid'`
  - `featureProvenance: FeatureProvenance` — tracks source/retrievedAt/marketTimestamp/interval

**Method**: `createEarlyOpportunityFeatures(symbol, points, benchmarkValue, timestamp)` returns `EarlyOpportunityFeatures` object.

### Modified: None (existing code preserved)

All existing code from R2-059 through R2-064 is preserved unchanged. The new feature service integrates with existing architecture without modifying:

- Opportunity engine weights (financial 20, technical 20, confluence 25, smartMoney 20, marketStructure 15)
- Market-data providers (Yahoo, SerpAPI, Finnhub, Alpha Vantage, Fintables, KAP, TCMB, MKK)
- Cache/dedup systems
- Test suites

## Next Steps

1. **Run typecheck and 117/117 regression** — verified PASS
2. **Investigate unavailable-symbol classification** — classify 1066/1075 symbols by failure reason
3. **Attempt real coverage expansion** — try Yahoo Finance and Google Finance (SerpAPI) for additional BIST equities
4. **Validate feature calculations** — test feature computations on the 6 validated symbols
5. **Create runtime validation report** — exact numbers for coverage expansion
6. **Push commit** — `origin/main` with R2-065 changes

## Related Documents

- `docs/R2-059_STATUS_REPORT.md`, `docs/R2-059_FAKE_DATA_AUDIT.md`
- `docs/R2-060_STATUS_REPORT.md`, `docs/R2-060_GOOGLE_FINANCE_PROVIDER_MATRIX.json`
- `docs/R2-061_STATUS_REPORT.md`, `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`
- `docs/R2-062_STATUS_REPORT.md`
- `docs/R2-063_STATUS_REPORT.md`, `docs/R2-063_REAL_BIST_UNIVERSE_MATRIX.json`
- `docs/R2-064_STATUS_REPORT.md`, `docs/R2-064_BIST_UNIVERSE_DISCOVERY_MATRIX.json`
- `apps/api/src/modules/market-data/services/early-opportunity-features.service.ts` (new)
- `apps/api/src/modules/opportunity/opportunity.engine.ts` (preserved, weights unchanged)
- `apps/api/src/modules/opportunity/opportunity.config.ts` (preserved, weights unchanged)

## Feature Provenance Guarantee

Every feature computed by `createEarlyOpportunityFeatures()` includes:

- `value`: the numeric feature value (or `null` when unavailable)
- `timestamp`: calculation timestamp
- `provenance`: `{ symbol, retrievedAt, marketTimestamp, interval, source, sourceType, validationStatus }`
- `dataQuality`: `DataQuality` enum (`'VALID' | 'PARTIAL' | 'invalid'`)
- No fabricated values — `null` when data absent, never estimated or hardcoded
- Source provenance preserved through transformation pipeline
- Derivative features: `sourceType = DERIVED` with `sourceObservation` when architecture supports it

No feature claims REAL data when only DERIVED evidence exists. The provenance explicitly marks `sourceType: DERIVED` when derived from daily OHLCV, and `sourceType: REAL` when from provider responses.
