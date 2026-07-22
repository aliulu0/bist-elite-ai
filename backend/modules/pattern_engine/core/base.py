from __future__ import annotations

from abc import ABC, abstractmethod
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory, DetectedPattern,
)


class BasePatternPlugin(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def display_name(self) -> str: ...

    @property
    @abstractmethod
    def category(self) -> PatternCategory: ...

    @abstractmethod
    def initialize(self, **kwargs) -> None: ...

    @abstractmethod
    def detect(
        self,
        prices: list[PriceBar],
        **params,
    ) -> list[PatternResult]: ...

    @abstractmethod
    def validate(
        self,
        prices: list[PriceBar],
        **params,
    ) -> list[str]: ...

    @abstractmethod
    def metadata(self) -> dict: ...

    @abstractmethod
    def parameters(self) -> dict: ...

    def shutdown(self) -> None:
        pass

    def get_default_params(self) -> dict:
        return {}

    def min_bars(self) -> int:
        return 30
