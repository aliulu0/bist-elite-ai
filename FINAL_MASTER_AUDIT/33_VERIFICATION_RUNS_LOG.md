# 33 — VERIFICATION RUNS LOG (RAW EVIDENCE)

> Commands executed + outputs (this audit, 2026-08-12).

## Build

```
> node node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json
EXIT=2
  modules/early-opportunity-backtest/early-opportunity-backtest.module.ts(13,29): TS2307 Cannot find module '../common/cache/cache.module'
  .../historical-early-opportunity-backtest.service.ts(2,30):  TS2307 Cannot find module 'uuid'
  .../historical-early-opportunity-backtest.service.ts(13,30): TS2307 Cannot find module '../common/cache/cache.service'
  .../historical-early-opportunity-backtest.service.ts(14,39): TS2307 Cannot find module '../indicators/indicator-cache.service'
  .../historical-early-opportunity-backtest.service.ts(289,118): TS2554 Expected 2-3 arguments, but got 4

> node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json
EXIT=0
```

## Tests

```
> CI=true node apps/api/node_modules/jest/bin/jest.js --config apps/api/jest.config.ts --testPathPattern early-opportunity-backtest
Test Suites: 10 passed, 10 total │ Tests: 52 passed, 52 total (time ~136s)

> CI=true node apps/api/node_modules/jest/bin/jest.js --config apps/api/jest.config.ts --testPathPattern early-opportunity-decision
Test Suites: 2 passed, 2 total │ Tests: 16 passed, 16 total
```

## Git

```
git log --oneline -10  → a13c745c R2-046 (HEAD), 74f1e064 R2-044, 6273367a F03-001, 43f5f83e, 8a93cded, 3e24bb30, 5599bbbe
git ls-files .env          → (none)
git check-ignore .env      → matched (.env under # Environment)
git log --all -- .env      → (none)
git grep (secret patterns) → 0 matches in tracked files
git ls-files apps/api/src/modules/early-opportunity-backtest/ → 24 files (committed)
git diff --stat (early-opportunity-backtest) → empty (no working-tree drift)
```

## Working tree (user work — preserved, not staged)

- deleted: AUDIT_REPORT.md, audit.zip, audit/FINAL_AUDIT_SUMMARY.md, audit_verify/** , final_audit.zip
- modified: ai-early-opportunity/{dto,controller,intelligence-engine+spec,service,module,types}, portfolio-intelligence/{service+spec,types}, web/{sdk.ts,dashboard.tsx,opportunity-card.tsx+test,dashboard-page.test.tsx,dashboard.test.tsx}
- untracked: ai-early-opportunity/decision/ (8 files), docs/R2-045_EARLY_OPPORTUNITY_DECISION.md