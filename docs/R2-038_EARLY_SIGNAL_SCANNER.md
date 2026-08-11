# R2-038 Early Signal Scanner

## Overview

This document describes the Early Signal Scanner layer (R2-038) for the BIST ELITE AI system. The layer detects deterministic EARLY / CONFIRMED signals that enrich the existing **Early Opportunity Intelligence** and **Multi-Timeframe Opportunity** systems. It is **not** another scoring system — the Early Opportunity Score remains the primary score; signals are evidence and enrichment.

The scanner reuses every existing production engine (Prediction, Smart Money, Catalyst, Multi-Timeframe, Fundamental Validation, Financial Data Quality) and performs **one fetch per engine per ticker** with 5-minute cache reuse. No duplicated calculations, no duplicated provider requests, no randomness, no GPT-generated scoring.

## Architecture

### Components

1. **EarlySignalScannerEngine** (`apps/api/src/modules/ai-early-opportunity/signals/early-signal-scanner.engine.ts`)
   - Pure, deterministic engine: takes `EarlySignalScannerInput` → returns `EarlySignalScannerResult`.
   - Six detection categories: PRICE_VOLUME, SMART_MONEY, FUNDAMENTAL, CATALYST, MULTI_TIMEFRAME, MARKET_STRUCTURE.
   - Signal strength 0-100 mapped to Weak / Medium / Strong / Very Strong via `SIGNAL_STRENGTH_META`.
   - Every signal classified EARLY or CONFIRMED; priority HIGH / MEDIUM / LOW.
   - Applies a data-quality factor + strength cap based on `financialDataQuality.status`.

2. **EarlySignalScannerService** (`apps/api/src/modules/ai-early-opportunity/signals/early-signal-scanner.service.ts`)
   - Orchestrates `PredictionService`, `SmartMoneyService`, `CatalystService`, `MultiTimeframeOpportunityService`, `MarketDataOrchestrator`, `SymbolRegistryService`, `FundamentalIntegrationService`, `FinancialDataQualityService` — all optional-tolerant with local fallbacks.
   - `scan(ticker, context)` reuses supplied `EarlySignalScanContext` values when provided (no re-fetch), otherwise fetches each engine exactly once via `Promise.all`.
   - 5-minute TTL caching through the existing `CacheService` (`earlySignals` namespace) — repeated calls hit cache.
   - `scanTop(limit, filters)` scans active symbols concurrently (12 workers), filters, ranks by convergence, slices to limit.
   - Graceful degradation: any engine failure or missing provider returns `null` for that source; if all engines return nothing the scan returns `null`.

3. **SignalsController** (`apps/api/src/modules/ai-early-opportunity/signals/signals.controller.ts`)
   - `GET /signals/top` — top early signals across all BIST symbols ranked by convergence.
   - `GET /signals/:ticker` — deterministic scan for a single ticker.
   - `GET /signals/:ticker/explain` — deterministic Turkish explanation.

4. **Types & DTOs** (`signals/early-signal.types.ts`, `signals/signals.dto.ts`)
   - `EarlySignal` — id, ticker, category, type, phase, strength, strengthLabel, priority, description, sourceFields, detectedAt.
   - `SignalConvergenceSummary` — convergenceScore, totalSignals, strongSignalCount, earlyCount, confirmedCount, categoryCoverage, avgStrength, confirmedShare, strongestSignals.

### Data Flow

```
EarlySignalScannerService.scan(ticker)
    ├── symbolRegistry.getSymbol() → company + sector
    ├── CacheService.get('earlySignals', 'early-signals:<TICKER>') → hit returns immediately
    ├── Promise.all (one fetch per engine, context overrides win):
    │    ├── predictionService.getPrediction()   (or context.prediction)
    │    ├── smartMoneyService.getSmartMoney()   (or context.smartMoney)
    │    ├── catalystService.getCatalyst()       (or context.catalyst)
    │    ├── multiTimeframeService.analyze()     (or context.multiTimeframe)
    │    ├── fetchFundamentals()                 (or context.fundamentals)
    │    └── assessDataQuality()                 (or context.financialDataQuality)
    └── EarlySignalScannerEngine.scan(input) → EarlySignalScannerResult
         └── CacheService.set(...) for 5 minutes
```

## Implemented Signals

### PRICE_VOLUME (Priority 1) — reuses SmartMoneyEngine + PredictionEngine
| Signal | Phase | Source |
|---|---|---|
| `volume_spike` | EARLY / CONFIRMED (with breakout volume) | smartMoney.volumeSpike |
| `relative_volume` | EARLY / CONFIRMED | smartMoney.relativeVolume |
| `breakout` | CONFIRMED | smartMoney.breakoutVolume |
| `breakout_confirmation` | CONFIRMED | smartMoney.signals.volume_confirmation |
| `price_compression` | EARLY | smartMoney.signals.compression_breakout |
| `volatility_compression` | EARLY | prediction.expectedVolatility + trendStrength |
| `accumulation_day` | EARLY | smartMoney.accumulationDays |
| `distribution_day` | EARLY | smartMoney.distributionDays |
| `price_volume_divergence` | EARLY | prediction.trendDirection vs smartMoney.moneyFlow |
| `trend_transition` | EARLY | smartMoney.signals.trend_confirmation |
| `momentum_acceleration` | EARLY / CONFIRMED | prediction.momentum + confidence |

### SMART_MONEY (Priority 2) — composite signals, no independent recalculation
| Signal | Phase | Source |
|---|---|---|
| `accumulation` | EARLY | smartMoney.accumulationScore ≥ 55 |
| `distribution` | EARLY | smartMoney.distributionScore ≥ 55 |
| `accumulation_breakout` | CONFIRMED | accumulation + breakoutVolume |
| `accumulation_compression` | EARLY | accumulation + compression_breakout |
| `smart_money_catalyst` | EARLY / CONFIRMED (verified) | smartMoney + catalyst ≥ 60 |
| `smart_money_fundamental` | CONFIRMED | smartMoney + fundamentals PASS |

### FUNDAMENTAL (Priority 3) — reuses FundamentalValidationService
| Signal | Phase | Source |
|---|---|---|
| `earnings_improvement` | EARLY | fundamentals.netProfitGrowth (AVAILABLE + PASS + > 0) |
| `net_profit_growth` | EARLY | fundamentals.netProfitGrowth > 0 |
| `valuation_improvement` | EARLY | pdDd or fdFavok PASS |
| `fundamental_price_divergence` | EARLY | fundamentals.score ≥ 60 while trend ≠ up |
| `fundamental_smart_money_convergence` | CONFIRMED | overallStatus PASS + accumulating |

### CATALYST (Priority 4) — reuses CatalystEngine / KAP research data
| Signal | Phase | Source |
|---|---|---|
| `material_disclosure` | EARLY / CONFIRMED (verified) | catalystScore ≥ 60 or high/critical importance |
| `contract_catalyst` | EARLY / CONFIRMED | tender_win / defense_contract / large_customer_contract / export_agreement |
| `investment_catalyst` | EARLY / CONFIRMED | new_investment / factory_opening / capacity_expansion / rnd / foreign_investment / patent |
| `partnership_catalyst` | EARLY / CONFIRMED | strategic_partnership |
| `capital_action_catalyst` | EARLY / CONFIRMED | capital_increase / share_buyback / dividend / bonus_issue |
| `regulatory_catalyst` | EARLY / CONFIRMED | government_incentive / credit_rating / index_inclusion / sector_rotation |
| `corporate_event_catalyst` | EARLY / CONFIRMED | ceo_change / board_change |

### MULTI_TIMEFRAME (Priority 5) — consumes existing MTF results, no re-calculation
| Signal | Phase | Source |
|---|---|---|
| `mtf_alignment` | EARLY / CONFIRMED (Strong+) | multiTimeframeScore ≥ 60 |
| `timeframe_convergence` | CONFIRMED | timeframeAgreement + trendAlignment ≥ 60 |
| `early_trend_transition` | EARLY | trendStage = Early |
| `short_long_alignment` | CONFIRMED | short best + long most-bullish aligned |

### MARKET_STRUCTURE (Priority 6) — derived from reused signals, no re-detection
| Signal | Phase | Source |
|---|---|---|
| `trend_change` | EARLY / CONFIRMED | prediction trend up + strong OR MTF Breakout/Growing |
| `consolidation_breakout` | CONFIRMED | compression_breakout + trend up |
| `breakdown` | CONFIRMED | distribution signal + trend down |

## Early vs Confirmed Classification

- Volume expansion without breakout → EARLY; with breakout volume → CONFIRMED.
- Smart Money accumulation → EARLY; accumulation + breakout / catalyst + fundamentals → CONFIRMED.
- Fundamental improvement → EARLY; fundamental + price confirmation (SM accumulation) → CONFIRMED.
- Verified catalyst events → CONFIRMED; unverified → EARLY.
- MTF alignment without strength → EARLY; Strong/Very Strong alignment → CONFIRMED.

Purpose: identify the transition **EARLY → CONFIRMED → OPPORTUNITY**.

## Convergence

`buildConvergence` (deterministic):

```
raw = categoryCoverage * 0.35 + avgStrength * 0.4 + confirmedShare * 0.25
convergenceScore = clamp0100(raw)
data-quality cap: DATA_ACCEPTABLE ≤ 80, DATA_WARNING ≤ 60, DATA_INSUFFICIENT ≤ 40
```

Exposed on the result: `convergenceScore`, `totalSignals`, `strongSignalCount` (strength ≥ 65), `earlyCount`, `confirmedCount`, `categoryCoverage`, `avgStrength`, `confirmedShare`, `strongestSignals` (top 5).

This is evidence for the Early Opportunity Score — it never replaces it.

## Early Opportunity Integration

`EarlyOpportunityIntelligenceResult` carries the signal enrichment fields (all populated from the scanner when available):

- `signals: EarlySignal[]`
- `signalConvergenceScore: number`
- `earlySignalCount: number`
- `confirmedSignalCount: number`
- `topSignals: EarlySignal[]`

`EarlyOpportunityIntelligenceService` attaches these via `attachSignals` after ranking. A failing/absent scanner is tolerated — results fall back to empty arrays and score 0.

## Filters

Extended `EarlyOpportunityFilters` (reuses the existing filter framework — no new filtering engine):

- `minSignalStrength` — strongest signal must meet the threshold
- `minSignalConvergence` — signalConvergenceScore must meet the threshold
- `signalCategory` — at least one signal in the category
- `signalType` — at least one signal of the type
- `earlyOnly` / `confirmedOnly` — at least one early / confirmed signal

First-pass filtering intentionally ignores signal filters (signals are attached after ranking); the second pass applies them post-enrichment.

## API

- `GET /signals/top` — query params: `limit`, `minSignalStrength`, `minSignalConvergence`, `signalCategory`, `signalType`, `earlyOnly`, `confirmedOnly`.
- `GET /signals/:ticker` — single-ticker deterministic scan.
- `GET /signals/:ticker/explain` — deterministic Turkish explanation.
- `GET /early-opportunities` — existing endpoint now accepts the signal filters above.
- `GET /early-opportunities/:ticker` — single result carries `signals`, `signalConvergenceScore`, `earlySignalCount`, `confirmedSignalCount`, `topSignals`.

## Cache

- Uses the existing `CacheService` (`earlySignals` namespace, 5-minute TTL).
- `scan()` reads cache before any engine fetch; repeated calls within TTL perform zero provider requests.
- `scanTop()` benefits from the same cache across symbols and repeated calls (verified by tests).

## Data Quality Integration

`financialDataQuality.status` affects every signal deterministically:

| Status | Strength factor | Strength cap | Convergence cap |
|---|---|---|---|
| DATA_VERIFIED | 1.0 | 100 | 100 |
| DATA_ACCEPTABLE | 0.9 | 90 | 80 |
| DATA_WARNING | 0.75 | 75 | 60 |
| DATA_INSUFFICIENT | 0.5 | 50 | 40 |

Signals based on insufficient data are explicitly capped — they never appear over-confident. `DATA_INSUFFICIENT` results never reach the top list unless explicitly requested.

## Tests

- `signals/early-signal-scanner.engine.spec.ts` — deterministic scan, smart money accumulation/breakout, distribution, volume spike (EARLY vs CONFIRMED), relative volume, breakout, compression, volatility compression, accumulation/distribution days, catalyst groups (contract / investment / capital / corporate), MTF alignment + convergence + early trend transition, market structure trend change / consolidation breakout / breakdown, fundamental divergence, composite signals, priority assignment, `strongSignalCount`, DATA_INSUFFICIENT / WARNING / ACCEPTABLE caps, convergence determinism.
- `signals/early-signal-scanner.service.spec.ts` — single-ticker scan using each engine exactly once, cache reuse (no re-fetch on second call), null when no engines provide data, engine failure tolerance, no-fundamental path, scanTop ranking + filters + cache reuse.
- `signals/signals.controller.spec.ts` — `/signals/:ticker`, `/signals/top` (limit + filter forwarding), `/signals/:ticker/explain`, null handling.
- `early-opportunity.intelligence.service.spec.ts` — signal enrichment, `minSignalConvergence` filtering, single-ticker exposure, scanner failure tolerance.
- `early-opportunity.intelligence-engine.spec.ts` — signal filters (`minSignalStrength`, `minSignalConvergence`, `signalCategory`, `signalType`, `earlyOnly`, `confirmedOnly`).

## Regression

- 26 suites / 397 tests GREEN across early-opportunity + portfolio-intelligence.
- `tsc --noEmit` clean for every touched file. The 6 remaining whole-project typecheck errors are pre-existing in untracked files (`financial-data-quality.service.ts`, `financial-data-quality.types.ts`, `early-opportunity.dto.ts`) and are not touched by this sprint.

## No-Duplication Verification

- **Market data:** `MarketDataOrchestrator` is the only fetch path; signal scan does not add a second OHLCV acquisition.
- **Prediction / Smart Money / Catalyst / MTF / Fundamentals:** each fetched exactly once per ticker via `Promise.all`, with `EarlySignalScanContext` overrides allowing callers to pass already-computed results (the Early Opportunity path does).
- **Indicators:** none recomputed — the scanner consumes existing engine outputs only.
- **Cache:** 5-minute TTL on the scan result; tests assert provider call counts stay constant across repeated scans.

## Intentionally Out of Scope

| Signal | Reason |
|---|---|
| Higher High / Higher Low / Lower High / Lower Low, Break of Structure, Support/Resistance break (raw market-structure swifts) | `MarketStructureEngine` already reports these; the scanner derives composite market-structure signals (trend change / consolidation breakout / breakdown) from reused prediction + smart-money + MTF outputs instead of duplicating swing detection. |
| Revenue growth acceleration, margin improvement | Fintables provider returns single-period statements; `netProfitPrevious`/`equityPrevious` are `null` → unavailable. Net-profit-growth and valuation signals are implemented; multi-period growth is a provider-data follow-up. |
| Sector-relative valuation signal | `sectorAverages` is never populated (no sector-average source wired) → stays UNKNOWN. |
| Real-time order-book / institutional order data | Requires infrastructure outside personal-use scope and unavailable data. |
| News pipeline duplication | Catalyst signals consume the existing KAP / Research Hub evidence — no second news pipeline. |

## Known Issues

- Pre-existing `tsc` errors in untracked `financial-rules/financial-data-quality.*` and `early-opportunity.dto.ts` (unrelated to signals).
- Revenue-growth / margin / sector-relative signals remain UNAVAILABLE until the provider exposes multi-period statements and sector averages.

## Next Recommended Sprint

Per the roadmap, the next logical personal-use step is **Phase 5 — Real-time BIST data feed integration** (incremental data updates and real-time feed), then **Phase 7 — frontend integration of the Top Early Signals view** (the `signals` API already exposes the data the dashboard needs). No new architecture is required — both consume existing engines.
