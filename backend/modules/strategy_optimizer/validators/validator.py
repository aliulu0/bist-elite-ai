from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import (
    OptimizationRequest,
    ParameterCandidate,
    ParameterRange,
    RejectionReason,
    ValidationStage,
)


class RequestValidator:
    """Validates optimization requests before execution."""

    def validate(self, request: OptimizationRequest) -> List[str]:
        errors: List[str] = []
        if not request.symbol:
            errors.append("symbol is required")
        if request.max_iterations < 1:
            errors.append("max_iterations must be >= 1")
        if request.max_candidates < 1:
            errors.append("max_candidates must be >= 1")
        if request.initial_capital <= 0:
            errors.append("initial_capital must be > 0")
        if request.commission_pct < 0:
            errors.append("commission_pct must be >= 0")
        if not request.start_date:
            errors.append("start_date is required")
        if not request.end_date:
            errors.append("end_date is required")
        if request.start_date and request.end_date:
            if request.start_date >= request.end_date:
                errors.append("start_date must be before end_date")
        if request.max_iterations > 10000:
            errors.append("max_iterations cannot exceed 10000")
        if request.max_candidates > 1000:
            errors.append("max_candidates cannot exceed 1000")
        return errors

    def validate_parameter_space(
        self, space: Dict[str, ParameterRange]
    ) -> List[str]:
        errors: List[str] = []
        for name, pr in space.items():
            if not name:
                errors.append("parameter name cannot be empty")
            if pr.min_value > pr.max_value:
                errors.append(
                    f"{name}: min_value ({pr.min_value}) > max_value ({pr.max_value})"
                )
            if pr.step <= 0 and not pr.is_discrete:
                errors.append(f"{name}: step must be > 0 for continuous params")
            if pr.is_discrete and not pr.values:
                errors.append(f"{name}: discrete parameter requires values list")
        return errors


class ResultValidator:
    """Validates optimization results after execution."""

    def validate_result(
        self,
        result: Dict[str, Any],
        thresholds: Optional[Dict[str, float]] = None,
    ) -> List[str]:
        errors: List[str] = []
        if not result.get("optimized_parameters"):
            errors.append("optimized_parameters is empty")
        if result.get("execution_time_ms", 0) < 0:
            errors.append("execution_time_ms cannot be negative")
        return errors

    def validate_candidate_score(
        self,
        candidate: ParameterCandidate,
        min_fitness: float = 0.0,
    ) -> bool:
        return candidate.fitness_score >= min_fitness

    def validate_acceptance(
        self,
        candidate: ParameterCandidate,
        baseline_fitness: float,
    ) -> bool:
        if candidate.rejection_reasons:
            return False
        return candidate.overall_score >= baseline_fitness * 0.8

    def check_rejection_rules(
        self,
        candidate: ParameterCandidate,
        thresholds: Dict[str, float],
    ) -> List[RejectionReason]:
        reasons: List[RejectionReason] = []
        max_dd = thresholds.get("max_drawdown", 30.0)
        min_sharpe = thresholds.get("min_sharpe", 0.5)
        min_generalization = thresholds.get("min_generalization", 0.5)
        min_win_rate = thresholds.get("min_win_rate", 30.0)
        min_robustness = thresholds.get("min_robustness", 0.3)

        obj = candidate.objective_scores
        if obj.get("minimize_drawdown", 1.0) < 0.3:
            reasons.append(RejectionReason.EXCESSIVE_DRAWDOWN)
        if obj.get("maximize_sharpe", 0.0) < 0.2:
            reasons.append(RejectionReason.DEGRADED_PERFORMANCE)
        if candidate.walk_forward_score < min_generalization:
            reasons.append(RejectionReason.LOW_GENERALIZATION)
        if candidate.monte_carlo_score < 0.3:
            reasons.append(RejectionReason.OVERFITTING)
        if obj.get("maximize_win_rate", 0.5) < min_win_rate / 100.0:
            reasons.append(RejectionReason.DEGRADED_PERFORMANCE)
        if obj.get("improve_robustness", 0.5) < min_robustness:
            reasons.append(RejectionReason.REDUCED_ROBUSTNESS)
        return reasons
