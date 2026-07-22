from __future__ import annotations

from typing import List

from modules.walk_forward_engine.core.types import (
    WalkForwardRequest,
    WalkForwardResult,
    WindowMode,
    TrainTestSplit,
    WindowPeriod,
)


class WalkForwardValidator:
    """Validates walk-forward requests and results."""

    def validate_request(self, request: WalkForwardRequest) -> List[str]:
        errors: List[str] = []
        self._check_symbol(request, errors)
        self._check_dates(request, errors)
        self._check_capital(request, errors)
        self._check_window_config(request, errors)
        self._check_optimization(request, errors)
        return errors

    def validate_result(self, result: WalkForwardResult) -> List[str]:
        errors: List[str] = []
        self._check_windows(result, errors)
        self._check_generalization(result, errors)
        self._check_consistency(result, errors)
        return errors

    def is_valid_request(self, request: WalkForwardRequest) -> bool:
        return len(self.validate_request(request)) == 0

    def is_valid_result(self, result: WalkForwardResult) -> bool:
        return len(self.validate_result(result)) == 0

    def _check_symbol(self, request: WalkForwardRequest, errors: List[str]) -> None:
        if not request.symbol or len(request.symbol) < 1:
            errors.append("Symbol is required")
        if request.symbol and len(request.symbol) > 20:
            errors.append("Symbol must be at most 20 characters")

    def _check_dates(self, request: WalkForwardRequest, errors: List[str]) -> None:
        if not request.start_date:
            errors.append("Start date is required")
        if not request.end_date:
            errors.append("End date is required")
        if request.start_date and request.end_date and request.start_date >= request.end_date:
            errors.append("Start date must be before end date")

    def _check_capital(self, request: WalkForwardRequest, errors: List[str]) -> None:
        if request.initial_capital <= 0:
            errors.append("Initial capital must be positive")
        if request.commission_pct < 0 or request.commission_pct > 0.1:
            errors.append("Commission must be between 0 and 0.1")

    def _check_window_config(self, request: WalkForwardRequest, errors: List[str]) -> None:
        if request.min_train_rows < 10:
            errors.append("Minimum train rows must be at least 10")
        if request.min_test_rows < 5:
            errors.append("Minimum test rows must be at least 5")
        if request.custom_train_pct < 0.1 or request.custom_train_pct > 0.95:
            if request.train_test_split == TrainTestSplit.CUSTOM:
                errors.append("Custom train percentage must be between 0.1 and 0.95")

    def _check_optimization(self, request: WalkForwardRequest, errors: List[str]) -> None:
        valid_metrics = {"sharpe", "return", "sortino", "calmar"}
        if request.optimization_metric not in valid_metrics:
            errors.append(f"Optimization metric must be one of {valid_metrics}")
        if request.max_combinations < 1:
            errors.append("Max combinations must be at least 1")
        if request.max_combinations > 10000:
            errors.append("Max combinations cannot exceed 10000")

    def _check_windows(self, result: WalkForwardResult, errors: List[str]) -> None:
        if result.total_windows < 1:
            errors.append("No walk-forward windows generated")
        if result.total_windows > 0 and result.successful_windows == 0:
            errors.append("All walk-forward windows failed")

    def _check_generalization(self, result: WalkForwardResult, errors: List[str]) -> None:
        g = result.generalization
        if g.generalization_score < 0:
            errors.append("Generalization score cannot be negative")
        if g.overfitting_score < 0 or g.overfitting_score > 1:
            errors.append("Overfitting score must be between 0 and 1")

    def _check_consistency(self, result: WalkForwardResult, errors: List[str]) -> None:
        if result.window_results:
            sharpes = []
            for wr in result.window_results:
                if wr.validation:
                    sharpes.append(wr.validation.out_of_sample_sharpe)
            if sharpes:
                avg = sum(sharpes) / len(sharpes)
                if avg < -5:
                    errors.append("Average out-of-sample Sharpe is critically low")
