# Notification Engine Architecture

## Overview

The Notification Engine is a centralized service that consumes analysis events and delivers notifications across multiple channels (Telegram, Email, future Mobile Push/Web).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Event Sources                          │
│  Elite Opportunity | Risk Event | Portfolio | System     │
└───────────────────────────────┬─────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────┐
│                   Event Consumers                        │
│  AnalysisEventConsumer | SystemEventConsumer             │
└───────────────────────────────┬─────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────┐
│              Notification Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Preferences  │  │   Filter    │  │  Quiet Hours   │  │
│  │   Manager    │  │   Engine    │  │   Checker      │  │
│  └─────────────┘  └─────────────┘  └───────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  Cooldown    │  │  Record     │  │  Batch         │  │
│  │  Manager     │  │  Creator    │  │  Processor     │  │
│  └─────────────┘  └─────────────┘  └───────────────┘  │
└───────────────────────────────┬─────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────┐
│               Redis Notification Queue                   │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │   Main Queue     │  │   Dead Letter Queue           │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │   Cooldown Cache │  │   Delivery Logs               │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────┐
│                  Channel Manager                         │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ TelegramChannel  │  │   EmailChannel                │  │
│  │  (grammY/HTTP)   │  │   (SMTP)                     │  │
│  └─────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Components

### NotificationEvent
Incoming event from analysis engines or system components.

### EventConsumer
Processes events and enriches them with titles, messages, and priority levels.

### NotificationService
Central orchestrator that:
1. Routes events through consumers
2. Checks user preferences and filters
3. Applies quiet hours and cooldowns
4. Creates notification records
5. Enqueues to Redis
6. Processes batch delivery

### NotificationQueue
Redis-backed queue with:
- Main queue for pending notifications
- Dead letter queue for failed notifications
- Cooldown cache
- Delivery logging

### ChannelManager
Manages delivery channels:
- TelegramChannel: Sends via Telegram Bot API
- EmailChannel: Sends via SMTP

## Event Types

| Event Type | Source | Priority |
|------------|--------|----------|
| ELITE_OPPORTUNITY | Scoring Engine | HIGH |
| EARLY_OPPORTUNITY | Early Detection Engine | NORMAL |
| RISK_EVENT | Risk Analysis | HIGH/CRITICAL |
| PORTFOLIO_UPDATE | Portfolio Engine | NORMAL |
| BACKTEST_COMPLETE | Backtest Engine | LOW |
| DAILY_SUMMARY | Scheduler | NORMAL |
| WEEKLY_SUMMARY | Scheduler | NORMAL |
| MONTHLY_SUMMARY | Scheduler | NORMAL |
| SYSTEM_EVENT | System | NORMAL |
| APPLICATION_ERROR | Error Handler | HIGH |

## Filtering

Events pass through user-configured filters:
- Min Elite Score threshold
- Min Confidence threshold
- Sector whitelist
- Symbol whitelist
- Market Regime filter
- Risk Level filter
- Event Type filter

## Throttling

- **Quiet Hours**: Block non-critical notifications during configured hours
- **Cooldown Period**: Prevent duplicate notifications within cooldown window
- **Rate Limiting**: Redis-based per-user rate limiting

## Retry Policy

- Max 3 attempts per notification
- Exponential backoff: 1s, 2s, 4s
- After max attempts → Dead Letter Queue
- Dead letters can be inspected and retried manually

## Configuration

All parameters are configurable via `NotificationConfig`:

```python
NotificationConfig(
    redis_url="redis://localhost:6379/1",
    batch_size=50,
    processing_interval_seconds=5.0,
    max_queue_size=10000,
    enable_batching=True,
)
```
