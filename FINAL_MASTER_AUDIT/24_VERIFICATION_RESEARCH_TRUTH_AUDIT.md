# 24 — VERIFICATION & RESEARCH TRUTH AUDIT

## Verification AI (R2-022)

- `verification-ai` module: cross-checks research claims vs data; deterministic Turkish explanations.
- Real code + specs; consumes research + market data.
- Runtime: blocked by research provider (no SerpAPI key) and data.

## Research Hub (R2-021) / Data Research Pipeline (R2-031)

- `ai-research`, `data-research-pipeline`, `research` modules present.
- Evidence normalization (ticker/title/source/sourceTier/url/publishedAt/sentiment/relevance/evidenceType/credibility/contentHash) — implemented types.
- Agent Reach adapter (SerpAPI) — code present, **not configured** (no key) → `NOT_RUNTIME_CONNECTED`.
- 15 endpoints claimed under `/data-research` — routes exist.

## Truth check

- The research pipeline is layered correctly and unit-tested where possible.
- **SerpAPI key absent** → no live news/web research; agent-reach reports disconnected.

## Verdict

- Verification/research: **CODE_ONLY / NOT_RUNTIME_CONNECTED** (external key required).
- Not a code defect.