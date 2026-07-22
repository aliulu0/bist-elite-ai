from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from ..types import DeliveryStatus, NotificationChannel, NotificationRecord


@dataclass
class ChannelResult:
    success: bool
    channel: NotificationChannel
    notification_id: str
    external_id: str = ""
    error: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class Channel(ABC):
    @property
    @abstractmethod
    def name(self) -> NotificationChannel:
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        ...

    @abstractmethod
    async def send(self, record: NotificationRecord) -> ChannelResult:
        ...

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        ...
