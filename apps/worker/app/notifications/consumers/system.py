from __future__ import annotations

from .base import EventConsumer
from ..types import EventType, NotificationEvent


class SystemEventConsumer(EventConsumer):
    def can_handle(self, event: NotificationEvent) -> bool:
        return event.event_type in (
            EventType.SYSTEM_EVENT,
            EventType.APPLICATION_ERROR,
            EventType.DAILY_SUMMARY,
            EventType.WEEKLY_SUMMARY,
            EventType.MONTHLY_SUMMARY,
        )

    def process(self, event: NotificationEvent) -> NotificationEvent | None:
        if event.event_type == EventType.APPLICATION_ERROR:
            return self._process_error(event)
        if event.event_type in (
            EventType.DAILY_SUMMARY,
            EventType.WEEKLY_SUMMARY,
            EventType.MONTHLY_SUMMARY,
        ):
            return self._process_summary(event)
        if event.event_type == EventType.SYSTEM_EVENT:
            return self._process_system_event(event)
        return None

    def _process_error(self, event: NotificationEvent) -> NotificationEvent | None:
        event.title = "System Error"
        event.priority = NotificationPriority.CRITICAL if "critical" in event.message.lower() else NotificationPriority.HIGH
        return event

    def _process_summary(self, event: NotificationEvent) -> NotificationEvent | None:
        period_names = {
            EventType.DAILY_SUMMARY: "Daily",
            EventType.WEEKLY_SUMMARY: "Weekly",
            EventType.MONTHLY_SUMMARY: "Monthly",
        }
        period = period_names.get(event.event_type, "Summary")
        event.title = f"{period} Market Summary"
        event.message = event.message or f"{period} market summary has been generated"
        return event

    def _process_system_event(self, event: NotificationEvent) -> NotificationEvent | None:
        if not event.title:
            event.title = "System Notification"
        return event


from ..types import NotificationPriority
