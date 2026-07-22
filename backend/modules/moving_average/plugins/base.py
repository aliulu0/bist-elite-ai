from __future__ import annotations

from abc import ABC, abstractmethod


class BaseMAPattern(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def display_name(self) -> str: ...

    @abstractmethod
    def calculate(self, closes: list[float], period: int) -> list[float | None]: ...

    def min_periods(self, period: int) -> int:
        return period
