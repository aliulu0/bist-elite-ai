# 006 — DASHBOARD AUDIT

## Verdict: THREE SURFACES — ONE CANONICAL, ONE LEGACY WITH BROKEN ROUTE

## Frontend Landscape

| Surface | Path | Framework | Workspace member | Status |
|---|---|---|---|---|
| **Web (canonical)** | `apps/web` | Vite + React 19 + React Router 7 + Zustand + TanStack Query + Recharts | ✅ | Production, 36 pages, 1902 tests passing |
| **Web (legacy)** | `frontend/` | Next.js 14 App Router | ❌ NOT in workspace | **Broken `/dashboard` route; unmaintained** |
| Telegram bot | `apps/telegram` | grammY | ✅ | Working (gaps) |

## Screen Matrix

| Screen | Frontend | Implemented % | Missing / Broken |
|---|---|---|---|
| Elite Dashboard (8 sections) | `frontend/` | ~85% | All 8 built + data-wired, but `/dashboard` route imports broken (page won't compile); homepage `/` works |
| Elite Dashboard | `apps/web` | ~40% | Terminal layout, no dedicated R2-029 8-section layout; market quotes synthesized/hardcoded |
| Research Dashboard | `apps/web` research-intelligence.tsx | ~90% | Research score, research, catalysts, AI summary, providers UI complete |
| Portfolio Dashboard | `apps/web` portfolio.tsx | ~90% | Holdings, allocation/sector charts, performance, risk, advisor, optimization wired via portfolio-adapter |
| Coverage Dashboard | `apps/web` providers.tsx | ~85% | Provider health/history/latency/reliability/failover complete |
| Heatmap | `frontend/` MarketOverview.tsx | ~50% | Sector heatmap present; no dedicated heatmap page |
| Backtest Dashboard | `apps/web` backtest.tsx | ~80% | Equity/drawdown charts, benchmark, rule analytics, weight optimizer, trades, export |
| Prediction Dashboard | `apps/web` analysis.tsx | ~60% | No dedicated prediction screen; data surfaces inside analysis tabs |
| Telegram Dashboard | `frontend/` telegram/page.tsx | ~10% | Config-form stub, no API wiring, no save handlers |
| Telegram Bot | `apps/telegram` | ~60% | 12 commands + callbacks real; notifications service never started + never sends |

## Critical Findings

1. **`frontend/src/app/dashboard/page.tsx` imports `./AIFilterPanel`, `./TopEarlyOpportunities`, etc.** — relative paths pointing to non-existent files in `app/dashboard/`. Components actually live in `components/dashboard/`. **This page cannot compile.**
2. **Dual frontend stack** — `apps/web` is canonical (workspace member, build-verified); `frontend/` is untracked (git shows 0 test files tracked), not built by turbo.
3. **`apps/web` sdk.ts line 58:** `auditLog: () => Promise.reject(...)` — Audit page always errors (backend endpoint missing).
4. `apps/web` dashboard chartData hardcoded sample; market widgets synthesized from scannerTotal/macroScore (fake quotes).
5. Legacy `frontend/` has placeholder pages: technical-analysis (3/4 tabs), fundamental-analysis (static ratios), telegram (no handlers), settings (no persistence).

## Recommendation

Fix legacy dashboard imports or deprecate `frontend/` in favor of `apps/web`. Canonical frontend is `apps/web`.
