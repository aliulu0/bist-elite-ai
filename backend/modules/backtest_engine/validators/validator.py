from __future__ import annotations

from typing import List

from modules.backtest_engine.core.types import (
    BacktestRequest,
    BacktestResult,
    PerformanceMetrics,
)


class BacktestValidator:
    """Validates backtest requests and results."""

    def validate_request(self, request: BacktestRequest) -> List[str]:
        errors: List[str] = []
        self._check_symbol(request, errors)
        self._check_dates(request, errors)
        self._check_capital(request, errors)
        self._check_position_size(request, errors)
        self._check_stop_loss(request, errors)
        self._check_commission(request, errors)
        return errors

    def validate_result(self, result: BacktestResult) -> List[str]:
        errors: List[str] = []
        self._check_metrics(result.metrics, errors)
        self._check_equity_curve(result.equity_curve, errors)
        self._check_execution_time(result.execution_time_ms, errors)
        return errors

    def is_valid_request(self, request: BacktestRequest) -> bool:
        return len(self.validate_request(request)) == 0

    def is_valid_result(self, result: BacktestResult) -> bool:
        return len(self.validate_result(result)) == 0

    def _check_symbol(self, request: BacktestRequest, errors: List[str]) -> None:
        if not request.symbol or len(request.symbol) < 1:
            errors.append("Symbol is required")

    def _check_dates(self, request: BacktestRequest, errors: List[str]) -> None:
        if not request.start_date:
            errors.append("Start date is required")
        if not request.end_date:
            errors.append("End date is required")
        if request.start_date and request.end_date and request.start_date >= request.end_date:
            errors.append("Start date must be before end date")

    def _check_capital(self, request: BacktestRequest, errors: List[str]) -> None:
        if request.initial_capital <= 0:
            errors.append("Initial capital must be positive")

    def _check_position_size(self, request: BacktestRequest, errors: List[str]) -> None:
        if request.position_size_pct <= 0 or request.position_size_pct > 100:
            errors.append("Position size must be between 0 and 100")

    def _check_stop_loss(self, request: BacktestRequest, errors: List[str]) -> None:
        if request.stop_loss_pct < 0 or request.stop_loss_pct > 50:
            errors.append("Stop loss must be between 0 and 50")

    def _check_commission(self, request: BacktestRequest, errors: List[str]) -> None:
        if request.commission_pct < 0 or request.commission_pct > 0.1:
            errors.append("Commission must be between 0 and 0.1 (10%)")

    def _check_metrics(self, metrics: PerformanceMetrics, errors: List[str]) -> None:
        if metrics.total_trades < 0:
            errors.append("Total trades cannot be negative")
        if metrics.win_rate < 0 or metrics.win_rate > 100:
            errors.append("Win rate must be between 0 and 100")
        if metrics.max_drawdown < 0:
            errors.append("Max drawdown cannot be negative")

    def _check_equity_curve(self, curve: list, errors: List[str]) -> None:
        if not curve:
            errors.append("Equity curve is empty")

    def _check_execution_time(self, ms: float, errors: List[str]) -> None:
        if ms < 0:
            errors.append("Execution time cannot be negative")
