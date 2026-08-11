# 12. SECURITY

## 12.1 Summary

Security posture is **mixed**: solid hardening at the transport/middleware layer, but **auth is effectively disabled by default** and the WebSocket gateway is exposed with wildcard CORS and no authentication.

## 12.2 Findings by severity

### C1 — WebSocket gateway exposed
- File: `modules/websocket-gateway/websocket-gateway.ts:13`
- `cors: { origin: '*', credentials: true }` and **no authentication** on the socket namespace.
- Any client can connect and receive broadcast market data; combined with C2, this is the most exposed attack surface.

### C2 — Authentication effectively disabled
- File: `common/auth/auth.service.ts:22-56`
- `AUTH_ENABLED` defaults to **false**; `validateToken()` and `validateApiKey()` **return `null`** (stub/no-op).
- `AuthGuard` short-circuits (allows) when auth is disabled → **all 15+ controllers and the socket are public** by default.
- No JWT library is installed in the API (`package.json` has no `@nestjs/jwt`/`jsonwebtoken`).
- Enabling `AUTH_ENABLED=true` today would still permit everything (validation methods are no-ops), so the flag is not a real switch.

### C3 — SerpAPI provider registered silently off
- Unified market-data adapter exists but is missing from `market-data.config.ts` → `enabled=false`, `priority=99` (see `05/06`). Operational/coverage, not strictly a vuln.

### H1 — Hardcoded / committed secrets hygiene
- `.env.development` and `.env.production` are **committed** to git (placeholders — values are placeholders, so low exposure, but the convention is dangerous; real secrets must not be added to these files).
- `.env.docker` is **not** in `.gitignore` (untracked).
- `.env` (local) is gitignored but contains real-looking local secrets on this machine.
- Dockerfile fallback: production Docker uses a dev JWT secret fallback if `JWT_SECRET` unset → any deployed image with defaults shares a known secret.

### H2 — Secrets in code search (trufflehog CI)
- `.github/workflows/security.yml` runs trufflehog on push — good.
- No hardcoded production secrets found in source during this audit (only placeholders + `.env` local values which are gitignored).

### M — Other findings
1. **No global exception filter** — error responses leak Nest default stack traces (in dev; `disableErrorMessages` in prod mitigates partially).
2. **No CSRF protection** — stateless API + socket; lower risk since no cookies, but CORS misconfig would compound.
3. **Rate limiting is global** `RateLimitGuard` — good, but health/metrics endpoints are not rate-limited (metrics endpoint is unauthenticated).
4. **`helmet` CSP strictness** may break the dashboard if it loads inline scripts/styles; needs verification.
5. **No audit for WS events** — only HTTP audit-log module observed.

## 12.3 What is done well

- `helmet` with strict CSP, HSTS, COOP/COEP/CORP. `main.ts`
- Correlation IDs, request-timeout, request-size, input-sanitization middleware.
- `AppLoggerService` masks sensitive fields (JWT, token, password, authorization).
- Rate limiting, request deduplication, ETag/compression interceptors.
- trufflehog secret scan in CI.
- Input `ValidationPipe` with whitelist + forbidNonWhitelisted.

## 12.4 Security score rationale

Strong defensive middleware and hygiene tooling, but the two critical items (disabled auth, exposed WebSocket) mean the application is effectively public by default. This dominates the score.
