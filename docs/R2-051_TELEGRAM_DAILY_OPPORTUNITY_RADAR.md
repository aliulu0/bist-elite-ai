# R2-051: Telegram Daily Opportunity Radar

## Executive Summary

This sprint adds a **delivery channel** for the existing Early Opportunity Radar: a daily Turkish-language report sent through the official Telegram Bot API. Telegram is **presentation-only** — it never recomputes scores, returns, stops or targets. It consumes the existing Radar snapshot and the existing Decision outputs, selects deterministic qualifying opportunities, formats a compact Turkish report and delivers it.

**Key Achievements:**
- Real Telegram Bot API client (`getMe`, `sendMessage`) with token masking, bounded retries, 429 `retry_after` respect and honest status classification
- Presentation-only Turkish formatter (no invented values, all values come from existing Radar/Decision)
- Deterministic dedup via `sha256(ticker|snapshotId|state|scoreBucket|configVersion)` fingerprint
- Delivery persistence (in-memory fallback + optional Prisma table `telegram_notification_deliveries`)
- Lightweight daily scheduler guarded by the existing BIST trading calendar (`isTradingDay`/`todayTrDate`)
- HTTP surface: status, preview, manual send, delivery history
- Web UI page (`/telegram`) with status, manual trigger and delivery table
- No second pipeline, no fake data, no fabricated verification

## Section 1 — Delivery-Only Principle

Telegram in this sprint is a **delivery channel**, never a computation engine.

```
Radar snapshot (existing)
   ↓
Decision outputs (existing)
   ↓
TelegramDailyRadarService (selection + dedup)
   ↓
TelegramMessageFormatter (presentation only)
   ↓
TelegramClient → Telegram Bot API
   ↓
TelegramDeliveryRepository (persistence)
```

**What the formatter NEVER does:**
- computes scores
- computes expected returns
- computes stops or targets
- classifies risk
- re-scores or re-decides anything

It only renders values already produced by `RadarService` and the `EarlyOpportunityDecisionEngine`.

## Section 2 — Environment Configuration

All configuration is read from environment variables at startup (`getTelegramRadarConfig()`).

| Variable | Default | Purpose |
|----------|---------|---------|
| `TELEGRAM_BOT_TOKEN` | — | Bot token (required for delivery) |
| `TELEGRAM_CHAT_ID` | — | Destination chat id (required for delivery) |
| `TELEGRAM_ENABLED` | `false` | Master switch |
| `TELEGRAM_DAILY_RADAR_ENABLED` | `false` | Enable the scheduled daily report |
| `TELEGRAM_DAILY_RADAR_TIME` | `18:30` | Local delivery time |
| `TELEGRAM_TIMEZONE` | `Europe/Istanbul` | Timezone for scheduling/formatting |
| `TELEGRAM_MIN_SCORE` | `70` | Minimum `earlyOpportunityScore` |
| `TELEGRAM_MAX_OPPORTUNITIES` | `10` | Max opportunities per report |
| `TELEGRAM_INCLUDE_WEAKENING` | `false` | Include WEAKENING state |
| `TELEGRAM_INCLUDE_INVALIDATED` | `false` | Include INVALIDATED state |
| `TELEGRAM_SEND_EMPTY_REPORT` | `false` | Send a message even when no opportunities qualify |
| `TELEGRAM_COOLDOWN_MINUTES` | `60` | Scheduler daily cooldown (per trading day) |
| `TELEGRAM_REQUEST_TIMEOUT_MS` | `15000` | Per-request HTTP timeout |
| `TELEGRAM_MAX_RETRIES` | `3` | Bounded retries for transient failures |
| `TELEGRAM_DRY_RUN` | `false` | Build messages but never call the Bot API |
| `TELEGRAM_LIVE_SMOKE_TEST` | `false` | Gate for live smoke tests |

## Section 3 — Client (`telegram-client.ts`)

Minimal official Bot API client exposing only the operations the radar needs:

- `getMe()` — authentication/connectivity check, read-only, never sends a message
- `sendMessage(text)` — delivery with `disable_web_page_preview`

**Status classification** (`TelegramClientStatus`):
`NOT_CONFIGURED | READY | AUTH_FAILED | CHAT_UNAVAILABLE | RATE_LIMITED | SEND_FAILED | VERIFIED`

**Safety properties:**
- Token is used only inside the URL, never logged; `maskToken()` masks it for status endpoints
- Permanent errors (401 auth, 400/403 chat unavailable) are never retried
- Transient errors (5xx, network) are retried up to `maxRetries` with backoff
- `429` respects Telegram's `retry_after` before retrying
- Request timeout via `AbortController` (`requestTimeoutMs`)

## Section 4 — Formatter (`telegram-message.formatter.ts`)

Presentation-only Turkish message builder:

- `buildDailyReport()` — header, per-opportunity blocks (score, confidence label, state label, expected return, risk, entry zone, stop, targets 1/2, top reasons, data source) and a compact radar summary
- `buildEmptyReport()` — used only when `TELEGRAM_SEND_EMPTY_REPORT=true`
- `buildSmokeTestMessage()` — connectivity test, never market advice
- `chunk()` — deterministic line-break chunking safety net, preserves order
- `truncateTo(4096)` — hard cap per chunk

Every displayed number comes from the snapshot/decision item; nothing is invented.

## Section 5 — Selection & Deduplication

**Selection** (`selectOpportunities`):
1. Only states `CONFIRMED`, `STRENGTHENING`, `NEW` by default; `WEAKENING`/`INVALIDATED` only when configured
2. Only items with `earlyOpportunityScore >= TELEGRAM_MIN_SCORE`
3. Sorted deterministically: score → confidence → expected return → signal convergence → ticker
4. Capped at `TELEGRAM_MAX_OPPORTUNITIES`

**Deduplication** (`notificationFingerprint`):
```
sha256(ticker | snapshotId | state | scoreBucket | configVersion)
```
- `scoreBucket = floor(score / 10)` — a small score drift within the same bucket does not re-trigger
- `snapshotId = snapshot.timestamp ?? snapshot.generatedAt` — a new radar run changes the identity
- Existing `SENT` fingerprints are skipped (`SKIPPED`, `duplicatesSkipped` counter)
- Fresh snapshot reuse (30-minute TTL) prevents redundant radar runs

## Section 6 — Delivery States

`TelegramDeliveryState`:
`PENDING | SENDING | SENT | FAILED | RATE_LIMITED | SKIPPED_DUPLICATE | SKIPPED_FILTER | DISABLED`

Run result statuses (`TelegramRadarRunResult.status`):
`SENT | SKIPPED | SKIPPED_EMPTY | SKIPPED_DISABLED | SKIPPED_COOLDOWN | FAILED | DRY_RUN`

## Section 7 — Persistence

`TelegramDeliveryRepository`:
- `@Optional()` PrismaService injection with an **in-memory fallback** so unit tests and unconfigured DBs keep working
- `save()`, `findByFingerprint()`, `list()`, `countByStatus()`, `countAll()`
- `hashChatId()` — stores a truncated hash of the chat id, never the raw id

New Prisma model `TelegramNotificationDelivery` mapped to `telegram_notification_deliveries` with indexes on `fingerprint`, `ticker`, `status`, `snapshot_id`, `created_at`.

Migration: `packages/database/prisma/migrations/20260814000000_add_telegram_notification_deliveries/migration.sql`.

Only sanitized data is persisted: no token, no authorization headers, no raw chat id.

## Section 8 — Scheduler

Lightweight `setInterval`-based daily check (no `@nestjs/schedule` dependency, matching repo convention):

1. Only when `TELEGRAM_ENABLED` and `TELEGRAM_DAILY_RADAR_ENABLED`
2. Only on BIST trading days (`isTradingDay(todayTrDate())`)
3. Only when the local (configured timezone) clock matches `TELEGRAM_DAILY_RADAR_TIME`
4. Once per trading day (cooldown keyed by `todayTrDate()`)

The timer is `.unref()`'d and cleaned up in `onModuleDestroy()`.

## Section 9 — HTTP Surface

`TelegramDailyRadarController` (`@Controller('telegram')`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/telegram/status` | Configuration + auth + counts (no secrets) |
| GET | `/telegram/preview` | Exact message that would be sent, without sending |
| POST | `/telegram/radar/send?forceRefresh=&dryRun=` | Manual trigger (dry-run override supported) |
| GET | `/telegram/deliveries?limit=&status=&ticker=` | Delivery history |

No endpoint exposes the token, chat id or authorization headers.

## Section 10 — Snapshot Reuse

`obtainSnapshot()`:
- Reuses the cached radar snapshot when fresh (`timestamp` within 30-minute TTL) — `reused: true`
- Otherwise performs one controlled `RadarService.runRadar({ forceRefresh?, maxSymbols?, minScore })`
- Failure returns `{ snapshot: null }` and the run degrades to `SKIPPED_EMPTY`/`FAILED` honestly — no fabricated snapshot

## Section 11 — Empty Reports & Honesty

- When no opportunities qualify and `TELEGRAM_SEND_EMPTY_REPORT=false`: `SKIPPED_EMPTY`, nothing sent
- When `true`: the empty-report message is sent
- When credentials are missing: `NOT_CONFIGURED` status, `SKIPPED_DISABLED` run result
- When the bot is misconfigured: `AUTH_FAILED` / `CHAT_UNAVAILABLE` / `RATE_LIMITED` / `SEND_FAILED` statuses — never fabricated success
- Live smoke tests only run when `TELEGRAM_LIVE_SMOKE_TEST=true` and require explicit credentials

## Section 12 — Tests

New suites (all deterministic, no live API required):

- `telegram-client.spec.ts` — config/masking, getMe success/auth-fail/network-fail, sendMessage permanent vs transient errors, retry recovery, 429 `retry_after`, rate-limit exhaustion
- `telegram-message.formatter.spec.ts` — Turkish content, empty report, chunking, hard cap, no invented values, smoke test
- `telegram-delivery.repository.spec.ts` — fingerprint determinism/uniqueness, save/find, filters, counts, chat-id hashing, sanitized persistence
- `telegram-daily-radar.service.spec.ts` — selection, sort, cap, dedup, dry-run, empty, disabled, failure survival, snapshot reuse, status, preview, listDeliveries

Web:
- `sdk.test.ts` — telegram SDK endpoint mapping
- `telegram-page.test.tsx` — page render, error state, deliveries table, manual send

## Section 13 — Git Safety

- Stage ONLY R2-051 files
- Commit message: `R2-051: Telegram Daily Opportunity Radar`
- Push `origin/main`, then verify `git status`, `git log -1 --oneline`, `git rev-parse HEAD`, `git remote -v`
- Never stage `.env`, tokens, or credentials
- Preserve user-created audit artifacts (`audit/`, `audit_verify/`, `audit.zip`, etc.)

## Known Limitations

- Live delivery cannot be runtime-verified without a real `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`; status honestly reflects this (`NOT_CONFIGURED` / `PARTIALLY_VERIFIED`)
- Prisma `generate` is blocked in the current environment by a locked query-engine DLL; the new table is created by migration and the repository falls back to in-memory storage until the DB connects
- The daily schedule uses the existing BIST calendar; `TELEGRAM_DAILY_RADAR_TIME` respects the configured timezone

## Next Recommended Sprint

- Live smoke-test run once credentials are available (`TELEGRAM_LIVE_SMOKE_TEST=true`)
- Optional periodic delivery (weekly digest) using the same delivery layer
- Config-driven cooldown persistence across restarts