# 29. INFRASTRUCTURE

## 29.1 Deploy assets

- **`deploy/`** — nginx config, systemd units, logrotate.
- **`docker/`** — `Dockerfile.worker` (Python), `Dockerfile.backend` (Python). **Orphaned** — no compose service for the NestJS API/web.
- **`docker-compose.yml`** — defines infra (postgres, redis) + maybe api/web; **Python worker omitted** (H6).
- **`.dockerignore`** — excludes `backend/` (Python) and `.git` etc.
- **`.github/workflows`** — `deploy.yml`, `docker.yml`, `security.yml` (trufflehog), `label-sync.yml`.

## 29.2 Findings

1. **H6 — Python layer not integrated:** `apps/worker` (Python FastAPI) and legacy `backend/` have **no package.json** → turbo ignores them; docker-compose omits the worker; `.dockerignore` excludes `backend/`. The documented architecture mentions a Python notification worker, but it is not part of any deploy path.
2. **No Dockerfile for the NestJS API or web** in `docker/` (the existing Dockerfiles target Python only). Deploy must build via systemd/turbo.
3. **`Dockerfile.backend`/`Dockerfile.worker` orphaned** relative to compose.
4. **Redis in compose but unused** (M2).
5. **Health/readiness** in `main.ts` — but readiness checks not wired to an orchestration platform.
6. **No Terraform/Ansible/IaC** — deploy is shell + systemd.
7. **CI runs trufflehog** (good) and docker build; no automated migration step in deploy pipeline (C4 interplay — schema drift would be caught at deploy, not CI).

## 29.3 Verdict

Deploy tooling is minimal and split: infra via compose, app via systemd, Python layer orphaned (H6). No IaC, no migration step in CI/CD, orphaned Dockerfiles.
