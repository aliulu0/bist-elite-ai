# 27 — ENVIRONMENT, DEPLOY & OPS AUDIT

> Non-enterprise reality check for a personal-use platform (R2-047 rule: do not invent enterprise requirements).

## Deployment material present

- `docker-compose.yml` (api + db + others), `Dockerfile`-based workflows (`deploy.yml`, `docker.yml`).
- Runbooks: `docs/DEPLOYMENT.md`, `LOCALHOST_RELEASE.md`, `DEPLOYMENT.md`, `server-setup.md`, `GO_LIVE_CHECKLIST.md`, `FINAL_RELEASE.md`, `disaster-recovery.md`, `backup-guide.md`, `operations-manual.md`, `branching-strategy.md`, `ci-cd-guide.md`.

## Actual running state

- **Not deployed anywhere**; no live instance evidence.
- API cannot even boot locally (compile).
- `pnpm`/corepack broken in this shell (pre-existing) → local build via turbo unavailable; jest+tsc work via direct binaries (worked).

## Environment blocker status

| Item | Status |
|---|---|
| Local TypeScript typecheck | API ❌ / Web ✅ |
| Local Jest | ✅ (direct node invocation) |
| Local Postgres | ⚠️ previously crash-recovery; not re-tested |
| pnpm/turbo | ❌ unavailable in this shell |
| Docker run | not exercised |
| Deployed instance | NOT_PRESENT |

## Enterprise items — NOT REQUIRED (explicitly out of scope for personal use)

- Kubernetes, IAM/SSO, multi-region HA, microservices split, billing, audit SOC2, canary/blue-green, secrets manager (Vault), full observability stack. Not counted as gaps.

## Verdict

- Ops material is **extensive and honest**.
- Blocking ops gap: repository doesn't compile → cannot deploy.
- Acceptable for personal use once compile fix + real provider land.