# PROMPT REMAINING — BIST ELITE AI

## Original Target: 35 prompts

## Prompt Accounting

| Category | Count |
|---|---|
| Roadmap prompts completed (R2-001 … R2-029 + foundation sprints 1-12) | ~29 |
| Roadmap prompts remaining (R3-001 vectorbt/TS, R3-002 Python quant, R3-003 TradingAgents, R3-004 Agency Agents, R4 vision items: AI Berkshire, Portfolio Manager, Risk Manager, Strategy Builder, Learning Engine) | **8-10** |
| New required prompts from gap register G1-G30 (data pipeline, ML, hardening, consolidation, go-live) | **~20** |
| **Estimated remaining implementation prompts** | **~28-32** |

## Which Prompts Are Effectively Cancelled / Merged

- **Cancelled:** None formally. `backend/` Python legacy (D011) deleted — its scope merged into `apps/worker`.
- **Merged:** vectorbt work (R3-001/002) can be merged into a single "Python vectorized backtesting" prompt. TradingAgents + AI Berkshire + Agency Agents (R3-003/004, R4) can merge into a single "Multi-Agent AI" workstream. ⇒ effective remaining count ~25-28.
- **New required (not in original 35):** UI/API consolidation, coverage gates, route-collision fixes, TradingView adapter, self-learning persistence, go-live → adds ~6-8 to the plan.

## Prioritized Remaining Prompt List (recommended order)

### P1 — Quality Gate & Commit (1 prompt)
Fix 5 failing tests, wire e2e, enforce coverage, install ESLint/commitlint, commit working tree, pin tool versions.

### P2 — API Integrity (1 prompt)
Resolve 5 route collisions, delete orphaned controller, replace 2 stubs with DB-backed.

### P3 — Data Layer Fixes (1 prompt)
QualityScorer bug, TradingView adapter, phantom identities, Macro `Math.random()`.

### P4 — Self-Learning & Scheduler (1 prompt)
Nightly learning job, Prisma persistence, real-direction pass.

### P5 — Frontend Consolidation (1 prompt)
Deprecate legacy `frontend/` or fix imports; wire Audit page; real market quotes.

### P6 — Go-Live (1-2 prompts)
deploy.yml fix, HTTPS, GO_LIVE_CHECKLIST, monitoring.

### P7 — Telegram Activation (1 prompt)
Notifications sendMessage, settings persistence, watchlist callbacks, tests.

### P8 — Data Pipeline Phase 5 (4-6 prompts)
Real-time feed, 10+yr historical import, sentiment/alt-data, data-quality validation, incremental updates.

### P9 — ML Phase 6 (4-6 prompts)
Training pipeline, feature engineering automation, model versioning/rollback, monitoring, A/B testing.

### P10 — Multi-Agent & Vision R3/R4 (4-6 prompts)
Python vectorized backtesting (worker), TradingAgents-style debate, AI Berkshire, portfolio/risk manager agents, strategy builder, learning engine.

## Time Estimate to Full Completion

| Milestone | Prompts | Duration |
|---|---|---|
| Usable for personal investing (P1-P6) | ~7 | **2-3 weeks** |
| + Telegram, data pipeline (P7-P8) | ~11-13 | **5-6 weeks** |
| Full vision incl. ML + multi-agent (P9-P10) | ~25-30 | **2 months** |

## Conclusion

Approximately **25-30 effective prompts remain** (28-32 nominal). The project becomes genuinely usable for personal investing after the first **~7 prompts (2-3 weeks)**. Full completion of the original 35-prompt vision plus new hardening scope lands at roughly **2 months** of focused work.
