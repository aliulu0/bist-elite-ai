from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    BenchmarkResult,
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationRequest,
    OptimizationResult,
    OptimizationRun,
    OptimizationType,
    ParameterCandidate,
    ParameterCategory,
    ParameterRange,
    RejectionReason,
    ReportType,
    ValidationStage,
    _mean,
    _median,
    _stdev,
    check_rejection_rules,
    classify_horizon_days,
    compute_fitness_score,
    compute_improvement,
)


class TestParameterRange:
    def test_default_construction(self):
        pr = ParameterRange()
        assert pr.name == ""
        assert pr.min_value == 0.0
        assert pr.max_value == 1.0
        assert pr.step == 0.01
        assert pr.is_discrete is False

    def test_named_construction(self):
        pr = ParameterRange(
            name="rsi_oversold",
            category=ParameterCategory.RSI,
            min_value=20.0,
            max_value=40.0,
            step=1.0,
            current_value=30.0,
        )
        assert pr.name == "rsi_oversold"
        assert pr.category == ParameterCategory.RSI
        assert pr.min_value == 20.0
        assert pr.max_value == 40.0

    def test_discrete_values(self):
        pr = ParameterRange(
            name="ma_short",
            is_discrete=True,
            values=[5, 10, 15, 20],
        )
        assert pr.is_discrete is True
        assert len(pr.values) == 4


class TestParameterCandidate:
    def test_default_construction(self):
        pc = ParameterCandidate()
        assert pc.parameters == {}
        assert pc.fitness_score == 0.0
        assert pc.is_accepted is False
        assert pc.rejection_reasons == []

    def test_with_parameters(self):
        pc = ParameterCandidate(
            parameters={"rsi_oversold": 25, "confidence": 0.6},
            fitness_score=0.75,
            is_accepted=True,
        )
        assert pc.parameters["rsi_oversold"] == 25
        assert pc.fitness_score == 0.75
        assert pc.is_accepted is True


class TestOptimizationRun:
    def test_default_construction(self):
        run = OptimizationRun()
        assert run.run_id == ""
        assert run.candidates_evaluated == 0
        assert run.best_candidate is None

    def test_full_run(self):
        run = OptimizationRun(
            run_id="run_1",
            symbol="THYAO",
            optimization_type=OptimizationType.WEIGHT,
            horizon=InvestmentHorizon.MONTH_3,
            candidates_evaluated=10,
            candidates_accepted=3,
            candidates_rejected=7,
            baseline_fitness=0.5,
            best_fitness=0.75,
            improvement_pct=50.0,
        )
        assert run.run_id == "run_1"
        assert run.candidates_evaluated == 10
        assert run.improvement_pct == 50.0


class TestOptimizationRequest:
    def test_default_construction(self):
        req = OptimizationRequest()
        assert req.symbol == ""
        assert req.max_iterations == 100
        assert req.max_candidates == 50

    def test_custom_request(self):
        req = OptimizationRequest(
            symbol="THYAO",
            optimization_type=OptimizationType.RULE_THRESHOLD,
            horizon=InvestmentHorizon.MONTH_1,
            max_iterations=200,
        )
        assert req.symbol == "THYAO"
        assert req.max_iterations == 200
        assert req.horizon == InvestmentHorizon.MONTH_1


class TestOptimizationResult:
    def test_default_construction(self):
        res = OptimizationResult()
        assert res.optimized_parameters == {}
        assert res.robustness_score == 0.0


class TestHelperFunctions:
    def test_mean_empty(self):
        assert _mean([]) == 0.0

    def test_mean_single(self):
        assert _mean([5.0]) == 5.0

    def test_mean_multiple(self):
        assert _mean([1.0, 2.0, 3.0]) == 2.0

    def test_stdev_empty(self):
        assert _stdev([]) == 0.0

    def test_stdev_single(self):
        assert _stdev([5.0]) == 0.0

    def test_stdev_multiple(self):
        result = _stdev([1.0, 2.0, 3.0])
        assert abs(result - 1.0) < 0.001

    def test_median_empty(self):
        assert _median([]) == 0.0

    def test_median_odd(self):
        assert _median([1.0, 2.0, 3.0]) == 2.0

    def test_median_even(self):
        assert _median([1.0, 2.0, 3.0, 4.0]) == 2.5

    def test_compute_fitness_score_empty(self):
        assert compute_fitness_score({}) == 0.0

    def test_compute_fitness_score_equal_weights(self):
        scores = {"a": 0.8, "b": 0.6}
        result = compute_fitness_score(scores)
        assert abs(result - 0.7) < 0.001

    def test_compute_fitness_score_custom_weights(self):
        scores = {"a": 1.0, "b": 0.0}
        weights = {"a": 2.0, "b": 1.0}
        result = compute_fitness_score(scores, weights)
        assert abs(result - 0.6667) < 0.01

    def test_compute_improvement(self):
        assert compute_improvement(100.0, 150.0) == 50.0
        assert compute_improvement(0.0, 100.0) == 0.0
        assert compute_improvement(100.0, 100.0) == 0.0
        assert compute_improvement(100.0, 80.0) == -20.0

    def test_classify_horizon_days(self):
        assert classify_horizon_days(InvestmentHorizon.WEEKLY) == 5
        assert classify_horizon_days(InvestmentHorizon.MONTH_1) == 21
        assert classify_horizon_days(InvestmentHorizon.MONTH_3) == 63
        assert classify_horizon_days(InvestmentHorizon.MONTH_6) == 126
        assert classify_horizon_days(InvestmentHorizon.MONTH_12) == 252


class TestCheckRejectionRules:
    def test_no_rejection(self):
        candidate = ParameterCandidate(
            objective_scores={
                "max_drawdown": 10.0,
                "sharpe_ratio": 1.5,
                "win_rate": 60.0,
            },
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = check_rejection_rules(candidate, {})
        assert reasons == []

    def test_excessive_drawdown(self):
        candidate = ParameterCandidate(
            objective_scores={"max_drawdown": 40.0, "sharpe_ratio": 1.5, "win_rate": 60.0},
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = check_rejection_rules(candidate, {})
        assert RejectionReason.EXCESSIVE_DRAWDOWN in reasons

    def test_low_sharpe(self):
        candidate = ParameterCandidate(
            objective_scores={"max_drawdown": 10.0, "sharpe_ratio": 0.1, "win_rate": 60.0},
            walk_forward_score=0.7,
            monte_carlo_score=0.6,
        )
        reasons = check_rejection_rules(candidate, {})
        assert RejectionReason.DEGRADED_PERFORMANCE in reasons

    def test_low_generalization(self):
        candidate = ParameterCandidate(
            objective_scores={"max_drawdown": 10.0, "sharpe_ratio": 1.5, "win_rate": 60.0},
            walk_forward_score=0.2,
            monte_carlo_score=0.6,
        )
        reasons = check_rejection_rules(candidate, {})
        assert RejectionReason.LOW_GENERALIZATION in reasons

    def test_overfitting(self):
        candidate = ParameterCandidate(
            objective_scores={"max_drawdown": 10.0, "sharpe_ratio": 1.5, "win_rate": 60.0},
            walk_forward_score=0.7,
            monte_carlo_score=0.1,
        )
        reasons = check_rejection_rules(candidate, {})
        assert RejectionReason.OVERFITTING in reasons

    def test_custom_thresholds(self):
        candidate = ParameterCandidate(
            objective_scores={"max_drawdown": 20.0, "sharpe_ratio": 0.8, "win_rate": 45.0},
            walk_forward_score=0.6,
            monte_carlo_score=0.7,
        )
        thresholds = {"max_drawdown": 25.0, "min_sharpe": 0.3, "min_win_rate": 40.0}
        reasons = check_rejection_rules(candidate, thresholds)
        assert reasons == []


class TestBenchmarkResult:
    def test_construction(self):
        br = BenchmarkResult(
            operation="test_op",
            iterations=10,
            avg_time_ms=1.5,
            success=True,
        )
        assert br.operation == "test_op"
        assert br.success is True
