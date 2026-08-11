# ROADMAP RECOMMENDATION — BIST ELITE AI

Based on the full A-001 audit. Order is risk-driven, not feature-driven.

## Sprint A — Hardening & Quality Gate (week 1) — "make CI trustworthy"
1. Fix 5 deterministic failing tests (cache LRU boundary, compression brotli timeout, performance-validator threshold)
2. Wire the 3 orphaned root e2e specs (203 tests) into CI
3. Enforce coverage thresholds (jest coverageThresholds) + generate real coverage
4. Install ESLint + wire commitlint pre-commit/commit-msg hook
5. **COMMIT the working tree** (2,108 changed + 15,044 untracked) — reduce data-loss risk
6. Fix version drift: pin pnpm 11 + Node 22 consistently across CI/deploy/Docker

## Sprint B — API Integrity (week 2)
1. Resolve 5 duplicate @Controller prefixes (portfolio, watchlist, scanner, dashboard, analysis)
2. Delete orphaned `market-scanner` controller
3. Replace stub `watchlist` controller with DB-backed (Prisma)
4. Replace mock `market-overview` leaders with real engine calls
5. Fix QualityScorer staleness bug (`new Date(c.provider)` → NaN)
6. Remove `Math.random()` from Macro demo signal (use real confidence from engines)

## Sprint C — Data Layer Completion (week 3)
1. Add TradingView provider adapter (D002 priority #2) + Google Finance adapter
2. Complete D012 migration: route internal engines through unified orchestrator, retire legacy Yahoo service
3. Remove phantom provider identities (investing, google_discovery)
4. Fix backtest RSI duplication (route through IndicatorEngine)

## Sprint D — Self-Learning & Scheduler (week 4)
1. Wire nightly scheduler job → `/early-opportunities/learning/run`
2. Persist self-learning confidence modifiers to Prisma
3. Add real-market recent-direction pass via MarketDataOrchestrator
4. Activate Telegram NotificationService (real sendMessage) + persist settings + implement watchlist:add/remove callbacks + add telegram tests

## Sprint E — Frontend Consolidation (week 5)
1. Decide canonical frontend: **apps/web** (workspace member, 1902 tests)
2. Fix legacy `frontend/` dashboard broken imports or deprecate the app
3. Wire apps/web Audit page (needs backend audit-log endpoint)
4. Replace synthesized/hardcoded market quotes in apps/web dashboard with real endpoints

## Sprint F — Deployment Go-Live (week 6)
1. Fix deploy.yml (`docker/build-and-push-action`), add failure detection
2. Configure HTTPS certs (nginx TLS block + ACME)
3. Execute GO_LIVE_CHECKLIST (Supabase/Upstash/Render/Cloudflare or self-hosted systemd path)
4. UptimeRobot monitoring + health-check automation

## Sprint G+ — Vision Completion (weeks 7-9, optional)
- R3-001/002: vectorbt/Python vectorized backtesting on worker stub
- R3-003: TradingAgents multi-agent research debate
- Phase 5: real-time BIST feed, 10+ year historical import, sentiment, data-quality validation
- Phase 6: ML training pipeline, feature engineering, model versioning, A/B testing
- R4: AI Berkshire + portfolio manager + risk manager + strategy builder + learning engine

## Ordering Rationale

Tests + commit first (trust + data-loss prevention), then API integrity (correctness), then data (freshness), then self-learning/scheduler (the "learning loop" the roadmap promises), then frontend (user-facing), then go-live (value), then vision (ambition).
