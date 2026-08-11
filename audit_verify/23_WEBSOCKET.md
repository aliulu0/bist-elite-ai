# 23. WEBSOCKET

> Complements `12_SECURITY.md` (C1).

## 23.1 Implementation

- **File:** `modules/websocket-gateway/websocket-gateway.ts`
- Nest `@WebSocketGateway` with `cors: { origin: '*', credentials: true }` — **wildcard CORS**.
- Namespace: `/socket.io` (default).
- **No authentication** on the connection or events.
- Broadcasts market data / pipeline updates to connected clients (dashboard live feed).
- Frontend connects via `hooks/useWebSocket.ts` (socket.io-client).

## 23.2 Findings

1. **C1 — wildcard CORS + credentials:** `origin: '*'` combined with `credentials: true` is invalid per the CORS spec in some clients and a security anti-pattern; any site can open a socket to the API.
2. **No auth (handshake query/token, JWT middleware, or guard):** the socket is fully public — consistent with the REST layer being public (C2).
3. **No rate limit / abuse control** on socket event traffic.
4. **No reconnect/backoff tuning** documented (client handles reconnect).
5. **No event schema/versioning** for the broadcast payloads → breaking changes ripple to frontend + telegram.
6. **No room/namespace separation** for private vs public feeds — once auth lands, per-user rooms will be needed.

## 23.3 Verdict

Functionally simple and fine for local dev; the wildcard-CORS + no-auth combination is the highest-severity single finding in the audit (C1).
