# 36 — EXECUTIVE SCORE DETAIL & EVIDENCE

> Weighted scoring rationale for personal-use platform. See 00 for totals.

| Category | Max | Score | Evidence |
|---|---|---|---|
| **Real Data** | 20 | 3 | KAP live; no OHLCV provider configured; Yahoo unreachable; only catalyst/disclosure data works (05, 06) |
| **Core Intelligence** | 20 | 11 | 17+ engines implemented & unit-tested; deterministic; but none live-verified with data (08, 31) |
| **Early Opportunity** | 15 | 6 | Full pipeline exists; decision+quality+signals logic passes; produces zero real signals (18, 20, 21) |
| **Backtesting** | 10 | 4 | R2-046 broken compile (−3); engine design good, 52/52 mocked; general backtest engine works (18, 04) |
| **Frontend** | 10 | 6 | Elite Dashboard + scanner + history pages; compiles; 708 tests; no live data (10) |
| **Runtime** | 10 | 2 | API cannot boot; no deployed instance; scheduler/telegram not running (06, 13, 25) |
| **Integrations** | 5 | 1 | Agent Reach adapter only; all external repos absent (14) |
| **Reliability** | 5 | 2 | CI files exist but HEAD fails; no effective gate (29) |
| **Personal Usability** | 5 | 3 | Clean docs, runbooks, honest QA notes; but unusable for real decisions today (16, 27) |
| **TOTAL** | **100** | **38** | |

## Score movement vs earlier truth-audit (52.5)

- Earlier audit predates the R2-046 commit's broken state (or tree drifted). R2-046 added a non-compiling module → build(−5), runtime(−2), backtest(−4.5), reliability(−2) ≈ net −14 → 38.

## Recoverable by fixing only real gaps

- After must-fix (compile+commit+docs): ~50–55.
- After one provider key + live smoke: ~70.
- Remaining 30 points are genuine feature-gaps (derived TFs, ML, notifications, persistence) for later.

## Honesty note

- Scores are the auditor's judgement from reproducible evidence; no fabricated numbers. Provider call-counts already verified in earlier runs for 043/044 were marked ⚠️-not-re-verified rather than assumed.