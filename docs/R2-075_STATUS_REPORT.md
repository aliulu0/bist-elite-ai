# R2-075: MULTI-TIMEFRAME CONFLUENCE + ADVANCED REAL-DATA SCANNER

## Verdict: READY_FOR_REVIEW

Multi-timeframe confluence implemented without fabricating data. No second pipeline. Score weights unchanged. 1H/2H remain UNAVAILABLE.

## 1. Files Changed

### Production code:

- `apps/api/src/modules/market-data/interfaces/market-data.types.ts` — Timeframe type already extended in R2-074; confirmed 8 timeframes
- `apps/api/src/modules/market-data/providers/yahoo-finance.provider.ts` — TIMEFRAME_MAP already extended in R2-074; 1H/2H marked UNAVAILABLE
- `apps/api/src/modules/market-data/services/scanner-features.service.ts` — New functions: `determineMultiTimeframeConfluence`, `determineEarlyOpportunityClassification`, `determineScannerSignalQuality`, `buildTimeframeData`
- `apps/api/src/modules/market-scanner/market-scanner.types.ts` — New types: `TimeframeData`, `MultiTimeframeAnalysis`, `ExtendedScannerResult`, `EarlyOpportunityClassification`, `ScannerSignalQuality`, `DataStatus`
- `apps/api/src/modules/market-scanner/market-scanner.engine.ts` — New methods: `filterSymbols` with advanced filters, `applyTimeframeFilters`, `buildMultiTimeframeFilterResult`, `buildTimeframeData`; extended `ScannerFilters` with multi-timeframe filter options

### Documentation:

- `docs/R2-075_STATUS_REPORT.md` — This report
- `docs/R2-075_MULTI_TIMEFRAME_MATRIX.json` — Machine-readable matrix

## 2. Key Design Decisions

### 2.1 No Fabrication of 1H/2H

- **R2-074 established**: 1H = UNAVAILABLE, 2H = UNAVAILABLE
- **R2-075 preserves**: 1H and 2H remain UNAVAILABLE unless a real source becomes available
- The system explicitly exposes availability — never hides unavailable timeframes
- If real 1H/2H data becomes available later, the TIMEFRAME_MAP and provider config can be updated without breaking existing logic

### 2.2 Confluence Without Fabrication

- Confluence is determined by **available** timeframes only
- UNAVAILABLE timeframes are excluded from the calculation, not treated as bearish or bullish
- The system never says "UNAVAILABLE → bearish" — it simply says "not enough data"
- Confluence states: STRONG (75%+ bullish), MODERATE (50-74% bullish), PARTIAL (some bullish some bearish or insufficient data), CONFLICTED (mixed signals), UNKNOWN (no available data)

### 2.3 Score Weights Unchanged

- **financial = 20**, **technical = 20**, **confluence = 25**, **smartMoney = 20**, **marketStructure = 15**
- The multi-timeframe confluence score is **diagnostic only** (0-100) and does NOT replace or modify the Elite Score architecture
- Elite Score remains the primary platform score; multi-timeframe confluence is a ranking diagnostic / tie-breaker

### 2.4 Single Pipeline Integrity

- **ONE market-data pipeline** (MarketDataOrchestrator) — scanner is a filter layer
- **ONE cache** (MarketDataCacheService) — no second cache
- **ONE opportunity engine** (OpportunityEngine) — scanner reuses existing results
- **ONE backtest engine** (HistoricalBacktestEngine) — scanner does not replace
- Scanner foundation (R2-074) + multi-timeframe confluence (R2-075) = single architecture, extended capabilities

## 3. Multi-Timeframe Analysis Structure

### TimeframeData per timeframe:

| Field                       | Type                                        | Description                                             |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `timeframe`                 | Timeframe                                   | The timeframe identifier                                |
| `available`                 | boolean                                     | Whether essential data (price + RSI + SMA20) is present |
| `dataStatus`                | DataStatus                                  | 'AVAILABLE' / 'PARTIALLY_AVAILABLE' / 'UNAVAILABLE'     |
| `source`                    | 'REAL' \| 'DERIVED' \| 'UNAVAILABLE'        | Data source classification                              |
| `retrievedAt`               | string                                      | ISO timestamp when data was retrieved                   |
| `marketTimestamp`           | string                                      | ISO timestamp of the market observation                 |
| `currentPrice`              | number \| null                              | Current closing price                                   |
| `priceChange1D`             | number \| null                              | 1-day price change                                      |
| `priceChange5D`             | number \| null                              | 5-day price change                                      |
| `priceChange20D`            | number \| null                              | 20-day price change                                     |
| `priceChange60D`            | number \| null                              | 60-day price change                                     |
| `volume20Average`           | number \| null                              | 20-day average volume                                   |
| `volume50Average`           | number \| null                              | 50-day average volume                                   |
| `relativeVolume20`          | number \| null                              | Current volume / 20-day average                         |
| `relativeVolume50`          | number \| null                              | Current volume / 50-day average                         |
| `volumeSpike`               | boolean \| null                             | Whether volume > 2x 20-day average                      |
| `sma9`                      | number \| null                              | 9-period SMA                                            |
| `sma20`                     | number \| null                              | 20-period SMA                                           |
| `sma50`                     | number \| null                              | 50-period SMA                                           |
| `rsi14`                     | number \| null                              | 14-period RSI                                           |
| `macd`                      | {macd, signal, histogram} \| null           | MACD indicator                                          |
| `stochasticRsiK`            | number \| null                              | Stochastic RSI K value                                  |
| `stochasticRsiD`            | number \| null                              | Stochastic RSI D value                                  |
| `distanceTo20DHigh`         | number \| null                              | Distance to 20-day high as percentage                   |
| `distanceTo50DHigh`         | number \| null                              | Distance to 50-day high as percentage                   |
| `isBreakout`                | boolean \| null                             | Whether price broke out above 20D high                  |
| `momentum5D`                | number \| null                              | 5-day momentum return                                   |
| `momentum20D`               | number \| null                              | 20-day momentum return                                  |
| `momentum60D`               | number \| null                              | 60-day momentum return                                  |
| `marketRegime`              | 'BULL' \| 'BEAR' \| 'SIDEWAYS' \| 'UNKNOWN' | Market regime                                           |
| `relativeStrength`          | number \| null                              | Relative strength vs benchmark                          |
| `relativeStrengthBenchmark` | 'OFFICIAL' \| 'SYNTHETIC_PROXY' \| null     | Benchmark type                                          |

### MultiTimeframeAnalysis:

| Field                      | Description                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `symbol`                   | The symbol being analyzed                                                           |
| `timeframes`               | Record<Timeframe, TimeframeData> — per-timeframe data                               |
| `confluence`               | 'STRONG' \| 'MODERATE' \| 'PARTIAL' \| 'CONFLICTED' \| 'UNKNOWN'                    |
| `availableTimeframeCount`  | Number of available timeframes out of 8 (1H/2H always UNAVAILABLE)                  |
| `bullishTimeframeCount`    | Number of timeframes with bullish alignment                                         |
| `bearishTimeframeCount`    | Number of timeframes with bearish alignment                                         |
| `conflictedTimeframeCount` | Number of timeframes with conflicted signals                                        |
| `confluenceScore`          | 0-100 diagnostic score (does NOT replace Elite Score)                               |
| `technicalAlignment`       | 'BULLISH' \| 'BEARISH' \| 'NEUTRAL' \| 'MIXED' \| 'UNKNOWN'                         |
| `volumeConfirmation`       | 'STRONG' \| 'MODERATE' \| 'WEAK' \| 'UNAVAILABLE'                                   |
| `momentumState`            | 'ACCELERATING' \| 'POSITIVE' \| 'NEUTRAL' \| 'WEAKENING' \| 'NEGATIVE' \| 'UNKNOWN' |

## 4. Confluence Methodology

The `determineMultiTimeframeConfluence` function determines confluence from available timeframes:

### Confluence Determination Logic:

1. **Collect available timeframes** — exclude UNAVAILABLE and dataStatus === 'UNAVAILABLE'
2. **For each available timeframe**, determine bullish/bearish/conflicted status:
   - Regime: marketRegime === 'BULL' → bullish, 'BEAR' → bearish
   - SMA alignment: SMA9 > SMA20 > SMA50 → bullish; SMA9 < SMA20 < SMA50 → bearish
   - MACD histogram > 0 → bullish; < 0 → bearish
   - RSI > 50 → bullish; < 30 → bearish
   - Combine signals: bullSignals > bearSignals → bullish; bearSignals > bullSignals → bearish; equal → conflicted
3. **Determine confluence**:
   - **STRONG**: 75%+ of available timeframes bullish → score 80
   - **MODERATE**: 50-74% bullish → score 55
   - **PARTIAL**: Some bullish, some bearish, or mixed → score 35-40
   - **CONFLICTED**: All available timeframes conflicted, or strong bearish dominance → score 25
   - **UNKNOWN**: No available timeframes → score 0
4. **Volume confirmation**: Based on volumeSpike counts among available timeframes
5. **Momentum state**: Based on momentum5D counts among available timeframes

### Confluence States:

| State      | Description                                               | Confluence Score |
| ---------- | --------------------------------------------------------- | ---------------- |
| STRONG     | 75%+ available timeframes bullish with aligned technicals | 80               |
| MODERATE   | 50-74% bullish with reasonable alignment                  | 55               |
| PARTIAL    | Mixed signals; some bullish some bearish                  | 35-40            |
| CONFLICTED | Strong mixed/contradictory signals                        | 25               |
| UNKNOWN    | No available data (all timeframes UNAVAILABLE)            | 0                |

## 5. Early Opportunity Classification

The `determineEarlyOpportunityClassification` function classifies opportunities based on multi-timeframe analysis:

### Classification States:

| State                  | Conditions                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **EARLY_ACCUMULATION** | STRONG confluence + BULLISH technical alignment + STRONG volume confirmation + POSITIVE momentum                                           |
| **PRE_BREAKOUT**       | Not CONFLICTED + BULLISH alignment + POSITIVE momentum + bullishTimeframeCount >= 3 + price near 20D high (>= 60% of available timeframes) |
| **BREAKOUT**           | Not CONFLICTED + BULLISH alignment + POSITIVE momentum + bullishTimeframeCount >= 3 + price NOT near 20D high                              |
| **MOMENTUM**           | POSITIVE momentum + volumeConfirmation !== 'WEAK'                                                                                          |
| **EXTENDED**           | MODERATE confluence + BULLISH alignment + MODERATE volume confirmation                                                                     |
| **WEAKENING**          | CONFLICTED momentum + WEAKENING momentum + WEAK volume confirmation                                                                        |
| **NO_SIGNAL**          | Default — no strong opportunity signal                                                                                                     |
| **UNAVAILABLE**        | No available timeframes (all 8 are UNAVAILABLE)                                                                                            |

### Important: These are classifications, NOT guarantees.

The system never says "this stock WILL rise" or "this stock will rise X% tomorrow." Classifications are based on current technical evidence only.

## 6. Scanner Signal Quality

The `determineScannerSignalQuality` function rates signal quality:

| Quality         | Conditions                                               |
| --------------- | -------------------------------------------------------- |
| **HIGH**        | CONFLUENCE = STRONG + bullishTimeframeCount >= 4         |
| **MEDIUM**      | CONFLUENCE !== CONFLICTED + availableTimeframeCount >= 3 |
| **LOW**         | Default — insufficient data or weak signals              |
| **UNAVAILABLE** | availableTimeframeCount === 0                            |

## 7. Advanced Scanner Filters

### New ScannerFilter Options:

| Filter                       | Type                                                                   | Description                                     |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| `minAvailableTimeframeCount` | number                                                                 | Minimum number of available timeframes required |
| `minBullishTimeframeCount`   | number                                                                 | Minimum number of bullish timeframes required   |
| `minConfluenceScore`         | number                                                                 | Minimum confluence score (0-100)                |
| `require4hBullish`           | boolean                                                                | Whether 4H must be bullish                      |
| `require1dBullish`           | boolean                                                                | Whether 1D must be bullish                      |
| `require1wBullish`           | boolean                                                                | Whether 1W must be bullish                      |
| `require1mBullish`           | boolean                                                                | Whether 1M must be bullish                      |
| `minVolumeConfirmation`      | 'STRONG' \| 'MODERATE' \| 'WEAK'                                       | Minimum volume confirmation level               |
| `minMomentumState`           | 'ACCELERATING' \| 'POSITIVE' \| 'NEUTRAL' \| 'WEAKENING' \| 'NEGATIVE' | Minimum momentum state                          |
| `minTechAlignment`           | 'BULLISH' \| 'BEARISH' \| 'NEUTRAL'                                    | Minimum technical alignment                     |

### Filter Status: PASS / FAIL / UNAVAILABLE

- **PASS**: All filter conditions met
- **FAIL**: Filter condition not met
- **UNAVAILABLE**: Required data is missing — never fabricated as 0/50/neutral
- The scanner can explain why a stock was rejected based on specific filter failures

## 8. Volume Intelligence

Volume features are reused from the existing `computeVolumeFeatures` service:

### Exposed Metrics:

- `volume20Average` — 20-day average volume
- `volume50Average` — 50-day average volume
- `relativeVolume20` — Current volume / 20-day average
- `relativeVolume50` — Current volume / 50-day average
- `volumeSpike` — Whether current volume > 2x 20-day average

### Volume Confirmation States:

- **STRONG**: 75%+ available timeframes have volumeSpike = true
- **MODERATE**: 50-74% have volumeSpike = true
- **WEAK**: Some timeframes have volumeSpike, but not majority
- **UNAVAILABLE**: No available timeframes for volume analysis

## 9. Breakout Intelligence

Breakout features reused from `computeBreakoutFeatures`:

### Exposed Metrics:

- `distanceTo20DHigh` — Percentage distance to 20-day high (positive = below high, negative = above)
- `distanceTo50DHigh` — Percentage distance to 50-day high
- `isBreakout` — Whether current close > 20D high (historical only, no future data)

### Breakout Classifications:

- **PRE_BREAKOUT**: Price approaching 20D high (within ~5%)
- **BREAKOUT**: Price above 20D high
- **NO_BREAKOUT**: Price significantly below 20D high
- **UNAVAILABLE**: Insufficient historical data

## 10. Momentum Alignment

Momentum features from existing returns/momentum calculations:

### Return periods: return1D, return5D, return20D, return60D, return120D, return252D

### Momentum states:

- **ACCELERATING**: 75%+ available timeframes have positive momentum5D
- **POSITIVE**: 50-74% have positive momentum5D
- **NEUTRAL**: Some positive, some negative, or mixed signals
- **WEAKENING**: 50-74% have negative momentum5D
- **NEGATIVE**: 75%+ have negative momentum5D
- **UNKNOWN**: No available data

## 11. Technical Alignment

Evaluation of technical indicators:

- **SMA9 > SMA20 > SMA50** → bullish alignment
- **MACD histogram > 0** → bullish momentum
- **RSI > 50** → bullish (not overbought)
- **RSI < 30** → bearish (not oversold)
- Alignment determined by signal count: bullish > bearish → BULLISH; bearish > bullish → BEARISH; mixed → MIXED

## 12. Market Regime

Reused from existing `determineMarketRegime`:

- **BULL**: Price above SMA20 + SMA9 above SMA20 (uptrend)
- **BEAR**: Price below SMA20 + SMA9 below SMA20 (downtrend)
- **SIDEWAYS**: Price near SMA20 + SMA9 mixed relative to SMA20
- **UNKNOWN**: Insufficient data (SMA20 = null)

Per-timeframe regime, then multi-timeframe alignment:

- **ALIGNED_BULL**: Majority of timeframes in BULL regime
- **ALIGNED_BEAR**: Majority of timeframes in BEAR regime
- **MIXED**: Timeframes split between BULL and BEAR
- **UNKNOWN**: Insufficient data for regime determination

## 13. Relative Strength

Reused from `computeRelativeStrength`:

- **benchmarkType**: 'OFFICIAL' \| 'SYNTHETIC_PROXY' \| null
- **Important**: Synthetic BIST index is NOT official BIST — never labeled as such
- relativeStrength = (symbolPrice / benchmarkPrice - 1) × 100 (percentage)

## 14. AI Analysis Payload (DTO Foundation)

For future AI consensus compatibility, the system exposes a clean analysis payload:

### AIAnalysisInput (structure):

| Field                    | Description                             |
| ------------------------ | --------------------------------------- |
| `symbol`                 | Trading symbol                          |
| `currentPrice`           | Current market price (or null)          |
| `eliteScore`             | Platform elite score (0-100)            |
| `scannerResult`          | ExtendedScannerResult with all features |
| `multiTimeframeAnalysis` | MultiTimeframeAnalysis with confluence  |
| `financialAnalysis`      | Fundamental data quality status         |
| `technicalAnalysis`      | Technical indicator status              |
| `volumeAnalysis`         | Volume confirmation state               |
| `breakoutAnalysis`       | Breakout status                         |
| `momentumAnalysis`       | Momentum state                          |
| `marketRegime`           | Current market regime                   |
| `relativeStrength`       | Relative strength value                 |
| `dataQuality`            | 'VALID' \| 'PARTIAL' \| 'INVALID'       |
| `sourceProvenance`       | Source tracking per data point          |

All AI providers receive the **same factual dataset**. The AI models independently analyze the evidence and later produce a consensus. No provider-specific strategies are implemented.

## 15. Provenance Preservation

Every result preserves:

| Field             | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `symbol`          | The symbol analyzed                                   |
| `provider`        | Data provider (Yahoo, etc.)                           |
| `timeframe`       | The timeframe of observation                          |
| `source`          | 'REAL' \| 'DERIVED' \| 'UNAVAILABLE'                  |
| `retrievedAt`     | When data was retrieved                               |
| `marketTimestamp` | When the market data applies                          |
| `dataStatus`      | 'AVAILABLE' \| 'PARTIALLY_AVAILABLE' \| 'UNAVAILABLE' |
| `coverage`        | Which data points are present                         |

Sources distinguish: REAL (market price), DERIVED (calculated from available data), UNAVAILABLE (no data). Never claim RESEARCH = REAL MARKET PRICE or DERIVED = OFFICIAL.

## 16. Absolute Prohibitions (R2-075)

**DO NOT:**

- Create second market-data pipeline
- Create second cache
- Create second opportunity engine
- Create second scanner engine
- Fabricate market data (prices, volume, RSI, MACD, SMA, returns, regime)
- Fabricate missing timeframes (1H/2H must remain UNAVAILABLE unless real source)
- Use 4H data and call it 1H or 2H
- Call synthetic BIST index official
- Use future data (look-ahead bias)
- Modify Elite Score weights (financial=20, technical=20, confluence=25, smartMoney=20, marketStructure=15)
- Optimize thresholds retrospectively
- Create fake AI predictions or price targets
- Convert unavailable into zero or neutral
- Silently drop unavailable observations
- Introduce institutional complexity unnecessarily

## 17. Runtime Verification

### Required HTTP probes (minimum):

Symbols: THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN, ISCTR, KCHOL, SAHOL, EREGL

Verify for each:

1. Price is real (Yahoo Finance API success)
2. 4H data available (Yahoo REAL)
3. 1D data available (Yahoo REAL)
4. 1W data available (Yahoo REAL)
5. 1M data available (Yahoo REAL)
6. 3M data available (Yahoo REAL)
7. 6M data available (Yahoo REAL)
8. 1H explicitly remains UNAVAILABLE
9. 2H explicitly remains UNAVAILABLE

### Record per symbol/provider:

- provider, symbol, timeframe, status, row count, latest timestamp, retrievedAt

## 18. Known Gaps

- Runtime verification of provider data for all BIST symbols
- Fintables credential configuration (optional, not required for core function)
- Full test suite for multi-timeframe confluence filters
- SerpAPI research integration for enhanced data
- AHT foundation integration (compatible data structures created, not fully implemented)

## 19. Recommended Next Sprint

After R2-075, implement **R2-076**: Baby Stock DNA / Historical Pattern Similarity using scanner output.

Or: **R2-077**: AHT Early Accumulation Detection consuming scanner results.

Do not automatically proceed — evaluate based on actual evidence.

---

**Honesty is more important than a green status.**

If real data is unavailable, report UNAVAILABLE.

If coverage is partial, report PARTIAL.

Do not claim COMPLETE if any critical requirement is not actually verified.

**R2-075 Verdict: READY_FOR_REVIEW**
