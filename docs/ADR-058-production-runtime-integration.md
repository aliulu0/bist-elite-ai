# ADR-058: Production Runtime Integration

**Status**: Accepted (2025-07-30)
**Applies to**: F14-FINAL

## Context

All individual engines (Market Data, Analysis, Opportunity Detection, Scanner, Ranking, Alerts, Portfolio, Macro) were implemented and tested in isolation. The Scheduler ran jobs but had a bug where jobs were never registered in production (only on controller hit). The frontend had no real-time data path. MacroDataService returned mock data. Build had TypeScript errors. AppModule was missing 6 modules.

## Decision

1. **Pipeline Orchestrator as sequential coordinator**: A single `PipelineOrchestratorService.runFullPipeline()` calls each engine in order (market data → normalize → aggregate → AI analysis → opportunity detection → scanner → ranking → alerts → portfolio → macro). All services are injected as optional with type-safe fallbacks. No new engine logic — pure orchestration.

2. **WebSocket as real-time event bus**: A single `PipelineGateway` on `/pipeline` namespace emits structured events for all 8 pipeline/scheduler/provider state changes. Frontend connects via Socket.IO client with auto-reconnect, subscribes to all events, and dispatches to Zustand stores.

3. **Scheduler registration in onModuleInit**: `SchedulerModule.onModuleInit()` registers all 13 jobs via `ModuleRef.get()` + `engine.registerJob()`. This is the only correct place for production job registration — controller endpoints are for manual triggers only.

4. **Frontend WebSocket hook with subscribe pattern**: `useWebSocket` returns `{isConnected, subscribe, connect, disconnect}`. Subscribe accepts event name + callback and returns an unsubscribe function. `RealtimeProvider` wires all 8 events to `useNotificationStore` (toast) and `useEventsStore` (event log).

5. **EventsStore addEvent method**: Added incremental event prepend with 500-entry cap. Previously only supported bulk replacement via `setEvents`.

6. **Vite proxy for Socket.IO**: `/socket.io` proxied with `ws: true` so the frontend dev server handles both HTTP and WS upgrades transparently.

7. **No engine modifications**: Pipeline, WebSocket, and frontend changes are integration-only. No existing engine, scoring, ranking, or folder structure was modified.

## Consequences

- **Positive**: Complete end-to-end pipeline with real-time frontend visibility. 13 scheduler jobs register in production. WebSocket provides real-time updates for all pipeline events. 28 new integration tests. Build succeeds with 0 TypeScript errors. Existing tests continue passing.
- **Negative**: MacroDataService still uses `Math.random()` (no real provider adapters connected). Frontend KPI cards not auto-refreshed on WebSocket events (require REST calls for full data). No WebSocket unit tests on frontend.
- **Migration path**: Connect MacroDataService to real adapters (Fintables, Finnhub, KAP, TCMB, Yahoo Finance, MKK). Add WebSocket-driven React Query invalidation for automatic dashboard refresh. Add frontend WebSocket hook unit tests with Socket.IO testing utilities.
