# 11. API SURFACE

## 11.1 Global conventions

- **Global prefix:** `api` (health routes excluded) — `main.ts`.
- **Versioning:** none.
- **Swagger:** `/api/docs`, bearer + api-key schemes; schema-generated SDK via `sdk-generator` module + `openapi` module.
- **Validation:** global `ValidationPipe` `{ whitelist, transform, forbidNonWhitelisted }`, `disableErrorMessages` in production.
- **Auth:** AuthGuard + RolesGuard + PermissionsGuard globally, but AuthGuard passes when `AUTH_ENABLED=false` (default). **In practice every endpoint is public by default** (`27_SECURITY.md`, C2).

## 11.2 Controller inventory (routes under `/api`)

| Prefix | Controller | Auth required (effective) |
|---|---|---|
| `scanner` | ScannerController | none (guards disabled by default) |
| `decision` | DecisionController | none |
| `opportunity` | OpportunityController (ai-opportunity) | none |
| `opportunity-center` | OpportunityCenterController | none |
| `elite-score` | EliteScoreController | none |
| `tomorrow` | TomorrowController | none |
| `analysis` | AnalystController | none |
| `entry` | EntryController | none |
| `portfolio` | PortfolioController + PortfolioOptimizationController | none |
| `market-data` | MarketDataController | none |
| `research` / `research/intelligence` | ResearchController | none |
| `providers` | ProviderHealthMonitorController | none |
| `financial-rules` | FinancialRulesController | none |
| `health` | HealthController (health, ready, live, auth/status, metrics) | none |
| `openapi` / `sdk` | SDK generation | none |
| WS | WebSocketGateway at `/socket.io` | **none, wildcard CORS** (C1) |

## 11.3 Route-prefix collision

Both `PortfolioController` (`@Controller('portfolio')`) and `PortfolioOptimizationController` (`@Controller('portfolio')`) register under `portfolio`. They do not conflict today because sub-paths are disjoint (`/:id...` vs `/optimize...`, `/top`, `POST /optimize`), but a future route like `portfolio/top` from PortfolioController would collide with the existing `portfolio/top` from optimization. Fragile.

## 11.4 Findings

1. **Every endpoint is effectively unauthenticated** — auth guards exist but are disabled by default (C2).
2. **WebSocket gateway:** `cors: { origin: '*', credentials: true }` and no authentication on the socket (C1).
3. **Route-prefix collision** on `portfolio` (M-level, fragile).
4. **No API versioning** — breaking changes ripple to all consumers.
5. **No explicit response envelope** — controllers return raw DTOs; the ETag/Compression interceptors apply globally.
6. **`/metrics`** exposed via HealthController (Prometheus-style), no rate limit.
7. **No OpenAPI `operationId` normalization** observed across all controllers — SDK generation relies on path-based IDs.

## 11.5 Verdict

The API surface is broad, consistent, and well documented via Swagger, but the effective lack of auth on all routes (including the WebSocket) is the single most important API-level issue.
