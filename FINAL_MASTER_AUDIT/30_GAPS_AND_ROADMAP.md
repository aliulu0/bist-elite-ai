# 30 — GAPS & ROADMAP RECOMMENDATION

> Final prioritised gap list for a **personal-use** platform. Only real gaps; enterprise items intentionally excluded.

## Must-fix (blocking)

| # | Gap | Evidence | Effort |
|---|---|---|---|
| 1 | **R2-046 does not compile** (5 errors) | 03, 18 | ~1–2 h |
| 2 | **R2-045 `decision/` module untracked** | 02, 17 | minutes (git add) |
| 3 | **Docs claim green** (PROJECT_STATUS/ROADMAP) | 16 | minutes |

## Should-fix (enables real value)

| # | Gap | Evidence | Effort |
|---|---|---|---|
| 4 | Configure ≥1 keyed OHLCV provider (Finnhub/Fintables) | 05 | config + key |
| 5 | Live smoke: `GET /early-opportunities` returns real symbols | 20 | after 1,4 |
| 6 | One R2-046 live backtest run on a real symbol | 18,20 | after 1,4 |

## Nice-to-have (non-critical, defer)

- Derived timeframes (1h/2h→4h) — 19
- SerpAPI research key / Agent Reach live — 24
- Deploy Telegram bot + worker — 25
- Persist registries to DB (snapshots survive restart) — 11
- ML training pipeline (Phases 6) — out of scope for personal use until data exists

## Explicitly NOT REQUIRED

- Kubernetes / microservices / SSO / multi-region / billing / SOC2 / Vault (personal-use).

## Priority order

1. Fix compile (1) → verify web+api tsc green.
2. Commit R2-045 untracked files (2).
3. Correct docs (3).
4. Add provider key (4) + live smoke (5,6).
5. Decide on nice-to-haves later.