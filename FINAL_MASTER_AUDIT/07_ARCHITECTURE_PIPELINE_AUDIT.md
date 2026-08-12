# 07 — ARCHITECTURE & PIPELINE AUDIT

> End-to-end pipeline described vs. reality.

## Documented architecture (docs/AI_HANDOFF.md, ARCHITECTURE_BIBLE.md)

```
Market Data Providers (Yahoo, AV, Finnhub, SerpAPI, TCMB, KAP, MKK, Agent Reach, Fintables)
  → Research Layer → Verification Layer → Catalyst Layer → Consensus Layer
  → Elite Score → Portfolio Optimization → Backtest → AI Research Hub → Verification AI → ...
  → Early Opportunity Intelligence (R2-027) → Decision (R2-045) → Backtest Validation (R2-046)
```

## Reality check per stage

| Stage | Files | Compiles | Runtime | Notes |
|---|---|---|---|---|
| Provider layer (unified adapters) | ✅ | ✅ | ⚠️ only KAP live | keyed providers unconfigured |
| Research/SerpAPI | ✅ | ✅ | ⚠️ no key | disconnected |
| Catalyst/KAP | ✅ | ✅ | ✅ (KAP) | disclosures work |
| Verification AI | ✅ | ✅ | ⚠️ | depends on upstream data |
| Elite Score / Opportunity / MTF | ✅ | ✅ | ⚠️ | empty inputs → 0/INVALID |
| Prediction | ✅ | ✅ | ⚠️ | needs candles |
| Smart Money | ✅ | ✅ | ⚠️ | needs candles |
| Signals (R2-038) | ✅ | ✅ | ⚠️ | needs candles |
| Financial Data Quality (R2-037) | ✅ | ✅ | ⚠️ | grades empty data as INSUFFICIENT |
| Early Opportunity Intelligence | ✅ | ✅ | ⚠️ | hard gate invalidates on no data |
| **Decision (R2-045)** | ✅ (untracked) | ✅ | ✅ (unit) | correct pure logic |
| **Backtest Validation (R2-046)** | ✅ (committed) | ❌ | ❌ | 5 compile errors; mocked tests |
| Historical backfill (R2-044) | ✅ | ✅ | ⚠️ | needs working provider |
| Cache / dedup / indicator-cache (R2-043) | ✅ | ✅ | ✅ | well-tested infra |
| Scheduler | ✅ | ✅ | ⚠️ | enabled but API doesn't boot |
| Web dashboard | ✅ | ✅ (web) | ⚠️ | calls dead API |

## Derived timeframes

- **No `1h/2h → 4h` derivation engine exists.** `docs/R2-044` claims `REAL/DERIVED/UNAVAILABLE` per timeframe reporting, but the timeframes remain provider-provided; there is no candle-derivation module. → `DOCUMENTED_ONLY`.

## Multi-market / multi-symbol

- `market-scanner`, `multi-market`, `market-overview` modules exist; they consume the same data pipeline, so they are data-starved in this env.

## Verdict

- **Architecture is coherent and layered correctly**; the problem is not design but (a) R2-046 compile break and (b) no real data upstream.
- The layered design correctly isolates data acquisition (orchestrator) from intelligence (pure engines), which is why unit tests are green despite live failures.
