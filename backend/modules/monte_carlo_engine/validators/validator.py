from __future__ import annotations

from typing import List

from modules.monte_carlo_engine.core.types import (
    MonteCarloRequest,
    MonteCarloResult,
    SimulationMethod,
)


class MonteCarloValidator:
    """Validates Monte Carlo requests and results."""

    def validate_request(self, request: MonteCarloRequest) -> List[str]:
        errors: List[str] = []
        self._check_symbol(request, errors)
        self._check_dates(request, errors)
        self._check_capital(request, errors)
        self._check_simulation_config(request, errors)
        return errors

    def validate_result(self, result: MonteCarloResult) -> List[str]:
        errors: List[str] = []
        self._check_simulations(result, errors)
        self._check_risk_metrics(result, errors)
        self._check_execution_time(result, errors)
        return errors

    def is_valid_request(self, request: MonteCarloRequest) -> bool:
        return len(self.validate_request(request)) == 0

    def is_valid_result(self, result: MonteCarloResult) -> bool:
        return len(self.validate_result(result)) == 0

    def _check_symbol(self, request: MonteCarloRequest, errors: List[str]) -> None:
        if not request.symbol or len(request.symbol) < 1:
            errors.append("Symbol is required")
        if request.symbol and len(request.symbol) > 20:
            errors.append("Symbol must be at most 20 characters")

    def _check_dates(self, request: MonteCarloRequest, errors: List[str]) -> None:
        if not request.start_date:
            errors.append("Start date is required")
        if not request.end_date:
            errors.append("End date is required")
        if request.start_date and request.end_date and request.start_date >= request.end_date:
            errors.append("Start date must be before end date")

    def _check_capital(self, request: MonteCarloRequest, errors: List[str]) -> None:
        if request.initial_capital <= 0:
            errors.append("Initial capital must be positive")

    def _check_simulation_config(self, request: MonteCarloRequest, errors: List[str]) -> None:
        if request.num_simulations < 100:
            errors.append("Minimum simulations is 100")
        if request.num_simulations > 1000000:
            errors.append("Maximum simulations is 1,000,000")
        if request.num_days < 1:
            errors.append("Number of days must be at least 1")
        if request.num_days > 2520:
            errors.append("Number of days cannot exceed 2520 (10 years)")
        if request.annual_volatility < 0 or request.annual_volatility > 5.0:
            errors.append("Annual volatility must be between 0 and 5.0")

    def _check_simulations(self, result: MonteCarloResult, errors: List[str]) -> None:
        if not result.simulations:
            errors.append("No simulations were generated")

    def _check_risk_metrics(self, result: MonteCarloResult, errors: List[str]) -> None:
        rm = result.risk_metrics
        if rm.max_drawdown < 0:
            errors.append("Max drawdown cannot be negative")
        if rm.probability_of_loss < 0 or rm.probability_of_loss > 100:
            errors.append("Probability of loss must be between 0 and 100")

    def _check_execution_time(self, result: MonteCarloResult, errors: List[str]) -> None:
        if result.execution_time_ms < 0:
            errors.append("Execution time cannot be negative")
