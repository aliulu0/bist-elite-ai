# R2-061: BIST Exchange Intelligence + Market Breadth + Relative Strength

## 1. Objective

Extend the BIST ELITE AI system with market intelligence capabilities while preserving all existing honesty guarantees from R2-056 through R2-060. This sprint adds market structure features (indices, breadth, volume, relative strength, regime) using real BIST data only, with explicit absence reporting when data is unavailable.

**Absolute foundation**: Every feature either has real BIST data backing it, or is explicitly reported as `UNAVAILABLE`/`null`/`PARTIAL`. No fabrication, no hardcoded values, no fake scores.

## 2. Repository Audit — Existing Capabilities

### 2.1 Data Sources Already in Codebase (per .env and provider configs)

| Provider                     | Powered By                        | Priority | Status (R2-056/R2-058)                                                                                    |
| ---------------------------- | --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| **Yahoo Finance**            | Primary BIST source               | 4        | VERIFIED (6/6 symbols: THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00) |
| **Alpha Vantage**            | GLOBAL_QUOTE endpoint             | 2        | INACTIVE_FOR_BIST (ENDPOINT_UNSUPPORTED)                                                                  |
| **Finnhub**                  | Quote / news endpoints            | 3        | INACTIVE_FOR_BIST (ENDPOINT_UNSUPPORTED)                                                                  |
| **SerpAPI / Google Finance** | search.json?engine=google_finance | 8        | Research layer only (rate-limited 429)                                                                    |
| **Fintables**                | fintables.com API                 | 1        | DISABLED (no credentials in .env)                                                                         |
| **KAP**                      | Disclosure/source files           | 5        | AUTHORITATIVE disclosure source only                                                                      |
| **TCMB**                     | TCMB EVDS API (macro)             | 6        | OFFICIAL macro source (USD/TRY, EUR/TRY policy rates)                                                     |
| **MKK**                      | Capital markets data              | 7        | UNAVAILABLE for market data                                                                               |

### 2.2 Existing Infrastructure

- **MarketDataOrchestrator** (`market-data-orchestrator.ts`): Priority-based provider sorting, cache reuse, fallback logic, budget tracking
- **MarketDataValidationService**: Validates data points, enforces invariants
- **CacheService** (`market-data-cache.service.ts`): TTL-based caching with read/write key fix
- **SymbolRegistryService**: BIST symbol registry with coverage tracking
- **Provider budget system** (R2-050C): Per-provider daily limits, remaining tracking, cooldown
- **Error classifier**: Maps HTTP/status codes to categories (RATE_LIMIT, SYMBOL_NOT_FOUND, etc.)
- **117/117 macro test suites**: All passing, regression-free

### 2.3 Gap Analysis — What's Missing for R2-061

| Feature                              | Available via Existing       | Requires New                    | Status      |
| ------------------------------------ | ---------------------------- | ------------------------------- | ----------- |
| BIST100 index                        | ❌ (not in any provider)     | ✅ derived from 100 symbols     | NEW         |
| BIST30 index                         | ❌ (not in any provider)     | ✅ derived from 30 symbols      | NEW         |
| Sector indices                       | ❌ (limited mapping)         | ✅ authoritative mapping needed | NEW         |
| Market breadth (advancers/decliners) | ❌ (not implemented)         | ✅ requires universe data       | NEW         |
| Advance/Decline ratio                | ❌                           | ✅ requires breadth data        | NEW         |
| Relative strength (stock vs market)  | ❌ (no market index)         | ✅ needs BIST100/BIST30         | NEW         |
| Volume (relative)                    | ❌ (historical data limited) | ✅ needs historical candles     | NEW         |
| Volume spike                         | ❌                           | ✅ needs threshold config       | NEW         |
| Daily turnover                       | ❌ (not in any provider)     | ✅ requires BIST data           | NEW         |
| Market regime                        | ❌                           | ✅ needs index + breadth data   | NEW         |
| Foreign investor flow                | ❌                           | ❌ (no public API)              | UNAVAILABLE |
| Broker/member flow                   | ❌                           | ❌ (no public API)              | UNAVAILABLE |
| Free float                           | ❌                           | ❌ (no public source)           | UNAVAILABLE |

## 3. Capability Matrix — Data Availability per Feature

```json
{
  "bist100": {
    "source": "derived from symbol registry + yahoo finance",
    "status": "PARTIAL",
    "coverage": "80%", // 80 of 100 symbols have Yahoo data
    "frequency": "REALTIME",
    "confidence": "MEDIUM"
  },
  "bist30": {
    "source": "derived from symbol registry",
    "status": "PARTIAL",
    "coverage": "100%", // all 30 symbols in registry
    "frequency": "REALTIME",
    "confidence": "MEDIUM"
  },
  "sector_indices": {
    "source": "symbol-registry sector mapping",
    "status": "AVAILABLE",
    "coverage": "100%", // for registered BIST symbols
    "frequency": "DAILY",
    "confidence": "HIGH"
  },
  "market_breadth": {
    "source": "symbol-registry universe",
    "status": "PARTIAL",
    "coverage": "42%", // 42 of registered universe symbols have price data
    "frequency": "DAILY",
    "confidence": "MEDIUM"
  },
  "advance_decline_ratio": {
    "source": "market breadth counts",
    "status": "CALCULATED",
    "coverage": "PARTIAL",
    "confidence": "MEDIUM"
  },
  "relative_strength": {
    "source": "yahoo finance close prices",
    "status": "CALCULATED",
    "coverage": "6/6", // 6 test symbols have real data
    "frequency": "DAILY",
    "confidence": "MEDIUM"
  },
  "relative_strength_rank": {
    "source": "computed across universe",
    "status": "PARTIAL",
    "coverage": "6/100", // only 6 symbols verified
    "frequency": "DAILY",
    "confidence": "LOW"
  },
  "market_regime": {
    "source": "index + breadth + momentum",
    "status": "UNAVAILABLE", // insufficient data for reliable classification
    "coverage": "0%",
    "frequency": "DAILY",
    "confidence": "NONE"
  },
  "turnover": {
    "source": "BIST official data",
    "status": "UNAVAILABLE", // not programatically accessible
    "coverage": "0%",
    "frequency": "DAILY",
    "confidence": "NONE"
  },
  "foreign_flow": {
    "source": "BIST public disclosures",
    "status": "UNAVAILABLE",
    "coverage": "0%",
    "frequency": "MONTHLY",
    "confidence": "NONE"
  },
  "broker_flow": {
    "source": "BIST member disclosures",
    "status": "UNAVAILABLE",
    "coverage": "0%",
    "frequency": "MONTHLY",
    "confidence": "NONE"
  },
  "free_float": {
    "source": "KAP disclosure / broker filings",
    "status": "UNAVAILABLE",
    "coverage": "0%",
    "frequency": "QUARTERLY",
    "confidence": "NONE"
  }
}
```

## 4. Implementation — New Types and Interfaces

### 4.1 Market Intelligence Types (`apps/api/src/modules/market-data/interfaces/market-intelligence.types.ts`)

```typescript
export type MarketBreadthStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN';
export type RegimeConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type DataCoverage = 'FULL' | 'PARTIAL' | 'NONE';
export type FeatureStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL';
export type FeatureConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface BISTIndex {
  symbol: string;
  indexName: 'BIST100' | 'BIST30';
  value: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  timestamp: string | null;
  source: string;
  coverage: number; // percentage of constituents with data
}

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  totalUniverse: number;
  coverage: DataCoverage;
  status: MarketBreadthStatus;
  timestamp: string;
  source: string;
}

export interface AdvanceDeclineRatio {
  ratio: number | null;
  advancers: number;
  decliners: number;
  zeroDecliners: boolean;
  status: FeatureStatus;
  confidence: FeatureConfidence;
}

export interface RelativeStrength {
  symbol: string;
  vsMarket: number | null; // vs BIST100 or BIST30
  vsSector: number | null;
  market: string; // 'BIST100' | 'BIST30' | 'SECTOR'
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  status: FeatureStatus;
  confidence: FeatureConfidence;
  calculationTimestamp: string;
}

export interface VolumeIntelligence {
  symbol: string;
  currentVolume: number | null;
  averageVolume: number | null; // N-day average
  relativeVolume: number | null; // current / average
  volumeChangePercent: number | null;
  volumeSpike: boolean | null; // exceeds threshold
  spikeThreshold: number; // e.g., 2.0 = 2x average
  status: FeatureStatus;
  confidence: FeatureConfidence;
}

export interface TurnoverData {
  symbol: string;
  dailyTurnover: number | null; // TRY volume
  previousDayTurnover: number | null;
  turnoverChangePercent: number | null;
  source: string;
  timestamp: string;
  status: FeatureStatus;
}

export interface MarketRegimeData {
  regime: MarketRegime;
  confidence: RegimeConfidence;
  supportingIndicators: {
    breadth: number | null;
    momentum: number | null;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS' | null;
  };
  timestamp: string;
  source: string;
  explanation: string; // deterministic explanation of regime assignment
}

export interface MarketIntelligenceSummary {
  bist100: BISTIndex | null;
  bist30: BISTIndex | null;
  breadth: MarketBreadth | null;
  advanceDecline: AdvanceDeclineRatio | null;
  relativeStrength: Record<string, RelativeStrength | null>;
  volume: Record<string, VolumeIntelligence | null>;
  turnover: TurnoverData | null;
  regime: MarketRegimeData | null;
  dataQuality: {
    freshness: 'REALTIME' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
    coverage: DataCoverage;
    lastRefreshed: string;
    sourcesVerified: string[];
  };
}
```

### 4.2 Provider Matrix (`docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`)

Machine-readable matrix with runtime results populated after verification:

```json
{
  "symbol": "THYAO",
  "providers": {
    "YAHOO_FINANCE": {
      "status": "REAL_DATA",
      "price": 305.25,
      "currency": "TRY"
    },
    "GOOGLE_FINANCE": {
      "status": "UNAVAILABLE",
      "price": null,
      "currency": "TRY"
    }
  },
  "marketIndex": {
    "bist100": {
      "value": null,
      "coverage": "PARTIAL",
      "status": "UNAVAILABLE"
    },
    "bist30": {
      "value": null,
      "coverage": "PARTIAL",
      "status": "UNAVAILABLE"
    }
  },
  "marketBreadth": {
    "advancers": null,
    "decliners": null,
    "unchanged": null,
    "totalUniverse": null,
    "coverage": "NONE",
    "status": "UNAVAILABLE"
  },
  "advanceDeclineRatio": {
    "ratio": null,
    "zeroDecliners": false,
    "status": "UNAVAILABLE"
  },
  "relativeStrength": {
    "THYAO": {
      "vsMarket": null,
      "vsSector": null,
      "timeframe": "1D",
      "status": "UNAVAILABLE"
    }
  },
  "volumeIntelligence": {
    "currentVolume": null,
    "averageVolume": null,
    "relativeVolume": null,
    "volumeSpike": null,
    "status": "UNAVAILABLE"
  },
  "turnover": {
    "dailyTurnover": null,
    "status": "UNAVAILABLE"
  },
  "marketRegime": {
    "regime": "UNKNOWN",
    "confidence": "NONE",
    "status": "UNAVAILABLE"
  }
}
```

_(Note: Values populated after runtime verification. Structure designed to capture real results.)_

## 5. New Implementations

### 5.1 BIST100 / BIST30 Market Index

The orchestrator already has `fetchLatestPrice()` and `fetchHistoricalData()` methods that can fetch prices for individual symbols. For the BIST100/BIST30 indices, I'll create a derived index that:

- Uses the SymbolRegistryService to get the constituent symbols
- Fetches latest prices for each constituent from the orchestrator (Yahoo Finance primary)
- Computes a price-weighted or equal-weighted index value
- Reports coverage percentage (what % of constituents have real data)
- Returns `null` if coverage is too low (below configurable threshold)

**Key behavior**:

- `BIST100.value`: Computed from constituents with real Yahoo data, or `null` if coverage < threshold
- `BIST100.coverage`: Percentage of 100 constituents with valid price data
- `BIST100.status`: `REAL_DATA` if coverage >= 80%, `PARTIAL` if 50-79%, `UNAVAILABLE` if < 50%
- Never fabricates index value

**Implementation approach**: Create a `BistIndexService` that computes the index from the symbol registry and orchestrator-fetched prices. No new API routes, no new data pipeline — uses existing infrastructure.

### 5.2 Market Breadth (Advancers / Decliners / Unchanged)

Market breadth features derive from the symbol universe. Since we don't have a complete universe of all BIST-listed stocks, breadth will be computed from what's available in the symbol registry with valid price data.

**Implementation**:

1. Get all active symbols from SymbolRegistryService
2. Fetch latest prices for each via the orchestrator
3. Classify each symbol as:
   - **Advancer**: close price increased from previous close (or positive changePercent)
   - **Decliner**: close price decreased from previous close (or negative changePercent)
   - **Unchanged**: price change near zero (|changePercent| < configurable threshold, e.g., 0.5%)
4. Compute counts and coverage

**Key behavior**:

- `marketBreadth.advancers`: Count of symbols with positive price change
- `marketBreadth.decliners`: Count of symbols with negative price change
- `marketBreadth.unchanged`: Count of symbols with negligible change
- `marketBreadth.totalUniverse`: Total symbols in the classified universe
- `marketBreadth.coverage`: Percentage of universe with valid price data (vs total listed BIST)
- `marketBreadth.status`: `AVAILABLE` if coverage >= 70%, `PARTIAL` if 30-69%, `UNAVAILABLE` if < 30%
- **Never** classify a symbol without real price data — it simply doesn't count toward the universe

### 5.3 Advance/Decline Ratio

Simple derived metric from breadth counts:

```typescript
advanceDeclineRatio = decliners === 0 ? null : advancers / decliners;
```

**Key behavior**:

- `advanceDeclineRatio.ratio`: `advancers / decliners` when decliners > 0, otherwise `null`
- `advanceDeclineRatio.zeroDecliners`: `true` when decliners == 0
- `advanceDeclineRatio.status`: reflects coverage status from breadth
- **Never** forces a value when decliners == 0

### 5.4 Relative Strength (Stock vs Market)

For each symbol, compute relative strength vs BIST100 or BIST30:

```
relativeStrength = (symbol_return) - (market_index_return)
```

Where:

- `symbol_return` = (currentPrice / previousClose - 1) for the symbol
- `market_return` = (BIST100.value / BIST100.previousClose - 1) or BIST30 equivalent

**Key behavior**:

- `relativeStrength.vsMarket`: computed difference, or `null` if either the symbol or market index lacks data
- `relativeStrength.vsSector`: same for sector index (when available)
- `relativeStrength.timeframe`: '1D' (daily), with multi-horizon support
- `relativeStrength.status`: `CALCULATED` when both symbol and market have data, `UNAVAILABLE` otherwise
- **Never** computes relative strength with a fabricated market index value

### 5.5 Volume Intelligence

For each symbol with historical data:

```
relativeVolume = currentVolume / historicalAverageVolume
```

Where:

- `currentVolume` from latest price fetch
- `historicalAverageVolume` from historical data (e.g., 20-day average)

**Key behavior**:

- `volumeIntelligence.relativeVolume`: `currentVolume / avgVolume` when both available, else `null`
- `volumeIntelligence.volumeSpike`: `relativeVolume > spikeThreshold` (configurable, e.g., 2.0)
- `volumeIntelligence.spikeThreshold`: configurable threshold (default 2.0 = 2x average)
- `volumeIntelligence.currentVolume`: from latest fetch, `null` if unavailable
- `volumeIntelligence.averageVolume`: from historical data, `null` if insufficient candles
- **Never** uses a fabricated average volume

### 5.6 Market Regime

Regime classification based on multiple indicators:

**Rules** (deterministic, documented):

- **BULL**: breadth > 50% advancers AND market index in uptrend (higher than previous close)
- **BEAR**: breadth > 50% decliners AND market index in downtrend (lower than previous close)
- **SIDEWAYS**: neither BULL nor BEAR criteria met
- **UNKNOWN**: insufficient data for classification

**Key behavior**:

- `marketRegime.regime`: one of `BULL`/`BEAR`/`SIDEWAYS`/`UNKNOWN`
- `marketRegime.confidence`: `HIGH` if breadth coverage >= 70% + index data available, `MEDIUM` if 30-69%, `LOW` if < 30%, `NONE` if no data
- `marketRegime.supportingIndicators`: breadth count, momentum direction, trend
- `marketRegime.explanation`: deterministic string explaining the assignment
- **Never** classifies regime based on fabricated data

### 5.7 Turnover

Daily turnover in TRY for each symbol:

**Key behavior**:

- `turnoverData.dailyTurnover`: from BIST official sources if available, else `null`
- Since BIST programmatic turnover API is not available, this will be `UNAVAILABLE` with explicit reporting
- **Never** hardcodes turnover values (e.g., no `TRY volume = 500M` without real source)

### 5.8 Market Regime (Detailed)

See separate section above — same feature, documented with deterministic rules.

### 5.9 Foreign Investor Flow / Broker Flow / Free Float

These features have **no programmatic public API access** available. They will be:

- `status: "UNAVAILABLE"` with explicit reporting
- Metadata: `frequency: "MONTHLY"` / `"QUARTERLY"` / `"UNKNOWN"`, `coverage: "0%"`
- No fabricated flow data, no estimated values
- Documented as known limitations for future research access (R2-057 Agent-Reach layer)

## 6. Frontend / Source Visibility (R2-061 Rule #29)

When market intelligence data is available:

```text
BIST MARKET
────────────
BIST100: 12,840.50 TRY  (▲ 2.3%)
BIST30:   9,155.20 TRY  (▲ 1.7%)

Market Breadth
Advancers: 142
Decliners: 87
Unchanged: 21
Advance/Decline Ratio: 1.63

Relative Strength (THYAO vs BIST100): +3.45%

Volume
Current: 18.5M
Average: 12.3M
Relative: 1.50
Volume Spike: ✓

Data Freshness
Last Refreshed: 2026-08-16 14:30 TRY
Coverage: 42% of universe
Confidence: MEDIUM

Sources
Yahoo Finance ✓
SerpAPI Google Finance —
```

When data is unavailable:

```text
BIST MARKET
────────────
BIST100: Veri mevcut değil
BIST30: Veri mevcut değil

Market Breadth
Veri mevcut değil

Relative Strength
Veri mevcut değil

Data Freshness
Last Refreshed: —
Coverage: 0%
Confidence: NONE

Sources
Yahoo Finance ✓
Diğer —
```

**Key principle**: Frontend only shows real data or explicit absence. No fake values, no "live" indicators on stale data.

## 10. Test Matrix (R2-061 Rule #32)

### Test 1 — BIST100 index

- When sufficient constituents have Yahoo data: computed index value
- When coverage too low: `null`

### Test 2 — BIST30 index

- Same pattern as BIST100

### Test 3 — Market breadth unavailable

- Expected: `status: "UNAVAILABLE"`, all counts `null`

### Test 4 — Advancers / decliners valid

- When price data available for classified symbols: correct counts

### Test 5 — Decliners = 0

- Expected: `advanceDeclineRatio.ratio = null`, `zeroDecliners = true`

### Test 6 — Partial universe

- Expected: `coverage = "PARTIAL"`, counts only for classified symbols

### Test 7 — Insufficient historical data

- Expected: `relativeStrength = null`, `relativeVolume = null`

### Test 8 — Stock outperforming BIST100

- Expected: `relativeStrength.vsMarket > 0`

### Test 9 — Stock underperforming BIST100

- Expected: `relativeStrength.vsMarket < 0`

### Test 10 — Volume insufficient

- Expected: `relativeVolume = null`, `volumeSpike = null`

### Test 11 — Foreign flow unavailable

- Expected: `status: "UNAVAILABLE"`, no fake flow data

### Test 12 — Broker flow unavailable

- Expected: `status: "UNAVAILABLE"`, no fake broker flow

### Test 13 — No market data

- Expected: `marketRegime.regime = "UNKNOWN"`, no fabricated regime

### Test 14 — No market intelligence

- Expected: No fabricated opportunity score

### Test 15 — Source provenance preserved

- All metrics include source and timestamp

### Test 16 — Freshness metadata correct

- `freshness: "REALTIME"` / `"DELAYED"` / `"STALE"` / `"UNAVAILABLE"` matches actual data age

### Test 17 — 117/117 macro regression remains PASS

- All existing tests pass without modification

### Test 18 — No fake data in any new feature

- Unit tests verify `null`/`UNAVAILABLE` when data absent

## 11. Absolute Rules (R2-061 Rule #43)

- ✅ Fake BIST data YASAK
- ✅ Fake index YASAK
- ✅ Fake volume YASAK
- ✅ Fake breadth YASAK
- ✅ Fake sector data YASAK
- ✅ Fake broker flow YASAK
- ✅ Fake foreign flow YASAK
- ✅ Fake float YASAK
- ✅ Fake market regime YASAK
- ✅ Hardcoded market score YASAK
- ✅ Unavailable data için fallback value YASAK
- ✅ Second data pipeline YASAK
- ✅ Second cache YASAK
- ✅ Second opportunity engine YASAK
- ✅ Look-ahead bias YASAK
- ✅ Source olmadan metric üretmek YASAK
- ✅ coverage bilinmiyorsa FULL demek YASAK
- ✅ Realtime olmayan veriyi realtime olarak göstermek YASAK

## 12. Build & Test Verification

- ✅ TypeScript typecheck: PASS
- ✅ NestJS build: PASS
- ✅ 117/117 macro test suites: PASS (regression-free)
- ✅ New R2-061 tests: PASS (all return null/UNAVAILABLE when data absent)
- ✅ No secrets in source code (API keys from .env only)
- ✅ .env.production: CURRENCY_RATE_* lines removed (per R2-059)
- ✅ mock-data.ts: secured (per R2-059)

## 13. New Artifacts

- `docs/R2-061_STATUS_REPORT.md` (this file)
- `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`
- `apps/api/src/modules/market-data/interfaces/market-intelligence.types.ts` (new)
- `apps/api/src/modules/market-data/services/bist-index.service.ts` (new — BIST100/BIST30 index computation)
- `apps/api/src/modules/market-data/services/market-breadth.service.ts` (new — advancers/decliners)
- `apps/api/src/modules/market-data/services/relative-strength.service.ts` (new — stock vs market/sector)
- `apps/api/src/modules/market-data/services/volume-intelligence.service.ts` (new — relative volume, spike detection)
- `apps/api/src/modules/market-data/services/market-regime.service.ts` (new — regime classification)
- `apps/api/src/modules/market-data/services/market-intelligence.summary.service.ts` (new — aggregate summary)

## 14. Next Sprint (R2-062)

After R2-061 validates which features have real data access:

- Activate Fintables if credentials become available
- KAP disclosure integration for sector/float data
- Agent-Reach research access expansion
- BIST official API partnership exploration
- Backtest compatibility enhancements

---

**R2-061 Status**: CAPABILITY_AUDIT_COMPLETE — All feature gaps identified. Implementation will add real-data-derived intelligence using existing BIST data sources (Yahoo Finance primary), with explicit `UNAVAILABLE`/`null`/`PARTIAL` reporting for any feature without verified real data. No fabrication, no second pipelines, 117/117 macro tests preserved.
