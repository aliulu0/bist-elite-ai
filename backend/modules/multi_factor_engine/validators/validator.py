from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.multi_factor_engine.core.types import (
    FactorAnalysisRequest,
    FactorGroup,
    FactorName,
    GroupScore,
    MarketRegime,
)


class RequestValidator:
    def validate(self, request: FactorAnalysisRequest) -> List[str]:
        errors: List[str] = []
        if not request.symbol:
            errors.append("Symbol is required")
        if not request.reference_date:
            errors.append("Reference date is required")
        if not request.market_data and not request.financial_data and not request.indicator_data:
            errors.append("At least one data source is required")
        return errors

    def is_valid(self, request: FactorAnalysisRequest) -> bool:
        return len(self.validate(request)) == 0


class ResultValidator:
    def validate_score(self, score: float) -> bool:
        return 0.0 <= score <= 100.0

    def validate_group_score(self, group_score: GroupScore) -> List[str]:
        errors: List[str] = []
        if not self.validate_score(group_score.score):
            errors.append(f"Group score out of range: {group_score.score}")
        if not group_score.factors:
            errors.append("Group has no factor scores")
        return errors

    def validate_profile_scores(self, scores: Dict[FactorName, float]) -> List[str]:
        errors: List[str] = []
        for name, score in scores.items():
            if not self.validate_score(score):
                errors.append(f"Factor {name.value} score out of range: {score}")
        return errors
