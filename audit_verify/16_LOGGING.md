# 16. LOGGING

## 16.1 Current state

- **`AppLoggerService`** (`common/logger`) — structured logger:
  - Levels: debug/info/warn/error.
  - **Sensitive-field masking** of `authorization`, `password`, `token`, `jwt`, `secret`, `api-key` values in log output.
  - Correlation/trace ID threading via middleware (`CorrelationId`).
  - JSON-friendly formatting.
- Used by most modules (injected as `AppLoggerService`); some raw `Logger` (Nest) usage remains.
- `audit-log` module — immutable audit trail records (DB-backed).
- `performance-monitor` — metrics capture.

## 16.2 Findings

1. **Inconsistent logger usage:** many services inject `AppLoggerService`, but some use Nest's built-in `Logger` or `console` (e.g., scheduler bootstrap, legacy provider path) — non-uniform log format, missing masking for those paths.
2. **No request-log middleware global config for access logs with duration** — `RequestLoggingInterceptor` exists and is global; good, but method-level logs can double-log.
3. **Log level config** via env; no structured field for service name/version by default.
4. **Audit-log module** good for compliance (immutable) but not integrated with every mutating endpoint.
5. **Python worker / legacy backend** have their own logging (not unified).

## 16.3 Verdict

Logging infrastructure is above average (structured + masking + correlation IDs). Gaps: inconsistent usage across a few paths, no full audit integration, Python layer logs separate.
