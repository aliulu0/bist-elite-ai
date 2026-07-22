from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationRequest,
    OptimizationType,
    ParameterRange,
)
from modules.strategy_optimizer.optimizer.engine import StrategyOptimizer


class TestStrategyOptimizerConstruction:
    def test_default_init(self):
        opt = StrategyOptimizer()
        assert opt is not None

    def test_custom_components(self):
        from modules.strategy_optimizer.fitness.calculator import FitnessCalculator
        from modules.strategy_optimizer.parameter_engine.engine import ParameterSpaceBuilder
        from modules.strategy_optimizer.profiles.manager import ProfileManager
        from modules.strategy_optimizer.validators.validator import RequestValidator, ResultValidator

        opt = StrategyOptimizer(
            parameter_engine=ParameterSpaceBuilder(),
            fitness_calculator=FitnessCalculator(),
            profile_manager=ProfileManager(),
            request_validator=RequestValidator(),
            result_validator=ResultValidator(),
        )
        assert opt is not None


class TestOptimize:
    def test_basic_optimization(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            optimization_type=OptimizationType.RULE_THRESHOLD,
            horizon=InvestmentHorizon.MONTH_3,
            max_iterations=10,
            max_candidates=5,
        )
        result = opt.optimize(request)
        assert result.run.symbol == "THYAO"
        assert result.run.optimization_type == OptimizationType.RULE_THRESHOLD
        assert result.run.candidates_evaluated > 0
        assert result.execution_time_ms >= 0

    def test_optimization_with_seed(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            optimization_type=OptimizationType.RULE_THRESHOLD,
            horizon=InvestmentHorizon.MONTH_3,
            max_iterations=10,
            max_candidates=5,
            seed=42,
        )
        result = opt.optimize(request)
        assert result.run.candidates_evaluated > 0

    def test_optimization_weight_type(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="GARAN",
            optimization_type=OptimizationType.WEIGHT,
            horizon=InvestmentHorizon.MONTH_6,
            max_iterations=10,
            max_candidates=5,
        )
        result = opt.optimize(request)
        assert result.run.symbol == "GARAN"
        assert result.run.optimization_type == OptimizationType.WEIGHT

    def test_optimization_all_horizons(self):
        for horizon in InvestmentHorizon:
            opt = StrategyOptimizer()
            request = OptimizationRequest(
                symbol="THYAO",
                horizon=horizon,
                max_iterations=5,
                max_candidates=3,
            )
            result = opt.optimize(request)
            assert result.run.horizon == horizon

    def test_optimization_all_types(self):
        for opt_type in OptimizationType:
            opt = StrategyOptimizer()
            request = OptimizationRequest(
                symbol="THYAO",
                optimization_type=opt_type,
                max_iterations=5,
                max_candidates=3,
            )
            result = opt.optimize(request)
            assert result.run.optimization_type == opt_type

    def test_optimization_with_custom_parameter_space(self):
        opt = StrategyOptimizer()
        space = {
            "custom_threshold": ParameterRange(
                name="custom_threshold",
                min_value=0.0,
                max_value=1.0,
                step=0.1,
                current_value=0.5,
            ),
        }
        request = OptimizationRequest(
            symbol="THYAO",
            parameter_space=space,
            max_iterations=5,
            max_candidates=3,
        )
        result = opt.optimize(request)
        assert result.run.candidates_evaluated > 0

    def test_invalid_request_raises(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="",
            max_iterations=-1,
        )
        with pytest.raises(ValueError, match="Invalid request"):
            opt.optimize(request)


class TestHistory:
    def test_get_history(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=3,
            max_candidates=2,
        )
        opt.optimize(request)
        opt.optimize(request)
        history = opt.get_history()
        assert len(history) == 2

    def test_get_history_by_symbol(self):
        opt = StrategyOptimizer()
        opt.optimize(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        opt.optimize(OptimizationRequest(symbol="GARAN", max_iterations=3, max_candidates=2))
        opt.optimize(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        thy = opt.get_history_by_symbol("THYAO")
        assert len(thy) == 2

    def test_get_run(self):
        opt = StrategyOptimizer()
        result = opt.optimize(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        run = opt.get_run(result.run.run_id)
        assert run is not None
        assert run.symbol == "THYAO"

    def test_get_run_not_found(self):
        opt = StrategyOptimizer()
        run = opt.get_run("nonexistent")
        assert run is None

    def test_reset_history(self):
        opt = StrategyOptimizer()
        opt.optimize(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        opt.reset_history()
        assert len(opt.get_history()) == 0


class TestEarlyStopping:
    def test_early_stopping(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=1000,
            max_candidates=1000,
            early_stopping=True,
            early_stopping_patience=3,
        )
        result = opt.optimize(request)
        assert result.run.candidates_evaluated <= 1000

    def test_no_early_stopping(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=5,
            max_candidates=5,
            early_stopping=False,
        )
        result = opt.optimize(request)
        assert result.run.candidates_evaluated == 5


class TestPerformanceImprovement:
    def test_performance_improvement_computed(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=5,
            max_candidates=5,
        )
        result = opt.optimize(request)
        assert "fitness_improvement_pct" in result.performance_improvement

    def test_risk_improvement_computed(self):
        opt = StrategyOptimizer()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=5,
            max_candidates=5,
        )
        result = opt.optimize(request)
        assert "drawdown_improvement_pct" in result.risk_improvement
