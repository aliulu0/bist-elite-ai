# AGENTS.md

Agent guidance for working in the `bist-elite-ai` monorepo.

## Workspace layout
- `apps/api`  — NestJS API (TypeScript). Jest via `apps/api/jest.config.ts`.
- `apps/web`  — web frontend.
- `packages/*`, `shared/*` — shared libraries.
- Tests are co-located: `<module>/<name>.spec.ts` or `<module>/__tests__/<name>.spec.ts`.

## Commands

TypeScript typecheck (API):
```
node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json
```

Run a specific Jest suite (works without `npm`/`turbo` when the shell wrapper is unavailable):
```
node_modules\typescript\bin\tsc --noEmit -p apps/api/tsconfig.json
"C:\Program Files\nodejs\node.exe" apps/api/node_modules/jest/bin/jest.js --config apps/api/jest.config.ts --rootDir apps/api --testPathPattern="<pattern>" --forceExit
```

Full API test run via turbo:
```
turbo run test --filter=@bist-elite/api
```

Lint (ESLint is not installed in this environment; rely on `tsc` + Jest):
```
turbo lint
```

## Conventions
- Inject shared services via Nest DI modules; prefer `@Optional()` constructors with a local fallback so unit tests (which construct classes directly) keep working.
- Keep market-data acquisition to ONE fetch per symbol (use `MarketDataOrchestrator` caching).
- Add/keep jest specs for new behaviour; run typecheck + relevant specs before finishing.
