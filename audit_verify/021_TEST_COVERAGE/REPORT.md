# 021 — TEST COVERAGE AUDIT

## Verdict: BROAD COVERAGE, 5 FAILING TESTS, NO THRESHOLDS (78/100)

## Test Inventory

| Scope | Spec files | Approx tests | Status |
|---|---|---|---|
| apps/api | 306 | ~3,850–4,160 | 5 failing (3 suites), rest pass |
| apps/web | 13 | ~184 | Passing (1902/1902 per docs) |
| frontend (legacy) | 19 | ~66 | **0 tracked in git** (untracked app) |
| apps/telegram | 0 | 0 | None |
| apps/worker (pytest) | 6 | ~30+ | Present |
| tests/ (root e2e) | 3 | ~203 | **Orphaned — not wired into CI/jest config** |
| **Total** | **~347** | **~4,100–4,500** | — |

## Observed Results (test-results*.txt)

| File | Suites pass/fail | Tests pass/fail | Time |
|---|---|---|---|
| test-results.txt | 199/3 | 3,852/5 | 437.6s |
| test-results-f13004.txt | 203/3 | 3,993/5 | 366.8s |
| test-results-f13005.txt | 205/3 | 4,082/5 | 303.1s |
| test-results-f14001.txt | 207/3 | 4,159/5 | 354.2s |

## Consistent Failing Tests (same 3 suites every run — NOT flaky)

1. `common/performance/__tests__/compression.interceptor.spec.ts` — brotli large-payload timeout (>5s done()).
2. `common/cache/__tests__/cache.service.spec.ts` — LRU eviction boundary (size 4 vs ≤3) + disabled-cache still stores (2 failures).
3. `common/production-readiness/__tests__/performance-validator.service.spec.ts` — custom threshold expects `warn`, gets `pass`.

## Key Coverage Findings

- **No `coverageThresholds`** enforced in jest.config.ts — coverage can silently regress.
- Coverage artifacts (`coverage-final.json`, `clover.xml`) empty/stale.
- No skipped/`.only` tests found.
- Early-opportunity (the HEART): 68 deterministic tests, all GREEN.
- 3 root e2e spec files (deployment-infrastructure 41, e2e-integration 103, repository-validation 59) are **not run by any CI pipeline** — dormant.
- `apps/telegram` has zero tests; frontend legacy tests untracked.

## STATUS: BROAD BUT NOT GATED — fix 5 failures, wire e2e specs, enforce thresholds
