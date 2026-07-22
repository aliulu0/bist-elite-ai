from __future__ import annotations

from abc import ABC, abstractmethod
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendResult,
)


class BaseTrendPlugin(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def display_name(self) -> str: ...

    @abstractmethod
    def initialize(self, **kwargs) -> None: ...

    @abstractmethod
    def calculate(
        self,
        prices: list[PriceBar],
        **params,
    ) -> IndicatorResult: ...

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

    @abstractmethod
    def signals(self, result: IndicatorResult) -> list[Signal]: ...

    def shutdown(self) -> None:
        pass

    def get_default_params(self) -> dict:
        return {}

    def min_bars(self) -> int:
        return 30
