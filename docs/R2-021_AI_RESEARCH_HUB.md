# R2-021: AI Research Hub

**Status:** ✅ COMPLETE
**Date:** 2026-08-07

---

## SCOPE

Build an AI Research Hub — a deterministic aggregation layer (NOT an LLM) that collects research from 12 AI providers, normalizes, deduplicates, ranks confidence, and produces a single `AIConsensus` object per ticker.

Architecture only. **No paid API calls** — all providers are modular; LLM providers (ChatGPT, Gemini, Perplexity, Grok) are disabled placeholders ready for key activation.

---

## PIPELINE

```
Ticker
  ↓
Collect Research (NewsAggregationService + MarketDataOrchestrator → ResearchBundle)
  ↓
Normalize (each provider maps bundle data → AiEvidenceItem)
  ↓
Deduplicate (contentHash-based)
  ↓
Rank Confidence (qualityScore descending)
  ↓
Consensus Calculation (agreement, conflicts, confidence, consensusScore)
  ↓
AIConsensusRegistry (in-memory, LRU-evicted)
```

---

## ARCHITECTURE

### Module: `apps/api/src/modules/ai-research/`

| File | Role |
|------|------|
| `ai-research.types.ts` | `AiProviderName` (12), `AiProviderCategory`, `AiProviderConfig`, `ResearchBundle`, `AiEvidenceItem`, `AiProviderResult`, `AiProviderStatus`, `AiConflict`, `AiResearchSource`, `AIConsensus` |
| `ai-research.config.ts` | `CONSENSUS_CACHE_NAMESPACE`, `CONSENSUS_TTL_MS`, `AI_RESEARCH_PROVIDERS` (enabled/disabled + priority + ttl) |
| `ai-provider-registry.ts` | `AIProviderRegistry` — provider routing, dedupe, `collectAll`, `flatten` |
| `ai-consensus.registry.ts` | `AIConsensusRegistry` — in-memory store, LRU (max 200), `getTop` |
| `ai-research-hub.service.ts` | `AIResearchHubService` — orchestration, cache, refresh |
| `ai-research.controller.ts` | `AIResearchController` — REST endpoints |
| `consensus/ai-consensus.engine.ts` | `AIConsensusEngine` — normalize → dedupe → rank → calculate |
| `dto/ai-research.dto.ts` | `AIConsensusDto`, `AIResearchProvidersDto`, `AIResearchRefreshDto` |
| `providers/ai-provider.interface.ts` | `IAiResearchProvider` + `AI_RESEARCH_PROVIDERS_TOKEN` |
| `providers/base-ai-provider.ts` | `BaseAiResearchProvider` — disabled guard, error capture, djb2 `hashId` |
| `providers/*.provider.ts` | 12 provider implementations |

### Providers

| Provider | Name | Enabled | Priority | Data Source |
|----------|------|---------|----------|-------------|
| ChatGPT | `chatgpt` | ❌ (placeholder) | 100 | — |
| Gemini | `gemini` | ❌ (placeholder) | 100 | — |
| Perplexity | `perplexity` | ❌ (placeholder) | 100 | — |
| Grok | `grok` | ❌ (placeholder) | 100 | — |
| SerpAPI | `serpapi` | ✅ | 80 | bundle.news (provider `serp-api`) |
| Google News | `google-news` | ✅ | 80 | bundle.news (provider `google-news`) |
| Google Search | `google-search` | ✅ | 80 | bundle.news (provider `agent-reach`) |
| Finnhub News | `finnhub-news` | ✅ | 70 | bundle.financials (source `finnhub`) |
| Yahoo Finance | `yahoo-finance` | ✅ | 90 | bundle.company (source `yahoo`) |
| KAP | `kap` | ✅ | 90 | bundle.disclosures |
| TCMB | `tcmb` | ✅ | 60 | bundle.macro |
| MKK | `mkk` | ❌ (placeholder) | 60 | — |

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/research/hub/:ticker` | Get AI research consensus for a ticker |
| GET | `/research/hub/top?limit=10` | Get top consensus entries |
| GET | `/research/hub/providers` | Get provider statuses |
| POST | `/research/hub/refresh?ticker=THYAO.IS` | Force consensus refresh |

All endpoints are `@Public()`. Routes scoped under `/research/hub` to avoid collision with existing `/research` and `/research/intelligence`.

---

## CONSENSUS OBJECT

`AIConsensus` contains:

- `chatgptSummary`, `geminiSummary`, `perplexitySummary`, `grokSummary` — LLM summaries (null while disabled)
- `newsSummary` — merged news digest (top critical/high items)
- `researchSources` — up to 20 evidence sources
- `agreementLevel` — 0-1 (coverage + official ratio + freshness)
- `conflicts` — provider errors, sentiment divergence (positive vs negative)
- `confidence` — 0-1 (agreement 50%, quality 30%, coverage 20%, minus conflict penalty)
- `consensusScore` — 0-100 (`confidence * 100`)
- `providerSummaries`, `totalEvidence`, `duplicatesRemoved`, `timestamp`

---

## CACHING & PERFORMANCE

- Consensus cached in global `CacheService` under namespace `research`, key `consensus:{TICKER}`, TTL 5 min.
- `getConsensus` returns cached → registry → recompute (never recomputes a fresh cached value).
- Providers never fetch identical news twice: `NewsAggregationService` already dedupes + caches; `MarketDataOrchestrator` has its own cache/circuit-breaker.
- Bundle collection runs all 5 fetches in parallel (`Promise.all`).

---

## TESTING

Gate: `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` clean; `jest ai-research` green.

**6 suites / 40 tests** (R2-021):

| Suite | Tests |
|-------|-------|
| `ai-consensus.engine.spec.ts` | dedupe, rank, calculate, conflicts, confidence, fallback |
| `ai-provider-registry.spec.ts` | register, enabled filter, collectAll, flatten |
| `ai-consensus.registry.spec.ts` | get/save, getTop order, limit, re-save front, LRU eviction, clear |
| `ai-research-hub.service.spec.ts` | orchestration, caching, case normalization, bundle injection |
| `ai-research.controller.spec.ts` | consensus DTO, top/limit, providers, refresh |
| `providers/ai-providers.spec.ts` | LLM disabled, GoogleNews filtering, KAP mapping |

Regression gates green: `jest backtest` (11 suites / 144 tests), `jest research` (10 suites / 70 tests).

---

## FILES CREATED

```
apps/api/src/modules/ai-research/
  ai-research.types.ts
  ai-research.config.ts
  ai-provider-registry.ts
  ai-provider-registry.spec.ts
  ai-consensus.registry.ts
  ai-consensus.registry.spec.ts
  ai-research-hub.service.ts
  ai-research-hub.service.spec.ts
  ai-research.controller.ts
  ai-research.controller.spec.ts
  ai-research.module.ts
  index.ts
  dto/ai-research.dto.ts
  consensus/ai-consensus.engine.ts
  consensus/ai-consensus.engine.spec.ts
  providers/ai-provider.interface.ts
  providers/base-ai-provider.ts
  providers/ai-providers.spec.ts
  providers/chatgpt.provider.ts
  providers/gemini.provider.ts
  providers/perplexity.provider.ts
  providers/grok.provider.ts
  providers/serpapi.provider.ts
  providers/google-news.provider.ts
  providers/google-search.provider.ts
  providers/finnhub-news.provider.ts
  providers/yahoo-finance.provider.ts
  providers/kap.provider.ts
  providers/tcmb.provider.ts
  providers/mkk.provider.ts
```

## FILES MODIFIED

```
apps/api/src/app.module.ts        (register AIResearchHubModule)
docs/MASTER_ROADMAP.md            (R2-021 complete)
docs/AI_HANDOFF.md                (R2-021 complete, engines/registries/APIs)
docs/PROJECT_STATUS.md            (R2-021 complete)
```

---

## INTEGRATION POINTS

- `NewsAggregationService` (ResearchModule) — company news
- `MarketDataOrchestrator` (MarketDataModule) — company, financials, disclosures, macro
- `CacheService` (common) — consensus cache namespace `research`
- `Public` decorator (common/auth)

---

## KNOWN LIMITATIONS

1. LLM providers are placeholders — no real API keys wired (by design this sprint).
2. Consensus data is in-memory; lost on restart (consistent with other registries).
3. `finnhub-news`/`yahoo-finance` depend on orchestrator returning those exact `source` values.
4. No persistence layer for consensus history yet.

---

## NEXT RECOMMENDED SPRINT

**R2-022: Consensus Intelligence Engine** — multi-source evidence weighting, signal convergence scoring, consensus-based confidence decay, provider disagreement alerts.
