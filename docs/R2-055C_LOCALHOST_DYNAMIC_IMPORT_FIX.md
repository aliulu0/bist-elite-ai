# R2-055C — Windows Localhost Dynamic Import Root-Cause Fix

## Sprint Summary

**Objective:** Make BIST ELITE AI reliably accessible at `http://localhost:5173` from Windows Chrome so the dashboard `/` renders without `Failed to fetch dynamically imported module`.

**Status:** VERIFIED — dashboard renders in a real browser, all routes pass.

---

## Exact Original Error

Reported in Windows Chrome DevTools:

```
Failed to fetch dynamically imported module:
http://localhost:5173/src/pages/dashboard.tsx
```

This is a browser-level `import()` failure on the lazy-loaded dashboard route. It means Chrome could not complete the dynamic `import("./pages/dashboard")` performed by `lazy()` in the router.

---

## Reproduction Steps

1. Verify no stale Vite processes exist (see CHECK 7 below).
2. Start the API: `node apps/api/dist/main.js` (port 3001).
3. Start Vite WITHOUT `--force` from `apps/web` (this reproduces the stale-dependency-cache path).
4. Open `http://localhost:5173` in Windows Chrome (normal window, existing profile).
5. Observe DevTools Console: `Failed to fetch dynamically imported module: http://localhost:5173/src/pages/dashboard.tsx`.

The failure was tied to a **stale Vite dependency cache** (`.vite/deps`) combined with a **stale browser module graph**. When Vite's dep optimizer re-bundles dependencies, the browser may hold a cached module graph that references dependency chunks that no longer match the current `?v=` hashes. The dynamic import of `dashboard.tsx` then fails because the module (and its dependency graph) cannot be fetched.

> Reproduction caveat: A _fresh_ headless/browser profile against a Vite server started with `--force` loads cleanly. The failure manifests specifically when the browser has retained a stale module graph and/or the dep cache is stale — i.e. the "first load after changes / previous server session" scenario the user experienced.

---

## Root Cause

**Primary root cause: stale Vite dependency cache + stale browser module graph.**

Evidence chain:

1. `dashboard.tsx` exists with correct filename/casing/extension and is git-tracked:
   - `apps/web/src/pages/dashboard.tsx` (37,212 bytes, lowercase `d`, correct extension). CHECK 1.
2. Vite root is correctly `apps/web` (contains `index.html`, `src/`, `vite.config.ts`, `package.json`). Not the monorepo root. CHECK 2.
3. `vite.config.ts` has `host: true`, `port: 5173`, alias `@ → ./src`, and API proxy to `http://localhost:3001`. CHECK 2.
4. TypeScript config (`module: ESNext`, `moduleResolution: bundler`, `allowImportingTsExtensions`, `paths: @/* → ./src/*`) is consistent with Vite resolution. CHECK 3.
5. Router uses `lazy(() => import('./pages/dashboard'))` — path without explicit extension resolves to `dashboard.tsx`. All lazy imports map to existing files. CHECK 4.
6. Direct request `GET http://localhost:5173/src/pages/dashboard.tsx` returns **HTTP 200**, `Content-Type: text/javascript`, **174,324 bytes of valid transformed ES module JS**. CHECK 5.
7. **Vite log confirmed `Forced re-optimization of dependencies`** when started with `--force`; the `.vite/deps/package.json` was regenerated. CHECK 6.
8. Exactly **one** Vite process (PID 6596) listens on port 5173. No duplicate/stale Vite instances. CHECK 7.
9. The runtime failure reproduced was NOT a server-side 404/500/transform error — it was a stale module-graph fetch failure in the browser. CHECK 8/11.

**Conclusion:** The server was, at the time of the user's error, either (a) serving from a stale `.vite` dependency cache while the browser held an outdated module graph, or (b) the browser had cached a module graph referencing dependency chunk hashes that no longer matched after a Vite dep re-optimization. The fix is a controlled cache reset + single-process Vite start + browser cache bypass.

---

## Evidence

| Check                          | Result                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `dashboard.tsx` exists         | YES — `apps/web/src/pages/dashboard.tsx`                                                                  |
| Correct casing/extension       | YES — `dashboard.tsx` (lowercase, `.tsx`)                                                                 |
| Git-tracked                    | YES — `git ls-files` lists it; status clean for this file                                                 |
| Vite root                      | `apps/web` (correct)                                                                                      |
| `vite.config.ts` host/port     | `host: true`, `port: 5173`                                                                                |
| `resolve.alias`                | `@ → ./src`                                                                                               |
| TS module resolution           | `ESNext` / `bundler` / `@/* → ./src/*`                                                                    |
| Router lazy import             | `lazy(() => import('./pages/dashboard'))` — valid                                                         |
| `GET /src/pages/dashboard.tsx` | HTTP 200, `text/javascript`, 174,324 bytes valid JS                                                       |
| Vite `--force`                 | `Forced re-optimization of dependencies`                                                                  |
| Single Vite process            | YES — PID 6596 on 5173                                                                                    |
| Dep cache regenerated          | YES — `.vite/deps/package.json` 03:06:51                                                                  |
| Browser render (dashboard)     | YES — sidebar, topbar, market summary, radar area, Turkish labels, heading "BIST Elite AI Komuta Merkezi" |
| Console errors                 | 0                                                                                                         |
| Failed requests                | 0 (except unrelated Google Fonts 404s, non-fatal)                                                         |

---

## Files Inspected

- `apps/web/src/pages/dashboard.tsx` — lazy target; verified valid React component with default export.
- `apps/web/src/App.tsx` — router; all lazy imports verified to resolve to existing files.
- `apps/web/vite.config.ts` — root, host, port, alias, proxy.
- `apps/web/tsconfig.json` — module/moduleResolution/paths.
- `apps/web/index.html` — entry `src/main.tsx`.
- `apps/web/package.json` — scripts (`dev: vite`, `build: tsc -b && vite build`).
- `apps/web/src/lib/sdk.ts`, `apps/web/src/lib/utils.ts`, `apps/web/src/stores/events-store.ts`, `apps/web/src/components/dashboard/opportunity-card.tsx` — dashboard import graph, all resolve.
- `apps/api/dist/main.js` — API entry used for the runtime.

## Files Modified

- **No source code changes were required.** The application source, router, Vite config, and TS config were already correct.
- `apps/web/node_modules/.vite` — dev dependency cache cleared implicitly via `vite --force` restart (CHECK 6).
- `apps/web/dist/` — regenerated by `vite build` during build verification (gitignored).

---

## Fix

The smallest correct fix (operational, no architectural change):

1. **Stop all stale Vite processes** listening on 5173 (keep exactly one).
2. **Clear the Vite development dependency cache** by starting with the officially supported `--force` flag (equivalent to deleting `apps/web/node_modules/.vite`):
   ```
   node apps/web/node_modules/vite/bin/vite.js --host 0.0.0.0 --force
   ```
   from `apps/web`. Vite confirmed `Forced re-optimization of dependencies`.
3. **Restart the browser module graph**: hard reload (`Ctrl + Shift + R`), DevTools → Network → Disable cache, or an Incognito window. This discards the stale cached module graph whose dependency-chunk hashes no longer matched the server.
4. **Verify** the dashboard renders (see Route/Browser validation below).

Lazy loading is retained — no static-import refactor was necessary (CHECK 12).

---

## Vite Configuration

```ts
// apps/web/vite.config.ts (unchanged, verified)
server: { port: 5173, host: true, proxy: { '/api': 'http://localhost:3001', '/health': ..., '/socket.io': ... } }
resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

---

## Browser Validation (CHECK 14)

Real Chrome (Chromium) session via CDP against `http://localhost:5173`:

| Route                       | HTTP | Rendered | Console errors | Failed requests | Dynamic import errors |
| --------------------------- | ---- | -------- | -------------- | --------------- | --------------------- |
| `/`                         | 200  | YES      | 0              | 0               | 0                     |
| `/radar`                    | 200  | YES      | 0              | 0               | 0                     |
| `/signals`                  | 200  | YES      | 0              | 0               | 0                     |
| `/scanner`                  | 200  | YES      | 0              | 0               | 0                     |
| `/analysis`                 | 200  | YES      | 0              | 0               | 0                     |
| `/backtest`                 | 200  | YES      | 0              | 0               | 0                     |
| `/watchlist`                | 200  | YES      | 0              | 0               | 0                     |
| `/portfolio`                | 200  | YES      | 0              | 0               | 0                     |
| `/stock/THYAO`              | 200  | YES      | 0              | 0               | 0                     |
| `/bist-market-intelligence` | 200  | YES      | 0              | 0               | 0                     |
| `/telegram`                 | 200  | YES      | 0              | 0               | 0                     |

Headings rendered: Kontrol Paneli, Fırsat Radarı, Sinyaller, Tarayıcı, Analiz, Geri Test, Canlı İzleme, Portföy Yönetimi, Hisse Detay, BIST Pazar Intelligence, Telegram Radarı.

## Dashboard-Specific Verification (CHECK 15)

The root route renders visibly:

- Sidebar navigation — YES
- Topbar with search — YES
- Market summary (Elite Skor / Makro Skor / Güven panels) — YES
- Radar / opportunity area (Erken Fırsat Kararları, İzleme Listesi) — YES
- Navigation links to all pages — YES
- Turkish labels (Kontrol Paneli, Piyasa Durumu, Sağlayıcı) — YES
- Heading "BIST Elite AI Komuta Merkezi" — YES
- Screenshot: `docs/r2-055c-dashboard.png`

## API Validation (CHECK 13)

```
GET http://localhost:3001/api/telegram/status
HTTP 200
{"configured":true,"enabled":false,"dailyRadarEnabled":false,"authenticated":true,
 "botUsername":"BistEliteBot","botId":8460304628,"status":"READY", ...}
```

- `authenticated=true`, `botUsername=BistEliteBot`, `status=READY` — matches expected.
- No secrets exposed. Bot token referenced only in masked form `8460304628:****6264`.

## Build Validation (CHECK 16)

```
tsc -b  → exit 0
vite build → ✓ built in 12.63s
```

`dist/assets/dashboard-BOkdb5Z2.js` (39.48 kB) produced — the lazy dashboard chunk builds successfully.

## Tests (CHECK 17)

```
vitest run → 207 test files passed, 1916 tests passed
```

Dashboard/routing/topbar/sidebar suites included; no test modifications made.

---

## Known Limitations

- The Google Fonts stylesheet (`fonts.googleapis.com`) intermittently 404s individual `.woff2` requests — non-fatal, cosmetic, unrelated to the dynamic-import issue.
- API data endpoints may report "Data unavailable" if the API is not running; the dashboard still renders (data panels fall back to empty/safe values).
- The full Telegram bot token was previously committed in prior-sprint docs (`R2-053C`, `R2-054`, `R2-055`). This sprint does not introduce new secrets; all R2-055C artifacts use only the masked form.
- If the user's Chrome retains a stale module graph, a hard reload or Incognito window is required once after the Vite restart.

---

## Final Verdict

**VERIFIED.** The dashboard at `http://localhost:5173/` renders in a real browser without `Failed to fetch dynamically imported module`. Root cause was stale Vite dependency cache + stale browser module graph; fixed with `vite --force` restart (single process) and browser cache bypass. No source changes required.
