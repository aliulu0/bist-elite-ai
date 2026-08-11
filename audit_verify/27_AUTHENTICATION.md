# 27. AUTHENTICATION & AUTHORIZATION

> Deep-dive companion to `12_SECURITY.md`.

## 27.1 Current implementation

**Files:**
- `common/auth/auth.service.ts` — `AuthService.validateToken()`, `validateApiKey()`.
- `common/auth/guards/*` — `AuthGuard`, `RolesGuard`, `PermissionsGuard`.
- `common/auth/decorators/*` — `@Public()`, `@Roles()`, etc.
- `common/auth/middleware` — auth middleware.

**Behavior (verified in source):**
- `AUTH_ENABLED` env default: **`false`**.
- `validateToken()` returns `null`.
- `validateApiKey()` returns `null`.
- `AuthGuard` → if `!AUTH_ENABLED` → `return true` (allow all).
- **No JWT library** in `apps/api/package.json` (`@nestjs/jwt`, `jsonwebtoken` absent).
- AuthService exposes a stub; there is no real token signing/verification path anywhere.

## 27.2 Effective state

| Endpoint class | Effective auth | Real protection |
|---|---|---|
| All REST controllers | **none** | rate-limit + helmet only |
| WebSocket gateway | **none** | none (C1) |
| Admin/config endpoints (`configuration`, `openapi/sdk`, `providers`) | **none** | none |

## 27.3 Findings

1. **C2 — Auth is not merely "off", it's not implemented:** with `AUTH_ENABLED=true`, guards would still pass because validation is a no-op. Enabling the flag today grants nothing.
2. **No user/password flow, no sessions, no API-key table usage** for the public surface (ApiKey model exists but no verifier).
3. **Roles/Permissions guards exist but enforce nothing** while auth is off.
4. **Telegram bot** has no key plumbing — must be added when auth lands (20_BOT_INTEGRATION).
5. **Positive:** decorators, guard scaffolding, and CI trufflehog are in place, so the work to land real auth is mostly implementation, not greenfield.

## 27.4 Road to fix

1. Install `@nestjs/jwt` (or `jose`).
2. Implement `validateToken` with `JWT_SECRET` + expiry; implement `validateApiKey` against the `ApiKey` table.
3. Decide default `AUTH_ENABLED` behavior; keep the migration smooth for telegram + frontend SDK (add bearer header support in `lib/sdk.ts` and `useWebSocket` handshake).
4. Add WS auth via socket.io handshake token.
5. Tighten CORS to explicit origins; drop `credentials: true` from wildcard.

## 27.5 Verdict

This is the most impactful functional gap: the platform's "auth" is scaffolding with no enforcement. Severity: **Critical**.
