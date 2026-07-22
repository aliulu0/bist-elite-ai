import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.notifications.service import NotificationService
from app.notifications.types import (
    AlertType,
    EventType,
    NotificationChannel,
    NotificationConfig,
    NotificationEvent,
    NotificationFilter,
    NotificationPreferences,
    NotificationRecord,
    NotificationStatus,
    QuietHours,
    RiskLevel,
    MarketRegime,
    SummaryData,
)
from datetime import datetime, timezone


class TestNotificationServiceInit:
    def test_default_init(self):
        svc = NotificationService()
        assert svc._running is False
        assert svc._preferences == {}

    def test_custom_config(self):
        config = NotificationConfig(batch_size=100)
        svc = NotificationService(config=config)
        assert svc._config.batch_size == 100

    def test_register_preferences(self):
        svc = NotificationService()
        prefs = NotificationPreferences(user_id="user1")
        svc.register_preferences(prefs)
        assert svc.get_preferences("user1") is prefs

    def test_get_preferences_returns_none(self):
        svc = NotificationService()
        assert svc.get_preferences("nonexistent") is None

    def test_remove_preferences(self):
        svc = NotificationService()
        prefs = NotificationPreferences(user_id="user1")
        svc.register_preferences(prefs)
        assert svc.remove_preferences("user1") is True
        assert svc.get_preferences("user1") is None
        assert svc.remove_preferences("user1") is False

    def test_set_user_channels(self):
        svc = NotificationService()
        prefs = NotificationPreferences(user_id="user1")
        svc.register_preferences(prefs)
        svc.set_user_channels("user1", [NotificationChannel.EMAIL])
        assert prefs.channels == [NotificationChannel.EMAIL]

    def test_set_user_filter(self):
        svc = NotificationService()
        prefs = NotificationPreferences(user_id="user1")
        svc.register_preferences(prefs)
        filt = NotificationFilter(min_elite_score=80.0)
        svc.set_user_filter("user1", filt)
        assert prefs.notification_filter.min_elite_score == 80.0


class TestNotificationServicePublish:
    def setup_method(self):
        self.svc = NotificationService(local_only=True)

    def test_publish_event_returns_empty_without_preferences(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_publish_event_with_matching_preferences(self):
        prefs = NotificationPreferences(
            user_id="user1",
            channels=[NotificationChannel.TELEGRAM],
            elite_opportunities=True,
            quiet_hours=QuietHours(enabled=False),
        )
        self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        ids = self.svc.publish_event(event)
        assert len(ids) == 1

    def test_publish_event_disabled_user(self):
        prefs = NotificationPreferences(user_id="user1", enabled=False)
        self.svc.register_preferences(prefs)
        event = NotificationEvent(event_type=EventType.ELITE_OPPORTUNITY, symbol="GARAN", elite_score=85.0)
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_publish_event_filtered_out(self):
        prefs = NotificationPreferences(
            user_id="user1",
            notification_filter=NotificationFilter(min_elite_score=90.0),
            quiet_hours=QuietHours(enabled=False),
        )
        self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=80.0,
        )
        ids = self.svc.publish_event(event)
        assert ids == []

    def test_publish_event_multiple_users(self):
        for uid in ["user1", "user2", "user3"]:
            prefs = NotificationPreferences(user_id=uid, quiet_hours=QuietHours(enabled=False))
            self.svc.register_preferences(prefs)
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
        )
        ids = self.svc.publish_event(event)
        assert len(ids) == 3

    def test_publish_direct(self):
        nid = self.svc.publish_direct("user1", "Test", "Hello")
        assert nid is not None

    def test_publish_direct_returns_id(self):
        nid = self.svc.publish_direct(
            "user1",
            "Alert",
            "Something happened",
            channel=NotificationChannel.TELEGRAM,
            data={"score": 90},
        )
        assert nid is not None
        assert len(nid) > 0


class TestNotificationServiceIsEventEnabled:
    def test_elite_opportunity_respects_flag(self):
        svc = NotificationService(local_only=True)
        prefs = NotificationPreferences(user_id="u1", elite_opportunities=False)
        assert svc._is_event_enabled(prefs, EventType.ELITE_OPPORTUNITY) is False
        prefs2 = NotificationPreferences(user_id="u2", elite_opportunities=True)
        assert svc._is_event_enabled(prefs2, EventType.ELITE_OPPORTUNITY) is True

    def test_risk_event_respects_flag(self):
        svc = NotificationService(local_only=True)
        prefs = NotificationPreferences(user_id="u1", risk_alerts=False)
        assert svc._is_event_enabled(prefs, EventType.RISK_EVENT) is False

    def test_daily_summary_respects_flag(self):
        svc = NotificationService(local_only=True)
        prefs = NotificationPreferences(user_id="u1", daily_summary=False)
        assert svc._is_event_enabled(prefs, EventType.DAILY_SUMMARY) is False

    def test_system_always_enabled(self):
        svc = NotificationService(local_only=True)
        prefs = NotificationPreferences(user_id="u1")
        assert svc._is_event_enabled(prefs, EventType.SYSTEM_EVENT) is True
        assert svc._is_event_enabled(prefs, EventType.APPLICATION_ERROR) is True


class TestNotificationServiceHealthCheck:
    def test_health_check(self):
        svc = NotificationService(local_only=True)
        import asyncio
        health = asyncio.get_event_loop().run_until_complete(svc.health_check())
        assert "status" in health
        assert "queue_size" in health
        assert "channels" in health


class TestNotificationServiceQueueStats:
    def test_queue_stats(self):
        svc = NotificationService(local_only=True)
        stats = svc.get_queue_stats()
        assert "queue_size" in stats
        assert "batch_size" in stats


class TestNotificationServiceSummary:
    def test_send_summary(self):
        svc = NotificationService(local_only=True)
        summary = SummaryData(
            period="Daily",
            generated_at=datetime.now(timezone.utc),
            total_notifications=10,
            delivered=8,
            failed=2,
            events=[],
            top_symbols=[{"symbol": "GARAN", "score": 85.0}],
            market_overview={"XU100": "10,500"},
        )
        nid = svc.send_summary("user1", summary)
        assert nid is not None
