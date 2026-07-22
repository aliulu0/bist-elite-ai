from __future__ import annotations

from typing import List

from modules.decision_engine.core.types import (
    DecisionResult,
    DecisionType,
    classify_decision,
)


class DecisionValidator:
    """Validates decision results for consistency and correctness."""

    def validate_result(self, result: DecisionResult) -> List[str]:
        errors: List[str] = []
        self._check_score_range(result, errors)
        self._check_label_consistency(result, errors)
        self._check_confidence_range(result, errors)
        self._check_risk_range(result, errors)
        self._check_recommendation_exists(result, errors)
        return errors

    def _check_score_range(self, result: DecisionResult, errors: List[str]) -> None:
        if result.decision_score < 0.0 or result.decision_score > 100.0:
            errors.append(f"Decision score {result.decision_score} outside range [0, 100]")

    def _check_label_consistency(self, result: DecisionResult, errors: List[str]) -> None:
        expected = classify_decision(result.decision_score)
        if result.decision_label != expected:
            errors.append(
                f"Label mismatch: got {result.decision_label.value}, expected {expected.value}"
            )

    def _check_confidence_range(self, result: DecisionResult, errors: List[str]) -> None:
        if result.decision_confidence < 0.0 or result.decision_confidence > 100.0:
            errors.append(f"Confidence {result.decision_confidence} outside range [0, 100]")

    def _check_risk_range(self, result: DecisionResult, errors: List[str]) -> None:
        if result.decision_risk < 0.0 or result.decision_risk > 100.0:
            errors.append(f"Risk {result.decision_risk} outside range [0, 100]")

    def _check_recommendation_exists(self, result: DecisionResult, errors: List[str]) -> None:
        if result.recommendation is None:
            errors.append("Recommendation package is missing")

    def is_valid(self, result: DecisionResult) -> bool:
        return len(self.validate_result(result)) == 0

    def validate_all(self, results: List[DecisionResult]) -> List[str]:
        all_errors: List[str] = []
        for i, r in enumerate(results):
            for err in self.validate_result(r):
                all_errors.append(f"[{i}] {r.symbol}: {err}")
        return all_errors
