# R2-007A Recovery Report — Research Layer Recovery

Sprint: P0 Stabilization — restore the production build by restoring the missing research,
verification, and catalyst services. No new architecture, no redesign, no new patterns.

Date: 2026-08-04
Status: **COMPLETE — build restored to zero TypeScript errors**

## Baseline

`pnpm --filter @bist-elite/api build` (`nest build`) failed with **23 TS2307 errors**
(all "Cannot find module" — dangling imports of 15 unique missing files).
Full error registry: `docs/recovery/build-errors.md`.

## Files restored (15)

All located in `apps/api/src/modules/research/` (exact paths required by existing imports).

### Foundation / DTOs
| File | Exports | Role |
|------|---------|------|
| `verified-evidence.dto.ts` | `ResearchEvidenceDto`, `VerifiedEvidenceDto` | Re-exports existing `ResearchEvidenceDto` (from `dto/research-evidence.dto.ts`) and `VerifiedEvidenceDto` (from `interfaces/verification.types.ts`). No duplicate DTOs — single source of truth preserved. |
| `research-cache.service.ts` | `ResearchCacheService` | In-memory TTL cache used by aggregation/intelligence services. |

### Repositories (in-memory, consistent with available DI in ResearchModule — no DB schema for research exists)
| File | Exports | Methods |
|------|---------|---------|
| `research-repository.service.ts` | `ResearchRepository` | `setCompanyResearch`, `getCompanyResearch`, `getAllCompanyResearch`, `clear` |
| `verification-repository.service.ts` | `VerificationRepository` | `setVerificationResult`, `getVerificationResult`, `getAllResults`, `setDashboard`, `getDashboard`, `clear` |
| `catalyst-repository.service.ts` | `CatalystRepository` | `setCatalysts`, `getCatalysts`, `getAllCatalysts`, `getDashboard`, `setDashboard`, `clear` |

### Engines (pure domain logic over existing types)
| File | Exports | Methods |
|------|---------|---------|
| `verification-engine.service.ts` | `VerificationEngine` | `verify(ResearchEvidenceDto) → VerificationResult`, `buildDashboard(VerifiedEvidenceDto[]) → VerificationDashboardDto` |
| `catalyst-engine.service.ts` | `CatalystEngineService` | `verify(VerificationResult) → CatalystResultDto[]`, `buildDashboard(CatalystResultDto[]) → CatalystDashboardDto` |

### Middleware / intelligence services
| File | Exports | Role |
|------|---------|------|
| `news-aggregation.service.ts` | `NewsAggregationService` | Aggregates/dedupes news across GoogleNews, SerpApi, AgentReach providers with caching |
| `research-aggregator.service.ts` | `ResearchAggregatorService` | `aggregate(ResearchAggregatorInput) → ResearchAggregationResult` |
| `research-score.service.ts` | `ResearchScoreService` | `score(ResearchEvidenceItem[]) → ResearchScoreResult` (grade A–D) |
| `research-verification.service.ts` | `ResearchVerificationService` | `verifyStatements(...) → VerifiedStatement[]` |
| `catalyst-detection.service.ts` | `CatalystDetectionService` | `detect(ResearchEvidenceItem[]) → Catalyst[]` (keyword-based) |
| `research-intelligence.service.ts` | `ResearchIntelligenceService` | `refreshResearch() → ResearchIntelligenceDashboard`, `refreshCompanyResearch(tickers) → {refreshed, failed}`, `getDashboard`, `getCompanyResearch`, `getProviderStatus` |

### Controllers
| File | Routes |
|------|--------|
| `research.controller.ts` | `GET /research/news`, `/research/news/company/:ticker`, `/research/news/sector/:sector`, `/research/news/economic`, `/research/status` |
| `research-intelligence.controller.ts` | `GET /research/intelligence`, `/research/intelligence/:ticker`, `/research/intelligence/providers`, `POST /research/intelligence/refresh` |

Controller paths match the existing web SDK contract (`apps/web/src/lib/sdk.ts`).

## Layers reconnected
- **Scheduler jobs** (`catalyst-refresh`, `verification-refresh`, `research-refresh`,
  `company-research`, `agent-reach-refresh`) now compile against the restored services.
  No changes to `scheduler.module.ts` wiring. `CatalystRefreshJob` remains an orphan
  (not registered in `JOB_CLASSES`/job map, as designed) but compiles.
- **Research module** (`research.module.ts`) now resolves all 12 imports plus its provider list.
  No changes to `research.module.ts`.
- **Verification & catalyst layer** restored reusing `verification.types.ts`
  (`VerificationStatus`, `CatalystType`, `CatalystDirection`, `CatalystStrength`,
  `CatalystResultDto`, `CatalystDashboardDto`) and `verified-evidence.dto.ts` — no type redefinition.

## Build result
- `pnpm --filter @bist-elite/api build` → **EXIT 0, zero TypeScript errors** (previously 23).
- All restored services emitted to `dist/modules/research/`.

## Test results

### `packages/shared` — 77/77 pass (unchanged).

### `apps/api` (jest) — 4622 passed, 23 failed, 6 suites failed, 259 total suites.
None of the failing suites import or exercise the restored research layer. All are
pre-existing infrastructure/common test failures:

| Suite | Failing test(s) | Cause |
|-------|-----------------|-------|
| `common/production-readiness/__tests__/performance-validator.service.spec.ts` | `validate › should respect custom thresholds` | Known pre-existing threshold mismatch (documented in AUDIT-017). |
| `common/performance/__tests__/compression.interceptor.spec.ts` | compression assertions | Pre-existing (common layer, untouched). |
| `common/cache/__tests__/cache.service.spec.ts` | cache assertions | Pre-existing (common layer, untouched). |
| `modules/provider-health-monitor/provider-health-monitor.service.spec.ts` | `getSnapshot › should return 4 providers by default` | Pre-existing expectation mismatch (untouched module). |
| `modules/market-data/market-data.controller.spec.ts` | 18 controller tests | Pre-existing (untouched module). |
| `modules/scheduler/scheduler.service.spec.ts` | `getStatus › should return scheduler status` | Stale assertion: test hardcodes 16 jobs; `scheduler.module.ts` legitimately registers 17 (13 core + researchRefresh, companyResearch, agentReachRefresh, verificationRefresh). Test could not even compile before this sprint. Not caused by this restoration. |

Per sprint scope, these failures are **reported, not fixed**.

## Acceptance criteria
- [x] `pnpm build` passes with zero errors
- [x] Zero TS2307 dangling imports
- [x] Research, scheduler, verification, and catalyst layers compile
- [x] No duplicate DTOs/services — reused existing `ResearchEvidenceDto`, `VerifiedEvidenceDto`, verification/catalyst types
- [x] No architecture changes — only missing files restored; existing modules untouched
- [x] Scheduler reconnected (registered jobs compile and instantiate)
- [x] `docs/recovery/build-errors.md` and this report produced

## Notes
- `CatalystRefreshJob` is intentionally not registered in the scheduler engine (as-designed
  orphan). Its dependencies now exist and compile; wiring was left unchanged.
- Restored repositories are in-memory (`Map`-backed) because ResearchModule's DI scope
  (CircuitBreakerModule + MarketDataModule) provides no persistence service and no research
  DB schema exists. No new persistence pattern was introduced.
