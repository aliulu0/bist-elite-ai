# 15. ERROR HANDLING

## 15.1 Current state

- **No global exception filter** — `common/filters/` directory is **empty**; no `APP_FILTER` registered.
- NestJS default `ExceptionFilter` is active: returns `{ statusCode, message, error }`.
- Global `ValidationPipe` with `disableErrorMessages: true` in production hides validation detail.
- Middleware handles: `RequestTimeout` (408), `RequestSize` (414).
- Per-module engines use try/catch and return structured `errors` arrays on their result DTOs (e.g., DecisionResult.error, ScannerResult.errors) — a good domain-level pattern.
- `common/error-handling` may exist as utility (see check) but is not wired as a global filter.

## 15.2 Findings

1. **M4 — no standardized API error format:** raw Nest errors leak to clients (dev); no error codes, no envelope, no `errorCode`/`details` consistent shape.
2. **No AppException base class** with HTTP status + code + traceId correlation (trace IDs are generated in middleware but not threaded into error responses).
3. **Step-level error isolation** in pipeline orchestrator is good (pipeline continues if a step fails) — but the failures are logged, not surfaced in a standard shape.
4. **No retry taxonomy:** scheduler/workflow has retries, but data-fetch errors don't distinguish transient (timeout, 429) from permanent (bad key, 404).
5. **Logger masks secrets** (`AppLoggerService`) — good; errors logged with correlation id.

## 15.3 Verdict

Domain-level error handling (structured `errors` arrays on DTOs) is thoughtful, but the transport layer lacks a global exception filter / standardized envelope → inconsistent client-facing errors and no code-based programmatic handling (M4).
