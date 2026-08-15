# R2-055C STATUS REPORT — Windows Localhost Dynamic Import Root-Cause Fix

**Date:** 2026-08-15
**Sprint:** R2-055C
**Status:** VERIFIED

---

## Build

- `tsc -b` → exit 0 (TypeScript compiles cleanly)
- `vite build` → `✓ built in 12.63s`
- Lazy dashboard chunk produced: `dist/assets/dashboard-BOkdb5Z2.js` (39.48 kB / gzip 11.96 kB)

## Web Server

- URL: `http://localhost:5173`
- Running: YES (exactly one Vite process, PID 6596, `--host 0.0.0.0 --force`)
- Dep cache: `Forced re-optimization of dependencies` (`.vite` cache regenerated)
- Vite root: `apps/web` (correct; not the monorepo root)

## API Server

- URL: `http://localhost:3001`
- Running: YES (PID 9772, `node apps/api/dist/main.js`)
- `GET /api/telegram/status` → HTTP 200

## Dynamic Import Result

- `GET http://localhost:5173/src/pages/dashboard.tsx` → **HTTP 200**, `Content-Type: text/javascript`, 174,324 bytes of valid transformed ES module JavaScript
- No 404, no Vite transform error, no redirect

## Root Cause

**Stale Vite dependency cache + stale browser module graph.** The browser held a cached module graph whose dependency-chunk `?v=` hashes no longer matched the server after a Vite dependency re-optimization, so the `lazy(() => import('./pages/dashboard'))` dynamic import failed to fetch. The source, router, Vite config, and TS config were verified correct.

## Fix

1. Ensure exactly one Vite process on port 5173.
2. Restart with the officially supported `vite --force` flag (clears/regenerates `.vite/deps`).
3. Bypass the stale browser module graph (hard reload `Ctrl+Shift+R`, Disable cache, or Incognito).

No source code changes were required.

## Browser Result

Real Chrome session rendered the dashboard: sidebar, topbar, market summary (Elite Skor / Makro Skor / Güven), radar/opportunity area, navigation, Turkish labels, heading "BIST Elite AI Komuta Merkezi". Screenshot: `docs/r2-055c-dashboard.png`.

## Routes

| Route                       | HTTP | Rendered | Console errors | Dynamic import errors |
| --------------------------- | ---- | -------- | -------------- | --------------------- |
| `/`                         | 200  | YES      | 0              | 0                     |
| `/radar`                    | 200  | YES      | 0              | 0                     |
| `/signals`                  | 200  | YES      | 0              | 0                     |
| `/scanner`                  | 200  | YES      | 0              | 0                     |
| `/analysis`                 | 200  | YES      | 0              | 0                     |
| `/backtest`                 | 200  | YES      | 0              | 0                     |
| `/watchlist`                | 200  | YES      | 0              | 0                     |
| `/portfolio`                | 200  | YES      | 0              | 0                     |
| `/stock/THYAO`              | 200  | YES      | 0              | 0                     |
| `/bist-market-intelligence` | 200  | YES      | 0              | 0                     |
| `/telegram`                 | 200  | YES      | 0              | 0                     |

## Tests

- `vitest run` → **207 test files passed, 1916 tests passed**
- Dashboard, routing, topbar, sidebar, lazy-route suites included
- No tests modified

## Security

- `.env` gitignored (confirmed via `git check-ignore`)
- `apps/web/dist` gitignored (confirmed)
- No new secrets introduced in R2-055C artifacts
- Telegram bot token referenced only in masked form `8460304628:****6264`
- Known pre-existing issue (from prior sprints, not this one): the full token appears in previously committed docs `R2-053C`, `R2-054`, `R2-055`.

## Git

- R2-055C adds three artifacts: `docs/R2-055C_LOCALHOST_DYNAMIC_IMPORT_FIX.md`, `docs/R2-055C_LOCALHOST_RUNTIME_STATUS.json`, `docs/R2-055C_STATUS_REPORT.md`, plus `docs/r2-055c-dashboard.png`.
- No source, config, or audit files modified/deleted.
- Commit message: `R2-055C: Fix Windows localhost dynamic import and browser runtime`

## Known Limitations

- Occasional Google Fonts `.woff2` 404s — cosmetic, non-fatal.
- If the API is not running, data panels fall back to "Data unavailable" but the dashboard still renders.
- If the user's Chrome retains the old module graph after restart, one hard reload / Incognito visit is needed.
