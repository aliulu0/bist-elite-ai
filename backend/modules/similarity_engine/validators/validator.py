from __future__ import annotations

from typing import Any, Dict, List

from modules.similarity_engine.core.types import (
    SimilarityRequest,
    SimilarityResult,
)


class RequestValidator:
    """Validates similarity analysis requests."""

    def validate(self, request: SimilarityRequest) -> List[str]:
        errors: List[str] = []
        if not request.symbol:
            errors.append("symbol is required")
        if not request.reference_date:
            errors.append("reference_date is required")
        if request.top_n < 1:
            errors.append("top_n must be >= 1")
        if request.top_n > 100:
            errors.append("top_n cannot exceed 100")
        if not request.methods:
            errors.append("at least one similarity method is required")
        if request.lookback_days < 1:
            errors.append("lookback_days must be >= 1")
        if request.lookback_days > 7560:
            errors.append("lookback_days cannot exceed 7560 (30 years)")
        if request.min_similarity < 0.0 or request.min_similarity > 1.0:
            errors.append("min_similarity must be between 0.0 and 1.0")
        return errors

    def validate_request_params(
        self,
        symbol: str,
        date: str,
    ) -> List[str]:
        errors: List[str] = []
        if not symbol or not symbol.strip():
            errors.append("symbol cannot be empty")
        if not date or not date.strip():
            errors.append("date cannot be empty")
        return errors


class ResultValidator:
    """Validates similarity results."""

    def validate_results(
        self,
        results: List[SimilarityResult],
        max_results: int = 100,
    ) -> List[str]:
        errors: List[str] = []
        if len(results) > max_results:
            errors.append(f"too many results: {len(results)} > {max_results}")
        for i, r in enumerate(results):
            if r.similarity_score < 0 or r.similarity_score > 1.0:
                errors.append(f"result {i}: similarity_score out of range")
            if not r.target_symbol:
                errors.append(f"result {i}: target_symbol is empty")
        return errors

    def validate_result_completeness(
        self,
        result: SimilarityResult,
    ) -> bool:
        required_fields = ["source_symbol", "target_symbol", "similarity_score"]
        for f in required_fields:
            if not getattr(result, f, None):
                return False
        return True

    def validate_score_range(
        self,
        score: float,
        min_score: float = 0.0,
        max_score: float = 1.0,
    ) -> bool:
        return min_score <= score <= max_score
