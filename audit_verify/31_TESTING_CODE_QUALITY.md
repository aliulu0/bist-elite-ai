# 31. TESTING CODE QUALITY

> Deep-dive into the quality of the test code itself. Complements `30_TESTING.md`.

## 31.1 Patterns observed

- Engine specs use mocked providers/services (no live HTTP) → deterministic.
- Registry specs cover the full surface (set/get/getAll/has/count/clear/top).
- Snapshot-style assertions used where stable; explicit `expect` on numeric DTO fields elsewhere.
- Shared (Vitest) covers zod schema validation, i18n dictionaries, and utils — high value.
- Portfolio-optimization specs (24) include edge cases (no data, insufficient data, ties) — strong.

## 31.2 Issues

1. **No test for the WebSocket gateway** (auth + CORS behavior unguarded).
2. **No tests for security-critical paths** (AuthGuard allow/deny matrix, RolesGuard) — ironic given C2.
3. **No migration/schema test** — schema-vs-migration drift (C4) would have been caught by a `prisma migrate diff` check in CI.
4. **No property-based/fuzz tests** for engines (deterministic inputs only).
5. **Test count inflation:** some suites count many specs but assert shallowly (single assertion per spec) — coverage % looks high without depth.
6. **Vitest + Jest mixed across workspace** — inconsistent config, contributor friction.
7. **No `coverageThresholds`** enforcement (also 30.3.5).

## 31.3 Verdict

Test code is above-average for unit coverage with good mocking discipline. Gaps: no security tests, no migration-drift test, no coverage gates, no e2e, and mixed runners.
