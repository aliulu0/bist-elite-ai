# 016 — SELF-LEARNING AUDIT

## Verdict: PROTOTYPE — WORKING BUT IN-MEMORY ONLY (60/100)

## Implementation

| Item | Detail |
|---|---|
| Module | `apps/api/src/modules/ai-early-opportunity/self-learning/` |
| Files | `self-learning.engine.ts`, `self-learning.service.ts`, registry |
| Logic | Reads cached predictions + Backtest Engine `winRate`; computes confidence modifier (0.85–1.15); stores in-memory; improves ranking by `score × modifier` |
| Cycle | `GET /early-opportunities/learning/run` (manual endpoint) |
| Tests | 2 suites / 19 tests, GREEN |
| Design | **Network-free deterministic cycle** — no new scoring system, no duplicated logic |

## Verified Strengths

- Deterministic (no randomness) — consistent with project's explainability principle.
- Reuses Backtest Engine win-rate — composition, no duplication.
- Integrated into EarlyOpportunityIntelligenceService ranking.
- Dashboard Performance shows learning progress (AI accuracy, win rate, learning progress).

## Gaps

1. **In-memory state only** — confidence modifiers reset on service restart; no persistence (Prisma not used).
2. **No scheduler job** wires `/early-opportunities/learning/run` — it must run manually or via external scheduler today. PROJECT_STATUS explicitly lists this as next step.
3. Real-market recent-direction pass (via MarketDataOrchestrator) documented but **not implemented** — currently only cached backtest win-rate.
4. No model versioning / calibration history persistence.

## STATUS: PROTOTYPE — functional, deterministic, but needs persistence + scheduler wiring + real-direction pass
