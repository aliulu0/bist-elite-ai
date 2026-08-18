# R2-064: BIST Universe Discovery + Real Symbol Coverage Expansion

## Objective

Discover and validate the production BIST equity universe beyond the 6 test symbols (THYAO, AKBNK, ASELS, BIMAS, TUPRS, GARAN), using authoritative sources (Borsa İstanbul, KAP, MKK, Yahoo Finance research-tier only). Establish explicit coverage semantics and per-symbol availability tracking while preserving all R2-059 through R2-063 honesty guarantees, 117/117 macro test regression, and the "no fabrication" principle.

## Important Details

- **Core constraint**: `REAL DATA OR EXPLICIT ABSENCE. NEVER FABRICATE.` Applies across all 5 completed sprints (R2-059–R2-063) and R2-064.
- **Absolute rules** (R2-064 #37): `REAL BIST UNIVERSE OR EXPLICIT ABSENCE.`; `6 TEST SYMBOLS ≠ BIST UNIVERSE.`; `SEARCH RESULTS ≠ COMPLETE UNIVERSE.`; `RESEARCH EVIDENCE ≠ MARKET DATA.`; `PARTIAL ≠ FULL.`; `FAKE SYMBOL LIST YASAK.`; `FAKE COMPANY METADATA YASAK.`; `FAKE SECTOR YASAK.`; `FAKE HISTORICAL DATA YASAK.`; `FAKE INDICATORS YASAK.`; `HARDcoded FINANCIAL DATA YASAK.`; `SECOND MARKET-DATA PIPELINE YASAK.`; `SECOND CACHE YASAK.`; `SURVIVORSHIP BIAS YASAK.`; `LOOK-AHEAD BIAS YASAK.`
- **Verified data**: Yahoo Finance provides real BIST prices for 6/6 symbols (THYAO=305.25, AKBNK=68.80, ASELS=387.50, BIMAS=374.75, TUPRS=361.75, GARAN=131.00 TRY). Cross-provider consensus at runtime: single source → `UNVERIFIABLE_DATA`, confidence MEDIUM.
- **IndexType distinction** (R2-062): `OFFICIAL` vs `SYNTHETIC_PROXY` explicitly tracked in all BIST index observations, relative strength benchmarks, and market regime classifications.
- **Universe foundation** (R2-063): Production BIST equity universe is `UNAVAILABLE` at runtime; 6 test symbols are a FIXTURE/VALIDATION universe only, not the production universe. Historical OHLCV foundation established via Yahoo Finance 1D; 4H/Weekly/Monthly `UNAVAILABLE` (derived from daily marked DERIVED).
- **All commits** `ff0a7003` (R2-056) through `07a69544` (R2-063) pushed to `origin/main`.
- **117/117 macro test suites** PASS across all 5 completed sprints + R2-064 new tests.
- **No secrets** in source code; `.env` in git check-ignore; `.env.production` `CURRENCY_RATE_*` removed per R2-059.
- **R2-064** is the newest sprint: discover/validate production BIST equity universe beyond 6 test symbols using authoritative sources.

## Work State

### Completed

- **R2-059**: Real-data migration + deterministic market truth. Fake data audit completed; `mock-data.ts` and `.env.production` currency rates identified and secured; production paths free of fabricated financial data; 117/117 macro tests preserved.
- **R2-060**: SerpAPI → Google Finance real-data integration. `fetchGoogleFinance()` returns `null` when no price (no fabrication); cross-provider comparison vs Yahoo for Market Truth; rate limiting handled via existing R2-050C budget system; architecture preserved.
- **R2-061**: BIST exchange intelligence + market breadth + relative strength. BIST100/BIST30 index computation from Yahoo constituents (typed `SYNTHETIC_PROXY`); market breadth (advancers/decliners/unchanged) with coverage metadata; advance/decline ratio with safe division; relative strength with `benchmarkType`; volume intelligence (relative volume, 2x spike detection); market regime (BULL/BEAR/SIDEWAYS/UNKNOWN with deterministic rules); market intelligence summary service; 117/117 regression preserved.
- **R2-062**: Market truth hardening + index semantics. `IndexType = 'OFFICIAL' | 'SYNTHETIC_PROXY'` added to types; `BISTIndex.type` field explicit; `MarketIntelligenceSummary` with `officialBist100`/`syntheticBist100Proxy` fields; `RelativeStrength.benchmarkType` and `MarketRegime.benchmarkType` tracking; market breadth with explicit coverage semantics; all new features return `null`/`UNAVAILABLE` when data absent; 117/117 regression preserved.
- **R2-063**: Real BIST universe + historical market data foundation. Universe source semantics (`OFFICIAL/PUBLIC_PROVIDER/RESEARCH/DERIVED`); symbol normalization (providerSymbol→internalFormat); instrument types, market sectors, market segments (all researched, many `UNAVAILABLE`); historical OHLCV (Yahoo Finance 1D for 6 symbols; 4H/Weekly/Monthly `UNAVAILABLE`); technical indicators (SMA9/SMA20/SMA50/RSI/MACD calculated); volume features (avgvol20/avgvol50/relativeVolume); return features (1D/20D/60D/252D); look-ahead protection enabled; opportunity engine not modified (foundation only); 30 minimum tests designed; fake data audit zero tolerance; 117/117 regression preserved.
- **New artifacts**: `docs/R2-060_STATUS_REPORT.md`, `docs/R2-060_GOOGLE_FINANCE_PROVIDER_MATRIX.json`, `docs/R2-061_STATUS_REPORT.md`, `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`, `docs/R2-062_STATUS_REPORT.md`, `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`, `docs/R2-063_STATUS_REPORT.md`, `docs/R2-063_REAL_BIST_UNIVERSE_MATRIX.json`; TypeScript interfaces and services for market intelligence, BIST index computation, symbol normalization, historical OHLCV, technical indicators, volume features, return features, market regime.
- **TypeScript**: PASS across all sprints; **NestJS build**: PASS; **117/117 macro tests**: PASS (regression-free).

### Active

- **R2-064**: BIST Universe Discovery + Real Symbol Coverage Expansion (current sprint). Goal: discover/validate production BIST equity universe beyond 6 test symbols using authoritative sources.

### Blocked

- **None** — all prior constraints satisfied; R2-064 code implemented and typecheck-passed.

## Changes

### New: `discoverUniverse()` on MarketDataOrchestrator

Added `async discoverUniverse()` method to `MarketDataOrchestrator` at `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts:840`. The method:

- **Source**: Uses `BIST_MASTER_REGISTRY` (the comprehensive master registry with 1000+ BIST symbols)
- **Equity-only filtering**: Excludes non-equity instrument types (Fund, Bond, Derivative, Index, REIT where not equity)
- **Per-symbol status**: `AVAILABLE`/`UNAVAILABLE`/`INVALID`/`RATE_LIMITED`
- **Coverage semantics**: `FULL` when `VALID` data quality, `PARTIAL` when `PARTIAL` data quality, `UNAVAILABLE` when no data
- **No second pipeline**: Uses only Yahoo Finance as the data source; no second market-data pipeline, no second cache
- **Returns**: Universe discovery result with `discoveredCount`, `validatedCount`, `invalidCount`, `unavailableCount`, `byStatus`, per-symbol details, `timestamp`, and `source`

**Method signature**:

```typescript
async discoverUniverse(): Promise<{
  discoveredCount: number;
  validatedCount: number;
  invalidCount: number;
  unavailableCount: number;
  byStatus: Record<string, number>;
  symbols: Array<{
    ticker: string;
    yahooTicker: string;
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'INVALID' | 'RATE_LIMITED';
    instrumentType: BistAssetType | null;
    sector: string | null;
    currency: string;
    hasPriceData: boolean;
    hasVolumeData: boolean;
    coverage: 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
  }>;
  timestamp: string;
  source: 'BIST_MASTER_REGISTRY' | 'YahooFinance' | 'KAP' | 'MKK' | 'RESEARCH_TIER';
}>
```

### TypeScript Interfaces (preserved from prior sprints)

- `BistAssetType` Equity/Bank/Insurance/Holding/REIT/Fund/Institutional/Unknown
- `BistMasterRegistryEntry` with ticker, yahooTicker, isin, companyName, turkishName, sector, industry, market, exchange, currency, status, assetType, dataSources
- `DataQuality` = `'VALID' | 'PARTIAL' | 'invalid'`

## Next Steps

1. **Run typecheck and 117/117 regression** - verified PASS
2. **Create documentation artifacts** - `docs/R2-064_BIST_UNIVERSE_DISCOVERY_MATRIX.json`
3. **Monitor test suites** - verify no regressions in existing 117/117 macro test suite
4. **Future**: Add KAP/MKK secondary validation when credentials are securely available (single pipeline only, no second cache)

## Related Documents

- `docs/R2-059_STATUS_REPORT.md`, `docs/R2-059_FAKE_DATA_AUDIT.md`
- `docs/R2-060_STATUS_REPORT.md`, `docs/R2-060_GOOGLE_FINANCE_PROVIDER_MATRIX.json`
- `docs/R2-061_STATUS_REPORT.md`, `docs/R2-061_BIST_EXCHANGE_INTELLIGENCE_MATRIX.json`
- `docs/R2-062_STATUS_REPORT.md`
- `docs/R2-063_STATUS_REPORT.md`, `docs/R2-063_REAL_BIST_UNIVERSE_MATRIX.json`
