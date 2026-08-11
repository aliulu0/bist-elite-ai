# 32. DOCUMENTATION

> Baseline: `docs/` = 55 top-level files + `plans/`, `recovery/`, `runtime/`, `reports/`. Root has README, ARCHITECTURE, AUDIT_REPORT, and several guides.

## 32.1 Live-doc family (auto-updated)

- `MASTER_ROADMAP.md` (v3.0)
- `PROJECT_STATUS.md`
- `AI_HANDOFF.md`
- `PROJECT_DECISIONS.md`
- `LOCALIZATION_STANDARD.md`
- `TESTING.md` / test-run docs
- `reports/` — sprint reports

## 32.2 Roadmap health

- **Completion ≈88%** (documented).
- **Current sprint: R2-019** (in progress) — matches this audit's working state (portfolio-optimization).
- **Next: R2-020 Backtesting** — not started (matches missing backtest engine, H7).
- **Duplicate sprint IDs:** `R2-008` vs `R2-022`, `R2-010` vs `R2-024`, `R2-011` vs `R2-023` — same ID used by two different sprints → roadmap references ambiguous.
- **No completed entries for R2-012 … R2-018** — the roadmap has a gap in the ID sequence.

## 32.3 Findings

1. **`ARCHITECTURE.md` (root) is stale** — describes the older layout (e.g., mentions the old frontend/Next and single backend) inconsistent with the current monorepo split.
2. **`AUDIT_REPORT.md` (root) is stale** — older audit snapshot; this new audit supersedes it.
3. **TradingView documented complete but no code** (H1) — documentation asserts a feature that doesn't exist.
4. **Python layer documented as part of architecture but not integrated** (H6) — `AI_HANDOFF`/architecture mention it, deploy omits it.
5. **Redis documented** as used (per infra docs/env) but unused (M2).
6. **Duplicate sprint IDs + gap** in roadmap (M6).
7. **No CHANGELOG** at root; sprint reports in `reports/` partially cover it.
8. **Positive:** 4 live docs auto-updated by AI workflow (D010), Turkish-standard doc, decisions log maintained.

## 32.4 Verdict

Documentation culture is strong (live docs, decisions log, sprint reports) but accuracy has drifted on architecture (stale root docs), roadmap IDs, and claimed features (TradingView, Redis, Python).
