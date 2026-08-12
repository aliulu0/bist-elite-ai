# 13 — SCHEDULER & BACKGROUND AUDIT

> `scheduler` module — 25 files, jobs present, specs present.

## Jobs (real code, `scheduler/jobs`)

market-open-scan · incremental-scan · nightly-backtest · benchmark · rule-analytics ·
weight-optimization · agent-reach-refresh · alert-refresh · cache-refresh · catalyst-refresh ·
company-research · full-pipeline-run · macro-refresh · portfolio-refresh · provider-health-check ·
research-refresh · retry-failed-jobs · verification-refresh

- Default config enables: marketOpenScan (15 min), incrementalScan (1 h), nightlyBacktest (24 h), benchmark (6 h), ruleAnalytics (12 h), weightOptimization (24 h).

## Truth check

- `SCHEDULER_ENABLED` present in `.env` (value not printed).
- Scheduler module is **wired and enabled by config** — but the API cannot boot (compile break), so **no job has actually run** in a verified live session.
- Nightly self-learning job (`nightly-backtest`) exists; doc TODO "wire nightly scheduler to call learning/run" is effectively addressed by `full-pipeline-run`/`nightly-backtest` jobs — verify in code; treat as `CODE_ONLY` until live.

## Verdict

- Scheduler: **CODE_ONLY / NOT_RUNTIME_VERIFIED** (depends on API boot + data).
- No cron/E2E proof available in this audit.