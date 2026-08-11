# R2-002X-1 — End-to-End Data Flow Audit

**Sprint:** R2-002X-1 · **Type:** Audit only (no fixes applied)
**Date:** 2026-08-02 · **Environment:** localhost:3001 (`node dist/main.js`, PID 2072, `APP_ENV=development`)
**Mission:** Locate the exact bottleneck where production data stops reaching the Opportunity Engine, with evidence.

> Scope rule: this is an audit. Nothing was changed in this sprint. A prior in-progress edit
> to `pipeline-orchestrator.service.ts` was **reverted** so the audited system is the real,
> unmodified runtime.

---

## 1. Executive Summary

**Root cause: the pipeline's `aggregate` step has zero working data sources.**

`AggregationEngine` queries **only** the unified `MarketDataOrchestrator`, whose 5 providers
(fintables, finnhub, kap, mkk, tcmb) all lack credentials and all fail at runtime. The only
provider that actually works — **Yahoo Finance** — is wired into the **legacy registry path**
(`MarketDataService`), which is used by the `fetch_market_data` step, and is **never fed into the
unified orchestrator / aggregation engine**. As a result:

| Step | Input → Output (live evidence) |
|---|---|
| fetch_market_data | 47 symbols → ~11k candles **succeeds** (Yahoo) |
| normalize | passes |
| **aggregate** | **0/20 aggregated companies — every symbol fails** (`All providers failed … No valid responses`) |
| ai_analysis | 0 aggregated symbols → falls back to legacy `AnalysisService` on 10 symbols; all results weak (elite 22–42) |
| opportunity_detection | opportunity score **0 / NONE** for every symbol |
| scanner | **0 top candidates, 0 watchlist, 28/28 rejected** |
| ranking | **0 ranked** |

The pipeline then **reports 10/10 steps `completed`** (steps never throw; `fallback_no_service`
counts as success), so the failure is invisible to any observer. This is the primary
observability defect, and the reason the sprint's "pipeline executes successfully" statement
holds true while the Opportunity Engine stays empty.

**Responsible modules (primary):** `AggregationEngine` + `MarketDataOrchestrator` wiring
(`market-data.module.ts`); **secondary:** fabricated fallbacks in `PipelineOrchestratorService`
and `MacroService.getOpportunities` that mask the absence of data.

---

## 2. Provider Matrix (Phase 1)

| Provider | Adapter impl | Registered in `MarketDataProviderRegistry`? | Env key required | Key present in `.env`? | validateConnection | Live status |
|---|---|---|---|---|---|---|
| yahoo_finance | `YahooFinanceProvider` | **YES** (`market-data.module.ts:36`) | none | n/a | AAPL probe OK | **Healthy** — 57/57, avg 244 ms, p95 771 ms, reliability 98 (prior run) |
| fintables | legacy + `FintablesUnifiedAdapter` | no (legacy only `FUNDAMENTAL_PROVIDER`) | `FINTABLES_API_KEY` (or login creds) | **no** (commented out) | `GET /health` w/ empty key → false | Auth fails |
| finnhub | `FinnhubAdapter` | no | `FINNHUB_API_KEY` | **no** | `GET /quote?token=` → 401 | Circuit **OPEN** (111+ consecutive 401s) |
| kap | `KAPAdapter` | no | none (public API) | — | `GET /member/filter/THYAO` → likely **true** | Untested at runtime; only company + disclosures impl |
| mkk | `MKKAdapter` | no | `MKK_API_KEY` or `MKK_USERNAME`+`MKK_PASSWORD` (+ `MKK_SENDER_MEMBER`, `MKK_SENDER`) | **no** | `acquireToken()` → null | "MKK credentials not configured" |
| tcmb | `TCMBAdapter` | no | `TCMB_API_KEY` | **no** | EVDS w/ empty key → false | "TCMB_API_KEY not configured" |

Evidence: `GET /api/market-data/providers` returns **only** `[{ name: "yahoo-finance", healthy: true }]`.

**Phantom health names:** `investing` and `google_discovery` are seeded in
`provider-health-monitor.config.ts:28` but **no adapter class exists anywhere** in the repo.

---

## 3. Wiring Diagram (Who Feeds Whom)

```
LEGACY PATH  (works — Yahoo only)
  YahooFinanceProvider ──register──> MarketDataProviderRegistry  (only member)
        │
        └──> MarketDataService.fetchData()        <── fetch_market_data step (pipeline)
             market-data.service.ts:37

UNIFIED PATH  (feeds Opportunity Engine — ALL providers fail)
  FintablesUnifiedAdapter
  FinnhubAdapter            ──new MarketDataOrchestrator([...5])──> AggregationEngine
  KAPAdapter                market-data.module.ts:62-68            aggregation-engine.service.ts:40,55
  MKKAdapter                                                             │
  TCMBAdapter                                                    aggregate step (pipeline)

PipelineOrchestratorService.runFullPipeline (pipeline-orchestrator.service.ts:191)
  1. fetch_market_data  → MarketDataService (Yahoo)  ✔ works
  2. normalize          ✔
  3. aggregate          → AggregationEngine → orchestrator (5 unauthenticated) ✘ 0/20
  4. ai_analysis        → 0 aggregated → falls back to legacy AnalysisService, BIST_SYMBOLS[:10]
  5. opportunity_detection → OpportunityDetectionEngine (sync) → all NONE
  6. scanner            → ScannerEngine.scan(opportunities) → 0 candidates
  7. ranking            → RankingEngine.rank(candidates) → 0 ranked
  8. alerts / portfolio_refresh / macro_refresh → optional
```

**Key architectural finding:** the working provider (Yahoo) and the aggregation layer that the
Opportunity Engine depends on are on **two disconnected paths**. `AggregationEngine` only ever
sees the orchestrator's 5 providers (`aggregation-engine.service.ts:51-59`); it never calls
`MarketDataService`/Yahoo. And `MarketDataOrchestrator` contains no Yahoo adapter.

---

## 4. Stage-by-Stage Audit (Phases 2–8)

### 4.1 fetch_market_data — PASSES
- `pipeline-orchestrator.service.ts:284-336`. Fetches 47 hardcoded `BIST_SYMBOLS` (line 40) via `MarketDataService.fetchData(symbol, '1d')`.
- Live run: 47 symbols, `successCount` high, ~1.3 s total.
- Fabricated metadata (does NOT match real provider): `providers: ['fintables','finnhub']`, `healthyProviders: ['fintables']` (lines 320–321, 331). Real provider is Yahoo.

### 4.2 normalize — PASSES
- `pipeline-orchestrator.service.ts:338-378`. No-op validation; passes candles through.

### 4.3 aggregate — FAILS (the bottleneck)
- `pipeline-orchestrator.service.ts:380-430` → `AggregationEngine.aggregateCompany(symbol)` (line 404) → `orchestrator.fetchCompany(s)` (aggregation-engine.service.ts:55).
- Live logs: `MarketDataOrchestrator: All providers failed for <SYM> (company)` for every symbol; `AggregationEngine: No valid responses for <SYM> (company)`.
- Live run: `aggregate` took **28,767 ms**, `aggregatedSymbols` = 0. Hard cap of 20 symbols (`pipeline-orchestrator.service.ts:394`).
- **Result:** zero aggregated companies → zero `AiPipelineInput` → the entire downstream is starved.

### 4.4 ai_analysis — DEGRADED
- `pipeline-orchestrator.service.ts:438-481`. Because `state.aggregated` has no `company`, `aggregatedSymbols` is empty → falls back to `analysisService.analyzeSymbol` on `BIST_SYMBOLS.slice(0,10)` (line 447) — the **legacy** analysis pipeline, not the AI modules.
- `buildPipelineInput` returns `{ company }` only (line 435) — no balance sheet / income / cash flow / sector / disclosures even when aggregation succeeds.
- Legacy analysis output (live `GET /api/analysis/THYAO/opportunity`): financialScore 0 (D), technicalScore 0, opportunity 0 / NONE, elite 39 (C). `confluence` computed as 56.3 — **fabricated** "5 technical strengths / 5 weaknesses" despite zero indicators (see §6).

### 4.5 opportunity_detection — EMPTY
- `pipeline-orchestrator.service.ts:483-507`. Synchronous `OpportunityDetectionEngine.detect(result)` per AnalysisResult.
- Engine requires module scores > 60–70 to emit opportunity **types** (`opportunity-detection-engine.service.ts:281-300`) and confidence/level thresholds (`opportunity-detection.config.ts`). With analysis results at score 0 / NONE, **0 opportunities** are produced.

### 4.6 scanner — ALL REJECTED
- `pipeline-orchestrator.service.ts:509-528` → `ScannerEngine.scan(opportunities, 'FULL')`. With 0 opportunities → 0 candidates.
- **Legacy scanner** (the one the dashboard reads via `GET /api/scanner`, served by `market-scanner/scanner.controller.ts:21`, fed by `MarketOpenScanJob` via `AnalysisService.analyzeSymbol`): live state shows **28 symbols, 28 rejected** — `topCandidates: 0, watchlist: 0`, `avgEliteScore 35.57`, all below `minEliteScore: 60` (`scanner.config`). Reasons: "Financial quality below criteria", "Overall score too low for opportunity analysis".

### 4.7 ranking — EMPTY
- `pipeline-orchestrator.service.ts:530-559` → `RankingEngine.rank(state.candidates)`. With 0 candidates → **0 ranked**.
- **No REST controller exposes ranking** (`@Controller('ranking')` does not exist). `GET /api/ranking` → **404**; `GET /api/opportunities` → **404**. The frontend SDK instead calls `/analysis/{symbol}/opportunity`, `/macro/opportunities`, `/scanner`.

### 4.8 dashboard / frontend (Phase 7)
- Frontend (`apps/web/src/lib/sdk.ts`) reads: `/api/scanner`, `/api/scanner/top`, `/api/analysis/{sym}/opportunity`, `/api/macro/opportunities`, `/api/providers/health`, `/api/pipeline/status`.
- `/api/macro/opportunities` is **fabricated**: `MacroService.getOpportunities` returns a hardcoded `sampleTickers` array with hardcoded elite scores (AKBNK 78, GARAN 82, EREGL 65, THYAO 71, ASELS 88, KCHOL 74) — `macro.service.ts:278-309`. This is **not** derived from the Opportunity Engine.
- `/api/providers/health` reports 8 names; only `yahoo_finance` ever has live data. `investing`/`google_discovery` have no implementation; finnhub/kap/mkk/tcmb are never recorded (see §5).

### 4.9 observability (Phase 8)
- `GET /api/pipeline/status` after a run: `completedSteps: 10/10`, `failedSteps: 0`, `providerFailures: 0` — **all misleading** (see §5).
- `POST /api/pipeline/run` returns **HTTP 408** because `RequestTimeoutMiddleware` is 30 s (`security.config.ts:71`) and `aggregate` alone takes ~29 s. The 30 s timeout applies to **every** route (`.forRoutes('*')`, `security.module.ts:22-24`).

---

## 5. Pipeline Observability & Health Monitoring Defects

1. **Cosmetic step success.** Steps never throw on missing engines/data — `fallback_no_service` / empty results are recorded as `completed` (`pipeline-orchestrator.service.ts:219`, integration spec asserts 10/10 completed with **all** engines `undefined`: `__tests__/pipeline-orchestrator.integration.spec.ts:16-19,38-44`).
2. **Provider failure counters are not wired.** `providerFailures` comes from `metadata?.providerFailures` or `state.providerFailures` (set only in `fetch_market_data`, line 317) — aggregation failures are never counted → metrics report `providerFailures: 0` despite 100+ finnhub 401s.
3. **Health monitor is disconnected from real providers.** The 8-name list is hardcoded (`provider-health-monitor.config.ts:28`); the scheduler health job iterates the **registry** (only Yahoo — `provider-health-check.job.ts:31`); `MarketDataService.recordProviderRequest` only maps `yahoo-finance` and `fintables` (`market-data.service.ts:16-19`). Unified adapters' traffic never reaches the health monitor, and `investing`/`google_discovery` are phantoms.
4. **Cache read/write key mismatch.** `executeWithFallback` reads `cacheService.get('any', …)` (orchestrator:203) but writes `cacheService.set(provider.name, …)` (:225) → per-symbol data is effectively **never served from cache**.
5. **Provider config fields are decorative.** `market-data.config.ts` per-provider `timeout/retries/apiKey/baseUrl` are not injected into the adapters (`market-data.module.ts:56-60` constructs with no config); adapters hardcode 15000 ms / 3 retries and read env directly. Also `X_ENABLED !== 'false'` means all 5 unified providers are **enabled by default with empty keys**.
6. **Circuits are in-memory only** (`circuit-breaker.service.ts:12`), threshold 3, 5-min recovery, single half-open probe; nothing persists across restarts.
7. **Build is broken (pre-existing, unrelated to data flow):** `pnpm --filter @bist-elite/api build` fails with 17 TS errors in the untracked `research` module (`research.dto.ts` TS2564, `research-cache.service.ts` TS2307). The running API uses a stale `dist/`. No data-flow file is implicated.

---

## 6. Fabricated / Hardcoded Fallbacks (No-Mock-Fix Inventory)

These mask the data-flow failure and must be treated as defects (NOT used as "working data"):

| Location | Value | What it pretends |
|---|---|---|
| `pipeline-orchestrator.service.ts:287` | `providers: ['fintables','finnhub']` | providers when no MarketDataService |
| `pipeline-orchestrator.service.ts:320-321` | `providers: ['fintables','finnhub']`, `healthyProviders: ['fintables']` | provider status on every fetch |
| `pipeline-orchestrator.service.ts:383` | `avgQualityScore: 85` | aggregation quality fallback |
| `pipeline-orchestrator.service.ts:695-704` | `?? 50` scores / `?? 50` confidence on all 10 modules | AI module results |
| `pipeline-orchestrator.service.ts:736-737` | `?? 50` eliteScore / confidence | final elite score |
| `pipeline-orchestrator.service.ts:770` | `qualityScore ?? 70` | aggregation quality in providerMetadata |
| `macro.service.ts:278-309` | hardcoded `sampleTickers` with elite scores | macro-driven opportunities on the dashboard |
| `analysis.service.ts` sub-methods | zero-out financial/technical scores | (real handlers, but degrade to 0 without data) |

---

## 7. Root Cause Statement

**Primary:** `AggregationEngine`/`MarketDataOrchestrator` are the point where production data dies.
The unified provider set (fintables, finnhub, kap, mkk, tcmb) has **no credentials** configured
and every one of its `fetch*` methods returns null/fails at runtime; the single working provider
(Yahoo) is isolated on the legacy registry path and is never offered to the aggregation engine.
Therefore `aggregate` yields 0 companies, `ai_analysis` gets no real aggregated input,
`opportunity_detection` produces nothing, and the Opportunity Engine — and every downstream
consumer (scanner, ranking, dashboard) — receives zero opportunities.

**Secondary (why it looks OK):** fabricated fallbacks and cosmetic "completed" steps in
`PipelineOrchestratorService`, and hardcoded sample opportunities in `MacroService`, make the
system appear healthy while the real data chain is empty. The health monitor never sees the 5
unified providers' failures.

**Impact of fixing credentials alone:** finnhub + fintables keys would start feeding `aggregate`,
but Yahoo still would not participate, KAP/MKK/TCMB would still be partial or absent, and the
observability/cosmetic-success defects would still hide residual failures. A full fix requires
wiring the orchestration path AND removing the fabricated fallbacks AND fixing health monitoring.

---

## 8. Recommendations (not applied — audit only)

1. **Feed the aggregation layer with a working source.** Register a Yahoo adapter (or equivalent)
   into `MarketDataOrchestrator`, or make `AggregationEngine` also consult `MarketDataService`.
   This is the single highest-leverage fix.
2. **Remove fabricated fallbacks** listed in §6 (use `0`/empty and report truthfully).
3. **Make step status truthful:** a step that produced 0 results or `fallback_no_service` must not
   be recorded `completed`; add in/out record counts per step.
4. **Register unified providers in the health monitor** (and remove `investing`/`google_discovery`
   or implement them) so 401/circuit state is visible on `/api/providers/health`.
5. **Fix the cache read/write key mismatch** (orchestrator `'any'` vs `<provider>`).
6. **Inject `market-data.config.ts` values** into the adapters; disable providers without keys
   (`X_ENABLED=false`) instead of running them enabled-by-default.
7. **Expose ranking/opportunity REST endpoints** or align the frontend SDK to what exists.
8. **Fix the pre-existing `research` module build errors** so `pnpm build` passes again.
9. **Persist circuit-breaker state** across restarts to avoid post-restart 401 storms.

---

## 9. Verification Performed

- `GET /api/providers/health` — 8 names, all `unknown` (fresh process; only Yahoo ever populated).
- `GET /api/market-data/providers` — `[{ yahoo-finance: healthy }]`.
- `GET /api/scheduler` — running; `providerHealthCheck` executes every 300 s (iterates registry only).
- `POST /api/pipeline/run` — HTTP 408 after 30 s; background run completed: 10/10 steps "completed",
  `aggregate` 28,767 ms, `providerFailures: 0`, all aggregation calls logged as failed.
- `GET /api/scanner` — 28 symbols, 0 top, 0 watchlist, 28 rejected.
- `GET /api/analysis/THYAO/opportunity` — opportunity 0 / NONE; elite 39 C.
- `GET /api/macro/opportunities?eliteScore=75` — hardcoded sample list.
- `GET /api/ranking` → 404; `GET /api/opportunities` → 404.
- `pnpm --filter @bist-elite/api build` — **FAILS** (17 pre-existing TS errors in `research` module).

---

## 10. Evidence Sources (file:line)

- `apps/api/src/modules/market-data/market-data.module.ts:36` — only Yahoo registered; `:56-68` orchestrator construction.
- `apps/api/src/modules/market-data/market-data.provider-registry.ts:37-47` — active provider selection.
- `apps/api/src/modules/market-data/aggregation/aggregation-engine.service.ts:51-59` — aggregation queries orchestrator only.
- `apps/api/src/modules/market-data/orchestrator/market-data-orchestrator.ts:197-244` — fallback loop; cache key mismatch :203/:225.
- `apps/api/src/modules/pipeline-orchestrator/pipeline-orchestrator.service.ts:284-336,380-430,438-481,483-507,509-528,530-559`.
- `apps/api/src/modules/provider-health-monitor/provider-health-monitor.config.ts:28` — 8 hardcoded names.
- `apps/api/src/modules/scheduler/jobs/provider-health-check.job.ts:31` — iterates registry only.
- `apps/api/src/modules/scheduler/jobs/market-open-scan.job.ts:36,55` — legacy scanner feed.
- `apps/api/src/modules/market-scanner/scanner.controller.ts:21` — dashboard scanner source.
- `apps/api/src/modules/macro/macro.service.ts:278-309` — hardcoded sample opportunities.
- `apps/api/src/common/security/security.config.ts:71` + `security.module.ts:22-24` — 30 s global timeout.
- `apps/api/src/modules/opportunity-detection/opportunity-detection-engine.service.ts:281-300` — type thresholds.
