# 34 — PROMPT & EFFORT ESTIMATE

> Minimum additional prompts/runs to make the system genuinely usable (personal use). Realistic per-prompt effort.

## Must-fix (2 prompts)

| # | Prompt scope | Effort |
|---|---|---|
| 1 | Fix R2-046 compile (5 errors) + re-run tsc/tests + boot smoke | ~1 prompt |
| 2 | Commit R2-045 decision/ + correct PROJECT_STATUS/ROADMAP docs | ~1 prompt |

## Enable real value (3–5 prompts, sequential)

| # | Prompt scope | Effort |
|---|---|---|
| 3 | Add provider key config + live smoke `GET /early-opportunities` | ~1 prompt |
| 4 | Debug any real-data gaps discovered in smoke (provider mapping, timeframes) | 1–3 prompts |
| 5 | One live R2-046 backtest run + summary | ~1 prompt |

## Nice-to-haves (non-critical ~6+ prompts)

- Derived timeframes (1–2)
- SerpAPI research key + Agent Reach live (1)
- Telegram bot deploy (1–2)
- Registry→DB persistence (1–2)

## Total estimate

- **Minimum viable real use: ~5 prompts** (fix + commit + key + smoke + one backtest).
- Comfortable hardening: ~8–10 prompts.
- Full roadmap (Phase 6 ML, derived TFs, notifications): 15+ prompts.

## Prompt-count caveat

- This is a **planning estimate**, not a guarantee; unknown real-data issues may add 1–3 prompts.