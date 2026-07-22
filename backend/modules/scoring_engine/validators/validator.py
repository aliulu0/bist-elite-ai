from __future__ import annotations

from modules.scoring_engine.core.types import (
    ScoreType, ScoreResult, WeightConfig, ScoreBreakdown,
)


class ScoringValidator:

    def validate_metrics(self, metrics: dict) -> list[str]:
        errors = []
        if not metrics:
            errors.append("Metrics dictionary is empty")
        return errors

    def validate_weights(self, weights: dict[ScoreType, float]) -> list[str]:
        errors = []
        if not weights:
            errors.append("Weights dictionary is empty")
            return errors
        total = sum(weights.values())
        if abs(total - 1.0) > 0.05:
            errors.append(f"Weights sum to {total:.4f}, expected ~1.0")
        for st, w in weights.items():
            if w < 0:
                errors.append(f"Negative weight for {st.value}")
            if w > 1.0:
                errors.append(f"Weight > 1.0 for {st.value}")
        return errors

    def validate_result(self, result: ScoreResult) -> list[str]:
        errors = []
        if not result.symbol:
            errors.append("Symbol is required")
        if not result.scores:
            errors.append("No scores calculated")
        for st_str, score in result.scores.items():
            if not isinstance(score, (int, float)):
                errors.append(f"Invalid score type for {st_str}: {type(score)}")
            elif score < 0 or score > 100:
                errors.append(f"Score out of range for {st_str}: {score}")
        return errors

    def validate_breakdown(self, breakdown: ScoreBreakdown) -> list[str]:
        errors = []
        if breakdown.normalized_score < 0 or breakdown.normalized_score > 100:
            errors.append(f"Normalized score out of range: {breakdown.normalized_score}")
        if breakdown.confidence < 0 or breakdown.confidence > 1:
            errors.append(f"Confidence out of range: {breakdown.confidence}")
        return errors

    def validate_config(self, config: WeightConfig) -> list[str]:
        errors = []
        if not config.weights:
            errors.append("No weights in config")
        total = sum(sw.weight for sw in config.weights.values())
        if total > 0 and abs(total - 1.0) > 0.1:
            errors.append(f"Config weights sum to {total:.4f}")
        return errors

    def is_valid(self, result: ScoreResult) -> bool:
        return len(self.validate_result(result)) == 0
