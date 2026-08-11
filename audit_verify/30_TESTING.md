# 30. TESTING

## 30.1 Frameworks & tooling

- **Jest** (api + web), **Vitest** (shared, ui?, decision).
- Coverage: shared 77/77, decision 26/26, analyst+elite-score+opportunity+tomorrow+entry 150/150, portfolio-engine+portfolio-optimization+serpapi+indicator-engine 89/89, web vite-proxy 12/12 (all spot-verified GREEN this audit).
- Root `pnpm test` exists via turbo.

## 30.2 Verified results (this audit, Windows)

| Scope | Result | Note |
|---|---|---|
| `pnpm build` (turbo) | **GREEN** | 5/5 tasks (api, web, ui, shared, telegram); `nest build` clean |
| shared (vitest) | 77/77 GREEN | |
| decision (jest) | 26/26 GREEN | |
| analyst+elite-score+opportunity+tomorrow+entry | 150/150 GREEN | |
| portfolio-engine+portfolio-optimization+serpapi+indicator-engine | 89/89 GREEN | |
| web vite-proxy | 12/12 GREEN | |
| **root `pnpm test` (whole)** | **FAILS** | `@bist-elite/ui` → `No test files found, exiting with code 1` |
| Full API suite (269 spec files) | **HANGS** on Windows | passes per-module |
| Full web suite (204 test files) | **HANGS** on Windows | passes per-module |

## 30.3 Findings

1. **M5 — `pnpm test` broken at root** because `packages/ui` has no test files → turbo exits 1. Every module individually is green, but the canonical command fails → CI "test" gate is red.
2. **Full-suite hang on Windows** — running all API/web specs together hangs (per-module green). Doc baseline (3852/3857 = 99.86%) is not reproducible in a single run on this machine.
3. **Test count vs doc baseline:** current suite ≈ 2,885+ tests across verified modules; docs claim 3,857. Difference unexplained (30_TESTING: could be worker/web integration tests not enumerated).
4. **Frontend pages untested** — web suite is vite-proxy/config tests only; no component tests.
5. **Coverage thresholds** — no enforced `coverageThresholds` found in jest configs → coverage can regress silently.
6. **E2E absent** — no Playwright/Cypress for web + API flows; no telegram e2e.
7. **Pipeline integration test absent** — chain steps unit-tested individually (10_PIPELINES).

## 30.4 Verdict

Unit coverage is strong and green module-by-module. The release-critical issue is that the **canonical test command fails** (M5) and full-suite single-run is unreliable on Windows.
