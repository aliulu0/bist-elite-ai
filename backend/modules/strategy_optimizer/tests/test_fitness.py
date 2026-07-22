from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    OptimizationObjective,
    ParameterCandidate,
)
from modules.strategy_optimizer.fitness.calculator import FitnessCalculator


class TestFitnessCalculatorConstruction:
    def test_default_init(self):
        calc = FitnessCalculator()
        assert calc is not None

    def test_custom_objectives(self):
        calc = FitnessCalculator(
            objectives=[OptimizationObjective.MAXIMIZE_SHARPE]
        )
        assert len(calc._objectives) == 1

    def test_custom_weights(self):
        weights = {OptimizationObjective.MAXIMIZE_SHARPE: 2.0}
        calc = FitnessCalculator(weights=weights)
        assert calc._weights[OptimizationObjective.MAXIMIZE_SHARPE] == 2.0


class TestEvaluate:
    def test_evaluate_with_metadata(self):
        calc = FitnessCalculator()
        candidate = ParameterCandidate(
            metadata={
                "backtest_metrics": {
                    "total_return": 0.2,
                    "sharpe_ratio": 1.5,
                    "max_drawdown": 10.0,
                    "win_rate": 60.0,
                },
                "walk_forward_metrics": {
                    "consistency_score": 0.7,
                    "robustness_score": 0.8,
                },
            }
        )
        score = calc.evaluate(candidate)
        assert 0.0 <= score <= 1.0
        assert candidate.fitness_score == score

    def test_evaluate_empty_metadata(self):
        calc = FitnessCalculator()
        candidate = ParameterCandidate()
        score = calc.evaluate(candidate)
        assert 0.0 <= score <= 1.0

    def test_evaluate_with_baseline(self):
        calc = FitnessCalculator()
        candidate = ParameterCandidate(
            metadata={
                "backtest_metrics": {"total_return": 0.2, "sharpe_ratio": 1.0},
                "walk_forward_metrics": {"consistency_score": 0.5},
            }
        )
        baseline = {"total_return": 0.1}
        score = calc.evaluate(candidate, baseline)
        assert 0.0 <= score <= 1.0

    def test_evaluate_objective_scores_populated(self):
        calc = FitnessCalculator()
        candidate = ParameterCandidate(
            metadata={
                "backtest_metrics": {
                    "total_return": 0.15,
                    "sharpe_ratio": 1.2,
                    "max_drawdown": 15.0,
                    "win_rate": 55.0,
                },
            }
        )
        calc.evaluate(candidate)
        assert "maximize_return" in candidate.objective_scores
        assert "maximize_sharpe" in candidate.objective_scores
        assert "minimize_drawdown" in candidate.objective_scores
        assert "maximize_win_rate" in candidate.objective_scores


class TestRankCandidates:
    def test_rank_candidates(self):
        calc = FitnessCalculator()
        candidates = [
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.1}},
            ),
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.3}},
            ),
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.2}},
            ),
        ]
        ranked = calc.rank_candidates(candidates)
        assert len(ranked) == 3
        for i in range(len(ranked) - 1):
            assert ranked[i].overall_score >= ranked[i + 1].overall_score

    def test_rank_empty(self):
        calc = FitnessCalculator()
        ranked = calc.rank_candidates([])
        assert ranked == []


class TestSelectTop:
    def test_select_top(self):
        calc = FitnessCalculator()
        candidates = [
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.1}},
            ),
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.3}},
            ),
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.2}},
            ),
        ]
        top = calc.select_top(candidates, top_n=2)
        assert len(top) == 2

    def test_select_top_fewer_than_available(self):
        calc = FitnessCalculator()
        candidates = [
            ParameterCandidate(
                metadata={"backtest_metrics": {"total_return": 0.1}},
            ),
        ]
        top = calc.select_top(candidates, top_n=5)
        assert len(top) == 1


class TestNormalization:
    def test_clamp(self):
        assert FitnessCalculator._clamp(0.5) == 0.5
        assert FitnessCalculator._clamp(-0.5) == 0.0
        assert FitnessCalculator._clamp(1.5) == 1.0

    def test_clamp_custom_range(self):
        assert FitnessCalculator._clamp(5.0, 0.0, 10.0) == 5.0
        assert FitnessCalculator._clamp(-1.0, 0.0, 10.0) == 0.0
        assert FitnessCalculator._clamp(15.0, 0.0, 10.0) == 10.0

    def test_normalize_return_with_baseline(self):
        calc = FitnessCalculator()
        score = calc._normalize_return(0.2, 0.1)
        assert score > 0.5

    def test_normalize_return_without_baseline(self):
        calc = FitnessCalculator()
        score = calc._normalize_return(0.1, 0.0)
        assert 0.0 <= score <= 1.0

    def test_normalize_sharpe_negative(self):
        calc = FitnessCalculator()
        score = calc._normalize_sharpe(-0.5)
        assert 0.0 <= score <= 1.0

    def test_normalize_sharpe_positive(self):
        calc = FitnessCalculator()
        score = calc._normalize_sharpe(2.0)
        assert score > 0.5

    def test_normalize_drawdown_small(self):
        calc = FitnessCalculator()
        score = calc._normalize_drawdown(-3.0)
        assert score == 1.0

    def test_normalize_drawdown_large(self):
        calc = FitnessCalculator()
        score = calc._normalize_drawdown(-35.0)
        assert score == 0.1

    def test_normalize_win_rate(self):
        calc = FitnessCalculator()
        assert calc._normalize_win_rate(50.0) == 0.5
        assert calc._normalize_win_rate(0.0) == 0.0
        assert calc._normalize_win_rate(100.0) == 1.0
