from __future__ import annotations

from typing import Dict, List

from modules.decision_engine.core.types import (
    Conflict,
    DecisionDimension,
    DimensionScore,
    classify_confidence_score,
)


class DecisionConfidenceCalculator:
    """Calculates overall decision confidence from dimension scores and conflicts."""

    WEIGHT_COHERENCY = 0.30
    WEIGHT_AVG_CONFIDENCE = 0.35
    WEIGHT_COVERAGE = 0.20
    WEIGHT_CONFLICT_PENALTY = 0.15

    def calculate(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        conflicts: List[Conflict],
    ) -> float:
        if not dimension_scores:
            return 0.0

        coherency = self._compute_coherency(dimension_scores)
        avg_conf = self._compute_average_confidence(dimension_scores)
        coverage = self._compute_coverage(dimension_scores)
        conflict_penalty = self._compute_conflict_penalty(conflicts)

        raw = (
            self.WEIGHT_COHERENCY * coherency
            + self.WEIGHT_AVG_CONFIDENCE * avg_conf
            + self.WEIGHT_COVERAGE * coverage
            - self.WEIGHT_CONFLICT_PENALTY * conflict_penalty
        )
        return max(0.0, min(100.0, raw))

    def _compute_coherency(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        scores = [ds.normalized_score for ds in dimension_scores.values()]
        if len(scores) < 2:
            return 100.0
        mean = sum(scores) / len(scores)
        variance = sum((s - mean) ** 2 for s in scores) / len(scores)
        std_dev = variance ** 0.5
        return max(0.0, 100.0 - std_dev * 2)

    def _compute_average_confidence(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        confs = [ds.confidence for ds in dimension_scores.values()]
        return sum(confs) / len(confs) if confs else 0.0

    def _compute_coverage(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        total_dims = len(DecisionDimension)
        covered = len(dimension_scores)
        return min(100.0, (covered / total_dims) * 100.0)

    def _compute_conflict_penalty(self, conflicts: List[Conflict]) -> float:
        if not conflicts:
            return 0.0
        severity_map = {
            "low": 5.0,
            "medium": 15.0,
            "high": 30.0,
            "critical": 50.0,
        }
        total = sum(severity_map.get(c.severity.value, 10.0) for c in conflicts)
        return min(100.0, total)

    def label(self, confidence: float) -> str:
        return classify_confidence_score(confidence)
