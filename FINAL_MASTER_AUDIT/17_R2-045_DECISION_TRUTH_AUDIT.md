# 17 — R2-045 EARLY OPPORTUNITY DECISION — TRUTH AUDIT

## Claim (docs/R2-045 + MASTER_ROADMAP)

- Pure deterministic convergence + decision layer over `EarlyOpportunityIntelligenceResult`; no data fetch, no indicator math, no GPT.
- 10 weighted dimensions (sum 1.00); coverage model; 7-way status; hard gates; confidence = 0.6×decision + 0.4×quality; immutable SHA-256 snapshot; `GET /ai-early-opportunity/decision/:ticker`; batch `enrichWithDecisions()`.

## Reality (verified)

- Files: `ai-early-opportunity/decision/` — engine, service, controller, DTO, types, index + 2 spec files. **8 files, all untracked** (never committed).
- Tests: 2 suites / 16 tests **PASS** (verified this audit).
- Typecheck: clean (is it imported by `early-opportunity.module`? The module references exist; `app.module` imports `EarlyOpportunityModule` and R2-046 imports it too — but `decision/` files remain untracked).
- Logic: weights sum 1.00 present in `early-opportunity-decision.types.ts`; hard gates implemented; pure function → correct.

## Classification

- **REAL_AND_WORKING (logic-level)** — deterministic and unit-proven.
- **Git fragility:** the entire R2-045 feature is **untracked**. A fresh clone loses it. `PROJECT_STATUS.md` says R2-045 committed/green — git says otherwise.
- Runtime: with no market data, decisions are `INVALID_OPPORTUNITY` for all symbols (upstream gate, not decision logic).

## Verdict

- R2-045: logic ✅, tests ✅, **commit status ❌** (untracked), live end-to-end ❌ (needs data + API boot).
- Persist this module so the R2-046 backtest input source is reproducible.