# 21. FRONTEND

## 21.1 Stack

- **`apps/web`** — React 19 + Vite 6 + TypeScript, react-router v7 (BrowserRouter), zustand (17 stores), socket.io-client (`hooks/useWebSocket.ts`).
- API base: `/api` (Vite dev proxy → `:3001`), `lib/sdk.ts` central fetch client.
- 20 pages under `pages/`; components under `components/` (shared 15, layout 4, feature 14; `ui/` empty).
- Design tokens in `design/tokens.ts`.

## 21.2 Pages

`dashboard, scanner, analysis, backtest, portfolio, portfolio-optimization, elite-score, tomorrow, opportunity, opportunity-center, macro, research, alerts, configuration, settings, api, strategies, comparison, provider-health, watchlist`.

## 21.3 Quality

1. **Clean structure** — pages/stores/components separation, single SDK client, token-driven design.
2. **Localization violation (H4):** ~30 English UI strings remain in `apps/web/src` (`26_LOCALIZATION.md`) — violates D001 Turkish-only UI.
3. **Empty `components/ui/`** — no shared UI primitives in the app (despite `packages/ui` existing); duplication risk.
4. **No route-level lazy loading** — all 20 pages eager-loaded in `App.tsx` (18/M5).
5. **No error boundary** observed at app root; socket reconnect logic present in `useWebSocket`.
6. **SDK client is plain fetch** — no auth header handling today (auth disabled); will need updating when C2 is fixed.
7. **No tests** for web pages (`apps/web` test suite runs but has no component/spec for pages — see `31_TESTING.md`).
8. **Legacy `frontend/`** Next.js app still on disk, undocumented.

## 21.4 Verdict

Frontend architecture is tidy and modern; primary gaps are the D001 localization violation (H4), empty UI package usage, eager loading, and no web test coverage.
