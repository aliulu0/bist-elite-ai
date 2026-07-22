from __future__ import annotations

from typing import Any

from .base import Channel, ChannelResult
from .telegram import TelegramChannel
from .email_channel import EmailChannel
from ..types import NotificationChannel, NotificationRecord


class ChannelManager:
    def __init__(self):
        self._channels: dict[NotificationChannel, Channel] = {}

    def register(self, channel: Channel) -> None:
        self._channels[channel.name] = channel

    def get(self, channel_type: NotificationChannel) -> Channel | None:
        return self._channels.get(channel_type)

    def get_all(self) -> list[Channel]:
        return list(self._channels.values())

    def get_configured(self) -> list[Channel]:
        return [ch for ch in self._channels.values() if ch.is_configured]

    async def send(self, record: NotificationRecord, channel_type: NotificationChannel) -> ChannelResult:
        channel = self._channels.get(channel_type)
        if channel is None:
            return ChannelResult(
                success=False,
                channel=channel_type,
                notification_id=record.id,
                error=f"Channel {channel_type.value} not registered",
            )
        if not channel.is_configured:
            return ChannelResult(
                success=False,
                channel=channel_type,
                notification_id=record.id,
                error=f"Channel {channel_type.value} not configured",
            )
        return await channel.send(record)

    async def send_to_all(self, record: NotificationRecord) -> list[ChannelResult]:
        results = []
        for channel in self.get_configured():
            result = await channel.send(record)
            results.append(result)
        return results

    async def health_check(self) -> dict[str, Any]:
        checks = {}
        for channel in self._channels.values():
            checks[channel.name.value] = await channel.health_check()
        return checks

    @staticmethod
    def create_default() -> ChannelManager:
        manager = ChannelManager()
        manager.register(TelegramChannel())
        manager.register(EmailChannel())
        return manager
