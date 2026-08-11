# BIST ELITE AI — FINAL RECALCULATED ROADMAP

**Audit Date:** 2026-08-08  
**Auditor:** Principal AI Developer (R2-FINAL-AUDIT)

---

## ROADMAP PHILOSOPHY

Based on actual audit findings — not the original aspirational roadmap.  
**Priority:** Unblock real usage → Harden production → Enhance quality.

---

## PHASE 0: FOUNDATION UNBLOCKING (P0 Blockers) — **Weeks 1-2**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 1 | 0.1 | Provision PostgreSQL + run migrations | No persistence without DB | None | Low | P0 |
| 2 | 0.2 | Provision Redis instance | Distributed caching | None | Low | P0 |
| 3 | 0.3 | Obtain Fintables API key | Financials, fundamentals | Vendor signup | Low | P0 |
| 4 | 0.4 | Obtain Finnhub API key | Real-time quotes, news | Vendor signup | Low | P0 |
| 5 | 0.5 | Obtain Alpha Vantage API key | Historical, technicals | Vendor signup | Low | P0 |
| 6 | 0.6 | Obtain KAP API key | Turkish disclosures | Vendor signup | Low | P0 |
| 7 | 0.7 | Obtain TCMB API key | Macro indicators | Vendor signup | Low | P0 |
| 8 | 0.8 | Obtain MKK API key | Ownership/float data | Vendor signup | Low | P0 |
| 9 | 0.9 | Obtain SerpAPI key | News, research, verification | Vendor signup | Low | P0 |
| 10 | 0.10 | Configure all env vars + secrets | Runtime needs | 1-9 | Low | P0 |

**Deliverable:** All providers functional, DB + Redis live, secrets managed.

---

## PHASE 1: PRODUCTION HARDENING (P1 Critical) — **Weeks 3-5**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 11 | 1.1 | Add Self-Learning persistence (Prisma model + migration) | Modifiers survive restart | Phase 0 | Medium | P1 |
| 12 | 1.2 | Add Float data to model + providers | Complete fundamentals | Phase 0 | Medium | P1 |
| 13 | 1.3 | Add technical indicator filters (RSI, MACD, SMA, etc.) | Complete screening | Phase 0 | Medium | P1 |
| 14 | 1.4 | Complete Docker/K8s deployment configs | Deployable artifact | Phase 0 | Medium | P1 |
| 15 | 1.5 | Implement per-endpoint rate limiting | Security | Phase 0 | Medium | P1 |
| 16 | 1.6 | Set up APM + alerting (Grafana/Prometheus) | Observability | Phase 0 | Medium | P1 |
| 17 | 1.7 | Implement automated backups + DR plan | Data safety | Phase 0 + 11 | Medium | P1 |
| 18 | 1.8 | Deploy Telegram bot (token + webhook) | Notification channel | Phase 0 | Low | P1 |
| 19 | 1.9 | Add missing technical indicator filters to EarlyOpportunityFilters | Complete screening | Phase 0 | Medium | P1 |
| 20 | 1.10 | Verify historical data completeness + import gaps | Data quality | Phase 0 | Medium | P1 |
| 21 | 1.11 | Add Float field to SymbolRegistry + Prisma | Data model | Phase 0 | Medium | P1 |

**Deliverable:** Production-ready infrastructure, all P1 gaps closed.

---

## PHASE 2: SIGNAL SCANNER COMPLETION (P0/P1) — **Weeks 6-8**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 22 | 2.1 | Implement 20 missing signal models (Golden Cross, RSI, MACD, etc.) | Core requirement | Phase 1 | High | P0 |
| 23 | 2.2 | Add signal detection layer feeding scanner | Detection → Scanner | 22 | High | P0 |
| 24 | 2.3 | Add backtests for each signal | Validation | 22 | High | P0 |
| 25 | 2.4 | Add signal-specific UI toggles in Scanner | User control | 22 | Medium | P0 |
| 25 | 2.5 | Audit WeightOptimizer module + implement or remove | Unknown status | Phase 1 | Medium | P1 |

**Deliverable:** Complete Signal Scanner with all 25 signals.

---

## PHASE 3: QUALITY & SELF-LEARNING (P1/P2) — **Weeks 9-11**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 26 | 3.1 | Implement true ML self-learning (regime-aware, feature weights) | Genuine learning | Phase 1 + 11 | High | P1 |
| 27 | 3.2 | Add tests for 12 untested engines | Quality | Phase 1 | Medium | P1 |
| 28 | 3.3 | Implement Coverage Engine | Track symbol coverage | Phase 1 | Medium | P1 |
| 29 | 3.4 | Add regime-adaptive modifiers to Self-Learning | Context awareness | 26 | Medium | P1 |
| 30 | 3.5 | Implement E2E test suite (Playwright) | Critical path validation | Phase 1 | High | P1 |

**Deliverable:** Genuine self-learning, full test coverage, coverage tracking.

---

## PHASE 4: PRODUCTION VALIDATION (P1) — **Weeks 12-13**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 31 | 4.1 | Run load tests (k6/Locust) | Scalability proof | Phase 1 | Medium | P1 |
| 32 | 4.2 | Penetration test + security audit | Security | Phase 1 | High | P1 |
| 33 | 4.3 | Run E2E test suite | User flow validation | 30 | Medium | P1 |
| 34 | 4.4 | Smoke test all 130+ endpoints | Regression check | Phase 1 | Low | P1 |
| 35 | 4.5 | Telegram bot production verification | Notifications | 18 | Low | P1 |

**Deliverable:** Validated production system.

---

## PHASE 5: POLISH & DOCUMENTATION (P2/P3) — **Week 14**

| Prompt | Sprint | Task | Why | Dependencies | Complexity | Priority |
|--------|--------|------|-----|--------------|------------|----------|
| 36 | 5.1 | Remove/archive legacy `frontend/` folder | Clean repo | None | Low | P3 |
| 37 | 5.2 | Enhance API documentation (OpenAPI) | Developer experience | Phase 1 | Low | P2 |
| 38 | 5.3 | Write user guides + onboarding docs | Onboarding | Phase 4 | Low | P2 |
| 39 | 5.4 | Final production deployment + go-live | Launch | All prior | Low | P0 |

---

## SPRINT SUMMARY

| Phase | Sprints | Prompts | Focus |
|-------|---------|---------|-------|
| 0: Foundation | 0.1-0.10 | 10 | Unblock all external dependencies |
| 1: Hardening | 1.1-1.11 | 11 | Production infrastructure |
| 2: Signal Scanner | 2.1-2.5 | 5 | Complete 25 signals |
| 3: Quality | 3.1-3.5 | 5 | True ML, tests, coverage |
| 4: Validation | 4.1-4.5 | 5 | Load, security, E2E |
| 5: Polish | 5.1-5.4 | 4 | Cleanup, docs, launch |

**Total: 40 Prompts over ~14 Weeks**

---

## CRITICAL PATH

```
Phase 0 (API Keys + DB) → Phase 1 (Infra + Persistence) → Phase 2 (Signals) → Phase 3 (Quality) → Phase 4 (Validation) → Phase 5 (Launch)
```

**No parallelization possible for Phase 0** — All keys + DB needed before anything works.

**Estimated Timeline: 14 Weeks (3.5 months) with dedicated team of 3-4 engineers.**

---

## NOT IN ROADMAP (Explicitly Deferred)

| Item | Reason |
|------|--------|
| Vectorized Backtesting (VectorBT style) | Current engine sufficient; optimization later |
| Multi-Agent Architecture (TradingAgents style) | Service-based architecture sufficient |
| Mobile App (React Native) | Responsive web sufficient for v1 |
| Multi-Market (US, Crypto) | BIST focus for v1 |
| Advanced Portfolio Optimization (AI Berkshire style) | Current optimization sufficient |
| Real-time WebSocket Market Data | Polling sufficient for v1 |