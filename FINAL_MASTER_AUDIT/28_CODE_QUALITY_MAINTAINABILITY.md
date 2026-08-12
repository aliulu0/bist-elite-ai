# 28 — CODE QUALITY & MAINTAINABILITY AUDIT

## Structure & conventions

- Clean monorepo: `apps/{api,web,telegram,worker}` + `packages/shared`.
- NestJS modules are self-contained: module/service/controller/dto/types + co-located `*.spec.ts`.
- AGENTS.md conventions followed: `@Optional()` DI with local fallback (unit tests construct classes directly), single-fetch-per-symbol via orchestrator, co-located specs.
- DTOs with `class-validator`, `.from()` factories, immutable snapshots with `Object.freeze` + SHA-256 digest (R2-045/046).

## Observations

- 342 API spec files + 708 web test files → strong test culture.
- No ESLint installed in this environment (lint script exists but binary absent) → rely on strict TS.
- `tsc --noEmit` strict passes for everything except R2-046 (5 errors) — module quality itself is fine; imports are wrong.
- `uuid` import in R2-046 suggests a dependency that was never added (`package.json` — not installed). Using Node's built-in `crypto.randomUUID()` would avoid a new dependency.
- No `@ts-ignore`/`@ts-expect-error` observed (matches stated convention).

## Verdict

- Maintainability: GOOD. One cluster of broken imports (R2-046) is the only compile debt.
- Personal-use scale: appropriate — no over-engineering, engines are pure and testable.