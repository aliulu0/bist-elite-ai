# Plan: R2-003 — Research Intelligence Layer (COMPLETED)

## Objective

Add a Research Intelligence Layer: SerpApi (Google Search / Google Finance / Google AI Mode) provider, research aggregator with dedupe + official-source scoring, 0-100 quality score, multi-source statement verification, 16-type catalyst detection (Turkish-aware), dashboard/company bundle REST endpoints, a new web panel, and two scheduler jobs. No changes to the existing Market Data interfaces.

---

## Files Created/Modified

### New Files (API)

| File | Purpose |
| ---- | ------- |
| `apps/api/src/modules/research/interfaces/research-intelligence.types.ts` | Research engine/source types, SerpApi shapes, verification, catalyst, aggregation, bundle, dashboard, provider-status contracts |
| `apps/api/src/modules/research/turkish-text.util.ts` | `normalizeTurkish()` — `toLocaleLowerCase('tr')`, `İ→i`, `I→ı` for Turkish dotless-I matching |
| `apps/api/src/modules/research/providers/serp-api.research-provider.ts` | `SerpApiResearchProvider` — 3 engines, quota tracking, circuit-breaker protected |
| `apps/api/src/modules/research/research-aggregator.service.ts` | Aggregation, official-domain scoring, dedupe |
| `apps/api/src/modules/research/research-score.service.ts` | 0-100 score + A/B/C/D grade |
| `apps/api/src/modules/research/research-verification.service.ts` | Statement verification (`verified/likely/unknown`) |
| `apps/api/src/modules/research/catalyst-detection.service.ts` | 16 catalyst types, Turkish-aware keyword matching |
| `apps/api/src/modules/research/research-intelligence.service.ts` | Orchestration, market dashboard + company bundle, caching (15m / 24h) |
| `apps/api/src/modules/research/research-intelligence.controller.ts` | REST endpoints (`GET /research/intelligence`, `/providers`, `POST /refresh`, `GET /:ticker`) |
| `apps/api/src/modules/research/dto/research-intelligence.dto.ts` | Swagger DTO types + query DTO |
| `apps/api/src/modules/research/research.module.ts` | Wiring + imports (`CircuitBreakerModule`, `MarketDataModule`) |
| `apps/api/src/modules/scheduler/jobs/research-refresh.job.ts` | 15-minute market dashboard refresh |
| `apps/api/src/modules/scheduler/jobs/company-research.job.ts` | 24-hour company bundle refresh for active symbols |

### New Files (Tests)

| File | Tests |
| ---- | ----- |
| `providers/serp-api.research-provider.spec.ts` | 9 |
| `research-aggregator.service.spec.ts` | 5 |
| `research-score.service.spec.ts` | 5 |
| `research-verification.service.spec.ts` | 4 |
| `catalyst-detection.service.spec.ts` | 5 |

### New Files (Web)

| File | Purpose |
| ---- | ------- |
| `apps/web/src/pages/research-intelligence.tsx` | Turkish panel: 4 stat cards, company search, catalyst list, latest research, provider status table |

### Modified Files

| File | Change |
| ---- | ------ |
| `apps/api/src/common/cache/cache.service.ts` | Registered `research:market` namespace |
| `apps/api/src/modules/research/research-cache.service.ts` | Added `research:market` namespace + `delete()` passthrough |
| `apps/api/src/modules/scheduler/scheduler.types.ts` | `JobName` union += `researchRefresh`, `companyResearch` |
| `apps/api/src/modules/scheduler/scheduler.config.ts` | Job configs for both new jobs |
| `apps/api/src/modules/scheduler/scheduler.engine.ts` | `ALL_JOB_NAMES` += both jobs |
| `apps/api/src/modules/scheduler/scheduler.controller.ts` | `VALID_JOB_NAMES` += both jobs |
| `apps/api/src/modules/scheduler/scheduler.module.ts` | New job classes + `ResearchModule` import |
| `apps/api/src/modules/scheduler/jobs/index.ts` | New job exports |
| `apps/api/src/modules/scheduler/__tests__/scheduler.integration.spec.ts` | Import `SymbolRegistryModule` for test graph DI |
| `apps/api/src/modules/scheduler/scheduler.service.spec.ts` | Job count 13 → 15 |
| `apps/web/src/lib/sdk.ts` | `researchIntelligence` sdkClient + typed API block |
| `apps/web/src/App.tsx` | Lazy route `/research-intelligence` |
| `apps/web/src/components/layout/sidebar.tsx` | Nav item `Araştırma İstihbaratı` (Radar icon) |
| `.env` | `SERPAPI_*` block |

---

## Research Features

- **SerpApi provider** (`SerpApiResearchProvider`): 3 engines — `google_search` (company/market/keyword), `google_finance` (financial snapshot), `google_ai_mode` (AI summary). Missing `SERPAPI_API_KEY` → reports `connected: false`; quota read from `SERPAPI_PLAN_LIMIT`. Circuit-breaker protected (failure threshold, recovery window, half-open).
- **Aggregator** (`ResearchAggregatorService`): merges search + companySearch + finance + news + KAP disclosures; normalizes to `ResearchEvidenceItem`; scores quality 0-100; marks official when source matches IR/official domains (`kap.org.tr`, `kamuyaydinlatma`, investor-relations paths, corporate `*.com.tr`); dedupes by title/URL; buckets by source type.
- **Score** (`ResearchScoreService`): 0-100 composite of source quality, count, official-source presence, freshness, duplicate ratio; grade `A` (≥80) / `B` (≥60) / `C` (≥40) / `D` (<40). Empty input → score 0 grade `D`. Clamped 0-100.
- **Verification** (`ResearchVerificationService`): tokenizes statement vs. evidence titles/snippets (Turkish-normalized); `verified` (official evidence + high overlap), `likely` (overlap, no official), else `unknown`; `verifiedSourceCount` for dashboard.
- **Catalyst detection** (`CatalystDetectionService`): 16 types — `new_investment`, `tender`, `government_contract`, `dividend`, `bonus_issue`, `capital_increase`, `patent`, `factory`, `partnership`, `ceo_change`, `spk_decision`, `foreign_investment`, `acquisition`, `merger`, `rnd`, `export_contract`. Keyword sets are Turkish-normalized.
- **AI summary**: prefers SerpApi `google_ai_mode`; falls back to evidence-based summary with sources, citations, and a confidence score derived from verified-source ratio + domain variety.
- **Cache**: market dashboard TTL 15 min (`research:market`), company bundle TTL 24 h (`research:company`). `refreshResearch()` deletes the market key then rebuilds.

## Catalyst Types (16)

| Type | Example TR triggers |
| ---- | ------------------- |
| `new_investment` | yatırım, yeni yatırım |
| `tender` | ihale |
| `government_contract` | kamu ihalesi, devlet sözleşmesi |
| `dividend` | temettü, kar payı |
| `bonus_issue` | bedelsiz sermaye artırımı |
| `capital_increase` | bedelli sermaye artırımı |
| `patent` | patent |
| `factory` | fabrika yatırımı |
| `partnership` | ortaklık, işbirliği |
| `ceo_change` | genel müdür değişikliği, CEO |
| `spk_decision` | SPK kararı |
| `foreign_investment` | yabancı yatırım |
| `acquisition` | satın alma |
| `merger` | birleşme |
| `rnd` | ar-ge, araştırma geliştirme |
| `export_contract` | ihracat sözleşmesi |

## Endpoints (all `@Public`)

| Method | Route | Description |
| ------ | ----- | ----------- |
| `GET` | `/research/intelligence` | Market dashboard (or company bundle when `?ticker=` given) |
| `GET` | `/research/intelligence/providers` | Provider statuses (connected, circuit, latency, requests, quota, cache) |
| `POST` | `/research/intelligence/refresh` | Invalidate + rebuild market dashboard |
| `GET` | `/research/intelligence/:ticker` | Company bundle (uppercase-normalized; 404-style null for unknown symbol) |

Responses include a `timestamp` field. Full response shapes: `ResearchIntelligenceDashboard`, `CompanyResearchBundle`, `ResearchProviderStatusEntry`.

## Provider Changes

- New provider family in `apps/api/src/modules/research/providers/`: `SerpApiResearchProvider` (reuses existing `CircuitBreakerModule` and `ResearchCacheService`).
- `ResearchProviderStatusEntry` exposes `connected`, `circuitState`, `latency`, `requests`, `errors`, `quota {used, limit}`, `lastSync`, `cacheStatus`.

## Scheduler Jobs

| Job | Interval | Action | Success |
| --- | -------- | ------ | ------- |
| `researchRefresh` | 15 min | `refreshResearch()` (invalidate + rebuild market dashboard) | metadata: `latestResearch.length`, `catalysts.length` |
| `companyResearch` | 24 h | `refreshCompanyResearch(activeSymbols)` | success when `failed === 0` |

## Env Config

```
SERPAPI_API_KEY=            # empty → provider reports disconnected, graceful
SERPAPI_BASE_URL=https://serpapi.com/search.json
SERPAPI_SEARCH_ENGINE=google
SERPAPI_FINANCE_ENGINE=google_finance
SERPAPI_AI_MODE_ENGINE=google_ai_mode
SERPAPI_PLAN_LIMIT=100      # quota limit for provider status
```

---

## Verification

- `pnpm --filter @bist-elite/api build` — passes (typecheck gate)
- `pnpm --filter @bist-elite/web build` — passes (tsc -b + vite)
- `pnpm --filter @bist-elite/api test -- --testPathPattern "(research|scheduler)"` — 18 suites / 190 tests pass
- Scheduler integration: `researchRefresh` and `companyResearch` register/start/stop cleanly (14 active jobs)

## Known Limitations

- **No live SerpApi key in `.env`** → provider runs disconnected; dashboard degrades to empty aggregation (score 0, no catalysts) until `SERPAPI_API_KEY` is set.
- **Google News provider** (`google-news.provider.ts`) relies on external RSS fetch; same degraded path when offline.
- **Verification** is heuristic (token overlap + official-source priority), not a fact-checking system.
- **AI summary** confidence is heuristic; real AI Mode output only when the AI-mode engine is reachable.
- **No pagination/rate-limit tuning** for SerpApi plan tiers beyond `SERPAPI_PLAN_LIMIT`.
- **Lint**: eslint not installed in the workspace — reported as unavailable.

## Suggested Next Task

**R2-004**: Production runtime verification — wire real `SERPAPI_API_KEY`, add live-source fixtures, and validate dashboard/company-bundle payloads against the running stack on localhost.
