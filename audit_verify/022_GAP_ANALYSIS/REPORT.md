# 022 — GAP ANALYSIS AUDIT

## Verdict: CORE DELIVERED; DATA PIPELINE, ML, AND POLISH REMAIN (70/100 complete)

## Gap Register (severity-ordered)

| # | Gap | Area | Severity | Effort |
|---|---|---|---|---|
| G1 | TradingView provider missing (D002 priority #2) | Data layer | High | 1-2 prompts |
| G2 | Real-time BIST data feed (Phase 5, not started) | Data pipeline | High | 3-5 prompts |
| G3 | Historical data import 10+ years (Phase 5) | Data pipeline | High | 3-5 prompts |
| G4 | Alternative data / sentiment (Phase 5) | Data pipeline | Medium | 2-3 prompts |
| G5 | Data quality validation + incremental updates (Phase 5) | Data pipeline | Medium | 2-3 prompts |
| G6 | ML pipeline: training, feature engineering, model versioning (Phase 6) | ML/AI | High | 5-8 prompts |
| G7 | A/B testing framework (Phase 6) | ML/AI | Medium | 2-3 prompts |
| G8 | Scheduler job for `/early-opportunities/learning/run` | Self-learning | Medium | 0.5 prompt |
| G9 | Self-learning persistence (in-memory → Prisma) | Self-learning | Medium | 1 prompt |
| G10 | Self-learning real-direction pass via MarketDataOrchestrator | Self-learning | Medium | 1 prompt |
| G11 | Fix legacy `frontend/` dashboard imports or deprecate | Frontend | High | 0.5-1 prompt |
| G12 | Wire apps/web Audit page (backend audit-log endpoint missing) | Frontend/API | Medium | 0.5-1 prompt |
| G13 | Replace hardcoded/synthesized market data in apps/web dashboard | Frontend | Medium | 1 prompt |
| G14 | 5 duplicate @Controller prefixes — resolve | API | **Critical** | 0.5-1 prompt |
| G15 | Replace 2 stub controllers (watchlist, market-overview) with DB-backed | API | High | 1-2 prompts |
| G16 | Delete orphaned market-scanner controller | API | Low | 0.1 prompt |
| G17 | Consolidate 3 Elite Score modules | Reuse | Medium | 1 prompt |
| G18 | Fix backtest RSI duplication (D004) | Reuse | Medium | 0.5 prompt |
| G19 | Activate Telegram NotificationService (sendMessage) + settings persistence | Telegram | Medium | 1-2 prompts |
| G20 | Implement watchlist:add/remove callbacks | Telegram | Low | 0.5 prompt |
| G21 | Wire 3 orphaned root e2e specs into CI | Testing | Medium | 0.5-1 prompt |
| G22 | Fix 5 failing tests + enforce coverage thresholds | Testing | High | 1-2 prompts |
| G23 | Install ESLint + wire commitlint hook | Quality | Medium | 0.5-1 prompt |
| G24 | Fix QualityScorer staleness bug (`new Date(c.provider)`) | Data | High | 0.5 prompt |
| G25 | Remove `Math.random()` from Macro demo signal | Macro | High | 0.5-1 prompt |
| G26 | Fix version drift (pnpm 9 vs 11, Node 20 vs 22) | DevOps | Medium | 0.5-1 prompt |
| G27 | Fix deploy.yml broken action (`docker/build-and-push-action`) | DevOps | High | 0.5 prompt |
| G28 | Cleanup: node_modules.bak_corrupt, empty coverage, placeholder tests | Hygiene | Low | 0.5 prompt |
| G29 | Go-live: HTTPS certs, real deployment (GO_LIVE_CHECKLIST unchecked) | Deployment | High | 1-2 prompts |
| G30 | Consolidate legacy `frontend/` vs `apps/web` decision | Frontend | Medium | 1 prompt |

## What Is NOT a Gap

- Early Opportunity detection chain — complete (11/11 links).
- Multi-Timeframe, Smart Money, Catalyst, Verification, Research, Elite Score — complete.
- Dashboard, scheduler, event bus, websocket, provider stack — present.

## STATUS: ~70% VISION COMPLETE — REMAINDER IS DATA PIPELINE + ML + POLISH + HARDENING
