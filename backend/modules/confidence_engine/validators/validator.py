from __future__ import annotations

from typing import Dict, List, Optional, Any

from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    ConfidenceWeightConfig,
    ConfidenceResult,
    ConfidenceLabel,
    LABEL_RANGES,
)


class ConfidenceValidator:
    def validate_input_data(self, data: Dict[str, Any]) -> List[str]:
        errors: List[str] = []
        if not data:
            errors.append("Input data dictionary is empty")
        return errors

    def validate_config(self, config: ConfidenceWeightConfig) -> List[str]:
        errors: List[str] = []
        if not config.dimensions:
            errors.append("No dimensions configured")
        total = sum(dw.weight for dw in config.dimensions.values())
        if total <= 0:
            errors.append("Total weight must be positive")
        for dim, dw in config.dimensions.items():
            if dw.weight < 0:
                errors.append(f"Weight for {dim.value} is negative")
        for br in config.bonus_rules:
            if br.points < 0:
                errors.append(f"Bonus rule {br.factor.value} has negative points")
        for pr in config.penalty_rules:
            if pr.points > 0:
                errors.append(f"Penalty rule {pr.factor.value} has positive points")
        return errors

    def validate_result(self, result: ConfidenceResult) -> List[str]:
        errors: List[str] = []
        if result.confidence_score < 0 or result.confidence_score > 100:
            errors.append(f"Confidence score {result.confidence_score} outside [0, 100]")
        if not isinstance(result.confidence_label, ConfidenceLabel):
            errors.append("Invalid confidence label")
        expected = self._classify(result.confidence_score)
        if result.confidence_label != expected:
            errors.append(
                f"Label mismatch: expected {expected.value}, "
                f"got {result.confidence_label.value}"
            )
        return errors

    def is_valid(self, result: ConfidenceResult) -> bool:
        return len(self.validate_result(result)) == 0

    def _classify(self, score: float) -> ConfidenceLabel:
        for label, (lo, hi) in LABEL_RANGES.items():
            if lo <= score <= hi:
                return label
        if score > 100:
            return ConfidenceLabel.EXCEPTIONAL
        return ConfidenceLabel.VERY_LOW
