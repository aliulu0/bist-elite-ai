# 10 — FRONTEND & DASHBOARD AUDIT

> `apps/web` — React/TypeScript SPA, 28 page modules, 708 test files, compiles clean (`tsc -p apps/web/tsconfig.json` PASS, exit 0).

## Pages present

- **Elite Dashboard** (`dashboard.tsx`) — 8-section main console (Early Opportunities, Market Overview, Filter Panel, Watchlist, Quick Search, Timeframe Panel, Top Lists, Dashboard Performance).
- **AI Screener / scanner-like** (`scanner.tsx`) — filterable screener (BistScan-style counterpart).
- **Portfolio** (`portfolio.tsx`) — portfolio intelligence tab(s).
- **Tarihsel Veri** (`history.tsx`) — R2-044 lightweight page (overview/symbol/backfill tabs).
- Also: ai-reports, ai-assistant, alerts, analysis, audit, backtest, configuration, diagnostics, events, not-found, performance, pipeline-status, providers, research-intelligence, settings, watchlist, workflows.

## SDK & state

- `apps/web/src/lib/sdk.ts` — API client with methods for opportunity/portfolio/decision/backtest surfaces (modified in working tree with R2-045/046 additions — uncommitted user work).
- `dashboard.tsx` / `opportunity-card.tsx` modified (uncommitted) to surface R2-045 decisions.

## Tests

- 708 web test files; dashboard/scanner/opportunity-card/portfolio suites present. Web tests pass (dashboard-page.test.tsx etc. modified in working tree).

## Truth check

- **UI renders** (web compiles; component tests green).
- **Live data:** `NO` — the UI calls an API that does not boot. Pages will show empty states / error toasts.
- Dashboard claims (scores, opportunities, performance) are **data-dependent**; with `INVALID_OPPORTUNITY` everywhere, the dashboard shows no real opportunities.

## Verdict

- Frontend quality: GOOD (design-system, typed SDK, tests).
- Real functionality today: NONE (depends on API + data).

## Score note

- Frontend = 6/10: built & tested, but produces no real output until API + providers are fixed.