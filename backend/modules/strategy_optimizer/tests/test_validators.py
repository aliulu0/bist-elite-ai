from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    OptimizationRequest,
    ParameterCandidate,
    ParameterRange,
    RejectionReason,
)
from modules.strategy_optimizer.validators.validator import RequestValidator, ResultValidator


class TestRequestValidator:
    def test_valid_request(self):
        v = RequestValidator()
        req = OptimizationRequest(
            symbol="THYAO",
            start_date="2020-01-01",
            end_date="2025-12-31",
        )
        errors = v.validate(req)
        assert errors == []

    def test_empty_symbol(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="")
        errors = v.validate(req)
        assert any("symbol" in e for e in errors)

    def test_negative_iterations(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", max_iterations=-1)
        errors = v.validate(req)
        assert any("max_iterations" in e for e in errors)

    def test_zero_candidates(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", max_candidates=0)
        errors = v.validate(req)
        assert any("max_candidates" in e for e in errors)

    def test_negative_capital(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", initial_capital=-100)
        errors = v.validate(req)
        assert any("initial_capital" in e for e in errors)

    def test_negative_commission(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", commission_pct=-0.01)
        errors = v.validate(req)
        assert any("commission_pct" in e for e in errors)

    def test_missing_dates(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", start_date="", end_date="")
        errors = v.validate(req)
        assert any("start_date" in e for e in errors)

    def test_start_after_end(self):
        v = RequestValidator()
        req = OptimizationRequest(
            symbol="THYAO",
            start_date="2025-12-31",
            end_date="2020-01-01",
        )
        errors = v.validate(req)
        assert any("start_date" in e for e in errors)

    def test_too_many_iterations(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", max_iterations=20000)
        errors = v.validate(req)
        assert any("max_iterations" in e for e in errors)

    def test_too_many_candidates(self):
        v = RequestValidator()
        req = OptimizationRequest(symbol="THYAO", max_candidates=2000)
        errors = v.validate(req)
        assert any("max_candidates" in e for e in errors)


class TestParameterSpaceValidation:
    def test_valid_space(self):
        v = RequestValidator()
        space = {
            "p1": ParameterRange(name="p1", min_value=0.0, max_value=1.0, step=0.1),
        }
        errors = v.validate_parameter_space(space)
        assert errors == []

    def test_min_greater_than_max(self):
        v = RequestValidator()
        space = {
            "p1": ParameterRange(name="p1", min_value=1.0, max_value=0.0, step=0.1),
        }
        errors = v.validate_parameter_space(space)
        assert any("min_value" in e for e in errors)

    def test_empty_name(self):
        v = RequestValidator()
        space = {
            "": ParameterRange(name="", min_value=0.0, max_value=1.0, step=0.1),
        }
        errors = v.validate_parameter_space(space)
        assert any("name" in e for e in errors)

    def test_discrete_no_values(self):
        v = RequestValidator()
        space = {
            "p1": ParameterRange(
                name="p1", is_discrete=True, values=[],
            ),
        }
        errors = v.validate_parameter_space(space)
        assert any("discrete" in e for e in errors)


class TestResultValidator:
    def test_valid_result(self):
        v = ResultValidator()
        result = {"optimized_parameters": {"a": 1}, "execution_time_ms": 100}
        errors = v.validate_result(result)
        assert errors == []

    def test_empty_parameters(self):
        v = ResultValidator()
        result = {"optimized_parameters": {}, "execution_time_ms": 100}
        errors = v.validate_result(result)
        assert any("optimized_parameters" in e for e in errors)

    def test_negative_time(self):
        v = ResultValidator()
        result = {"optimized_parameters": {"a": 1}, "execution_time_ms": -1}
        errors = v.validate_result(result)
        assert any("execution_time_ms" in e for e in errors)


class TestCandidateScoreValidation:
    def test_valid_score(self):
        v = ResultValidator()
        c = ParameterCandidate(fitness_score=0.7)
        assert v.validate_candidate_score(c, min_fitness=0.5) is True

    def test_below_minimum(self):
        v = ResultValidator()
        c = ParameterCandidate(fitness_score=0.3)
        assert v.validate_candidate_score(c, min_fitness=0.5) is False


class TestAcceptanceValidation:
    def test_accepted(self):
        v = ResultValidator()
        c = ParameterCandidate(overall_score=0.8, rejection_reasons=[])
        assert v.validate_acceptance(c, baseline_fitness=0.5) is True

    def test_rejected_due_to_reasons(self):
        v = ResultValidator()
        c = ParameterCandidate(
            overall_score=0.8,
            rejection_reasons=[RejectionReason.OVERFITTING],
        )
        assert v.validate_acceptance(c, baseline_fitness=0.5) is False

    def test_rejected_due_to_low_score(self):
        v = ResultValidator()
        c = ParameterCandidate(overall_score=0.3, rejection_reasons=[])
        assert v.validate_acceptance(c, baseline_fitness=0.5) is False


class TestCheckRejectionRules:
    def test_no_rejection(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={
                "minimize_drawdown": 0.8,
                "maximize_sharpe": 0.7,
                "maximize_win_rate": 0.6,
                "improve_robustness": 0.6,
            },
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = v.check_rejection_rules(c, {})
        assert reasons == []

    def test_excessive_drawdown(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={"minimize_drawdown": 0.1, "maximize_sharpe": 0.7, "maximize_win_rate": 0.6, "improve_robustness": 0.6},
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = v.check_rejection_rules(c, {})
        assert RejectionReason.EXCESSIVE_DRAWDOWN in reasons

    def test_low_sharpe(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={"minimize_drawdown": 0.8, "maximize_sharpe": 0.1, "maximize_win_rate": 0.6, "improve_robustness": 0.6},
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = v.check_rejection_rules(c, {})
        assert RejectionReason.DEGRADED_PERFORMANCE in reasons

    def test_overfitting(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={"minimize_drawdown": 0.8, "maximize_sharpe": 0.7, "maximize_win_rate": 0.6, "improve_robustness": 0.6},
            walk_forward_score=0.7,
            monte_carlo_score=0.1,
        )
        reasons = v.check_rejection_rules(c, {})
        assert RejectionReason.OVERFITTING in reasons

    def test_low_generalization(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={"minimize_drawdown": 0.8, "maximize_sharpe": 0.7, "maximize_win_rate": 0.6, "improve_robustness": 0.6},
            walk_forward_score=0.2,
            monte_carlo_score=0.6,
        )
        reasons = v.check_rejection_rules(c, {})
        assert RejectionReason.LOW_GENERALIZATION in reasons

    def test_custom_thresholds(self):
        v = ResultValidator()
        c = ParameterCandidate(
            objective_scores={"minimize_drawdown": 0.5, "maximize_sharpe": 0.6, "maximize_win_rate": 0.5, "improve_robustness": 0.5},
            walk_forward_score=0.6,
            monte_carlo_score=0.7,
        )
        reasons = v.check_rejection_rules(c, {"min_sharpe": 0.3, "min_win_rate": 40.0})
        assert reasons == []
