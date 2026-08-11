# 28. MONITORING

> Complements `18_PERFORMANCE.md` and `16_LOGGING.md`.

## 28.1 What exists

- **Health endpoints:** `/health`, `/health/live`, `/health/ready` (HealthController).
- **Metrics:** `/metrics` Prometheus-style.
- **`provider-health-monitor`** — per-provider status registry + endpoints `/api/providers/health`, `/history`.
- **`performance-monitor`** — app metrics capture (durations, counts).
- **`system-diagnostics`** — diagnostic dumps.
- **`audit-log`** — immutable audit records.
- **Alerting:** `alerts` module (in-app alerts, not external paging).

## 28.2 Findings

1. **Phantom provider identities** `investing` and `google_discovery` are tracked by the health monitor with **no adapter classes** (05_PROVIDER_LAYER) → monitoring reports non-existent providers; conversely **TradingView is documented complete but absent** so monitoring can't reflect it.
2. **No Prometheus scrape config / Grafana dashboards** in `deploy/` — metrics endpoint exists but no observability stack consuming it.
3. **No alert routing** to external channels (Telegram alert module is in-app; the worker is meant to send notifications but is not integrated, H6).
4. **No request latency SLO tracking** beyond interceptors.
5. **Log-based health** — readiness checks DB/Redis? Redis readiness claimed but Redis not used (M2).
6. **No uptime/SLA reporting.**

## 28.3 Verdict

Monitoring is functional at the endpoint level but stops at "expose metrics": no scraping stack, phantom providers in health, no external alerting, and readiness claims a Redis dependency that doesn't exist.
