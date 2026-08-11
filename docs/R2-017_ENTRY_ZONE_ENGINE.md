# R2-017 — Entry Zone Engine

## Overview

The Entry Zone Engine is **not** prediction, forecasting, ML, or GPT. It is a **deterministic level calculator** that reuses existing production data only: historical prices, indicators (ATR / SMA / EMA / RSI / Bollinger / Relative Volume), market structure (support/resistance zones), and the already-computed Opportunity (R2-013), Elite Score (R2-015) and Tomorrow (R2-016) outputs.

For every stock it produces an actionable trade plan: an **ideal entry zone** (min/max), aggressive and conservative entries, support/resistance levels, a stop loss, three targets, a risk/reward ratio, an entry confidence (0–100), the trend direction and a 5-level entry quality. Identical inputs always produce identical outputs.

## Pipeline

```
Historical Prices (reused, cached)
   ↓
IndicatorEngine.calculateAll (ATR, SMA, EMA, RSI, Bollinger, RelativeVolume)   ← reused, not duplicated
MarketStructureEngine.analyze (Support/Resistance zones + trend)               ← reused, not duplicated
   ↓
EntryZoneEngine (deterministic level calculation)
   ↓
EntryRegistry ──► EntryController (/entry)
   ↓
ScannerService.enrichWithDecisions  ── attaches entryZone to every Scanner Result
OpportunityCenterService.sync       ── attaches entryZone to every Opportunity Center card
```

## Entry Level Logic

All levels derive from the **last close price** and **ATR** (missing ATR falls back to `2%` of price).

```
Conservative Entry = max(support1, price − 1.0 × ATR)
Aggressive Entry   = price + 0.25 × ATR
Ideal Entry Zone   = [min(cons, aggr), max(cons, aggr)]
Stop Loss          = support1 − 0.6 × ATR
Target 1           = resistance1
Target 2           = target1 + 1.5 × ATR
Target 3           = target2 + 1.5 × ATR
Risk/Ödül (RR)     = (target1 − refEntry) / (refEntry − stopLoss)   → label "1 : 3.4"
```

Support/Resistance are picked from `MarketStructureEngine` zones nearest below/above price (fallback to `price ∓ 2×ATR` / `∓ 4×ATR` when structure zones are missing).

## Confidence (0–100)

Deterministic additive scoring, starts at 40:

| Signal | Δ |
|---|---|
| Trend uptrend / sideways / downtrend | +20 / +5 / −15 |
| Price above SMA20 / SMA50 / SMA200 | +6 / +6 / +8 |
| EMA20 > EMA50 | +5 |
| RSI in 40–65 / > 75 / < 30 | +6 / −8 / −3 |
| RelativeVolume ≥ 1.5 / ≥ 1.0 | +5 / +3 |
| Price within 1.5×ATR of support1 / beyond 3×ATR | +8 / −5 |
| Avg(aiScore, decisionScore, opportunityScore, eliteDaily, tomorrowScore) × 0.08 | ≤ +10 |
| risk score × 0.04 | ≤ +4 |
| RR < 1.5 | −5 |

Clamped to 0–100.

## Entry Quality (5 levels)

| Level | Label | Stars | Min Confidence |
|---|---|---|---|
| `PERFECT` | Mükemmel | ★★★★★ | 85 |
| `VERY_GOOD` | Çok İyi | ★★★★☆ | 70 |
| `GOOD` | İyi | ★★★☆☆ | 55 |
| `AVERAGE` | Orta | ★★☆☆☆ | 40 |
| `WEAK` | Zayıf | ★☆☆☆☆ | 0 |

Trend direction is `UPTREND` / `DOWNTREND` / `SIDEWAYS` (from structure trend, falling back to SMA20 vs SMA50).

## API

| Method | Route | Description |
|---|---|---|
| GET | `/entry/:ticker` | Entry zone for one stock (404 with Turkish message if uncomputable) |
| GET | `/entry/top?limit=10` | Strongest entry zones, confidence-ranked (opportunity universe, else first 40 active symbols) |
| GET | `/entry/batch` | All currently cached entry zones |
| POST | `/entry/calculate` | Evaluate a batch of `DecisionInputDto` items through the engine |

Result payload: Ticker, Company, Price, IdealEntryZone (min/max), AggressiveEntry, ConservativeEntry, Support1/2, Resistance1/2, StopLoss, Target1/2/3, RiskRewardRatio, RiskRewardLabel (`1 : 3.4`), EntryConfidence, TrendDirection, EntryQuality (level/label/stars), Reasons[], Warnings[], EvaluatedAt.

## Mandatory Integrations

- **Scanner results**: `EliteScannerResult.entryZone` + `ScannerResultDto.entryZone` carry the full `EntryZoneResult`; `ScannerService.enrichWithDecisions` is now async and computes it per result.
- **Opportunity Center cards**: `OpportunityCenterService` injects `EntryService`; `toOpportunityCenterCard` now takes the full `EntryZoneResult` and exposes zone / stop / targets / RR / quality in `entryArea` (the old `OpportunityEntryArea` interface was removed).

## File Map

```
apps/api/src/modules/entry/
├── entry-zone.types.ts     EntryZoneInput/Result/Context, quality levels, version
├── entry-zone.config.ts    Quality thresholds, ATR factors, limits (260 bars, 1d)
├── entry-zone.engine.ts    EntryZoneEngine (pure deterministic level calculator)
├── entry.registry.ts       EntryRegistry (Map + confidence/RR ranking)
├── entry.service.ts        computeForTicker, getByTicker, top, evaluateBatch, cache
├── entry.dto.ts            Swagger DTOs (result, top/batch/calculate requests)
├── entry.controller.ts     /entry routes
├── entry.module.ts         imports MarketData + Indicator + MarketStructure modules
├── index.ts
└── entry-zone.spec.ts      22 tests
```

Registered in `AppModule` as `AiEntryModule` (collision-safe naming per R2-013/015/016 precedent).

## Reuse (zero duplicated provider requests / zero duplicated indicator calculations)

- Historical prices: `MarketDataService.fetchData` via `MarketDataCacheService.getOrSet` (same cache as the rest of the system)
- Indicators: `IndicatorEngine.calculateAll` only — no indicator is computed inside the entry module
- Market structure: `MarketStructureEngine.analyze` only — support/resistance/trend come from here
- Symbols: `SymbolRegistryService`
- Opportunity (R2-013), Elite Score (R2-015), Tomorrow (R2-016): read from their registries to enrich `EntryZoneContext`

## Out of Scope (not implemented)

Prediction, ML, GPT, price/target forecasting, portfolio, backtesting, scheduler, notifications, UI redesign.

## Verification

- Build: `pnpm --filter @bist-elite/api build` — GREEN
- Entry suite: `jest entry` — 22/22 GREEN
- Related suites (scanner, opportunity-center, tomorrow, ai-elite-score, decision, ai-opportunity): 347/347 GREEN
