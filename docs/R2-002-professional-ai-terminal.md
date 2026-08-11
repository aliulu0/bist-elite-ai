# R2-002 Professional AI Terminal

## Scope

R2-002 transforms the web dashboard into a professional AI terminal focused only on UI and UX. Backend architecture, services, APIs, WebSocket, Scheduler, Pipeline and cache behavior remain unchanged.

## Screens Updated

- Dashboard command center
- Professional watchlist table
- Provider Monitor
- Pipeline Status monitor
- Market Status widget
- Live logs, WebSocket events and Scheduler activity panels

## Implementation Notes

- Reuses existing `sdkClient` API methods.
- Reuses existing `RealtimeProvider`, `useWebSocket` and `events-store`.
- Uses collapsible panels with native resize behavior for terminal panels.
- Avoids new polling and only refreshes through existing page refresh actions and existing WebSocket events.
- Keeps provider coverage explicit for Yahoo, Finnhub, Fintables, TCMB, KAP and MKK.

## Verification Requirements

- `pnpm --filter @bist-elite/web build`
- `pnpm --filter @bist-elite/web test`
- `pnpm --filter @bist-elite/web typecheck`
- Manual localhost verification through the Vite dev server
