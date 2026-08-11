# 005 — GITHUB INTEGRATIONS AUDIT

## Verdict: NONE INTEGRATED — ALL 5 ARE ROADMAP REFERENCES ONLY (10/100 for reuse)

## Repo Analysis

| Repo | Reused (code) | Inspired (design) | Missing | Can integrate |
|---|---|---|---|---|
| **NoFxAiOS/nofx** | **None.** No code/imports/deps (0 matches in source+lockfiles). | Yes — UI/UX aesthetic: "Dark Theme — professional, Bloomberg/TradingView/NoFx inspired" (R2-029 doc, AI_HANDOFF). | Everything. No pro-terminal features (market depth, execution workflow, hotkeys, alert routing). | Adopt NoFx pro-terminal UX patterns for Elite Dashboard; review open-source modules for reusable terminal components. |
| **tauricresearch/tradingagents** | **None.** Roadmap mentions only (R3-003). | Yes — conceptual (multi-agent AI research/debate). | Entire multi-agent framework (analyst roles, group-chat research loop, report synthesis). | Port multi-agent LLM collaboration layered on existing Research/AI-Research hub (R3-003/R4). |
| **polakowo/vectorbt** | **None.** Explicitly rejected for TS engine (deferred to R3-001/002). | Yes — metrics concept (Sharpe, drawdown, equity curve rebuilt natively in TS Backtest Engine). | Python/vectorized layer, parameter-grid/matrix sweeps, Python bridge. | Add Python worker (pandas-ta/TA-Lib/vectorbt) hosted on `apps/worker` stub (R3-001/002). |
| **Panniantong/agent-reach** | **None.** Name coincidence only — internal "Agent Reach" is a SerpAPI source-discovery engine built independently. | Yes — concept (self-originated source discovery, per docs/AGENT_REACH_RESEARCH.md). | No agent-coordination/protocol layer from the actual repo. | Integrate multi-agent communication patterns into R4; internal Agent Reach stays as source-discovery layer. |
| **xbtlin/ai-berkshire** | **None.** Roadmap mention only (R4). | Yes — concept (long-term value-investing agent). | Everything. No value-investor agent, no portfolio-manager/risk-manager layer. | Implement "AI Berkshire" feeding existing Portfolio Optimization + Paper Portfolio engines (R4/R5). |

## Evidence

- `pnpm-lock.yaml`: **0** matches for all five repo names.
- All 11 package.json files: no dependency matches.
- Internal `agent-reach` references (`apps/api/src/modules/research/providers/agent-reach.provider.ts`, scheduler `agentReachRefresh` job) refer to the internal SerpAPI provider — not the GitHub repo.

## Conclusion

The five GitHub repositories are **not code-integrated**. They appear only as: future roadmap items (tradingagents, vectorbt, ai-berkshire = R3–R5), a UI aesthetic reference (NoFx), and a naming coincidence (internal Agent Reach). No code was copied or vendored. Highest-value integrations: vectorbt quant layer on the worker stub, TradingAgents-style multi-agent research, AI Berkshire investor agent.
