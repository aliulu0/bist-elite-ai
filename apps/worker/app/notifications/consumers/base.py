from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..types import NotificationEvent


class EventConsumer(ABC):
    @abstractmethod
    def can_handle(self, event: NotificationEvent) -> bool:
        ...

    @abstractmethod
    def process(self, event: NotificationEvent) -> NotificationEvent | None:
        ...
