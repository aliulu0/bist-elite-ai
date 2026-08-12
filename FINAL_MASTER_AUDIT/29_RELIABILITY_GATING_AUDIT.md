# 29 — RELIABILITY & TEST GATING AUDIT

## What protects the repo from breaking silently?

- GitHub Actions workflows exist (`build.yml`, `ci.yml`, `test.yml`, `lint.yml`, `security.yml`, …).
- `ci.yml` runs prettier + lint + test + typecheck on push/PR to main/develop.

## Why the break slipped through

- The R2-046 module was committed with docs claiming green, but:
  - Local `tsc` was likely run in a different project state (correct paths/uuids present at authoring time), then committed after renames/cleaning → mismatch.
  - **No CI gate actually ran/failed on this commit** (no remote merge-protection evidence; and even if CI ran, the shell here lacks pnpm).
  - Tests are mocked at unit level → green regardless of broken DI wiring.

## Recommended gates (cheap, high value)

1. CI hard gate: `pnpm exec tsc --noEmit -p apps/api/tsconfig.json && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`.
2. CI run jest with a **boot smoke** (import `AppModule`, expect no throw) — catches broken Nest wiring beyond tsc.
3. Keep docs auto-derived (CI status badge in PROJECT_STATUS).
4. One keyed provider smoke test (enabled when secrets present via GitHub secrets).

## Current reliability score

- 2/5. CI scaffolding present but not effective as a gate today (and HEAD is red).

## Verdict

- Reliability improves immediately once (a) R2-046 compiles and (b) CI actually blocks non-green commits.