# BIST ELITE AI — SIGNAL SCANNER AUDIT

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## REQUIREMENT: USER-PROVIDED SIGNAL MODELS

The user provided a reference UI with **25 technical signal models** that are official BIST ELITE AI requirements.

---

## SCANNER ARCHITECTURE

**Backend:** `apps/api/src/modules/scanner/` — `ScannerEngine`, `FilterEngine`, `Ranker`, `SortEngine`, `Categorizer`, `Grouper`, `DuplicateMerger`, `HistoryTracker`, `WatchlistManager`, `ScannerMetricsCollector`

**Frontend:** `apps/web/src/pages/scanner.tsx` + `apps/web/src/components/scanner/` + `apps/web/src/stores/scanner-store.ts`

**API:** `GET /scanner`, `POST /scanner/scan`, `GET /scanner/presets`, `GET /scanner/:id`

**Input:** `OpportunityResult[]` from `opportunity-detection` module

**Output:** `ScannerResult[]` with score, category, recommendation, reasons

---

## SIGNAL-BY-SIGNAL AUDIT

| # | Signal Name (TR) | Signal Name (EN) | Implemented? | Formula/Logic | Indicator | Engine | Scanner | API | UI | Tests | Backtest | Notes |
|---|------------------|------------------|--------------|---------------|-----------|--------|---------|-----|----|-------|----------|-------|
| 1 | **Özel Filtre** | Custom Filter | ✅ | User-defined range filters | N/A | FilterEngine | ✅ | ✅ | ✅ | ✅ | ❌ | Fully configurable in UI |
| 2 | **10/50 Crossover** | MA 10/50 Cross | ❌ | SMA(10) > SMA(50) | SMA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 3 | **Golden Cross** | Golden Cross | ❌ | SMA(50) > SMA(200) | SMA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 4 | **52H Breakout** | 52-Week High Breakout | ❌ | Close > High(52w) | Price/High | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 5 | **Akıllı Para** | Smart Money | ✅ | Volume/OBV patterns | Volume, OBV | SmartMoneyEngine | ✅ | ✅ | ✅ | ✅ | ⚠️ | Score in OpportunityResult |
| 6 | **Tavan Tarama** | Ceiling Scan | ❌ | Near resistance | Support/Resistance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 7 | **Ucuz Kalmış** | Oversold/Value | ❌ | Low valuation metrics | P/E, P/B, EV/EBITDA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 8 | **Hacimlenen Dip** | Volume Bottom | ❌ | High volume at low | Volume | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 9 | **Momentum Bombası** | Momentum Explosion | ✅ | MOMENTUM_BREAKOUT type | Momentum | OpportunityDetection | ✅ | ✅ | ✅ | ✅ | ❌ | OpportunityType: MOMENTUM_BREAKOUT |
| 10 | **Destek Kalkanı** | Support Shield | ❌ | Bounce at support | Support/Resistance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 11 | **Bollinger Sıkışma** | Bollinger Squeeze | ❌ | Band width < threshold | Bollinger Bands | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 12 | **Stoch RSI** | Stochastic RSI | ❌ | StochRSI < 20 or > 80 | StochRSI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 13 | **MACD Kesişimi** | MACD Crossover | ❌ | MACD line > Signal | MACD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 14 | **Doji** | Doji Pattern | ❌ | Open ≈ Close | Candlestick | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 15 | **Hammer** | Hammer Pattern | ❌ | Long lower wick | Candlestick | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 16 | **Supertrend** | Supertrend | ❌ | Supertrend flip | Supertrend | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 17 | **EMA Crossover** | EMA Cross | ❌ | EMA(short) > EMA(long) | EMA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 18 | **ADX Güçlü Trend** | ADX Strong Trend | ❌ | ADX > 25 | ADX | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 19 | **Morning Star** | Morning Star | ❌ | 3-candle pattern | Candlestick | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 20 | **Engulfing** | Engulfing Pattern | ❌ | Body engulfs prev | Candlestick | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 21 | **Değer + Momentum** | Value + Momentum | ✅ | MULTI_FACTOR type | Composite | OpportunityDetection | ✅ | ✅ | ✅ | ✅ | ❌ | OpportunityType: MULTI_FACTOR |
| 22 | **Ichimoku Bulutu** | Ichimoku Cloud | ❌ | Price vs Cloud | Ichimoku | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 23 | **Qullamaggie Kırılımı** | Qullamaggie Breakout | ❌ | Specific breakout | Price/Volume | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 24 | **Minervini Trend** | Minervini Trend | ❌ | Minervini criteria | Multi-factor | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 25 | **Bulkowski Formasyon** | Bulkowski Patterns | ❌ | Chart patterns | Pattern Recognition | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 26 | **RSI Trend Kırılımı** | RSI Trend Break | ❌ | RSI trendline break | RSI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not in OpportunityType |
| 27 | **Pozitif Uyumsuzluk** | Positive Divergence | ❌ | Price down, RSI up | RSI Divergence | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |
| 28 | **Halka Arz** | IPO Tracking | ❌ | New listings | Corporate Actions | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Not implemented |

---

## IMPLEMENTED OPPORTUNITY TYPES (from `opportunity-detection.types.ts`)

| OpportunityType | Description | Implemented |
|-----------------|-------------|-------------|
| `MOMENTUM_BREAKOUT` | Price/volume breakout | ✅ |
| `VOLUME_EXPANSION` | Unusual volume | ✅ |
| `TREND_REVERSAL` | Trend change | ✅ |
| `FUNDAMENTAL_IMPROVEMENT` | Financials improving | ✅ |
| `UNDERVALUATION` | Low valuation | ✅ |
| `SECTOR_ROTATION` | Sector momentum | ✅ |
| `INSTITUTIONAL_ACCUMULATION` | Smart money buying | ✅ |
| `EARNINGS_OPPORTUNITY` | Earnings catalyst | ✅ |
| `MULTI_FACTOR` | Combined signals | ✅ |
| `CUSTOM` | User-defined | ✅ |

**Total: 10 Opportunity Types** — These are the **only** signal categories the scanner recognizes.

---

## GAP ANALYSIS: REQUIRED vs IMPLEMENTED

| Required Signal | Maps To OpportunityType | Status |
|-----------------|------------------------|--------|
| 10/50 Crossover | ❌ None | **MISSING** |
| Golden Cross | ❌ None | **MISSING** |
| 52H Breakout | ❌ None | **MISSING** |
| Smart Money | `INSTITUTIONAL_ACCUMULATION` | ✅ **MAPPED** |
| Tavan Tarama | ❌ None | **MISSING** |
| Ucuz Kalmış | `UNDERVALUATION` | ✅ **PARTIAL** (type exists, no specific logic) |
| Hacimlenen Dip | `VOLUME_EXPANSION` | ✅ **PARTIAL** |
| Momentum Bombası | `MOMENTUM_BREAKOUT` | ✅ **MAPPED** |
| Destek Kalkanı | ❌ None | **MISSING** |
| Bollinger Sıkışma | ❌ None | **MISSING** |
| Stoch RSI | ❌ None | **MISSING** |
| MACD Kesişimi | ❌ None | **MISSING** |
| Doji | ❌ None | **MISSING** |
| Hammer | ❌ None | **MISSING** |
| Supertrend | ❌ None | **MISSING** |
| EMA Crossover | ❌ None | **MISSING** |
| ADX Güçlü Trend | ❌ None | **MISSING** |
| Morning Star | ❌ None | **MISSING** |
| Engulfing | ❌ None | **MISSING** |
| Değer + Momentum | `MULTI_FACTOR` | ✅ **MAPPED** |
| Ichimoku Bulutu | ❌ None | **MISSING** |
| Qullamaggie Kırılımı | ❌ None | **MISSING** |
| Minervini Trend | ❌ None | **MISSING** |
| Bulkowski Formasyon | ❌ None | **MISSING** |
| RSI Trend Kırılımı | ❌ None | **MISSING** |
| Pozitif Uyumsuzluk | ❌ None | **MISSING** |
| Halka Arz | ❌ None | **MISSING** |

**Score: 5/25 Fully Implemented (Smart Money, Momentum Bombası, Değer+Momentum, Hacimlenen Dip partial, Ucuz Kalmış partial)**  
**Score: 20/25 MISSING or PARTIAL**

---

## SCANNER PAGE vs DASHBOARD

**The Signal Scanner is a SEPARATE PAGE** (`/scanner`) — NOT embedded in Dashboard.

**Evidence:** 
- Route: `/scanner` in `apps/web/src/pages/scanner.tsx`
- Not imported in `apps/web/src/pages/dashboard.tsx`
- Has its own filter panel, table, detail panel
- Independent state management (`scanner-store.ts`)

**This is CORRECT** — Scanner is a distinct tool for custom scans; Dashboard is for curated Top 10.

---

## FRONTEND SCANNER FILTERS (from `scanner-store.ts`)

| Filter | Type | Maps To |
|--------|------|---------|
| Sector | Select | `metadata.sector` |
| Elite Score | Range | `eliteScore` |
| Opportunity Score | Range | `opportunityScore` |
| Financial Score | Range | `financialScore` |
| Technical Score | Range | `technicalScore` |
| Smart Money Score | Range | `smartMoneyScore` |
| PD Ratio | Range | `pdRatio` |
| PB Ratio | Range | `pbRatio` |
| FD/FAVÖK | Range | `fdFavok` |
| Net Income Growth | Range | `netIncomeGrowth` |
| Volume | Range | `volume` |
| Liquidity | Range | `liquidity` |
| Beta | Range | `beta` |
| Dividend Yield | Range | `dividendYield` |
| Market Cap | Range | `marketCap` |
| Status | Select | `status` (TOP_CANDIDATE/WATCHLIST/REJECTED) |

**Missing from UI:** No specific signal toggles (e.g., "Show Golden Cross", "Show RSI Divergence")

---

## BACKEND SCANNER CONFIGURATION

**File:** `apps/api/src/modules/scanner/scanner.config.ts`

```typescript
export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  filters: {
    minOpportunityScore: 0,
    maxOpportunityScore: 100,
    minConfidence: 0,
    maxRisk: 100,
    allowedOpportunityTypes: [], // Empty = all types
    allowedSectors: [],
    minLiquidity: 0,
    minMarketCap: 0,
    maxVolatility: 100,
    minQualityScore: 0,
    minAggregationConfidence: 0,
    minConfirmationCount: 0,
    allowedPriorityLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    allowedAgeStatuses: ['NEW', 'GROWING', 'STABLE', 'WEAKENING', 'EXPIRED'],
    allowedConfirmationLevels: ['NONE', 'SINGLE', 'DOUBLE', 'TRIPLE', 'MULTI'],
    excludeWatchlists: [],
  },
  ranking: { /* 15 weights */ },
  categoryThresholds: { hot: 85, trending: 70, emerging: 55, ... },
  groupConfig: { enabledGroups: ['SECTOR', 'OPPORTUNITY_TYPE', ...], ... },
  duplicateMerge: { timeWindowMs: 3600000, scoreThreshold: 10, ... },
  watchlists: [/* 12 predefined watchlists */],
  sortMode: 'SCORE_DESC',
  maxResults: 100,
  minScoreThreshold: 10,
  version: '1.0.0',
};
```

**No specific signal configurations** — Only generic filters on scores/types.

---

## EVIDENCE

**Backend:**
- `apps/api/src/modules/scanner/scanner.engine.ts`
- `apps/api/src/modules/scanner/services/filter-engine.service.ts`
- `apps/api/src/modules/scanner/scanner.types.ts`
- `apps/api/src/modules/opportunity-detection/opportunity-detection.types.ts`

**Frontend:**
- `apps/web/src/pages/scanner.tsx`
- `apps/web/src/components/scanner/*.tsx`
- `apps/web/src/stores/scanner-store.ts`
- `apps/web/src/lib/sdk.ts` (scanner methods)

---

## CONCLUSION

**The Signal Scanner exists as a separate page with a functional filtering/sorting engine.**

**However, 20 of 25 required signal models are MISSING:**

| Category | Count | Signals |
|----------|-------|---------|
| **Fully Implemented** | 3 | Smart Money, Momentum Bombası, Değer + Momentum |
| **Partially Mapped** | 2 | Hacimlenen Dip → VOLUME_EXPANSION, Ucuz Kalmış → UNDERVALUATION |
| **Missing** | 20 | All MA crosses, patterns, candlesticks, Bollinger, Stoch, MACD, Supertrend, Ichimoku, specialized methods |

**Root Cause:** The scanner is built on `OpportunityType` enum (10 types) which doesn't cover the 25 specific technical signals. The scanner filters/ranks opportunities but doesn't **detect** the specific patterns.

**To meet requirements:** Need to either:
1. Expand `OpportunityType` enum to include all 25 signals, or
2. Add a dedicated "Signal Detection" layer that feeds into scanner

**Current Status: PARTIALLY IMPLEMENTED** — Functional scanner framework, but missing 80% of required signal definitions.