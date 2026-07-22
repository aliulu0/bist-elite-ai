from __future__ import annotations

from abc import ABC, abstractmethod
from modules.scoring_engine.core.types import (
    ScoreType, ScoreBreakdown, ScoreDirection,
)


class BaseScoreCalculator(ABC):

    @property
    @abstractmethod
    def score_type(self) -> ScoreType: ...

    @property
    def direction(self) -> ScoreDirection:
        return ScoreDirection.HIGHER_IS_BETTER

    @abstractmethod
    def calculate(
        self,
        symbol: str,
        metrics: dict,
        evidence: list | None = None,
        **kwargs,
    ) -> ScoreBreakdown: ...

    def normalize(self, value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
        if max_val == min_val:
            return 50.0
        return max(0.0, min(100.0, ((value - min_val) / (max_val - min_val)) * 100.0))

    def normalize_01(self, value: float) -> float:
        return max(0.0, min(1.0, value))

    def _build_breakdown(
        self,
        raw: float,
        confidence: float = 1.0,
        evidence_count: int = 0,
        calc_time: float = 0.0,
    ) -> ScoreBreakdown:
        norm = max(0.0, min(100.0, raw))
        return ScoreBreakdown(
            score_type=self.score_type,
            raw_score=raw,
            normalized_score=norm,
            weight=0.0,
            contribution=0.0,
            penalty=0.0,
            bonus=0.0,
            final_contribution=norm,
            confidence=confidence,
            direction=self.direction,
            evidence_count=evidence_count,
            calculation_time_ms=calc_time,
        )
