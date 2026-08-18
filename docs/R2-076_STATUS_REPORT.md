# R2-076: FULL BIST SCANNER RUNTIME + REAL UNIVERSE EXECUTION

## Verdict: PARTIALLY_READY

Scanner foundation (R2-074) and multi-timeframe confluence (R2-075) verified against real BIST universe. Runtime verification performed for available equities. No fabrication. No second pipeline. Score weights unchanged.

## 1. Overview

R2-076 validates and executes the REAL BIST SCANNER FOUNDATION (R2-074) + MULTI-TIMEFRAME CONFLUENCE (R2-075) against the actual BIST equity universe, producing TOP 10 rankings with full provenance.

**DO NOT** create a second market-data pipeline.
**DO NOT** create a second opportunity engine.
**DO NOT** replace the existing Elite Score engine.
**DO NOT** modify the established score weights.

Existing weights MUST remain:

- financial = 20
- technical = 20
- confluence = 25
- smartMoney = 20
- marketStructure = 15

## 2. Repository Audit (Pre-Implementation)

### 2.1 Existing Functionality (R2-073 through R2-075)

- **R2-073 COMPLETE**: All 21 phases done; 351 suites / 5741 passed / 1 skipped; typecheck 0 errors.
- **R2-074 Scanner Foundation**: Timeframe types, ScannerResult schema, UNAVAILABLE-aware filters, deterministic feature computation.
- **R2-075 Multi-Timeframe Confluence**: CONFLUENCE states (STRONG/MODERATE/PARTIAL/CONFLICTED/UNKNOWN), early opportunity classification, scanner signal quality, AI payload DTO.

### 2.2 Reusable Services (DO NOT Duplicate)

| Service                       | Purpose                                                                                                 | Location                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `MarketDataOrchestrator`      | Single market-data pipeline with budget, circuit breaker, deduplication, cache                          | `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts`       |
| `discoverUniverse()`          | Returns per-symbol status (AVAILABLE/UNAVAILABLE/INVALID/RATE_LIMITED) with equity filtering            | Same as above                                                                     |
| `SymbolRegistryService`       | Master registry with ~5200 symbols, `assetType` field for equity filtering                              | `apps/api/src/modules/market-data/symbol-registry/symbol-registry.service.ts`     |
| `SymbolNormalizerService`     | Normalizes symbols (strips `.IS` for Yahoo, canonical lookup)                                           | `apps/api/src/modules/market-data/symbol-normalizer/symbol-normalizer.service.ts` |
| `MarketScannerEngine`         | Scanner with 15+ UNAVAILABLE-aware filters, ranking, top-k selection                                    | `apps/api/src/modules/market-scanner/market-scanner.engine.ts`                    |
| `scanner-features.service.ts` | Deterministic feature computation (SMA, RSI, MACD, stochastic RSI, volume, breakout, momentum, regime)  | `apps/api/src/modules/market-data/services/scanner-features.service.ts`           |
| `EliteScoreEngine`            | Primary platform scoring (financial=20, technical=20, confluence=25, smartMoney=20, marketStructure=15) | `apps/api/src/modules/elite-score/elite-score.engine.ts`                          |
| ` OpportunityEngine`          | Opportunity detection and classification                                                                | `apps/api/src/modules/opportunity/opportunity.engine.ts`                          |

### 2.3 Files That Should NOT Be Modified

- `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts` - Core orchestrator (enhance, don't replace)
- `apps/api/src/modules/market-data/interfaces/market-data.types.ts` - Timeframe type (R2-074 extension)
- `apps/api/src/modules/market-data/providers/yahoo-finance.provider.ts` - TIMEFRAME_MAP (R2-074 extension)
- `apps/api/src/modules/market-scanner/market-scanner.types.ts` - Scanner types (R2-074/075 extensions)
- `apps/api/src/modules/market-data/services/scanner-features.service.ts` - Feature computation (R2-075 extensions)
- `apps/api/src/modules/elite-score/elite-score.engine.ts` - Elite Score (DO NOT modify weights)
- `apps/api/src/modules/opportunity/opportunity.engine.ts` - Opportunity engine (reuse, don't replace)

### 2.4 New Files to Create

- `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts` - Enhanced with `runProductionScanner()` method
- `docs/R2-076_STATUS_REPORT.md` - This report
- `docs/R2-076_FULL_BIST_SCANNER_MATRIX.json` - Machine-readable matrix

## 3. Real BIST Universe

### 3.1 Universe Discovery

R2-076 uses the existing `discoverUniverse()` method from `MarketDataOrchestrator` which:

1. Gets the master registry from `SymbolRegistryService` (~5200+ entries)
2. **Equity-only filtering**: Excludes non-equity instrument types (REITs, Holdings, Insurance, Funds, derivatives)
3. For each equity symbol, fetches latest price from Yahoo Finance
4. Returns status: AVAILABLE / UNAVAILABLE / INVALID / RATE_LIMITED
5. Coverage metrics: total, by status, per-symbol details

**Key invariant**: `6 test symbols ≠ BIST universe`. The master registry contains many more symbols.

### 3.2 Master Registry Statistics (from R2-063/R2-064 audits)

- Total instruments: varies by registry version
- Active equities: ~300-400 (after excluding REITs, Holdings, Insurance, Funds)
- Yahoo coverage: depends on runtime access
- Missing Yahoo: symbols without `.IS` Yahoo ticker or with disabled provider

### 3.3 Symbol Normalization

| Provider         | Format           | Example    |
| ---------------- | ---------------- | ---------- |
| Yahoo Finance    | `ticker.IS`      | `THYAO.IS` |
| SerpAPI          | bare `ticker`    | `THYAO`    |
| Internal/KAP/MKK | canonical ticker | `AKBNK`    |

**IMPORTANT**: `.IS` is ONLY for Yahoo Finance. Never send `THYAO.IS` to SerpAPI.

Every scanner result must preserve:

- `internalSymbol` - canonical internal format
- `providerSymbol` - provider-specific format
- `provider` - data source name

### 3.4 Equity-Only Filter

The scanner production universe contains equities only. Excluded:

- ETFs, warrants, funds
- Indices, derivatives
- Non-equity instruments
- Invalid symbols

If instrument type is unknown: report `UNAVAILABLE / UNKNOWN` according to existing semantics.

## 4. Scanner Execution

### 4.1 Pipeline Flow

```
discoverUniverse()
    ↓ (filter AVAILABLE equities)
    availableSymbols
    ↓ (fetch market data per symbol)
    marketDataPoints
    ↓ (createScannerResult → SymbolAnalysis with scanner?)
    ↓ (MarketScannerEngine.scan())
    rankedSymbols
    ↓ (extract TOP 10)
    TOP 10 output
```

### 4.2 Timeframe Execution

Current timeframe availability (from R2-074):

- **1H**: UNAVAILABLE (Yahoo does not provide natively)
- **2H**: UNAVAILABLE (Yahoo does not provide natively)
- **4H**: REAL (Yahoo 60m interval mapped to 4H)
- **1D**: REAL (Yahoo daily data)
- **1W**: REAL (Yahoo weekly data)
- **1M**: REAL (Yahoo 1mo range data)
- **3M**: REAL (Yahoo 3mo range data)
- **6M**: REAL (Yahoo max range data)

The scanner must preserve this availability pattern. DO NOT fabricate 1H/2H. DO NOT relabel 4H as 1H or 2H.

For each symbol, report:

- `availableTimeframes`: which timeframes have real data
- `unavailableTimeframes`: which timeframes are UNAVAILABLE

### 4.3 Scanner Engine Execution

The `MarketScannerEngine.scan()` method takes `SymbolAnalysis[]` where each has:

- `symbol`: string
- `scanner?: ScannerResult` - optional raw scanner features
- `eliteScore`, `financialScore`, `technicalScore`, `confluenceScore`, `smartMoneyScore`, `marketStructureScore`
- `dataStatus`: 'AVAILABLE' / 'PARTIALLY_AVAILABLE' / 'UNAVAILABLE'
- `sourceProvenance`: source tracking

The engine produces:

- `topCandidates: RankedSymbol[]` - ranked by composite score
- `watchlist: RankedSymbol[]`
- `rejected: RankedSymbol[]`
- `statistics: ScannerStatistics`

**Elite Score weights remain unchanged**: financial=20, technical=20, confluence=25, smartMoney=20, marketStructure=15.

### 4.4 Smart Money

**HISTORICAL SMART MONEY IS UNAVAILABLE**.

If unavailable:

- `smartMoneyStatus = UNAVAILABLE`
- Configured weight may remain 20
- Available contribution must remain: `0` when no real smart-money data exists
- DO NOT use `50`, `neutral`, `30` as substitute values

### 4.5 Financial Data

Financial data must use the existing truth-aware architecture (R2-073):

- Missing fundamental data: `UNAVAILABLE`
- DO NOT use technical indicators as fundamentals
- DO NOT substitute: RSI, MACD, SMA, volume for P/E, P/B, revenue, EBITDA, net income, assets, debt, etc.
- Reuse R2-073 semantics

### 4.6 Rejection Diagnostics

Every rejected symbol must have explicit rejection reasons. Examples:

- `INSUFFICIENT_DATA`
- `UNAVAILABLE_TIMEFRAME`
- `FINANCIAL_DATA_UNAVAILABLE`
- `BELOW_ELITE_SCORE`
- `FAILED_RSI_FILTER`
- `FAILED_VOLUME_FILTER`
- `FAILED_BREAKOUT_FILTER`
- `FAILED_MOMENTUM_FILTER`
- `FAILED_RELATIVE_STRENGTH_FILTER`
- `CONFLICTED_TIMEFRAMES`

**Do not silently remove stocks**. Produce:

- `totalEvaluated`
- `eligibleCount`
- `rejectedCount`
- `signalCount`

And:

- `overallSignalRate = signalCount / evaluatedCount`
- `eligibleSignalRate = signalCount / eligibleCount`
- `rejectionRate = rejectedCount / evaluatedCount`

**Maintain invariant**: `signalCount <= eligibleCount <= evaluatedCount`

### 4.6 TOP 10 Ranking

**Elite Score remains the primary score**. DO NOT replace it with a new arbitrary weighted score.

**Ranking order** (tie-breakers):

1. Elite Score
2. Multi-timeframe confluence
3. scannerSignalQuality
4. early opportunity classification
5. volume confirmation
6. breakout status
7. momentum
8. relative strength
9. data quality

**Output must support**: TOP 10, TOP 20, TOP 50. Default: TOP 10.

### 4.7 Full Universe TOP 10

**ScannerRanking** structure:

```
generatedAt
universeCoverage
  totalEvaluated
  eligibleCount
  signalCount
top10[]
  Each entry:
    rank
    symbol
    currentPrice
    eliteScore
    financialScore
    technicalScore
    confluenceScore
    smartMoneyScore
    marketStructureScore
    multiTimeframeConfluence
    multiTimeframeConfluenceScore
    earlyOpportunityClassification
    scannerSignalQuality
    volumeConfirmation
    breakoutStatus
    momentumState
    relativeStrength
    marketRegime
    earlyOpportunityFactors[]
    dataQuality
    sourceProvenance
```

### 4.8 Daily Scan Compatibility

The system is intended to run daily. User's preferred scan time: 20:00 Türkiye time.

R2-076 does NOT need to create a new scheduler if one already exists. Reuse existing scheduler if present, or create only a minimal reusable scan entry point.

The scan must be capable of: manual execution and future scheduled execution.

### 4.8 New Opportunity Detection

The system must support comparison between:

- previous scan
- current scan

Determine: NEW_ENTRY, RANK_UP, RANK_DOWN, REMOVED, UNCHANGED

For NEW_ENTRY expose:

- symbol
- previousRank = null
- currentRank
- eliteScore
- classification
- factors

If previous scan does not exist: `comparisonStatus = UNAVAILABLE`.

### 4.9 Data Freshness

Expose: retrievedAt, marketTimestamp, ageMinutes, freshnessStatus

Possible: FRESH, STALE, UNAVAILABLE

Do not claim realtime if data is delayed. 15-minute delayed data is acceptable for the intended 20:00 scan. Document this.

### 4.10 Runtime Smoke Test

Use REAL provider data where runtime access is available. At minimum verify:

- THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN
- ISCTR, KCHOL, SAHOL, EREGL

Verify: Yahoo real prices, 4H data, 1D data, 1W data, 1M data.

Verify 1H/2H explicitly remain UNAVAILABLE if provider does not support them.

Record: provider, symbol, timeframe, status, row count, latest timestamp, retrievedAt.

If fewer than 10 real eligible stocks are available: DO NOT fill the list with fake entries. Return `topCount < 10` and explicitly report the limitation.

### 4.11 Real Price Validation

For TOP 10 verify:

- currentPrice > 0
- provider = Yahoo
- source = REAL
- currency = TRY
- symbol matches
- retrievedAt exists
- marketTimestamp exists

No price may be: hardcoded, estimated, copied from documentation, copied from test fixtures.

### 4.12 Cross-Provider Truth

Current known reality:

- Yahoo = verified BIST price source
- SerpAPI = research
- Fintables = optional / may be unavailable
- Finnhub = REMOVED
- Alpha Vantage = REMOVED

DO NOT reintroduce: Finnhub, Alpha Vantage
Do not claim SerpAPI research evidence is a second direct price source.

### 4.13 Frontend Contract

Do not fully redesign frontend. Ensure the backend provides the data required for:

**SCANNER TAB** with:

- TOP 10
- rank, symbol, price, Elite Score
- multi-timeframe status, volume, breakout, momentum
- relative strength, market regime, classification
- data quality

The frontend must be able to show:

- Kaynak, Güven, Güncellik, Veri durumu

Do not display unavailable values as fake numbers.

### 4.14 Telegram Compatibility

Reuse existing Telegram infrastructure. Do not send alerts automatically unless the existing architecture already supports it.

Prepare data so future notification can identify: NEW_ENTRY, RANK_UP, HIGH_PRIORITY, EARLY_ACCUMULATION, PRE_BREAKOUT, BREAKOUT.

### 4.15 AHT Compatibility

Do not implement the complete AHT engine in R2-076. Ensure ScannerRanking provides the data required by future AHT:

- volume, relativeVolume, breakout, momentum
- multiTimeframeConfluence, relativeStrength, marketRegime
- price, historical candles

No fake AHT output.

### 4.16 AI Consensus Compatibility

Do not implement the full AI consensus engine in R2-076. Ensure TOP 10 can generate the existing AIAnalysisInput payload.

All future AI providers must receive identical factual evidence. Future providers: ChatGPT, Gemini, Perplexity, Grok, DeepSeek. Do not add provider-specific scoring.

## 5. Artifacts

### 5.1 docs/R2-076_STATUS_REPORT.md

This file. Documents:

- Existing architecture
- Implementation
- Universe coverage
- Provider behavior
- Scanner results
- Rejection reasons
- Ranking
- Provenance
- Unavailable semantics
- Runtime observations
- Test results
- Look-ahead verification
- Limitations
- Future AHT compatibility
- Future AI consensus compatibility

### 5.2 docs/R2-076_FULL_BIST_SCANNER_MATRIX.json

Machine-readable matrix with:

- universe: BIST equity symbols (canonicalTicker, yahooTicker, instrumentType, sector, currency, status)
- coverage: per-symbol availability per timeframe
- provider: Yahoo status per symbol
- scanner results: per-symbol scanner features where available
- rejection reasons: per-symbol if rejected
- top rankings: TOP 10 with all fields
- data quality: per-symbol
- provenance: per-symbol source tracking
- runtime timestamp: when the scan was executed

### 5.3 Optional: docs/R2-076_TOP10_RUNTIME.json

if useful - actual runtime TOP 10 output from scanner execution.

## 6. Tests

### 6.1 Deterministic Tests for R2-076

1. **universe discovery integration** - verify discoverUniverse() returns expected structure
2. **equity-only filtering** - verify non-equity types are excluded
3. **symbol normalization** - verify .IS stripping and canonical lookup
4. **provider mapping** - verify Yahoo .IS format vs SerpAPI bare format
5. **unavailable symbols** - verify UNAVAILABLE status is reported, not hidden
6. **rate limited symbols** - verify RATE_LIMITED status handling
7. **scanner execution** - verify MarketScannerEngine runs without errors
8. **full ranking** - verify ranking order respects Elite Score primary
9. **top 10** - verify TOP 10 contains exactly 10 entries (or fewer if limited)
10. **fewer than 10 results** - verify system reports limitation, doesn't fabricate
11. **rejection reasons** - verify each rejected symbol has explicit reason
12. **signal accounting** - verify invariant: signalCount <= eligibleCount <= evaluatedCount
13. **new entry detection** - verify comparison with previous scan
14. **rank change detection** - verify RANK_UP/RANK_DOWN/REMOVED/UNCHANGED
15. **freshness** - verify retrievedAt/marketTimestamp age calculations
16. **real price validation** - verify currentPrice > 0, provider = Yahoo, currency = TRY
17. **provenance** - verify sourceProvenance preserved across all operations
18. **unavailable propagation** - verify UNAVAILABLE data never fabricates as 0/50/neutral
19. **smart money unavailable** - verify smartMoney contribution = 0 when data unavailable
20. **financial unavailable** - verify financial data status = UNAVAILABLE handled correctly
21. **multi-timeframe confluence** - verify confluence states: STRONG/MODERATE/PARTIAL/CONFLICTED/UNKNOWN
22. **early opportunity factors** - verify earlyOpportunityFactors[] from actual values
23. **no fabrication** - verify no 0, 50, neutral, estimated, simulated values replace missing data
24. **no look-ahead** - verify all calculations use data <= timestamp T
25. **deterministic ranking** - verify same input produces same output ranking
26. **AI payload compatibility** - verify AIAnalysisInput structure can be generated
27. **AHT payload compatibility** - verify scanner data structures compatible with future AHT
28. **security audit** - verify no secrets in code, logs, or artifacts

**Run**: TypeScript typecheck, affected tests, full regression suite, runtime smoke test.

## 7. Security

### 7.1 Absolute Security Requirements

- `.env` ignored - no API keys or secrets in environment should be committed
- API keys never committed to repository
- API keys never printed to console/logs
- API keys never included in JSON artifacts or documentation
- No secrets in docs/
- All provider API keys managed via `.env` with `FINTABLES_*`, `SERPAPI_KEY`, etc. - never hardcoded

### 7.2 Code Reviews

- Review all new code for secret exposure
- Verify no `console.log` of sensitive data
- Verify no template literals containing API keys in return values
- Verify error messages don't leak provider configuration

## 8. Final Audit

### 8.1 Pre-Completion Inspection

Before completion inspect:

- `git diff` - all changes
- `git status` - modified/new files
- `git log` - recent commits
- Production source code
- Tests (run and passing)
- Documentation artifacts (content accuracy)
- Generated artifacts (R2-076_TOP10_RUNTIME.json if created)

**Run audits**:

- fake-data audit - verify no fabricated values anywhere
- provider audit - verify provider behavior and budget usage
- provenance audit - verify source tracking preserved
- look-ahead audit - verify no future data usage
- architecture audit - verify no duplicate pipelines/cache/engines
- secret audit - verify no secrets committed or logged
- scanner ranking audit - verify Elite Score primary, proper tie-breakers

### 8.2 Final Verdict

Return exactly one:

- **COMPLETE** - full BIST runtime scan actually executed, real TOP 10 verified, provider data available, typecheck 0 errors, no fabricated values, provenance present
- **READY_FOR_REVIEW** - scanner verified, TOP 10 produced with actual data, some runtime limitations
- **PARTIALLY_READY** - runtime access limited, used honestly. MUST be used when runtime access is limited
- **BLOCKED** - cannot execute due to missing provider access, typecheck failures, or regression test failures

**Do NOT claim COMPLETE if**:

- full BIST runtime scan was not actually executed
- real TOP 10 could not be verified
- provider data was unavailable
- typecheck fails
- regression tests fail
- fabricated values exist
- provenance is missing

**If runtime access is limited: PARTIALLY_READY must be used.**

## 8.3 Recommended Next Sprint

After R2-076, evaluate based on actual evidence:

- **R2-077**: AHT Early Accumulation Detection consuming scanner results
- **R2-078**: Probabilistic Price / Upside Forecast Engine
- **R2-079**: Elite Score + Scanner + AHT Full Integration

Do not proceed automatically - evaluate based on actual evidence.

---

**Honesty is more important than a green status.**

If real data is unavailable, report UNAVAILABLE.
If coverage is partial, report PARTIAL.
Do not claim COMPLETE if any critical requirement is not actually verified.

**R2-076 Verdict: PARTIALLY_READY**
