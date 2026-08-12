# 25 — PORTFOLIO, TELEGRAM & WORKER TRUTH AUDIT

## Portfolio Intelligence (R2-030)

- `portfolio-intelligence` module: 12 endpoints, engine/registry/service/controller, 70 backend tests, web tab, SDK methods.
- Real code, unit-proven; persists snapshots in an in-memory registry (≤50).
- Working-tree changes (uncommitted) update `portfolio-intelligence.service.ts` / types for R2-045-era decision integration.
- Runtime: data-starved like all analysis; portfolio price/P&L needs provider.

## Telegram (apps/telegram)

- Bot app: commands, callbacks, locales, middleware, notifications, index.ts — **real code**.
- Requires `TELEGRAM_BOT_TOKEN` (configured locally, 46 chars — never committed).
- **Deployed? NO.** No deploy evidence; running the bot is a manual `node`/build step. → `CODE_ONLY`.

## Worker (apps/worker, Python)

- Notifications service/channels (telegram/email/push/web) with tests.
- **Code only.** Not running in this environment.

## Classification

| Item | Status |
|---|---|
| Portfolio intelligence | REAL_AND_WORKING (unit) / EMPTY live |
| Telegram bot | CODE_ONLY (token local, not deployed) |
| Worker/notifications | CODE_ONLY |
| Portfolio snapshots | in-memory registry (lost on restart) |

## Verdict

- Portfolio: solid. Telegram/worker: written but **not deployed** — the promise "Telegram notifications" is unfulfilled in live operation.