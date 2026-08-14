# R2-051 Status Report — Telegram Daily Opportunity Radar

## Overview

| | |
|---|---|
| Sprint | R2-051 |
| Title | Telegram Daily Opportunity Radar |
| Goal | Deliver the existing Early Opportunity Radar as a daily Turkish Telegram report through the official Bot API |
| Status | IMPLEMENTED (code, tests, docs complete) — live delivery pending real Telegram credentials |

## Non-Negotiable Constraints Honored

- **No second pipeline** — Telegram is a delivery channel only; no new radar/scoring/decision/research/cache/learning/backtest/provider system
- **No invented values** — the formatter renders only existing Radar/Decision outputs
- **Deterministic dedup** — `sha256(ticker|snapshotId|state|scoreBucket|configVersion)`
- **Bounded retries** — transient failures only, `429 retry_after` respected
- **No fabricated verification** — no credentials ⇒ honest `NOT_CONFIGURED` / `PARTIALLY_VERIFIED`
- **Personal-use scope preserved** — lightweight scheduler, no enterprise infrastructure

## Files Created

**API (delivery layer):**
- `apps/api/src/modules/alerts/telegram-daily-radar.config.ts` — `TelegramRadarConfig` + `getTelegramRadarConfig()`
- `apps/api/src/modules/alerts/telegram-client.ts` — `TelegramClient` (getMe/sendMessage, masking, retries, 429)
- `apps/api/src/modules/alerts/telegram-message.formatter.ts` — `TelegramMessageFormatter` (presentation-only Turkish)
- `apps/api/src/modules/alerts/telegram-delivery.repository.ts` — persistence (in-memory fallback + guarded Prisma)
- `apps/api/src/modules/alerts/telegram-daily-radar.service.ts` — selection, dedup, delivery, scheduler, preview, status
- `apps/api/src/modules/alerts/telegram-daily-radar.controller.ts` — `/telegram/*` endpoints

**API (tests):**
- `apps/api/src/modules/alerts/__tests__/telegram-client.spec.ts`
- `apps/api/src/modules/alerts/__tests__/telegram-message.formatter.spec.ts`
- `apps/api/src/modules/alerts/__tests__/telegram-delivery.repository.spec.ts`
- `apps/api/src/modules/alerts/__tests__/telegram-daily-radar.service.spec.ts`

**Database:**
- `packages/database/prisma/schema.prisma` — `TelegramNotificationDelivery` model
- `packages/database/prisma/migrations/20260814000000_add_telegram_notification_deliveries/migration.sql`

**Web:**
- `apps/web/src/pages/telegram.tsx` — `/telegram` page (status, manual trigger, deliveries table)
- `apps/web/src/pages/__tests__/telegram-page.test.tsx`
- `apps/web/src/lib/sdk.ts` — `sdkClient.telegram.*` methods
- `apps/web/src/lib/sdk.test.ts` — telegram SDK tests

**Docs:**
- `docs/R2-051_TELEGRAM_DAILY_OPPORTUNITY_RADAR.md`
- `docs/R2-051_STATUS_REPORT.md`
- `docs/R2-051_TELEGRAM_STATUS.json`

## Files Modified

- `apps/api/src/modules/alerts/alerts.module.ts` — import `RadarModule`, register new providers/controller
- `apps/api/src/modules/ai-early-opportunity/radar/radar.service.ts` — public `getSnapshot()` accessor
- `apps/web/src/App.tsx` — `/telegram` route
- `apps/web/src/components/layout/sidebar.tsx` — Telegram nav item
- `apps/web/src/components/layout/topbar.tsx` — `/telegram` title
- `apps/web/src/components/layout/breadcrumb.tsx` — `/telegram` label
- `.env.example` — documented `TELEGRAM_*` variables

## Tests

| Suite | Result |
|-------|--------|
| API `telegram-*` suites (client, formatter, repository, service) | 51 passed |
| API regression `(radar|early-opportunity|alerts)` | 412 passed / 36 suites |
| Web `sdk.test.ts` + `topbar.test.tsx` | 49 passed |
| Web `telegram-page.test.tsx` | 4 passed |
| TypeScript typecheck (API) | clean |
| TypeScript typecheck (web) | clean |

## Runtime Checks

- Live Telegram delivery **not verified** — no `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` in the environment
- Status endpoints honestly report `NOT_CONFIGURED` in this state
- Prisma `generate` blocked by locked query-engine DLL (running dev servers); new table created via migration; repository falls back to in-memory storage until the DB connects

## Delivery States

`PENDING | SENDING | SENT | FAILED | RATE_LIMITED | SKIPPED_DUPLICATE | SKIPPED_FILTER | DISABLED`

## Run Result Statuses

`SENT | SKIPPED | SKIPPED_EMPTY | SKIPPED_DISABLED | SKIPPED_COOLDOWN | FAILED | DRY_RUN`

## Unresolved Limitations

- Live delivery verification requires real credentials
- Prisma client regeneration blocked by environment (locked DLL); schema is correct and migration is applied
- Scheduler cooldown key is in-memory (resets on restart)

## Next Sprint

- Live smoke test with real credentials (`TELEGRAM_LIVE_SMOKE_TEST=true`)
- Optional weekly digest delivery reusing the same delivery layer
- Persist cooldown across restarts