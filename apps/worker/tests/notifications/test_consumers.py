import pytest
from app.notifications.consumers.analysis import AnalysisEventConsumer
from app.notifications.consumers.system import SystemEventConsumer
from app.notifications.types import (
    EventType,
    NotificationEvent,
    NotificationPriority,
    RiskLevel,
    MarketRegime,
)


class TestAnalysisEventConsumer:
    def setup_method(self):
        self.consumer = AnalysisEventConsumer(elite_threshold=70.0, confidence_threshold=0.6)

    def test_can_handle_elite_opportunity(self):
        event = NotificationEvent(event_type=EventType.ELITE_OPPORTUNITY)
        assert self.consumer.can_handle(event) is True

    def test_can_handle_risk_event(self):
        event = NotificationEvent(event_type=EventType.RISK_EVENT)
        assert self.consumer.can_handle(event) is True

    def test_cannot_handle_system_event(self):
        event = NotificationEvent(event_type=EventType.SYSTEM_EVENT)
        assert self.consumer.can_handle(event) is False

    def test_process_elite_above_threshold(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.9,
            market_regime=MarketRegime.BULL,
            risk_level=RiskLevel.LOW,
        )
        result = self.consumer.process(event)
        assert result is not None
        assert result.title == "Elite Opportunity: GARAN"
        assert "85.0" in result.message

    def test_process_elite_below_threshold(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=60.0,
            confidence=0.9,
        )
        result = self.consumer.process(event)
        assert result is None

    def test_process_elite_low_confidence(self):
        event = NotificationEvent(
            event_type=EventType.ELITE_OPPORTUNITY,
            symbol="GARAN",
            elite_score=85.0,
            confidence=0.3,
        )
        result = self.consumer.process(event)
        assert result is None

    def test_process_risk_high(self):
        event = NotificationEvent(
            event_type=EventType.RISK_EVENT,
            symbol="GARAN",
            risk_level=RiskLevel.HIGH,
            market_regime=MarketRegime.CRASH,
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "HIGH" in result.title

    def test_process_risk_low_ignored(self):
        event = NotificationEvent(
            event_type=EventType.RISK_EVENT,
            symbol="GARAN",
            risk_level=RiskLevel.LOW,
        )
        result = self.consumer.process(event)
        assert result is None

    def test_process_portfolio_update(self):
        event = NotificationEvent(
            event_type=EventType.PORTFOLIO_UPDATE,
            symbol="GARAN",
            message="Position updated",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Portfolio Update" in result.title

    def test_process_backtest_complete(self):
        event = NotificationEvent(
            event_type=EventType.BACKTEST_COMPLETE,
            message="Backtest finished",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Backtest Complete" in result.title

    def test_process_early_opportunity(self):
        event = NotificationEvent(
            event_type=EventType.EARLY_OPPORTUNITY,
            symbol="AKBNK",
            elite_score=75.0,
            confidence=0.8,
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Early Opportunity" in result.title


class TestSystemEventConsumer:
    def setup_method(self):
        self.consumer = SystemEventConsumer()

    def test_can_handle_system_event(self):
        event = NotificationEvent(event_type=EventType.SYSTEM_EVENT)
        assert self.consumer.can_handle(event) is True

    def test_can_handle_application_error(self):
        event = NotificationEvent(event_type=EventType.APPLICATION_ERROR)
        assert self.consumer.can_handle(event) is True

    def test_can_handle_daily_summary(self):
        event = NotificationEvent(event_type=EventType.DAILY_SUMMARY)
        assert self.consumer.can_handle(event) is True

    def test_cannot_handle_elite_opportunity(self):
        event = NotificationEvent(event_type=EventType.ELITE_OPPORTUNITY)
        assert self.consumer.can_handle(event) is False

    def test_process_error(self):
        event = NotificationEvent(
            event_type=EventType.APPLICATION_ERROR,
            message="Database connection failed",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "System Error" in result.title

    def test_process_daily_summary(self):
        event = NotificationEvent(
            event_type=EventType.DAILY_SUMMARY,
            message="Market closed",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Daily" in result.title

    def test_process_weekly_summary(self):
        event = NotificationEvent(
            event_type=EventType.WEEKLY_SUMMARY,
            message="Week summary",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Weekly" in result.title

    def test_process_monthly_summary(self):
        event = NotificationEvent(
            event_type=EventType.MONTHLY_SUMMARY,
            message="Month summary",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert "Monthly" in result.title

    def test_process_system_event(self):
        event = NotificationEvent(
            event_type=EventType.SYSTEM_EVENT,
            title="Deployment Complete",
        )
        result = self.consumer.process(event)
        assert result is not None
        assert result.title == "Deployment Complete"
