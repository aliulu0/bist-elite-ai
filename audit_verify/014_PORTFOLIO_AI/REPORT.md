# 014 — PORTFOLIO AI AUDIT

## Verdict: BACKEND PRODUCTION, FRONTEND DEMO DATA (65/100)

## Implementation

| Component | Module | Status |
|---|---|---|
| Portfolio Engine (R2-019) | `modules/portfolio/` | Production backend |
| Portfolio Optimization Engine | `modules/portfolio-optimization/` + `common/portfolio-optimization/` | Production |
| Paper Portfolio Engine | `common/paper-portfolio/` | Production (8 suites) |
| Portfolio Intelligence Dashboard | `common/portfolio-intelligence/` | Production (12 suites, real dashboard controller) |
| Portfolio Advisor | `apps/web` (F16) | UI present |
| Portfolio Dashboard UI | `apps/web` portfolio.tsx | ~90% wired via portfolio-adapter |
| Portfolio Dashboard (legacy) | `frontend/` | Demo data |

## Verified Capabilities (backend)

- Portfolio CRUD, metrics, risk, allocation, performance, report endpoints (`/portfolio/*`).
- Portfolio Optimization: diversification score, risk contribution, allocation (endpoints `POST /portfolio/optimize`, `GET /portfolio/optimize/:ticker`).
- Paper Portfolio: 5 portfolio types, PositionManager, PaperTradeExecutor (slippage/costs), PerformanceTracker (returns/drawdown/Sharpe), RiskManager, Turkish report generator (.plan/prompt-51).
- Dashboard: config, filters, notifications, timeline, reports (`/dashboard/*`).

## Findings

1. **Frontend gap:** Portfolio & Watchlist pages in legacy `frontend/` use **demo/hardcoded data** — not wired to real PortfolioEngine API (ADR-060, FINAL_RELEASE, GO_LIVE all note this). `apps/web` portfolio.tsx IS wired (the better path).
2. **Duplicate `portfolio` route prefix** — portfolio-optimization.controller (portfolio-optimization.module) vs portfolio.controller (portfolio.module) → URL collision at `/api/portfolio/optimize/...`.
3. Optimization controller `top` endpoint returns only `results[0]` (behavioral quirk).
4. Paper portfolio is in-memory (resets on restart) — documented design but not persistent.
5. `docs/PROJECT_STATUS.md` marks "AI Portfolio Intelligence" as Not Started — stale.

## STATUS: BACKEND PRODUCTION / FRONTEND PARTIAL — wire legacy pages or rely on apps/web
