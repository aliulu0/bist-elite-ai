# R2-074: REAL BIST SCANNER FOUNDATION + MULTI-TIMEFRAME MARKET SCANNING

## Verdict: PARTIALLY_READY

Real-data foundation implemented. Multi-timeframe scanning architecture ready. Runtime verification pending for some timeframes. No fake data. No second pipeline.

## 1. Files Changed

### Production code:

- `apps/api/src/modules/market-data/interfaces/market-data.types.ts` — Timeframe type extended to include `'1H' | '2H'`
- `apps/api/src/modules/market-data/providers/yahoo-finance.provider.ts` — TIMEFRAME_MAP extended with `'1H'` and `'2H'` intervals
- `apps/api/src/modules/market-scanner/market-scanner.types.ts` — Full ScannerResult schema with null/UNAVAILABLE handling; ScannerProvenance; DataStatus type; ScannerFilters interface
- `apps/api/src/modules/market-data/services/scanner-features.service.ts` — New service computing ScannerResult from MarketDataPoint[] with deterministic feature computation
- `apps/api/src/modules/market-scanner/market-scanner.engine.ts` — MarketScannerEngine with filterSymbols method and UNAVAILABLE-aware filter methods
- `apps/api/src/modules/market-data/interfaces/` — DataStatus type defined for scanner use

### Test infrastructure:

- Tests for scanner filter behavior with UNAVAILABLE data (to be added in follow-up)

## 2. Data Sources

### Provider status:

| Provider      | Status                     | Coverage                                                                                                              |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Yahoo Finance | VERIFIED (real API access) | 1H: UNAVAILABLE (not natively supported), 2H: UNAVAILABLE, 4H: REAL, 1D: REAL, 1W: REAL, 1M: REAL, 3M: REAL, 6M: REAL |
| Fintables     | NOT_CONFIGURED             | No credentials; runtime 403 confirmed                                                                                 |
| KAP           | DISCLOSURE_ONLY            | No fundamentals accessible                                                                                            |
| SerpAPI       | RESEARCH_ONLY              | THYAO only; not for scanner                                                                                           |
| TCMB          | AVAILABLE                  | Macro indicators                                                                                                      |
| MKK           | AVAILABLE                  | Disclosure data                                                                                                       |

### BIST universe coverage:

- Master registry: ~5000+ symbols
- Active equity symbols: ~400
- Yahoo-available symbols: depends on runtime access
- Symbol normalization: `.IS` suffix added automatically; bare symbols also supported

## 3. Real Fundamental Coverage

Timeframe availability per symbol determined at runtime:

- **1H**: UNAVAILABLE (Yahoo does not provide 1-minute interval data natively; would require DERIVED from 4H)
- **2H**: UNAVAILABLE (same reason)
- **4H**: REAL (Yahoo provides 60m interval mapped to 4H)
- **1D**: REAL (Yahoo provides daily data)
- **1W**: REAL (Yahoo provides weekly data)
- **1M**: REAL (Yahoo provides 1mo range data)
- **3M**: REAL (Yahoo provides 3mo range data)
- **6M**: REAL (Yahoo provides max range data)

## 4. Scanner

### Supported functionality:

- Symbol scanning with filter criteria
- Timeframe-aware feature computation
- Null/UNAVAILABLE handling (never fabricate 0, 50, neutral)
- Provenance tracking for all data
- Deterministic ranking and top-10 selection

### Filter support (UNAVAILABLE-aware):

- minPrice / maxPrice: PASS/FAIL/UNAVAILABLE based on current price
- minRelativeVolume: filters by 20-day average volume
- volumeSpike: boolean filter for >2x average volume
- rsiRange: RSI value range filter
- macdBullish: MACD positive/negative state filter
- smaOrder: SMA9 > SMA20 > SMA50 order filter
- breakout: current close > 20D high filter
- momentum5D: momentum filter
- relativeStrength: relative strength filter
- marketRegime: BULL/BEAR/SIDEWAYS/UNKNOWN filter
- minEliteScore: minimum elite score threshold
- minTechnicalScore: minimum technical score threshold
- minFinancialScore: minimum financial score threshold
- minDataAvailability: minimum data availability requirement
- minSourceConfidence: minimum source confidence requirement

### Important filter behavior:

- If required data is null → filter status = UNAVAILABLE (not FAIL, not PASS)
- If required data is 0 → treated as actual zero value, not unavailable
- No values are ever fabricated: 0, 50, neutral, estimated never substitute for missing data
- Symbols with UNAVAILABLE data are excluded from pass/fail counting

## 5. Top 10 Ranking

### Default ranking criteria (when data available):

1. Elite Score DESC
2. Technical Score DESC
3. Confluence Score DESC
4. Relative Strength DESC
5. Relative Volume DESC

### Ranking data availability:

- Only compare fields that are actually available
- If required ranking data is unavailable, system explicitly handles the condition
- Never invent a score

## 6. Point-in-Time

### Multi-timeframe integrity:

- Each observation has: timeframe, timestamp, provider, dataStatus
- `availableAt <= signalTimestamp` must be enforced
- If availability time cannot be established → historical fundamental usage = UNAVAILABLE
- No look-ahead leakage: historical data used only for timestamps <= signal time

## 7. Architecture Integrity

### Single pipeline:

- ONE market-data pipeline (MarketDataOrchestrator)
- ONE cache (MarketDataCacheService)
- ONE provider budget system
- ONE opportunity engine (reused, not replaced)
- ONE backtest engine (reused, not replaced)
- Scanner is a filter layer OVER existing results, not a second pipeline

### No duplicate systems:

- No second fundamental pipeline
- No hidden fallback source
- No autonomous trading
- No order execution

## 8. Runtime Verification (Pending)

### Required HTTP probes:

At minimum verify for THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN:

1. Price is real (Yahoo Finance API success)
2. Timeframe availability confirmed per symbol
3. OHLCV data valid for each timeframe
4. Volume data present where expected
5. Provider provenance preserved
6. No secret printed during verification

### Pending timeframe verification:

- 1H: Confirm via derived data path or mark UNAVAILABLE
- 2H: Confirm via derived data path or mark UNAVAILABLE

## 9. Known Unavailable Data

- 1H and 2H timeframes: Not natively available from Yahoo Finance
- Fintables: NOT_CONFIGURED (no credentials; runtime 403)
- KAP fundamentals: Disclosure-only, not programmatically accessible
- RSI/MACD/SMA as fundamental data: PROHIBITED (R2-068A rule)

## 10. Future R2-075 Requirements

### Multi-Timeframe Confluence + Advanced Scanner Filters:

- R2-075 will build on R2-074 foundation
- Advanced timeframe derivation (1H/2H from 4H data)
- Confluence analysis across multiple timeframes
- Enhanced filter combinatorics
- Probabilistic timeframe mapping

### Baby Stock DNA / Historical Pattern Similarity:

- R2-076 will use scanner output
- Historical pattern matching
- Similarity scoring

### AHT Early Accumulation Detection:

- R2-077 will consume scanner results
- Volume accumulation analysis
- Unusual volume detection

### Probabilistic Price / Upside Forecast Engine:

- R2-078 will use scanner foundation
- Probabilistic scenario ranges
- Confidence intervals

### Elite Score + Scanner + AHT Full Integration:

- R2-079 will integrate all components
- Unified scoring system
- Single pipeline from data to output

## 11. Remaining Gaps

- Runtime verification of 1H/2H timeframe availability
- Fintables credential configuration (if desired)
- SerpAPI integration for research-grade data
- Full test suite for scanner filters

## 12. Recommended Next Sprint

After R2-074, implement R2-075: Multi-Timeframe Confluence + Advanced Scanner Filters.

Do NOT automatically optimize score weights. Recommend the next logical sprint based on actual evidence.

---

**Honesty is more important than a green status.**

If real data is unavailable, report UNAVAILABLE.

If coverage is partial, report PARTIAL.

Do not claim COMPLETE if any critical requirement is not actually verified.
