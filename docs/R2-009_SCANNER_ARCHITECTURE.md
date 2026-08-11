# R2-009 Elite Scanner Architecture

## Architecture

The Elite Scanner is a registry-driven scanning infrastructure built inside `apps/api/src/modules/scanner/`. It operates on the BIST Master Registry (795 instruments) and provides a pluggable strategy framework for future quantitative strategies.

The architecture reuses existing infrastructure without modifying the Provider Layer or Scheduler:
- **Master Registry** (`SymbolRegistryService`) — source of 795 instruments
- **Unified Provider** (`MarketDataOrchestrator`) — company data with fallback + caching
- **MarketDataCacheService** — cross-scan request deduplication and caching
- **MarketDataService** — latest price/volume via Yahoo provider
- **Verification Engine** (`VerificationEngine` from ResearchModule) — wired for future verificationScore
- **Catalyst Engine** (`CatalystDetectionService` from ResearchModule) — wired for future catalystScore
- **Provider Health** — via `MarketDataOrchestrator.getProviderHealth()`

## Flow

1. `GET /scanner` → `ScannerController.getOverview()` → `ScannerService.getOverview()` → returns Taramalar dashboard with strategy list, registry summary, last scan info
2. `GET /scanner/list` → `ScannerController.getStrategyList()` → returns all registered strategies
3. `GET /scanner/:strategy` → `ScannerController.runStrategy()` → `ScannerService.scanStrategy(strategyId, filter)` → `EliteScannerEngine.scan(instruments, strategy)` → async concurrency-bounded scan over filtered registry instruments → returns Tarama Sonuçları
4. `GET /scanner/results` → `ScannerController.getResults()` → returns last cached scan results or 404 Tarama Bulunamadı

### Scan Flow (per instrument)
1. `ScannerRegistry.getInstruments()` → filters Master Registry by sector/assetType/active
2. `ScannerFilter.apply()` → applies sector/assetType/limit filters
3. `EliteScannerEngine.scan()` → concurrency pool (configurable, default 20)
4. Per instrument: `MarketDataOrchestrator.fetchCompany()` (cached) + `MarketDataCacheService.getOrSet('any','latest',symbol, marketDataService.fetchLatest)` (cached)
5. Strategy `scan(context)` → placeholder returns base result with null scores
6. Results collected, sorted, returned as `EliteScanResponse`

## Components

### EliteScannerEngine (`elite-scanner-engine.service.ts`)
- Async scan with configurable concurrency (default 20)
- Reuses `MarketDataOrchestrator.fetchCompany()` for company/marketCap/sector (cached via `MarketDataCacheService`)
- Reuses `MarketDataService.fetchLatest()` for price/volume (cached via `MarketDataCacheService`)
- In-scan dedup via `Map<string, Promise>` memoization
- Timeout per instrument (default 15s)
- Produces `EliteScannerResult[]` with all STEP 3 fields + AI-ready nullable fields

### ScannerRegistry (`scanner-registry.service.ts`)
- Wraps `SymbolRegistryService.getMasterRegistry()` (795 entries)
- Provides `getInstruments(filter)` with sector/assetType/active/limit filtering
- Exposes `getCount()`, `getActiveCount()`, `getSectors()`, `getAssetTypes()`

### StrategyRegistry (`strategy-registry.service.ts`)
- Pluggable strategy registry: `register()`, `unregister()`, `get()`, `list()`, `listInfo()`
- 9 placeholder strategies registered by default:
  - `value-hunter` → Değer Avcısı
  - `smart-money` → Akıllı Para
  - `momentum` → Momentum
  - `swing` → Swing
  - `dip-collector` → Dip Toplayıcı
  - `minervini` → Minervini
  - `canslim` → CANSLIM
  - `william-oneil` → William O'Neil
  - `qullamaggie` → Qullamaggie
- Each placeholder returns `EliteScannerResult` with market data populated and all score/AI fields null
- `BaseScannerStrategy` abstract class provides the scan skeleton

### ScannerService (`scanner.service.ts`)
- Orchestrates registry + strategy registry + engine + filter
- Caches last scan per strategy + last scan overall
- Provides `getOverview()` (Taramalar), `getStrategyList()`, `scanStrategy()`, `getResults()`

### ScannerController (`scanner.controller.ts`)
- `@Controller('scanner')` with routes:
  - `GET /` → Taramalar overview
  - `GET /list` → Strateji Listesi
  - `GET /:strategy` → Run scan, return Tarama Sonuçları
  - `GET /results` → Son tarama sonuçları (Tarama Bulunamadı if none)
- All user-visible text in Turkish
- `@Public()` (no auth required)

### DTOs (`dto/`)
- `ScannerQueryDto` — sector, assetType, limit query params
- `StrategyParamDto` — strategy path param
- `ScannerResultDto`, `ScanSummaryDto`, `ScannerResultsResponseDto`, `StrategyInfoDto`, `ScannerOverviewDto`

### Types (`elite-scanner.types.ts`)
- `EliteScannerResult` — Ticker, Company, Sector, Price, Volume, MarketCap, Score, VerificationScore, CatalystScore, RiskScore, Provider, LastUpdate + AI-ready nullable: aiScore, aiConfidence
- `EliteScannerStrategy` — pluggable interface with `scan(context)`
- `EliteScannerContext` — instrument + marketData
- `ScannerInstrument`, `ScannerMarketData`, `ScannerFilterOptions`, `EliteScannerConfig`, `ScanSummary`, `StrategyInfo`

## Future Strategies

R2-009A will implement actual strategy logic by overriding `BaseScannerStrategy.scan()` or `buildResult()` in each strategy class. The architecture supports:
- Adding new strategies via `StrategyRegistry.register(new MyStrategy())`
- Scoring: strategies populate `score` field based on their logic
- AI scoring: `aiScore`, `aiConfidence` fields ready for R2-009B+
- Verification/Catalyst: `verificationScore`, `catalystScore` fields wired for VerificationEngine/CatalystDetectionService integration
- Risk scoring: `riskScore` field ready for risk engine integration

## Known Issues

- `YahooUnifiedAdapter.fetchCompany()` returns `marketCap: 0` and `sector: 'Unknown'` for BIST instruments. MarketCap and Sector fields in ScannerResult may be null/0 until a provider with richer BIST data is integrated.
- `MarketDataService.fetchLatest()` does not cache across scans; `MarketDataCacheService.getOrSet()` is used for within-scan dedup and cross-scan caching.
- Placeholder strategies return null scores; scoring logic arrives in R2-009A.
- The legacy `MarketScannerModule` controller (`@Controller('scanner')` in `market-scanner/`) was de-registered to free the `/scanner` route for the Elite Scanner. The engine and service remain intact in `MarketScannerModule`.