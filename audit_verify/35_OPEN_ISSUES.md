# 35. OPEN ISSUES

## 35.1 Requires product decision

| ID | Issue | Question | Suggested default |
|---|---|---|---|
| Q1 | Should REST + WS be public for the MVP dashboard, or auth-gated now? | Business wants public dashboard or login? | Gate now with a single `API_KEY`; enable JWT users later |
| Q2 | TradingView: implement provider, or remove claims? | Which BIST data sources actually matter? | Remove claims until implemented; implement after backtest (R2-020) |
| Q3 | Python layer: integrate worker, or delete `backend/`? | Is the notification worker real? | Keep worker intent; delete legacy `backend/` |
| Q4 | Redis: build it out or remove claims? | Multi-replica needed? | Remove claims for MVP; add when scaling |
| Q5 | Localization: enforce Turkish-only now, or allow English? | D001 strictness | Enforce now (small cleanup) |
| Q6 | `frontend/` (Next.js legacy): delete or keep? | Deprecation date | Delete or move to `legacy/` |

## 35.2 Needs investigation

| ID | Item | What to check |
|---|---|---|
| I1 | Full-suite hang on Windows | Which spec causes the hang (bisect); may be a watch/openHandle leak |
| I2 | Test-count mismatch (docs 3852 vs ~2885 run) | Enumerate all spec files per package |
| I3 | `common/error-handling` util — wired anywhere? | grep imports; confirm no APP_FILTER |
| I4 | Readiness checks — do they reference Redis? | `main.ts` health logic |
| I5 | CORS `origin:*` + `credentials:true` — verify browser rejection | Test with a real origin header |
| I6 | Production Docker dev-secret fallback — confirm image defaults | Check Dockerfile ARG/ENV |
| I7 | `database/seeds/` (root, empty) vs `packages/database/prisma/seeds` | Which is canonical |
| I8 | `contract-validator` / `rule-analytics` — real consumers? | grep usages |

## 35.3 Blocked / waiting

| ID | Item | Depends on |
|---|---|---|
| B1 | Backtest engine (R2-020) | Real execution engine + data pipeline |
| B2 | Auth enforcement rollout | Q1 decision; SDK + WS handshake changes |
| B3 | SerpAPI unified registration | Config change + key availability |

## 35.4 Documented-but-unverified

| ID | Item |
|---|---|
| U1 | Alpha Vantage/TCMB/KAP/MKK/Fintables live success rates (need keys + endpoints) |
| U2 | EL score vs index performance (no live tracking) |
| U3 | Backtest historical accuracy (no engine) |

## 35.5 Summary

Three decisions gate the next sprint (Q1 auth, Q2 TradingView, Q3 Python). Investigation I1 (test hang) and I6 (docker secret fallback) should be resolved in the hardening sprint.
