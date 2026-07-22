# Notification Configuration Guide

## Overview

The Notification Engine is fully configurable. No hardcoding is allowed.

## Configuration Types

### NotificationConfig

Controls engine behavior:

```python
from app.notifications.types import NotificationConfig

config = NotificationConfig(
    redis_url="redis://localhost:6379/1",    # Redis connection
    queue_key="bist:notifications:queue",    # Queue key
    dead_letter_key="bist:notifications:dead_letter",  # DLQ key
    batch_size=50,                           # Notifications per batch
    processing_interval_seconds=5.0,         # Queue poll interval
    max_queue_size=10000,                    # Max queue capacity
    enable_batching=True,                    # Batch processing
    log_delivery=True,                       # Log deliveries
    log_retries=True,                        # Log retries
)
```

### NotificationPreferences

Per-user notification settings:

```python
from app.notifications.types import NotificationPreferences, NotificationChannel

prefs = NotificationPreferences(
    user_id="user-123",
    channels=[NotificationChannel.TELEGRAM, NotificationChannel.EMAIL],
    enabled=True,
    elite_opportunities=True,
    portfolio_alerts=True,
    risk_alerts=True,
    price_alerts=False,
    daily_summary=True,
    weekly_summary=True,
    monthly_summary=True,
)
```

### NotificationFilter

Event filtering rules:

```python
from app.notifications.types import NotificationFilter, MarketRegime, RiskLevel

filter = NotificationFilter(
    min_elite_score=70.0,       # Minimum elite score
    min_confidence=0.6,         # Minimum confidence
    timeframes=["4h", "1d"],    # Timeframe filter
    sectors=["banking"],         # Sector whitelist
    symbols=["GARAN", "AKBNK"], # Symbol whitelist
    market_regimes=[MarketRegime.BULL],  # Market regime filter
    risk_levels=[RiskLevel.HIGH, RiskLevel.VERY_HIGH],  # Risk filter
)
```

### QuietHours

Notification quiet period:

```python
from app.notifications.types import QuietHours

quiet = QuietHours(
    enabled=True,
    start_hour=22,      # 10 PM
    start_minute=0,
    end_hour=7,          # 7 AM
    end_minute=0,
    timezone_name="Europe/Istanbul",
)
```

### CooldownConfig

Duplicate prevention:

```python
from app.notifications.types import CooldownConfig, EventType

cooldown = CooldownConfig(
    enabled=True,
    default_seconds=300,  # 5 minutes default
    per_event_seconds={
        EventType.RISK_EVENT: 60,      # 1 minute for risk alerts
        EventType.ELITE_OPPORTUNITY: 300,  # 5 minutes
        EventType.DAILY_SUMMARY: 3600,     # 1 hour
    },
)
```

### RetryConfig

Retry behavior:

```python
from app.notifications.types import RetryConfig

retry = RetryConfig(
    max_retries=3,
    base_delay_seconds=1.0,
    max_delay_seconds=60.0,
    exponential_base=2.0,  # 1s, 2s, 4s delays
    dead_letter_after_retries=True,
)
```

## Environment Variables

### Telegram Channel

```bash
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Email Channel

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=notifications@bist-elite-ai.com
```

### Redis

```bash
REDIS_URL=redis://localhost:6379/1
```

## Usage Example

```python
import asyncio
from app.notifications import (
    NotificationService,
    NotificationPreferences,
    NotificationChannel,
    NotificationFilter,
    EventType,
    NotificationEvent,
)

async def main():
    svc = NotificationService()

    prefs = NotificationPreferences(
        user_id="trader-1",
        channels=[NotificationChannel.TELEGRAM],
        notification_filter=NotificationFilter(min_elite_score=75.0),
    )
    svc.register_preferences(prefs)

    event = NotificationEvent(
        event_type=EventType.ELITE_OPPORTUNITY,
        symbol="GARAN",
        elite_score=85.0,
        confidence=0.9,
    )

    ids = svc.publish_event(event)
    print(f"Queued {len(ids)} notifications")

    await svc.start()
    # ... keep running ...
    await svc.stop()

asyncio.run(main())
```
