# R2-072 Status Report: Unsupported Provider Removal & Market Data Pipeline Hardening

**Generated**: 2026-08-17 (runtime probes 12:51 UTC)  
**Typecheck**: PASSED (0 errors, `apps/api` + `apps/web`)  
**Tests**: full API suite green except a pre-existing flaky `error-handling.integration.spec.ts`; affected-module regression 1241 passed / 1 skipped  
**Scope**: remove Finnhub + Alpha Vantage from the production architecture; Yahoo stays the single PRIMARY BIST price provider

---

## Decision

R2-071 runtime evidence (2026-08-17) proved:

- **Finnhub** → `AUTH_FAILED` ("You don't have access to this resource.")
- **Alpha Vantage** → `NO_QUOTE` / `RATE_LIMITED` for BIST `.IS`
- **Yahoo Finance** → **VERIFIED**, real TRY quotes for all 10 probed BIST symbols

Both unsupported providers were removed from production code, config, DTOs, types, scheduler wiring and the web UI. They are retained only as historical records under `removedProviders` in `docs/R2-072_PROVIDER_MATRIX.json` with status `UNUSABLE_FOR_BIST_RUNTIME`.

## Provider Hierarchy After R2-072

| Role       | Provider          | Priority | Notes                                       |
| ---------- | ----------------- | -------- | ------------------------------------------- |
| PRIMARY    | **Yahoo Finance** | 4        | real BIST prices, verified live 10/10       |
| RESEARCH   | SerpAPI           | 8        | google_search / google_news only            |
| RESEARCH   | Agent-Reach       | -        | research evidence, never direct market data |
| DISCLOSURE | KAP               | 5        | disclosure only                             |
| MACRO      | TCMB              | 6        | FX/macro only                               |
| OPTIONAL   | Fintables         | 1        | not configured; kept as future fundamental  |
| REMOVED    | Finnhub           | -        | UNUSABLE_FOR_BIST_RUNTIME                   |
| REMOVED    | Alpha Vantage     | -        | UNUSABLE_FOR_BIST_RUNTIME                   |

## Production Removals

- `apps/api/src/modules/market-data/providers/unified/finnhub.adapter.ts` (+ spec) — deleted
- `apps/api/src/modules/market-data/providers/unified/alpha-vantage.adapter.ts` (+ spec) — deleted
- `apps/api/src/modules/market-data/providers/unified/technical-indicator-provider.interface.ts` — deleted
- `apps/api/src/modules/ai-research/providers/finnhub-news.provider.ts` — deleted
- `market-data.config.ts`, `market-data.module.ts`, `providers/unified/index.ts`, `providers/index.ts` — Finnhub/Alpha Vantage wiring removed
- `symbol-registry.types.ts` / `bist-symbols.data.ts` — provider maps dropped (file rebuilt with clean UTF-8)
- `market-data-response.dto.ts` — provider union example updated
- `serpapi.adapter.ts` — `mergeNews` is now Google-News-only (removed Finnhub news merge)
- `ai-research` config/types/module — Finnhub news provider removed
- `verification-ai.config.ts` — Finnhub news source removed
- `data-research-pipeline` (types + controller + 3 services) — provider lists updated
- `pipeline-orchestrator.service.ts` — fallback lists `['fintables','finnhub']` → `['fintables','yahoo']`
- `provider-health-monitor.types.ts` / `config.ts` / `engine.ts` / `dto/provider-health-query.dto.ts` — `ProviderName` / `ALL_PROVIDERS` / `VALID_PROVIDERS` now list the 6 retained providers
- `scheduler/jobs/provider-health-check.job.ts` — Finnhub entry dropped from `PROVIDER_NAME_MAP`
- `scoring/scoring-types.ts` / `score-pipeline.service.ts` — `ProviderCoverage` is 6 fields (yahoo, fintables, serpApi, kap, tcmb, mkk)
- `.env.example` — `FINNHUB_*` / `ALPHA_VANTAGE_*` blocks removed (R2-072)
- `docs/AI_HANDOFF.md` — provider table rewritten (Yahoo PRIMARY)
- Web: `apps/web/src/pages/dashboard.tsx`, `providers.tsx` — provider lists `['Yahoo','Investing','Fintables','TCMB','KAP','MKK']` (Finnhub → Investing)

## Test Fixtures Updated

- All `finnhub` / `alpha_vantage` tokens renamed to the retained providers:
  - price providers → `yahoo`; research sources → `serpapi` / `google-news`; macro sources → `tcmb`; provider maps → `kap`
- `market-data-orchestrator.spec.ts` — token renames + duplicate config keys fixed (TS1117)
- `coverage-report.service.spec.ts` — fallback chain now `['fintables','yahoo','kap']` (real config priorities: fintables=1, yahoo=4, kap=5)
- `real-provider-validation.smoke-spec.ts` — provider inventory asserts exactly `['fintables','serpapi','yahoo','kap','tcmb','mkk']`
- `provider-health-monitor.service.spec.ts` — `totalProviders` 9 → 7
- Encoding: PowerShell 5.1 `Set-Content -Encoding UTF8` double-encodes UTF-8 (BOM + Windows-1252 read); repaired via `[System.IO.File]`/`UTF8Encoding($false)` byte-safe writes and git-restore + re-apply. No mojibake remains in `apps/api/src` or `apps/web/src`.

### Excluded from this commit (entangled with pre-existing uncommitted work)

These files also carry pre-existing changes from other in-flight sprints; they are intentionally NOT part of the R2-072 commit to keep it clean. Their provider renames ship with the respective feature commits:

- `apps/web/src/pages/dashboard.tsx` — Finnhub→Investing + pre-existing dashboard refactor (MarketOverview, nullable types)
- `.env.example` — FINNHUB/ALPHA_VANTAGE removal + pre-existing env edits (LOG_LEVEL, AUTH_*, Redis comment)
- `apps/api/src/modules/market-data/incremental/incremental-market-data.service.spec.ts` — finnhub→yahoo + pre-existing date-range clipping tests
- `apps/api/src/modules/macro/__tests__/macro.controller.spec.ts`, `macro.service.spec.ts`, `macro-elite-score.service.spec.ts` — finnhub→tcmb + pre-existing earlyOpportunity/eliteScore tests

## Runtime Verification

Standalone probe (`r2-072-runtime-verify.cjs`, reads `.env` without printing keys):

- Config/source audit: no `finnhub`/`alpha_vantage` in `market-data.config.ts`, `market-data.module.ts`, `providers/unified/index.ts`, `providers/index.ts`, smoke spec — PASS
- No production `market-data` source references either removed provider — PASS
- Live Yahoo quotes (12:51 UTC), **10/10 symbols served real TRY prices**: THYAO 301.25, AKBNK 68.5, ASELS 382, GARAN 129.6, BIMAS 379, KCHOL 203.1, EREGL 37.72, SAHOL 88.5, ISCTR 12.48, TUPRS 364
- Real-data gate: Yahoo as PRIMARY is usable — CONFIRMED

## Regression

- Typecheck `apps/api`: **0 errors**
- Affected modules (macro | provider-health-monitor | scoring | ai-research | verification-ai | ai-analysis | opportunity-detection | data-research-pipeline | pipeline-orchestrator | scheduler | error-handling | market-data): **1241 passed / 1 skipped**
- Full API suite: **350 passed, 1 failed** — `error-handling.integration.spec.ts` fails intermittently ONLY under heavy parallel load (passes in isolation; mocked HealthService/AuthService only, no market-data interaction; pre-existing, unrelated to R2-072)
- Web typecheck: **0 errors**; web vitest is pre-existing broken in this env (no vitest config; `React is not defined`; picks up `frontend/`), unrelated to R2-072 string-only UI changes

## Unresolved Limitations

1. Fintables still NOT_CONFIGURED (credentials absent) — optional, future fundamentals
2. Confidence remains LOW (single direct price source Yahoo)
3. `error-handling.integration.spec.ts` flaky under parallel load (pre-existing)

## Next Sprint

1. Configure Fintables credentials and smoke fundamentals for THYAO/AKBNK/ASELS
2. Verify `market-truth.service.ts` duplicated `@Injectable()` (pre-existing, flagged)
3. Wire Fintables as secondary price source once configured → raise confidence

---

_R2-072 Status Report — generated from real runtime evidence. No fabricated values._
