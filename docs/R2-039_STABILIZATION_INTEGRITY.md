# R2-039 Stabilization & Pre-Pipeline Integrity

## Overview

Stabilization sprint ahead of the incremental / real market-data pipeline (R2-040). Goal: make the whole API **type-clean**, make **caching actually work everywhere it is used**, make the DTO/API contracts compile and remain wire-compatible, and prove the pipeline is ready for real data. No new engines, no redesigned architecture, no breaking endpoint changes.

Priorities honored: correctness > features, stability > new engines, reuse > duplication, real data > mock. No `@ts-ignore`, no `@ts-expect-error`, no untyped `any` was introduced.

## Outcome

- **Whole-API type integrity restored:** `tsc --noEmit -p apps/api/tsconfig.json` exits 0 (was 6 errors at sprint start).
- **Cache integrity fixed:** 6 namespaces used by production services were never registered, so caching **silently no-oped** for them. All are now registered and covered by a regression test.
- **3 broken test suites repaired** (2 real test/implementation contract bugs + 1 flaky timing suite identified).
- **Full API regression:** 322/323 suites, 5453/5454 tests GREEN. The single remaining failure is a timing-sensitive dedup test that passes reliably in isolation (parallel-load flakiness only).

## Issues Found & Fixed

### 1. Pre-existing whole-project type errors (6) — FIXED

`tsc --noEmit -p apps/api/tsconfig.json` reported 6 errors at sprint start, all in untracked files:

| File | Error | Fix |
|---|---|---|
| `modules/financial-rules/financial-data-quality.service.ts(2,30)` | TS2307 cannot find `../../../common/cache/cache.service` | Path corrected to `../../common/cache/cache.service` |
| `modules/financial-rules/financial-data-quality.service.ts(14,33)` | TS2307 cannot find `../../market-data/interfaces/market-data.types` | Path corrected to `../market-data/interfaces/market-data.types` |
| `modules/financial-rules/financial-data-quality.service.ts(15,29)` | TS2307 cannot find `../../ai-research/ai-research.types` | Path corrected to `../ai-research/ai-research.types` |
| `modules/financial-rules/financial-data-quality.types.ts(1,33)` | TS2307 cannot find `../../market-data/interfaces` | Path corrected to `../market-data/interfaces` |
| `modules/financial-rules/financial-data-quality.types.ts(2,29)` | TS2307 cannot find `../../ai-research/ai-research.types` | Path corrected to `../ai-research/ai-research.types` |
| `modules/ai-early-opportunity/dto/early-opportunity.dto.ts(159,24)` | TS2449 class `FinancialDataQualityReportDto` used before its declaration | Quality DTO block (`FreshnessReportDto`, `MarketIntegrityReportDto`, `FundamentalQualityReportDto`, `ProviderSummaryDto`, `FinancialDataQualityReportDto`) moved above `EarlyOpportunityIntelligenceDto` |

All import targets were verified to exist and export the referenced symbols (`CacheService`, `MarketDataPoint`, `AIConsensus`). The DTO reorder preserves every field and the `static from(...)` mapping verbatim — wire contract unchanged.

### 2. Cache integrity — 6 orphan namespaces (caching silently disabled) — FIXED

`CacheService` only honors namespaces registered in its constructor; unregistered namespaces make `get()` miss and `set()` silently return `false`. Six production namespaces were used but never registered, meaning those services cached **nothing**:

| Namespace | Used by |
|---|---|
| `financialDataQuality` | `financial-rules/financial-data-quality.service.ts` |
| `source-quality` | `data-research-pipeline/services/source-quality.service.ts` |
| `research-evidence` | `data-research-pipeline/services/research-evidence.service.ts` |
| `data-health` | `data-research-pipeline/services/provider-health.service.ts` |
| `data-freshness` | `data-research-pipeline/services/data-freshness.service.ts` |
| `agent-reach` | `data-research-pipeline/providers/agent-reach.adapter.ts` |

Fix in `common/cache/cache.service.ts`: all six now registered against the existing strategy configs (`scores` for `financialDataQuality`, `research` for the data-research-pipeline namespaces). A regression test was added to `cache.service.spec.ts` asserting every production namespace actually stores/reads.

### 3. Broken cache tests — FIXED

`common/cache/__tests__/cache.service.spec.ts` had 2 tests that could never pass against the real default config:

- **"evicts when max entries reached"** constructed `new CacheService()` (default `maxEntries: 10_000`) then asserted ≤ 3 entries — impossible. Now passes `getCacheConfig({ maxEntries: 3 })`.
- **"does not store when disabled"** constructed `new CacheService()` (default `enabled: true`) then asserted nothing is stored — impossible. Now passes `getCacheConfig({ enabled: false })`.

To enable both, `CacheService` gained an `@Optional()` constructor param (`constructor(@Optional() config?: CacheConfig)` with `config ?? getCacheConfig()` fallback), matching the codebase's optional-DI convention. The Nest module's `useFactory: () => new CacheService()` is unaffected.

### 4. Compression interceptor test/implementation contract mismatch — FIXED

`common/performance/__tests__/compression.interceptor.spec.ts` expected `Content-Encoding: gzip/br` on 200-byte payloads, but the interceptor's compression threshold is **1024 bytes** — the tests could never pass. Payloads raised to 2048 bytes so the tests exercise the actual contract (gzip, brotli, and skip-without-accept-encoding).

### 5. Performance validator "custom thresholds" test was untestable — FIXED

`common/production-readiness/performance-validator.service.ts` had no way to inject thresholds; the spec's "should respect custom thresholds" test constructed the service with only metrics and could never reach `WARN`. Following the optional-constructor convention, the service now accepts an optional thresholds override:

```ts
constructor(metricsService: MetricsService, @Optional() thresholds?: Record<string, number>)
```

with `{ ...DEFAULT_THRESHOLDS, ...thresholds }`. The test now passes tight thresholds and asserts `WARN`. Production DI behavior unchanged.

## Integrity Verifications

- **Provider request integrity (Phase 7):** `MarketDataOrchestrator` is the single fetch path; `executeWithFallback`, `fetchLatestPrice`, and `fetchHistoricalData` all read the `'any'` cache namespace first, dedupe concurrent calls via `RequestDeduplicatorService`, and store via `cacheStore` under both `'any'` and provider keys. One fetch per symbol/type confirmed (25 market-data suites / 407 tests GREEN).
- **Early Opportunity + Signal contract (Phase 4-5):** `EarlyOpportunityIntelligenceResult` ↔ DTO mapping is type-enforced (`tsc` clean); the scanner reuses existing engine outputs and the `earlySignals` namespace was already registered.
- **No-suppression scan:** no `@ts-ignore` / `@ts-expect-error` anywhere in `apps/api/src`.
- **Financial Data Quality:** added the first spec for `financial-data-quality.service.ts` (7 tests: verified status, missing-price degradation, OHLC integrity, fallback conflicts, missing-field completeness, cache reuse via the `financialDataQuality` namespace, Turkish explanation).

## Test Results

- **Typecheck:** `tsc --noEmit -p apps/api/tsconfig.json` → exit 0 (whole API).
- **Cache:** 4 suites / 69 tests GREEN.
- **Financial rules (incl. new FDQ spec):** 9 suites / 145 tests GREEN.
- **Early Opportunity + signals + portfolio-intelligence + ai-research + research:** 36 suites / 467 tests GREEN.
- **Market data:** 25 suites / 407 tests GREEN.
- **Full API regression:** 322/323 suites, 5453/5454 tests GREEN.
  - Remaining: `modules/market-data/dedup/request-deduplicator.service.spec.ts` — 1 timing-sensitive test fails only under full parallel load; passes 3/3 in isolation. Pre-existing flakiness, unrelated to this sprint's changes.

## Readiness for R2-040 (Incremental / Real Market Data Pipeline)

- The whole API typechecks; all production cache namespaces are now live, so repeated real-data fetches will actually be served from cache (previously several pipeline services silently bypassed caching).
- `MarketDataOrchestrator` already provides cache-first fetch, deduplication, circuit breaking, validation gating, and provenance metadata — the incremental layer can build on it without new infrastructure.
- Data-quality gating (`financialDataQuality` + signal strength caps) is exercised by tests and ready to constrain incremental data ingestion.

## KAP Readiness

- Catalyst signals consume existing KAP / Research Hub evidence (`material_disclosure`, `contract_catalyst`, `capital_action_catalyst`, etc.) — no new news pipeline needed.
- `kap` provider adapter is covered by market-data suites and routes through the same orchestrator cache/dedupe path; no changes required for KAP integration.
- See `docs/R2-031_DATA_RESEARCH_PIPELINE.md` and `docs/MULTI_SOURCE_DATA_ARCHITECTURE.md` for the existing provider topology.

## Known Remaining (Out of Scope)

- `request-deduplicator.service.spec.ts` timing flakiness under full parallel load (passes in isolation).
- Revenue-growth / margin / sector-relative signal unavailability remains (provider data follow-up, recorded in R2-038).
- `data-research-pipeline` services have no dedicated spec files (their cache namespaces are covered by the new `cache.service.spec.ts` regression test).
