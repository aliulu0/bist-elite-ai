from __future__ import annotations

from typing import Any, Dict, List

from modules.market_regime_engine.core.types import (
    RegimeAnalysisRequest,
    RegimeClassification,
)


class RequestValidator:
    """Validates regime analysis requests."""

    def validate(self, request: RegimeAnalysisRequest) -> List[str]:
        errors: List[str] = []
        if not request.reference_date:
            errors.append("reference_date is required")
        if request.lookback_days < 1:
            errors.append("lookback_days must be >= 1")
        if request.lookback_days > 7560:
            errors.append("lookback_days cannot exceed 7560")
        if request.min_confidence < 0.0 or request.min_confidence > 1.0:
            errors.append("min_confidence must be between 0.0 and 1.0")
        if not request.market_data:
            errors.append("market_data is required")
        return errors


class ResultValidator:
    """Validates regime analysis results."""

    def validate_classification(
        self,
        classification: RegimeClassification,
    ) -> List[str]:
        errors: List[str] = []
        if classification.confidence < 0.0 or classification.confidence > 1.0:
            errors.append("confidence out of range")
        if classification.score < 0.0 or classification.score > 1.0:
            errors.append("score out of range")
        if not classification.regime:
            errors.append("regime not set")
        return errors

    def validate_confidence(
        self,
        classification: RegimeClassification,
        min_confidence: float = 0.3,
    ) -> bool:
        return classification.confidence >= min_confidence

    def validate_score_range(self, score: float) -> bool:
        return 0.0 <= score <= 1.0
