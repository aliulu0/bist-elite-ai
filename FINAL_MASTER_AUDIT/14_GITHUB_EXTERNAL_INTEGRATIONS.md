# 14 — GITHUB & EXTERNAL INTEGRATION AUDIT

> The docs promise integration of several external AI repos. Reality: **none are present**.

## Requested/promised external repos

| Repo / concept | Promised (docs) | Present in this repo? | Evidence |
|---|---|---|---|
| AI Berkshire | handoff/roadmap | **NOT_PRESENT** | no dir/file |
| Agent Reach (SerpAPI research) | R2-031 | NOT_PRESENT as repo — only an adapter (`agent-reach.adapter.ts`) | adapter exists, repo doesn't |
| VectorBT | R2-031 adapter boundary | NOT_PRESENT (Python optional, no repo) | boundary only |
| TradingAgents | roadmap | NOT_PRESENT | — |
| NOFX | roadmap/dashboard "inspired by" | NOT_PRESENT | — |
| FinRL | roadmap (ML) | NOT_PRESENT | — |
| last30days-skill | roadmap/skill | NOT_PRESENT | — |

Directory listing of repo root + `apps/` confirms: only `api`, `web`, `telegram`, `worker`. No external vendored repos.

## Classification

- All external repos: **NOT_INTEGRATED / DOCUMENTED_ONLY**.
- "Inspired by NOFX/Bloomberg/TradingView" refers to visual inspiration only — accurate.
- Agent Reach is implemented as an **adapter** (SerpAPI-backed) — a thin integration, not the full repo.

## Impact

- Integrations score 1/5: adapter for Agent Reach exists (code), everything else missing.
- No ML training pipeline (FinRL/VectorBT) exists — Phase 6 planned, honest.

## Verdict

- External integration: **DOCUMENTED_ONLY** → **NOT_RUNTIME_CONNECTED**.