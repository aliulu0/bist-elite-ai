from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4


# ==========================================================
# ENUMS
# ==========================================================

class NotificationChannel(str, Enum):
    TELEGRAM = "telegram"
    EMAIL = "email"
    MOBILE_PUSH = "mobile_push"
    WEB = "web"


class NotificationPriority(int, Enum):
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


class EventType(str, Enum):
    ELITE_OPPORTUNITY = "elite_opportunity"
    EARLY_OPPORTUNITY = "early_opportunity"
    PORTFOLIO_UPDATE = "portfolio_update"
    RISK_EVENT = "risk_event"
    BACKTEST_COMPLETE = "backtest_complete"
    SYSTEM_EVENT = "system_event"
    APPLICATION_ERROR = "application_error"
    DAILY_SUMMARY = "daily_summary"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"


class AlertType(str, Enum):
    INSTANT = "instant"
    SCHEDULED = "scheduled"
    DAILY_SUMMARY = "daily_summary"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"


class DeliveryStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"
    DEAD_LETTER = "dead_letter"


class NotificationStatus(str, Enum):
    CREATED = "created"
    QUEUED = "queued"
    PROCESSING = "processing"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"
    DEAD_LETTER = "dead_letter"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class MarketRegime(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    CRASH = "crash"
    RECOVERY = "recovery"


# ==========================================================
# DATA CLASSES
# ==========================================================

@dataclass
class NotificationFilter:
    min_elite_score: float = 70.0
    min_confidence: float = 0.6
    timeframes: list[str] = field(default_factory=lambda: ["4h", "1d", "1w", "1m"])
    sectors: list[str] = field(default_factory=list)
    symbols: list[str] = field(default_factory=list)
    market_regimes: list[MarketRegime] = field(default_factory=list)
    risk_levels: list[RiskLevel] = field(default_factory=list)
    event_types: list[EventType] = field(default_factory=list)

    def matches(self, event: NotificationEvent) -> bool:
        if self.event_types and event.event_type not in self.event_types:
            return False
        if self.symbols and event.symbol not in self.symbols:
            return False
        if self.sectors and event.sector not in self.sectors:
            return False
        if self.min_elite_score and event.elite_score is not None:
            if event.elite_score < self.min_elite_score:
                return False
        if self.min_confidence and event.confidence is not None:
            if event.confidence < self.min_confidence:
                return False
        if self.market_regimes and event.market_regime is not None:
            if event.market_regime not in self.market_regimes:
                return False
        if self.risk_levels and event.risk_level is not None:
            if event.risk_level not in self.risk_levels:
                return False
        return True


@dataclass
class QuietHours:
    enabled: bool = True
    start_hour: int = 22
    start_minute: int = 0
    end_hour: int = 7
    end_minute: int = 0
    timezone_name: str = "Europe/Istanbul"

    def is_quiet(self, dt: datetime | None = None) -> bool:
        if not self.enabled:
            return False
        now = dt or datetime.now(timezone.utc)
        current_minutes = now.hour * 60 + now.minute
        start_minutes = self.start_hour * 60 + self.start_minute
        end_minutes = self.end_hour * 60 + self.end_minute
        if start_minutes > end_minutes:
            return current_minutes >= start_minutes or current_minutes < end_minutes
        return start_minutes <= current_minutes < end_minutes


@dataclass
class CooldownConfig:
    enabled: bool = True
    default_seconds: int = 300
    per_event_seconds: dict[EventType, int] = field(default_factory=dict)

    def get_cooldown(self, event_type: EventType) -> int:
        return self.per_event_seconds.get(event_type, self.default_seconds)


@dataclass
class RetryConfig:
    max_retries: int = 3
    base_delay_seconds: float = 1.0
    max_delay_seconds: float = 60.0
    exponential_base: float = 2.0
    dead_letter_after_retries: bool = True

    def delay_for_attempt(self, attempt: int) -> float:
        delay = self.base_delay_seconds * (self.exponential_base ** attempt)
        return min(delay, self.max_delay_seconds)


@dataclass
class NotificationPreferences:
    user_id: str
    channels: list[NotificationChannel] = field(default_factory=lambda: [NotificationChannel.TELEGRAM])
    enabled: bool = True
    elite_opportunities: bool = True
    portfolio_alerts: bool = True
    risk_alerts: bool = True
    price_alerts: bool = False
    daily_summary: bool = True
    weekly_summary: bool = True
    monthly_summary: bool = True
    notification_filter: NotificationFilter = field(default_factory=NotificationFilter)
    quiet_hours: QuietHours = field(default_factory=QuietHours)
    cooldown: CooldownConfig = field(default_factory=CooldownConfig)


@dataclass
class NotificationEvent:
    event_id: str = field(default_factory=lambda: str(uuid4()))
    event_type: EventType = EventType.SYSTEM_EVENT
    symbol: str = ""
    sector: str = ""
    elite_score: float | None = None
    confidence: float | None = None
    market_regime: MarketRegime | None = None
    risk_level: RiskLevel | None = None
    title: str = ""
    message: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = ""
    priority: NotificationPriority = NotificationPriority.NORMAL
    alert_type: AlertType = AlertType.INSTANT


@dataclass
class NotificationRecord:
    id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ""
    event_id: str = ""
    channel: NotificationChannel = NotificationChannel.TELEGRAM
    title: str = ""
    message: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    priority: NotificationPriority = NotificationPriority.NORMAL
    status: NotificationStatus = NotificationStatus.CREATED
    delivery_status: DeliveryStatus = DeliveryStatus.PENDING
    attempts: int = 0
    max_attempts: int = 3
    last_error: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    sent_at: datetime | None = None
    next_retry_at: datetime | None = None
    delivered_at: datetime | None = None


@dataclass
class DeliveryLog:
    notification_id: str
    channel: NotificationChannel
    status: DeliveryStatus
    attempt: int
    error: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class SummaryData:
    period: str
    generated_at: datetime
    total_notifications: int
    delivered: int
    failed: int
    events: list[NotificationEvent]
    top_symbols: list[dict[str, Any]]
    market_overview: dict[str, Any]


@dataclass
class NotificationConfig:
    redis_url: str = "redis://localhost:6379/1"
    queue_key: str = "bist:notifications:queue"
    dead_letter_key: str = "bist:notifications:dead_letter"
    cooldown_key_prefix: str = "bist:notifications:cooldown:"
    rate_limit_key_prefix: str = "bist:notifications:ratelimit:"
    batch_size: int = 50
    processing_interval_seconds: float = 5.0
    max_queue_size: int = 10000
    enable_batching: bool = True
    log_delivery: bool = True
    log_retries: bool = True
