# H6 Pre-Deletion Audit — `backend/` (legacy Python / FastAPI)

> **Status:** Audit only. No files were deleted, moved, or modified.
> **Generated:** 2026-08-06
> **Scope:** The legacy `backend/` directory (root-level, git-tracked).
> **Mission verdict (see bottom):** `SAFE TO DELETE`

---

## 1. Full directory tree (compact, by top-level entry + engine modules)

```
backend/
├── alembic/                       (3 files)   DB migration tooling
│   ├── env.py
│   ├── script.py.mako
│   └── versions/.gitkeep
├── alembic.ini                    (1 file)    Alembic config
├── app/                           (47 files)  Legacy FastAPI app entrypoint
├── CHANGELOG.md                   (1 file)    Legacy changelog
├── docs/                          (5 files)   Python-backend documentation
├── modules/                       (961 files) 24 analytics engines (see §2)
│   ├── __init__.py
│   ├── backtest_engine/
│   ├── confidence_engine/
│   ├── data_engine/
│   ├── decision_engine/
│   ├── early_opportunity_engine/
│   ├── elite_score_engine/
│   ├── explainability_engine/
│   ├── financial/
│   ├── market_regime_engine/
│   ├── momentum_engine/
│   ├── monte_carlo_engine/
│   ├── moving_average/
│   ├── multi_factor_engine/
│   ├── pattern_engine/
│   ├── plugin_system/
│   ├── portfolio_engine/
│   ├── position_sizing_engine/
│   ├── prices/
│   ├── scoring_engine/
│   ├── similarity_engine/
│   ├── strategy_engine/
│   ├── strategy_optimizer/
│   ├── trend_engine/
│   ├── volume_engine/
│   └── walk_forward_engine/
├── plugins/                        (14 files)  Plug-in loader
├── pyproject.toml                  (1 file)    Python packaging
├── requirements.txt                (1 file)    Python dependencies
├── scripts/                        (1 file)    Legacy run scripts
└── tests/                          (91 files)  Python tests (NOT run by CI)
```

## 2. File count

| Scope | Count |
|------|-------|
| Total files tracked at `HEAD` under `backend/` | **1,126** |
| Engine modules under `modules/` | **24** (+ `plugin_system`) |
| Python source (`.py`) — approx | ~1,000+ (modules + tests + app + alembic) |
| Non-Python (toml/ini/md/txt/mako) | ~25 |

## 3. Folder size

| Scope | Size |
|------|------|
| `backend/` total (sum of all blob sizes at HEAD) | **3,947,504 bytes ≈ 3.76 MB** |
| `backend/modules/` (engines) | 3,303,341 bytes (~3.15 MB) |
| `backend/tests/` | 447,957 bytes (~437 KB) |
| `backend/app/` | 49,980 bytes |
| `backend/plugins/` | 22,685 bytes |
| `backend/docs/` | 43,452 bytes |
| `backend/scripts/` | 19,157 bytes |

## 4. Duplicate files

153 files share the git empty-blob SHA `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` (empty `__init__.py` markers across `app/`, `modules/`, and every engine subdirectory).

Additional duplicate-content clusters (files are byte-identical):

| Blob (12-char SHA) | Files | Representative members |
|--------------------|-------|------------------------|
| `8b137891791f` | 110 | `.../__init__.py` across `market_regime_engine/` tree |
| `5f282702bb03` | 23  | `backtest_engine/**/__init__.py` |
| `e69de29bb2d1` | 153 | empty `__init__.py` package markers |
| `f82f02ad667e` | 4   | `data_engine/providers/{price,news,financial,technical}_provider.py` |
| `5bc0c2e6d2a8` | 2   | `confidence_engine/api/__init__.py`, `elite_score_engine/api/__init__.py` |

These are redundant Python package markers and stub providers — they do not imply the folder is in use; they are internal duplication.

## 5. Duplicate / overlapping modules

The engine set contains overlapping concerns (e.g. `scoring_engine` vs `elite_score_engine` vs `confidence_engine`; `data_engine` vs `prices` vs `moving_average`). These are internal design smells, not external dependencies. No two backend modules are referenced from any other part of the repository.

## 6. Unused files

**All 1,126 files are unused by the active system.** "Unused" is here defined as: not imported/referenced by `apps/api`, `apps/web`, `apps/telegram`, `apps/worker`, CI, deploy, or any runtime configuration. Evidence:

- The entire `backend/` directory is Python; the active stack (`apps/api`, `apps/web`, `apps/telegram`) is TypeScript/NestJS. The two cannot import one another.
- `backend/` is excluded from Docker via `.dockerignore` (line 67: `backend/`).
- `backend/` is **not** listed in `turbo.json` (only `apps/*` via `pnpm --filter @bist-elite/...`), and is **not** a pnpm workspace package.
- CI (`.github/workflows/ci.yml`) has no job that builds, lints, or tests `backend/`. The only Python job (`test-worker`, lines 164-190) does `cd apps/worker && pytest tests/` — it targets `apps/worker/tests/`, **not** `backend/tests/` (91 files). `backend/tests/` is never executed.
- No deploy path references it (see §7).

## 7. Git history

| Item | Value |
|------|-------|
| Commits that touched `backend/` | **1** |
| That commit | `3e24bb3` — "Initial BIST Elite AI project" (2026-07-23) |
| First commit touching `backend/` | `3e24bb3` (2026-07-23) |
| Last commit touching `backend/` | `3e24bb3` (2026-07-23) |

`backend/` was added once in the initial repository import and was **never modified, never integrated, and never built** afterward. It is version-controlled dead weight from day one.

**Last modification date:** 2026-07-23 (the Initial commit). All 1,126 files share this date — none have been touched since. (The working-tree copy was later deleted; see §8.)

## 8. Working-tree state (important)

The `backend/` directory is **not present on disk** in this working tree. `git status` reports 1,126 **unstaged deletions** (` D backend/...`). The files remain tracked in the git index / at `HEAD`. Per the audit mission, nothing has been staged or committed — this audit is read-only and no `git rm` / commit was executed.

## 9. Equivalent exists under `apps/api`?

Only a subset of backend engines have rough counterparts in the active NestJS API; the rest are Python-only analytics that have **not** been ported into `apps/api`.

| Legacy `backend/` engine | Rough `apps/api/` equivalent (if any) | Notes |
|--------------------------|----------------------------------------|-------|
| `data_engine` / `prices` / `moving_average` | `apps/api/.../market-data/` (YahooUnifiedAdapter, FintablesAdapter, aggregation) | Price/ohlcv/fundamental fetch is now the unified provider stack |
| `scoring_engine` / `elite_score_engine` | `apps/api` analysis pipeline (`financialRules`, `indicatorEngine`) | Scoring logic ported to TS |
| `backtest_engine` | `apps/api` backtest pipeline (analysis-pipeline) | Partial — lightweight TS engine |
| `confidence_engine` | (none) | Python-only, not ported |
| `decision_engine` | (none) | Python-only, not ported |
| `strategy_engine` / `strategy_optimizer` / `multi_factor_engine` / `pattern_engine` / `momentum_engine` / `volume_engine` / `trend_engine` / `position_sizing_engine` / `portfolio_engine` / `similarity_engine` | (none) | Python-only, not ported |
| `market_regime_engine` | (none) | Python-only, not ported |
| `explainability_engine` | (none) | Python-only, not ported |
| `early_opportunity_engine` | (none) | Python-only, not ported |
| `walk_forward_engine` / `monte_carlo_engine` | (none) | Python-only, not ported |
| `plugin_system` | (none) | Internal Python plugin loader |
| `financial` (sub-package) | `apps/api/.../market-data/...` | Partial coverage |

The existence/non-existence of TS equivalents is **orthogonal** to the deletion decision: none of these backends are referenced by the running system. Porting the Python-only analytics is a separate product decision, explicitly out of scope for R2-019.1 (which keeps `apps/worker` as a health-only stub and does not implement Python analytics).

## 10. Risk level (per top-level folder)

Risk = probability that deleting this folder breaks the active system.

| Folder | Files | Business value (logic) | Deletion risk | Verdict |
|--------|------|------------------------|---------------|---------|
| `modules/` (24 engines + plugin_system) | 961 | HIGH (unported analytics) | **LOW** — zero external references | Delete |
| `tests/` | 91 | None (Python tests, not run by CI) | LOW | Delete |
| `app/` (FastAPI entrypoint) | 47 | None (not the running worker) | LOW | Delete |
| `plugins/` | 14 | None | LOW | Delete |
| `alembic/` + `alembic.ini` | 4 | None (Prisma is used, not Alembic) | LOW | Delete |
| `docs/` | 5 | None (stale Python docs, contradicts D003 hygiene) | LOW | Delete |
| `scripts/` | 1 | None | LOW | Delete |
| root `pyproject.toml`/`requirements.txt`/`CHANGELOG.md` | 3 | None (no Python build uses `backend/`) | LOW | Delete |

## External-reference sweep (conclusive)

`git grep` for any code/CI/deploy/docker path reference to `backend/` and for any Python invocation:

- Search scope: `.github`, `deploy`, `scripts`, `apps`, `package.json`, `turbo.json`, `docker-compose*.yml`.
- Path references (`apps/backend`, `bist-backend`, `/backend/`, `backend/app`, `backend/modules`): **0 matches**.
- Python invocations (`python`, `pip install`, `requirements.txt`, `\.py`): found **only** for `apps/worker/` — CI installs `apps/worker/requirements.txt` and runs `cd apps/worker && pytest tests/`; deploy does `cd $APP_DIR/apps/worker && pip install -r requirements.txt`; `scripts/start.sh` does `cd apps/worker && python -m uvicorn main:app`. **No Python invocation targets `backend/`.**
- Docker: `.dockerignore` excludes `backend/` (line 67); no `docker-compose` service mounts or builds `backend/`.
- The only in-repo occurrences of the literal string "backend" outside `backend/` itself are cosmetic: `CODEOWNERS` team `@bist-elite/backend`, `labels.yml` tag `area: backend`, and doc prose. None are path/import references.

## Conclusion

`backend/` is fully orphaned: 1,126 files added in the initial commit and never referenced, built, tested, or deployed since. It is excluded from Docker, absent from turbo/pnpm/CI, and the only Python runtime wiring in the repo targets `apps/worker/` (a separate, retained FastAPI health stub). The 24 analytics engines are not imported by the active TypeScript stack; those that have TS equivalents already do so under `apps/api`, and the unported engines are out of scope for this sprint.

## SAFE TO DELETE

**Technical justification:** Zero code, CI, deploy, or runtime references to `backend/` anywhere in the repository; the directory is excluded from Docker (`.dockerignore` line 67), is not a pnpm/turbo package, and is never built or tested by CI (CI's Python job runs `apps/worker`, not `backend`). Last git activity is the 2026-07-23 initial commit. Removing it (e.g. `git rm -r backend && git commit`) cannot affect `apps/api`, `apps/web`, `apps/telegram`, or `apps/worker`, all of which remain green. The only residual value is unported analytics source code, which is a product/porting decision deferred to Q3 and is explicitly out of scope — deletion does not preclude that decision because the code is already preserved in git history (reachable via the initial commit and can be resurrected with `git checkout <commit> -- backend` if ever needed).
