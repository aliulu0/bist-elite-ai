from __future__ import annotations

from .base import EventConsumer
from ..types import EventType, NotificationEvent


class AnalysisEventConsumer(EventConsumer):
    def __init__(self, elite_threshold: float = 70.0, confidence_threshold: float = 0.6):
        self._elite_threshold = elite_threshold
        self._confidence_threshold = confidence_threshold

    def can_handle(self, event: NotificationEvent) -> bool:
        return event.event_type in (
            EventType.ELITE_OPPORTUNITY,
            EventType.EARLY_OPPORTUNITY,
            EventType.RISK_EVENT,
            EventType.PORTFOLIO_UPDATE,
            EventType.BACKTEST_COMPLETE,
        )

    def process(self, event: NotificationEvent) -> NotificationEvent | None:
        if event.event_type == EventType.ELITE_OPPORTUNITY:
            return self._process_elite_opportunity(event)
        if event.event_type == EventType.EARLY_OPPORTUNITY:
            return self._process_early_opportunity(event)
        if event.event_type == EventType.RISK_EVENT:
            return self._process_risk_event(event)
        if event.event_type == EventType.PORTFOLIO_UPDATE:
            return self._process_portfolio_update(event)
        if event.event_type == EventType.BACKTEST_COMPLETE:
            return self._process_backtest_complete(event)
        return None

    def _process_elite_opportunity(self, event: NotificationEvent) -> NotificationEvent | None:
        if event.elite_score is None or event.elite_score < self._elite_threshold:
            return None
        if event.confidence is not None and event.confidence < self._confidence_threshold:
            return None
        event.title = f"Elite Opportunity: {event.symbol}"
        confidence_str = f"{event.confidence:.1%}" if event.confidence is not None else "N/A"
        event.message = (
            f"Elite Score: {event.elite_score:.1f}/100\n"
            f"Confidence: {confidence_str}\n"
            f"Market Regime: {event.market_regime.value if event.market_regime else 'N/A'}\n"
            f"Risk Level: {event.risk_level.value if event.risk_level else 'N/A'}"
        )
        return event

    def _process_early_opportunity(self, event: NotificationEvent) -> NotificationEvent | None:
        if event.elite_score is not None and event.elite_score < self._elite_threshold:
            return None
        event.title = f"Early Opportunity: {event.symbol}"
        confidence_str = f"Confidence: {event.confidence:.1%}" if event.confidence is not None else ""
        event.message = (
            f"Early detection signal for {event.symbol}\n"
            f"Score: {event.elite_score:.1f}/100\n"
            f"{confidence_str}".strip()
        )
        return event

    def _process_risk_event(self, event: NotificationEvent) -> NotificationEvent | None:
        if event.risk_level is None:
            return None
        from ..types import RiskLevel
        if event.risk_level not in (RiskLevel.HIGH, RiskLevel.VERY_HIGH):
            return None
        severity = "HIGH" if event.risk_level == RiskLevel.HIGH else "CRITICAL"
        event.title = f"Risk Alert [{severity}]: {event.symbol}"
        event.message = (
            f"Risk Level: {event.risk_level.value.upper()}\n"
            f"Market Regime: {event.market_regime.value if event.market_regime else 'N/A'}"
        )
        return event

    def _process_portfolio_update(self, event: NotificationEvent) -> NotificationEvent | None:
        event.title = f"Portfolio Update: {event.symbol}" if event.symbol else "Portfolio Update"
        event.message = event.message or "Portfolio position has been updated"
        return event

    def _process_backtest_complete(self, event: NotificationEvent) -> NotificationEvent | None:
        event.title = "Backtest Complete"
        event.message = event.message or "Your backtest has completed successfully"
        return event
