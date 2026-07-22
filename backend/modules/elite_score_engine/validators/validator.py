from __future__ import annotations

from typing import Dict, List, Optional

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    EliteWeightConfig,
    EliteScoreResult,
    DimensionContribution,
    BonusApplied,
    PenaltyApplied,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    EliteCategory,
    EliteLabel,
    CATEGORY_RANGES,
)


class EliteValidator:
    def validate_input_scores(self, scores: Dict[str, float]) -> List[str]:
        errors: List[str] = []
        if not scores:
            errors.append("Scores dictionary is empty")
        for key, value in scores.items():
            if not isinstance(value, (int, float)):
                errors.append(f"Score '{key}' is not numeric")
            elif value < -100 or value > 200:
                errors.append(f"Score '{key}' value {value} is outside valid range [-100, 200]")
        return errors

    def validate_dimension_scores(
        self, dimension_scores: Dict[ScoringDimension, float]
    ) -> List[str]:
        errors: List[str] = []
        if not dimension_scores:
            errors.append("Dimension scores dictionary is empty")
        for dim, value in dimension_scores.items():
            if not isinstance(value, (int, float)):
                errors.append(f"Dimension '{dim.value}' is not numeric")
            elif value < -100 or value > 200:
                errors.append(f"Dimension '{dim.value}' value {value} outside valid range")
        return errors

    def validate_config(self, config: EliteWeightConfig) -> List[str]:
        errors: List[str] = []
        if not config.dimensions:
            errors.append("No dimensions configured")
        total = sum(dw.weight for dw in config.dimensions.values())
        if total <= 0:
            errors.append("Total weight must be positive")
        for dim, dw in config.dimensions.items():
            if dw.weight < 0:
                errors.append(f"Weight for {dim.value} is negative")
            if dw.min_value >= dw.max_value:
                errors.append(f"Invalid range for {dim.value}")
        for br in config.bonus_rules:
            if br.points < 0:
                errors.append(f"Bonus rule {br.factor.value} has negative points")
        for pr in config.penalty_rules:
            if pr.points > 0:
                errors.append(f"Penalty rule {pr.factor.value} has positive points")
        return errors

    def validate_result(self, result: EliteScoreResult) -> List[str]:
        errors: List[str] = []
        if result.elite_score < 0 or result.elite_score > 100:
            errors.append(f"Elite score {result.elite_score} outside [0, 100]")
        if not isinstance(result.elite_category, EliteCategory):
            errors.append("Invalid elite category")
        if not isinstance(result.label, EliteLabel):
            errors.append("Invalid elite label")
        expected_category = self._classify(result.elite_score)
        if result.elite_category != expected_category:
            errors.append(
                f"Category mismatch: expected {expected_category.value}, "
                f"got {result.elite_category.value}"
            )
        if result.confidence < 0 or result.confidence > 1.0:
            errors.append(f"Confidence {result.confidence} outside [0, 1]")
        return errors

    def is_valid(self, result: EliteScoreResult) -> bool:
        return len(self.validate_result(result)) == 0

    def _classify(self, score: float) -> EliteCategory:
        for cat, (lo, hi) in CATEGORY_RANGES.items():
            if lo <= score <= hi:
                return cat
        if score > 100:
            return EliteCategory.EXCEPTIONAL
        return EliteCategory.AVOID
