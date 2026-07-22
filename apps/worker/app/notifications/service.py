from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .channels.manager import ChannelManager
from .consumers.analysis import AnalysisEventConsumer
from .consumers.system import SystemEventConsumer
from .queue import NotificationQueue
from .types import (
    AlertType,
    CooldownConfig,
    DeliveryStatus,
    EventType,
    NotificationChannel,
    NotificationConfig,
    NotificationEvent,
    NotificationFilter,
    NotificationPreferences,
    NotificationRecord,
    NotificationStatus,
    QuietHours,
    RetryConfig,
    SummaryData,
)

logger = logging.getLogger("notifications.service")


class NotificationService:
    def __init__(
        self,
        config: NotificationConfig | None = None,
        channel_manager: ChannelManager | None = None,
        local_only: bool = False,
    ):
        self._config = config or NotificationConfig()
        self._queue = NotificationQueue(self._config, local_only=local_only)
        self._channel_manager = channel_manager or ChannelManager.create_default()
        self._consumers = [AnalysisEventConsumer(), SystemEventConsumer()]
        self._preferences: dict[str, NotificationPreferences] = {}
        self._running = False
        self._processor_task: asyncio.Task | None = None

    @property
    def queue(self) -> NotificationQueue:
        return self._queue

    @property
    def channels(self) -> ChannelManager:
        return self._channel_manager

    def register_preferences(self, prefs: NotificationPreferences) -> None:
        self._preferences[prefs.user_id] = prefs

    def get_preferences(self, user_id: str) -> NotificationPreferences | None:
        return self._preferences.get(user_id)

    def remove_preferences(self, user_id: str) -> bool:
        return self._preferences.pop(user_id, None) is not None

    def set_user_channels(self, user_id: str, channels: list[NotificationChannel]) -> None:
        prefs = self._preferences.get(user_id)
        if prefs:
            prefs.channels = channels

    def set_user_filter(self, user_id: str, filter_config: NotificationFilter) -> None:
        prefs = self._preferences.get(user_id)
        if prefs:
            prefs.notification_filter = filter_config

    def set_user_quiet_hours(self, user_id: str, quiet_hours: QuietHours) -> None:
        prefs = self._preferences.get(user_id)
        if prefs:
            prefs.quiet_hours = quiet_hours

    def publish_event(self, event: NotificationEvent) -> list[str]:
        processed = self._process_event(event)
        if processed is None:
            return []

        notification_ids: list[str] = []
        for user_id, prefs in self._preferences.items():
            if not prefs.enabled:
                continue
            if not self._should_notify(user_id, prefs, processed):
                continue
            for channel in prefs.channels:
                record = self._create_record(user_id, processed, channel)
                if self._queue.enqueue(record):
                    notification_ids.append(record.id)
                    self._record_cooldown(user_id, processed.event_type, prefs.cooldown)
        return notification_ids

    def publish_direct(
        self,
        user_id: str,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.TELEGRAM,
        priority: int = 1,
        data: dict[str, Any] | None = None,
    ) -> str | None:
        record = NotificationRecord(
            id=str(uuid4()),
            user_id=user_id,
            channel=channel,
            title=title,
            message=message,
            data=data or {},
            priority=priority,
            status=NotificationStatus.QUEUED,
        )
        if self._queue.enqueue(record):
            return record.id
        return None

    def _process_event(self, event: NotificationEvent) -> NotificationEvent | None:
        for consumer in self._consumers:
            if consumer.can_handle(event):
                return consumer.process(event)
        return None

    def _should_notify(self, user_id: str, prefs: NotificationPreferences, event: NotificationEvent) -> bool:
        priority_val = event.priority.value if hasattr(event.priority, "value") else int(event.priority)
        if prefs.quiet_hours.is_quiet() and priority_val < 2:
            return False
        if self._queue.is_in_cooldown(user_id, event.event_type.value):
            return False
        if not prefs.notification_filter.matches(event):
            return False
        if not self._is_event_enabled(prefs, event.event_type):
            return False
        return True

    def _is_event_enabled(self, prefs: NotificationPreferences, event_type: EventType) -> bool:
        mapping = {
            EventType.ELITE_OPPORTUNITY: prefs.elite_opportunities,
            EventType.EARLY_OPPORTUNITY: prefs.elite_opportunities,
            EventType.PORTFOLIO_UPDATE: prefs.portfolio_alerts,
            EventType.RISK_EVENT: prefs.risk_alerts,
            EventType.BACKTEST_COMPLETE: True,
            EventType.SYSTEM_EVENT: True,
            EventType.APPLICATION_ERROR: True,
            EventType.DAILY_SUMMARY: prefs.daily_summary,
            EventType.WEEKLY_SUMMARY: prefs.weekly_summary,
            EventType.MONTHLY_SUMMARY: prefs.monthly_summary,
        }
        return mapping.get(event_type, True)

    def _create_record(
        self,
        user_id: str,
        event: NotificationEvent,
        channel: NotificationChannel,
    ) -> NotificationRecord:
        return NotificationRecord(
            id=str(uuid4()),
            user_id=user_id,
            event_id=event.event_id,
            channel=channel,
            title=event.title,
            message=event.message,
            data=event.data,
            priority=event.priority,
            status=NotificationStatus.QUEUED,
            max_attempts=3,
        )

    def _record_cooldown(self, user_id: str, event_type: EventType, cooldown: CooldownConfig) -> None:
        if cooldown.enabled:
            self._queue.record_cooldown(user_id, event_type.value, cooldown.get_cooldown(event_type))

    async def start(self) -> None:
        self._running = True
        self._processor_task = asyncio.create_task(self._process_loop())
        logger.info("Notification service started")

    async def stop(self) -> None:
        self._running = False
        if self._processor_task:
            self._processor_task.cancel()
            try:
                await self._processor_task
            except asyncio.CancelledError:
                pass
        logger.info("Notification service stopped")

    async def _process_loop(self) -> None:
        while self._running:
            try:
                await self._process_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in process loop: {e}")
            await asyncio.sleep(self._config.processing_interval_seconds)

    async def _process_batch(self) -> int:
        batch = self._queue.dequeue(self._config.batch_size)
        if not batch:
            return 0
        processed = 0
        for item in batch:
            try:
                await self._deliver(item)
                processed += 1
            except Exception as e:
                logger.error(f"Error delivering notification {item.get('id')}: {e}")
                self._handle_delivery_failure(item, str(e))
        return processed

    async def _deliver(self, item: dict[str, Any]) -> bool:
        channel_type = NotificationChannel(item["channel"])
        record = NotificationRecord(
            id=item["id"],
            user_id=item["user_id"],
            event_id=item.get("event_id", ""),
            channel=channel_type,
            title=item["title"],
            message=item["message"],
            data=item.get("data", {}),
            priority=item.get("priority", 1),
            status=NotificationStatus.PROCESSING,
            attempts=item.get("attempts", 0) + 1,
            max_attempts=item.get("max_attempts", 3),
        )

        result = await self._channel_manager.send(record, channel_type)

        if result.success:
            record.status = NotificationStatus.DELIVERED
            record.delivery_status = DeliveryStatus.SENT
            record.sent_at = datetime.now(timezone.utc)
            record.delivered_at = datetime.now(timezone.utc)
            log_entry = DeliveryLog(
                notification_id=record.id,
                channel=channel_type,
                status=DeliveryStatus.SENT,
                attempt=record.attempts,
            )
            self._queue.log_delivery(log_entry)
            return True
        else:
            record.status = NotificationStatus.FAILED
            record.delivery_status = DeliveryStatus.FAILED
            record.last_error = result.error
            log_entry = DeliveryLog(
                notification_id=record.id,
                channel=channel_type,
                status=DeliveryStatus.FAILED,
                attempt=record.attempts,
                error=result.error,
            )
            self._queue.log_delivery(log_entry)
            self._handle_delivery_failure(item, result.error)
            return False

    def _handle_delivery_failure(self, item: dict[str, Any], error: str) -> None:
        attempts = item.get("attempts", 0) + 1
        max_attempts = item.get("max_attempts", 3)
        if attempts >= max_attempts:
            record = NotificationRecord(
                id=item["id"],
                user_id=item["user_id"],
                channel=NotificationChannel(item["channel"]),
                title=item["title"],
                message=item["message"],
                data=item.get("data", {}),
                attempts=attempts,
                max_attempts=max_attempts,
            )
            self._queue.send_to_dead_letter(record, error)
            logger.warning(f"Notification {item['id']} sent to dead letter after {attempts} attempts")
        else:
            item["attempts"] = attempts
            self._queue.enqueue(NotificationRecord(
                id=item["id"],
                user_id=item["user_id"],
                channel=NotificationChannel(item["channel"]),
                title=item["title"],
                message=item["message"],
                data=item.get("data", {}),
                attempts=attempts,
                max_attempts=max_attempts,
            ))

    async def health_check(self) -> dict[str, Any]:
        queue_size = self._queue.queue_size()
        dead_letters = self._queue.get_dead_letters(10)
        channel_health = await self._channel_manager.health_check()
        return {
            "status": "healthy" if queue_size < self._config.max_queue_size else "degraded",
            "queue_size": queue_size,
            "dead_letter_count": len(dead_letters),
            "channels": channel_health,
            "preferences_count": len(self._preferences),
            "running": self._running,
        }

    def get_delivery_logs(self, count: int = 100) -> list[dict[str, Any]]:
        return self._queue.get_delivery_logs(count)

    def get_dead_letters(self, count: int = 50) -> list[dict[str, Any]]:
        return self._queue.get_dead_letters(count)

    def clear_dead_letters(self) -> int:
        return self._queue.clear_dead_letter_queue()

    def get_queue_stats(self) -> dict[str, Any]:
        return {
            "queue_size": self._queue.queue_size(),
            "dead_letter_count": len(self._queue.get_dead_letters()),
            "max_queue_size": self._config.max_queue_size,
            "batch_size": self._config.batch_size,
            "processing_interval": self._config.processing_interval_seconds,
        }

    async def send_summary(self, user_id: str, summary: SummaryData) -> str | None:
        lines = [
            f"*{summary.period} Market Summary*",
            "",
            f"Total Notifications: {summary.total_notifications}",
            f"Delivered: {summary.delivered}",
            f"Failed: {summary.failed}",
            "",
            "---",
            "",
        ]
        if summary.top_symbols:
            lines.append("*Top Symbols:*")
            for item in summary.top_symbols[:5]:
                lines.append(f"  {item.get('symbol', 'N/A')}: {item.get('score', 0):.1f}")
            lines.append("")

        if summary.market_overview:
            lines.append("*Market Overview:*")
            for key, value in summary.market_overview.items():
                lines.append(f"  {key}: {value}")

        return self.publish_direct(
            user_id=user_id,
            title=summary.period + " Market Summary",
            message="\n".join(lines),
            data={
                "total_notifications": summary.total_notifications,
                "delivered": summary.delivered,
                "failed": summary.failed,
                "generated_at": summary.generated_at.isoformat(),
            },
        )
