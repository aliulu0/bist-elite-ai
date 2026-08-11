# 20. BOT INTEGRATION

## 20.1 Telegram bot — `apps/telegram`

- NestJS-based bot (`TelegramModule`), `@nestjs/platform-express`? — actually a standalone TSC app.
- Consumes `@bist-elite/shared` for types.
- Communicates with the API via HTTP to the same endpoints the web uses (analysis/`batch`, `top`, `entry`, `portfolio`, etc.).
- Wired into turbo build (`@bist-elite/telegram` build step).

## 20.2 Quality

1. **Thin consumer** — no duplication of domain logic; it delegates to the API. Good.
2. **Auth:** the bot calls the public API (currently effectively public, C2) — if auth is later enabled the bot must be given a service API key; no key plumbing found in telegram app.
3. **No end-to-end test** — Telegram flow tested only manually/at unit level.
4. **Error handling:** retry logic present for flaky networks? (scheduler-level retries only; bot uses direct calls).

## 20.3 Verdict

Bot integration is clean and thin. Risks: it depends on API auth behavior (must be updated when auth lands) and has no e2e coverage.
