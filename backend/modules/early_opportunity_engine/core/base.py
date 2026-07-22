from __future__ import annotations

from abc import ABC, abstractmethod

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    StageResult,
)


class BaseAnalysisStage(ABC):

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def category(self) -> AnalysisCategory: ...

    @abstractmethod
    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult: ...

    @abstractmethod
    def validate(self, metrics: dict) -> list[str]: ...

    def min_data_points(self) -> int:
        return 1

    def default_weight(self) -> float:
        return 1.0
