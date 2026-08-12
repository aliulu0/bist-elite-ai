# 21 — FILTERS & SCREENER TRUTH AUDIT

## Claims

- R2-027 filter system (score, confidence, expected return, risk, sector, market cap, liquidity, smart money, catalyst, elite score).
- R2-035 signal filter validation; R2-037 data-quality filters.
- R2-038 new filter keys: `minSignalStrength`, `minSignalConvergence`, `signalCategory`, `signalType`, `earlyOnly`, `confirmedOnly`.
- R2-045 adds `minDecisionScore`.

## Reality (code)

- Filter framework implemented in `early-opportunity.intelligence-engine.ts` (`matchesFilters`) + SDK query builders; unit-covered.
- `minDecisionScore` filter observed (R2-045 summary + intelligence-engine usage of `result.decision.decisionScore`).
- Filter engine is deterministic and tested.

## Runtime truth

- With all symbols `INVALID_OPPORTUNITY`, filters return **no rows** — correct behaviour (filters are NOT lying), output is just empty.
- Web `scanner.tsx` exposes filters, but shows empty resultsets.

## Verdict

- Filters: **REAL_AND_WORKING** (logic) / **EMPTY at runtime** (data).
- No filter bug found.