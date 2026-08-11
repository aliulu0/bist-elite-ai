# 26. PACKAGES

> Monorepo shared libraries under `packages/`.

## 26.1 Inventory

| Package | Purpose | Deps | Tests | Notes |
|---|---|---|---|---|
| `@bist-elite/config` | config access | shared | — | **re-export facade** (`export * from '@bist-elite/shared'`) |
| `@bist-elite/types` | types | shared | — | **re-export facade** |
| `@bist-elite/shared` | types, zod schemas, validation, i18n (tr/en), utils | zod, date-fns | ✅ 77 specs pass | real value package |
| `@bist-elite/database` | Prisma schema/migrations/seeds + client | @prisma/client | — | 35 models, 1 migration |
| `@bist-elite/ui` | Button, Card, Input, Badge primitives | react (peer 18), | **NO test files** | built by turbo |

## 26.2 Findings

1. **`config` and `types` are pure re-exports of `shared`** — zero unique logic. They add import indirection without value (03_DEPENDENCY_GRAPH).
2. **`ui` has no test files** — this is the **root cause of the full-workspace `pnpm test` failure** (`No test files found, exiting with code 1` from the ui package; M5 → see 31_TESTING.md).
3. **`ui` peer `react 18` while `web` uses React 19** — version mismatch risk (works today via Vite aliasing, but can break with future react versions).
4. **`database` package** owns schema and seeds; `PrismaService`/client singleton exported — good single-source pattern.
5. **`shared`** is the strongest package (validated, tested, i18n). Keep it as the single truth; delete the facades.
6. **No package-level READMEs** for config/types/ui.

## 26.3 Verdict

`shared` + `database` are solid. `config`/`types` are dead weight; `ui` is the breaking link for the root test command.
