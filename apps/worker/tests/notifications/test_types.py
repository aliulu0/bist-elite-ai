import pytest
from datetime import datetime, timezone
from app.notifications.types import (
    NotificationChannel,
    NotificationPriority,
    EventType,
    AlertType,
    DeliveryStatus,
    NotificationStatus,
    RiskLevel,
    MarketRegime,
    NotificationFilter,
    QuietHours,
    CooldownConfig,
    RetryConfig,
    NotificationPreferences,
    NotificationEvent,
    NotificationRecord,
    DeliveryLog,
    SummaryData,
    NotificationConfig,
)


class TestEnums:
    def test_notification_channel_values(self):
        assert NotificationChannel.TELEGRAM.value == "telegram"
        assert NotificationChannel.EMAIL.value == "email"
        assert NotificationChannel.MOBILE_PUSH.value == "mobile_push"
        assert NotificationChannel.WEB.value == "web"

    def test_notification_priority_ordering(self):
        assert NotificationPriority.LOW.value < NotificationPriority.NORMAL.value
        assert NotificationPriority.NORMAL.value < NotificationPriority.HIGH.value
        assert NotificationPriority.HIGH.value < NotificationPriority.CRITICAL.value

    def test_event_type_values(self):
        assert EventType.ELITE_OPPORTUNITY.value == "elite_opportunity"
        assert EventType.DAILY_SUMMARY.value == "daily_summary"
        assert EventType.APPLICATION_ERROR.value == "application_error"

    def test_delivery_status_values(self):
        assert DeliveryStatus.PENDING.value == "pending"
        assert DeliveryStatus.SENT.value == "sent"
        assert DeliveryStatus.FAILED.value == "failed"
        assert DeliveryStatus.DEAD_LETTER.value == "dead_letter"

    def test_risk_level_values(self):
        assert RiskLevel.LOW.value == "low"
        assert RiskLevel.VERY_HIGH.value == "very_high"

    def test_market_regime_values(self):
        assert MarketRegime.BULL.value == "bull"
        assert MarketRegime.CRASH.value == "crash"


class TestNotificationFilter:
    def test_matches_allows_matching_event_type(self):
        f = NotificationFilter(event_types=[EventType.ELITE_OPPORTUNITY])
        event = NotificationEvent(event_type=EventType.ELITE_OPPORTUNITY)
        assert f.matches(event) is True

    def test_matches_rejects_non_matching_event_type(self):
        f = NotificationFilter(event_types=[EventType.ELITE_OPPORTUNITY])
        event = NotificationEvent(event_type=EventType.RISK_EVENT)
        assert f.matches(event) is False

    def test_matches_allows_matching_symbol(self):
        f = NotificationFilter(symbols=["GARAN"])
        event = NotificationEvent(symbol="GARAN")
        assert f.matches(event) is True

    def test_matches_rejects_non_matching_symbol(self):
        f = NotificationFilter(symbols=["GARAN"])
        event = NotificationEvent(symbol="AKBNK")
        assert f.matches(event) is False

    def test_matches_elite_score_threshold(self):
        f = NotificationFilter(min_elite_score=70.0)
        event = NotificationEvent(elite_score=75.0)
        assert f.matches(event) is True
        event2 = NotificationEvent(elite_score=65.0)
        assert f.matches(event2) is False

    def test_matches_confidence_threshold(self):
        f = NotificationFilter(min_confidence=0.6)
        event = NotificationEvent(confidence=0.8)
        assert f.matches(event) is True
        event2 = NotificationEvent(confidence=0.4)
        assert f.matches(event2) is False

    def test_matches_market_regime(self):
        f = NotificationFilter(market_regimes=[MarketRegime.BULL, MarketRegime.RECOVERY])
        event = NotificationEvent(market_regime=MarketRegime.BULL)
        assert f.matches(event) is True
        event2 = NotificationEvent(market_regime=MarketRegime.BEAR)
        assert f.matches(event2) is False

    def test_matches_risk_level(self):
        f = NotificationFilter(risk_levels=[RiskLevel.HIGH, RiskLevel.VERY_HIGH])
        event = NotificationEvent(risk_level=RiskLevel.HIGH)
        assert f.matches(event) is True
        event2 = NotificationEvent(risk_level=RiskLevel.LOW)
        assert f.matches(event2) is False

    def test_matches_empty_filter_matches_all(self):
        f = NotificationFilter()
        event = NotificationEvent(event_type=EventType.ELITE_OPPORTUNITY, symbol="GARAN")
        assert f.matches(event) is True


class TestQuietHours:
    def test_quiet_hours_disabled_never_quiet(self):
        qh = QuietHours(enabled=False)
        assert qh.is_quiet() is False

    def test_quiet_hours_active_during_quiet_time(self):
        qh = QuietHours(enabled=True, start_hour=22, end_hour=7)
        quiet_time = datetime(2026, 7, 21, 23, 30, tzinfo=timezone.utc)
        assert qh.is_quiet(quiet_time) is True

    def test_quiet_hours_not_active_outside_quiet_time(self):
        qh = QuietHours(enabled=True, start_hour=22, end_hour=7)
        active_time = datetime(2026, 7, 21, 10, 0, tzinfo=timezone.utc)
        assert qh.is_quiet(active_time) is False


class TestCooldownConfig:
    def test_default_cooldown(self):
        cc = CooldownConfig(default_seconds=300)
        assert cc.get_cooldown(EventType.ELITE_OPPORTUNITY) == 300

    def test_per_event_cooldown(self):
        cc = CooldownConfig(
            default_seconds=300,
            per_event_seconds={EventType.RISK_EVENT: 60}
        )
        assert cc.get_cooldown(EventType.RISK_EVENT) == 60
        assert cc.get_cooldown(EventType.ELITE_OPPORTUNITY) == 300


class TestRetryConfig:
    def test_delay_for_attempt(self):
        rc = RetryConfig(base_delay_seconds=1.0, exponential_base=2.0)
        assert rc.delay_for_attempt(0) == 1.0
        assert rc.delay_for_attempt(1) == 2.0
        assert rc.delay_for_attempt(2) == 4.0

    def test_max_delay_cap(self):
        rc = RetryConfig(base_delay_seconds=1.0, max_delay_seconds=10.0, exponential_base=2.0)
        assert rc.delay_for_attempt(10) == 10.0


class TestNotificationPreferences:
    def test_default_preferences(self):
        prefs = NotificationPreferences(user_id="user1")
        assert prefs.enabled is True
        assert prefs.channels == [NotificationChannel.TELEGRAM]
        assert prefs.elite_opportunities is True
        assert prefs.risk_alerts is True
        assert prefs.daily_summary is True


class TestNotificationEvent:
    def test_event_creation(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        assert event.event_type == EventType.ELITE_OPPORTUNITY
        assert event.symbol == "GARAN"
        assert event.elite_score == 85.0
        assert event.confidence == 0.9
        assert event.event_id is not None
        assert event.timestamp is not None


class TestNotificationRecord:
    def test_record_creation(self):
        record = NotificationRecord(
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test message",
        )
        assert record.user_id == "user1"
        assert record.status == NotificationStatus.CREATED
        assert record.delivery_status == DeliveryStatus.PENDING
        assert record.attempts == 0


class TestNotificationConfig:
    def test_default_config(self):
        config = NotificationConfig()
        assert config.batch_size == 50
        assert config.processing_interval_seconds == 5.0
        assert config.max_queue_size == 10000
