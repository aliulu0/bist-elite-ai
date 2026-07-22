import pytest
from datetime import datetime, timezone
from app.notifications.service import NotificationService
from app.notifications.types import (
    EventType,
    NotificationChannel,
    NotificationConfig,
    NotificationEvent,
    NotificationFilter,
    NotificationPreferences,
    NotificationRecord,
    QuietHours,
    RiskLevel,
    MarketRegime,
)


class TestNotificationEndToEnd:
    def setup_method(self):
        self.svc = NotificationService(local_only=True)
        self.prefs = NotificationPreferences(
            user_id="test-user",
            channels=[NotificationChannel.TELEGRAM],
            elite_opportunities=True,
            risk_alerts=True,
            daily_summary=True,
            notification_filter=NotificationFilter(min_elite_score=70.0),
            quiet_hours=QuietHours(enabled=False),
        )
        self.svc.register_preferences(self.prefs)

    def test_elite_opportunity_publishes_notification(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
            market_regime=MarketRegime.BULL,
            risk_level=RiskLevel.LOW,
        )
        ids = self.svc.publish_event(event)
        assert len(ids) == 1
        queue_stats = self.svc.get_queue_stats()
        assert queue_stats["queue_size"] >= 1

    def test_elite_opportunity_below_threshold_no_notification(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=60.0,
            confidence=0.9,
        )
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_risk_event_high_publishes_notification(self):
        event = NotificationEvent(
            event_type=EventType.RISK_EVENT,
            symbol="AKBNK",
            risk_level=RiskLevel.HIGH,
            market_regime=MarketRegime.CRASH,
        )
        ids = self.svc.publish_event(event)
        assert len(ids) == 1

    def test_risk_event_low_no_notification(self):
        event = NotificationEvent(
            event_type=EventType.RISK_EVENT,
            symbol="AKBNK",
            risk_level=RiskLevel.LOW,
        )
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_daily_summary_publishes(self):
        event = NotificationEvent(
            event_type=EventType.DAILY_SUMMARY,
            message="Market closed at 10,500",
        )
        ids = self.svc.publish_event(event)
        assert len(ids) == 1

    def test_multiple_users_receive_notifications(self):
        for uid in ["u1", "u2", "u3"]:
            prefs = NotificationPreferences(user_id=uid, quiet_hours=QuietHours(enabled=False))
            self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        ids = self.svc.publish_event(event)
        assert len(ids) >= 3

    def test_disabled_user_no_notification(self):
        self.prefs.enabled = False
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=90.0,
            confidence=0.95,
        )
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_direct_publish(self):
        nid = self.svc.publish_direct(
            "test-user",
            "Test Alert",
            "Direct notification",
            channel=NotificationChannel.TELEGRAM,
        )
        assert nid is not None


class TestQuietHoursIntegration:
    def setup_method(self):
        self.svc = NotificationService(local_only=True)

    def test_quiet_hours_block_notifications(self):
        prefs = NotificationPreferences(
            user_id="quiet-user",
            quiet_hours=QuietHours(enabled=True, start_hour=22, end_hour=7),
        )
        self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        should = self.svc._should_notify("quiet-user", prefs, event)
        assert should is False

    def test_quiet_hours_allows_critical(self):
        from app.notifications.types import NotificationPriority
        prefs = NotificationPreferences(
            user_id="quiet-user2",
            quiet_hours=QuietHours(enabled=True, start_hour=22, end_hour=7),
        )
        self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.RISK_EVENT,
            symbol="GARAN",
            risk_level=RiskLevel.VERY_HIGH,
            priority=NotificationPriority.HIGH,
        )
        should = self.svc._should_notify("quiet-user2", prefs, event)
        assert should is True


class TestFilterIntegration:
    def setup_method(self):
        self.svc = NotificationService(local_only=True)
        self.prefs = NotificationPreferences(
            user_id="filter-user",
            notification_filter=NotificationFilter(
                min_elite_score=80.0,
                sectors=["banking"],
                symbols=["GARAN", "AKBNK"],
            ),
            quiet_hours=QuietHours(enabled=False),
        )
        self.svc.register_preferences(self.prefs)

    def test_matching_sector_and_symbol(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            sector="banking",
            elite_score=85.0,
            confidence=0.9,
        )
        should = self.svc._should_notify("filter-user", self.prefs, event)
        assert should is True

    def test_non_matching_sector(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            sector="technology",
            elite_score=85.0,
            confidence=0.9,
        )
        should = self.svc._should_notify("filter-user", self.prefs, event)
        assert should is False
