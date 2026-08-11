# 17. CONFIGURATION

## 17.1 Env-driven configuration

- `@nestjs/config` `ConfigService` global; `.env` files loaded.
- **Env files on disk:**
  - `.env` — gitignored, real-looking local secrets (never committed).
  - `.env.development` — **COMMITTED** (placeholders).
  - `.env.production` — **COMMITTED** (placeholders).
  - `.env.docker` — present on disk, **NOT in `.gitignore`** (untracked).
- `env.validation.ts` (or equivalent) validates required vars; `isGlobal`.
- `config/` module + `common/config` for typed config providers.

## 17.2 Findings

1. **M3 / H5 — env hygiene:**
   - `.env.development` / `.env.production` committed to git → future accidental real-secret commits are only a keystroke away; CI trufflehog mitigates but doesn't fix the convention.
   - `.env.docker` not gitignored.
   - Production Docker falls back to a **dev JWT secret** when `JWT_SECRET` unset (12/H1).
2. **Two config layers** (`packages/config` re-export facade + `common/config`) create slight ambiguity about the source of truth.
3. **No secret rotation / keyless (Secrets Manager / Vault) integration** — flat env vars only.
4. **Validation:** required-env validation exists; unknown-env rejection not confirmed.
5. **No config versioning** for system-settings DB seed vs code defaults.

## 17.3 Verdict

Configuration works and is validated, but env hygiene (committed env files, non-ignored docker env, dev-secret fallback) is a real risk (M3/H5).
