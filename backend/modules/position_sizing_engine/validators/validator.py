from __future__ import annotations

from typing import List

from modules.position_sizing_engine.core.types import (
    PositionGrade,
    PositionSizing,
    PositionSizingRequest,
    PositionSizingResult,
    RiskProfile,
    _clamp,
    grade_to_value,
)


class RequestValidator:

    def validate(self, request: PositionSizingRequest) -> List[str]:
        errors: List[str] = []

        if not request.positions:
            errors.append("Positions list must not be empty")

        if not request.reference_date:
            errors.append("Reference date is required")

        try:
            _ = request.horizon.value
        except (ValueError, AttributeError):
            errors.append(f"Invalid investment horizon: {request.horizon}")

        try:
            _ = request.risk_profile.value
        except (ValueError, AttributeError):
            errors.append(f"Invalid risk profile: {request.risk_profile}")

        if request.total_capital <= 0:
            errors.append("Total capital must be greater than 0")

        if request.max_sector_exposure <= 0 or request.max_sector_exposure > 100:
            errors.append("Max sector exposure must be between 0 and 100")

        if request.max_correlation < 0 or request.max_correlation > 1:
            errors.append("Max correlation must be between 0 and 1")

        for pos in request.positions:
            if not pos.symbol:
                errors.append("All positions must have a symbol")
            if pos.elite_score < 0 or pos.elite_score > 100:
                errors.append(f"Elite score for {pos.symbol or '?'} must be between 0 and 100")
            if pos.confidence < 0 or pos.confidence > 100:
                errors.append(f"Confidence for {pos.symbol or '?'} must be between 0 and 100")
            if pos.risk < 0 or pos.risk > 100:
                errors.append(f"Risk for {pos.symbol or '?'} must be between 0 and 100")

        return errors

    def is_valid(self, request: PositionSizingRequest) -> bool:
        return len(self.validate(request)) == 0


class ResultValidator:

    def validate_result(self, result: PositionSizingResult) -> List[str]:
        errors: List[str] = []

        if not result.positions:
            errors.append("Result contains no positions")

        if result.execution_time_ms < 0:
            errors.append("Execution time must be non-negative")

        for pos in result.positions:
            pos_errors = self.validate_position(pos)
            errors.extend(pos_errors)

        return errors

    def validate_position(self, pos: PositionSizing) -> List[str]:
        errors: List[str] = []

        if not pos.symbol:
            errors.append("Position must have a symbol")

        if pos.recommended_pct < 0:
            errors.append(f"Recommended percentage must be non-negative for {pos.symbol}")

        if pos.min_pct < 0:
            errors.append(f"Min percentage must be non-negative for {pos.symbol}")

        if pos.max_pct <= 0:
            errors.append(f"Max percentage must be positive for {pos.symbol}")

        if pos.recommended_pct < pos.min_pct:
            errors.append(
                f"Recommended {pos.recommended_pct}% is below minimum {pos.min_pct}% for {pos.symbol}"
            )

        if pos.recommended_pct > pos.max_pct:
            errors.append(
                f"Recommended {pos.recommended_pct}% exceeds maximum {pos.max_pct}% for {pos.symbol}"
            )

        grade_val = grade_to_value(pos.position_grade)
        if grade_val < 1 or grade_val > 5:
            errors.append(f"Invalid position grade for {pos.symbol}")

        return errors
