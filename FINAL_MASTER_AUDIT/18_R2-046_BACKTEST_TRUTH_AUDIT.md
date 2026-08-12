# 18 — R2-046 BACKTEST VALIDATION — TRUTH AUDIT

> The most important single-file audit: R2-046 is committed but **doesn't compile**.

## Claim (docs/R2-046 + MASTER_ROADMAP + PROJECT_STATUS)

- New `early-opportunity-backtest` module; 10 endpoints; point-in-time isolation; future outcome (1W-1Y); decision success; benchmark; confidence calibration; lead-time; false-positive; missed-opportunity; immutable snapshots; 10 suites / 52 tests GREEN; `tsc --noEmit` clean.

## Reality (verified this audit)

1. Files present: module, service, controller, 9 support services, DTO, types + 10 test suites = 24 files, **committed in `a13c745c`**.
2. **`tsc --noEmit -p apps/api/tsconfig.json` FAILS with 5 errors** in this module (exact errors in 03_BUILD). → Module cannot load → **API cannot boot**.
3. Tests: 10 suites / **52/52 PASS** (verified) — but **all mocked**; they never import the broken DI wiring.
4. Service uses `uuid` (not installed), wrong cache/indicator-cache import paths, and a 4-arg call to `getValidatedHistory`.

## Error detail (lines)

```
module.ts:13            cannot find '../common/cache/cache.module'        → real: src/common/cache/cache.module
service.ts:2            cannot find 'uuid'                                 → pkg not installed
service.ts:13           cannot find '../common/cache/cache.service'       → real: src/common/cache/cache.service
service.ts:14           cannot find '../indicators/indicator-cache.service' → real: src/modules/indicator-cache/...
service.ts:289          Expected 2-3 args, got 4                          → getValidatedHistory arity
```

## Classification

- **BROKEN** (committed, non-compiling) — the single highest-priority defect in the repo.

## Recommended fix (AUDIT_FIX — minimal, ~1–2 h)

1. `module.ts:13` → `../../common/cache/cache.module`
2. `service.ts:13` → `../../common/cache/cache.service`
3. `service.ts:14` → `../indicator-cache/indicator-cache.service`
4. Use `import { v4 as uuidv4 } from 'uuid'` after adding `uuid` to deps, or replace with a crypto `randomUUID` (no new dep): `import { randomUUID } from 'node:crypto'`.
5. Fix the `getValidatedHistory(...)` call to 3 args (`symbol, timeframe, {start,end}` or similar per signature), or cast explicitly.
6. Re-run `tsc`; then boot API; then run a live smoke.

## Do not

- Do NOT redesign or reimplement the services — the logic/design is fine and unit-proven.