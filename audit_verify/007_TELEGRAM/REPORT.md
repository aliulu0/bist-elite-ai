# 007 — TELEGRAM AUDIT

## Verdict: WORKING COMMANDS, BROKEN NOTIFICATIONS (60/100)

## Feature Matrix

| Feature | Implemented | Files | Notes |
|---|---|---|---|
| Commands (12) | ✅ Real | commands/index.ts + 12 command files | start, help, scan, top, elite, portfolio, watchlist, signal, backtest, settings, status, about |
| Callbacks | ⚠️ Partial | callbacks/menu, settings, stock | `watchlist:add/remove` branches unhandled (dead buttons) |
| Alerts / Notifications | ❌ Dead code | notifications/notification.service.ts | Never instantiated; `broadcast()` only logs, never sends via bot.api |
| Portfolio | ✅ Real | portfolio.command.ts | API-wired |
| Research | ⚠️ Partial | — | Signals/scan from API; no research report command |
| Prediction | ✅ Real | signal.command.ts | API-wired |
| Daily Report | ❌ Missing | — | NotificationService daily-summary defined but not started |
| Weekly Report | ❌ Missing | — | Not present |
| Early Opportunity | ⚠️ Partial | scan.command.ts | Scan uses API market summary; no dedicated early-opportunity alert |
| i18n | ✅ Real | locales/tr.ts + en.ts | Language middleware per context |
| Settings | ⚠️ Partial | settings.command.ts + callback | Message edits only; **nothing persisted** (no DB/store) |

## Key Findings

1. **NotificationService is dead code** — elite-opportunity poll (5 min), risk alerts (15 min), daily summary (24h) all defined but:
   - Never instantiated in `index.ts` (only commands/callbacks registered).
   - `broadcast()` only writes to logger — never calls `bot.api.sendMessage()`, so even if started, nothing would be delivered.
2. **`watchlist:add` / `watchlist:remove` callbacks unhandled** — stock.callback.ts shows an "Add to Watchlist" button wired to an unhandled callback.
3. Settings not persisted — no user-preferences store/DB.
4. Webhook mode requires `WEBHOOK_URL`; long-polling is default.
5. 0 test files in apps/telegram.

## Recommendation

Instantiate NotificationService, replace logger-only broadcast with real sendMessage, persist settings, implement watchlist:add/remove handlers, add tests.
