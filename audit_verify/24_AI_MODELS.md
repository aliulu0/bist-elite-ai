# 24. AI MODELS

## 24.1 Providers integrated

| Provider | Class/Service | Used by |
|---|---|---|
| OpenAI/ChatGPT | `*ai-analysis*`, research news | news aggregation, sentiment |
| Gemini | research | news aggregation |
| Perplexity | research | news aggregation |
| SerpAPI | `SerpApiResearchService` | research intelligence |
| Google (news) | research providers | news aggregation |
| Finnhub | market-data + research | quotes + news |
| Anthropic (if present) | (check modules) | optional |

## 24.2 Model configuration

- `ModelProviderConfig` Prisma model exists but **not migrated** (C4 — table missing).
- API key config via env (OPENAI_API_KEY etc.), read through ConfigService.
- `ai-assistant` module provides chat-style assistant; `ai-analysis` wraps scoring models.

## 24.3 Findings

1. **No model fallback/retry beyond provider-level:** a single provider failure fails that news channel (pipeline isolates per step).
2. **Cost/usage tracking absent:** no token-cost metrics; `performance-monitor` covers app metrics not LLM spend.
3. **Prompt versioning:** prompts are inline strings in services; no central prompt registry → drift risk.
4. **`ModelProviderConfig` table missing** (C4) — runtime persistence of model configs will fail.
5. **No eval harness** for prompt quality / decision accuracy vs a golden set.

## 24.4 Verdict

Multi-provider LLM wiring is functional and cleanly isolated behind services; the gaps are operational (prompt registry, cost tracking, eval) and the missing table (C4).
