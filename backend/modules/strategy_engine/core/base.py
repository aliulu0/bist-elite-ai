from __future__ import annotations

from abc import ABC, abstractmethod

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyResult,
    StrategyType,
)


class BaseStrategy(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def display_name(self) -> str: ...

    @property
    @abstractmethod
    def strategy_type(self) -> StrategyType: ...

    @abstractmethod
    def initialize(self, **kwargs) -> None: ...

    @abstractmethod
    def build_definition(self) -> StrategyDefinition: ...

    @abstractmethod
    def evaluate(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StrategyResult: ...

    @abstractmethod
    def metadata(self) -> dict: ...

    def shutdown(self) -> None:
        pass

    def get_default_params(self) -> dict:
        return {}

    def required_metrics(self) -> list[str]:
        return []
