# 023 — DEPLOYMENT AUDIT

## Verdict: UNUSUALLY THOROUGH, CLOSE TO DEPLOYABLE (6.5/10)

## Docker

- `docker-compose.yml`: 5 services (postgres:16, redis:7, api, scheduler, web) — all with healthchecks, `depends_on: condition: service_healthy`, persistent named volumes, private bridge network.
- `docker-compose.override.yml`: dev overrides (hot reload, debug logs, dev ports).
- 6 Dockerfiles:
  - `Dockerfile.api` — 2-stage, `node:22-bullseye-slim`, non-root, HEALTHCHECK, `prisma migrate deploy`. ✅ Production-grade.
  - `Dockerfile.scheduler` — same as api. ✅
  - `Dockerfile.web` — 2-stage, nginx:alpine, non-root, gzip + SPA fallback. ✅
  - `Dockerfile.worker` — 2-stage Python 3.12, non-root, healthcheck, 2 uvicorn workers. ✅
  - `Dockerfile.backend` / `Dockerfile.frontend` — single-stage, dev-oriented, root user, legacy (superseded). ⚠️

## Native Systemd (deploy/)

- `install.sh` — clones, generates secrets, DB user, migrations+seed, systemd units, nginx, backup cron, logrotate.
- `setup-server.sh` — Ubuntu 22/24: ufw, fail2ban, swap, sysctl, PG16, Redis, nginx.
- `health-check.sh` — service states, endpoints, disk/memory.
- `backup.sh` — pg_dump + retention + verification.
- 4 hardened systemd units (api/web/worker/telegram): `NoNewPrivileges`, `ProtectSystem=strict`, memory caps (512M/384M/512M/256M), CPUQuota.
- `nginx/bist-elite-ai.conf` — rate limits, security headers, gzip, HTTP→HTTPS, TLS block (cert paths commented — needs domain).

## CI/CD (10 workflows)

`ci`, `test`, `lint`, `build`, `integration`, `docker`, `release`, `deploy`, `security`, `label-sync`. Includes CodeQL, TruffleHog secret scan, pnpm audit, GHCR publish, Render deploy hooks.

## Critical Gaps

1. **`deploy.yml` uses nonexistent action `docker/build-and-push-action@v6`** (correct: `docker/build-push-action`) — deploy pipeline would fail.
2. **`deploy.yml` is fire-and-forget** — Render webhooks via curl, no failure detection.
3. **Version drift:** pnpm 9 (ci/deploy/setup-server) vs pnpm 11.16.0 (root/Docker/integration); Node 20 (ci) vs 22 (Docker).
4. **Canonical test gate unreliable** — `pnpm test` at root historically fails (`packages/ui` "No test files found"); full suite hangs on Windows.
5. 5 known failing tests ship with any release.
6. Orphaned e2e specs not in CI.
7. Nginx TLS commented out — deploy is HTTP until certs configured.
8. `smoke-test.sh` expects web on 5173 (dev) while compose maps 3000 (prod) — port mismatch.
9. No enforced coverage thresholds.

## Security

- `.env` handling correct (`.env`, `.env.*` ignored; `.env.example` allowlisted).
- `.env.development`/`.env.production` historically committed (placeholders only) — **staged for deletion** ✅.
- SECURITY.md present; claims SSL in production but not enforced in compose.
- Prior audit: C1 auth-disabled in dev, C2 WS wildcard CORS.

## STATUS: READY-ISH — fix deploy action, version drift, failing tests before go-live
