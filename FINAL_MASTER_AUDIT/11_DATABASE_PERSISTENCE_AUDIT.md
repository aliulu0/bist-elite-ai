# 11 — DATABASE & PERSISTENCE AUDIT

> Data-layer claims vs reality.

## Structure

- `persistence` module, `DATABASE.md`, `database-guide.md`, `ER_DIAGRAM.md`, schema docs present.
- Config in `.env`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` — local Postgres configured.

## Pillars — are they persisted or in-memory?

| Store | Persisted? | Truth |
|---|---|---|
| Predictions | CACHE (CacheService) | in-memory/Redis-style; not a durable table by default |
| Backtest reports | Registry (in-memory) | R2-046 and backtest registries are memory maps → lost on restart |
| Portfolio snapshots | Registry (in-memory, ≤50) | memory |
| Decision snapshots | Registry (in-memory) | R2-045/046 registry, not DB |
| Self-learning modifier | memory | recomputed each boot |
| Symbol registry | code+config | static list |
| Auth users | `auth` module | DB-backed (Postgres) — but no live E2E verified |
| Worker/notifications | `apps/worker` | Python; DB tables only if worker running |

## Known environment issue (documented by prior runs)

- Local PostgreSQL was stuck in crash recovery → DB-backed E2E blocked **in that environment only** (not a code defect). Not re-tested this audit.

## Truth check

- The system is **primarily cache/registry-backed**; durable persistence is limited to whatever Postgres-backed modules (auth, worker) use.
- "Database schema, auth, security, observability" (Phase 1) — schema docs exist; live DB-backed flows **unverified** here.

## Verdict

- Persistence is **partial**: caches + in-memory registries cover the intelligence layer; a real DB runtime was not proven.
- Not a blocker for the audit verdict (personal-use platform; restart-loss acceptable for analytics, not for accounts).