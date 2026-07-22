from __future__ import annotations

from abc import ABC, abstractmethod
from modules.explainability_engine.core.types import (
    ExplanationLevel,
    ExplanationType,
    Language,
    ExplanationResult,
    EvidenceObject,
)


class BaseExplanationBuilder(ABC):

    @property
    @abstractmethod
    def explanation_type(self) -> ExplanationType:
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def build(
        self,
        symbol: str,
        metrics: dict,
        evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH,
        **kwargs,
    ) -> ExplanationResult:
        ...

    def supported_level(self, level: ExplanationLevel) -> bool:
        return True

    def min_evidence_count(self) -> int:
        return 0

    def validate_input(
        self,
        symbol: str,
        metrics: dict,
        evidence: list[EvidenceObject],
    ) -> list[str]:
        errors = []
        if not symbol:
            errors.append("Symbol is required")
        if not isinstance(metrics, dict):
            errors.append("Metrics must be a dictionary")
        return errors
