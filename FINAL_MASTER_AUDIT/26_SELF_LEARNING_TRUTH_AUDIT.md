# 26 — SELF-LEARNING & CALIBRATION TRUTH AUDIT

## Claims

- R2-027 self-learning: confidence modifier (0.85–1.15) from cached predictions + backtest win-rate; improves ranking.
- R2-046 confidence calibration: LOW/MEDIUM/HIGH buckets vs actual returns with sample-quality labels; lead-time; false-positive; missed-opportunity.

## Reality

- `SelfLearningService` — real code, base + modifier trend, **in-memory only** (no store).
- `confidence-calibration.service.ts`, `lead-time.service.ts`, `false-positive.service.ts`, `missed-opportunity.service.ts` in R2-046 — real code, unit-tested (part of the 52).
- **Real feedback loop: NOT possible yet** — no real predictions + outcomes have occurred; registries are empty; historical data cannot be fetched (no provider).

## Classification

- Self-learning engine: MEMORY_ONLY (works, loses state on restart; no live data to learn from).
- Calibration suite (R2-046): CODE_ONLY — would work given real decision histories; currently zero samples.

## Verdict

- Learning layer is **architecturally ready but has zero real experience**. "Improving accuracy over time" is not demonstrable today.