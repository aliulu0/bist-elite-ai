from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import OptimizationRun
from modules.strategy_optimizer.registry.registry import StrategyOptimizerRegistry, reset_registry


class TestRegistrySingleton:
    def test_singleton_same_instance(self):
        reset_registry()
        r1 = StrategyOptimizerRegistry()
        r2 = StrategyOptimizerRegistry()
        assert r1 is r2

    def test_reset_creates_new(self):
        r1 = StrategyOptimizerRegistry()
        reset_registry()
        r2 = StrategyOptimizerRegistry()
        assert r1 is not r2


class TestRegistryComponents:
    def test_get_optimizer(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        opt = reg.get_optimizer()
        assert opt is not None

    def test_get_optimizer_singleton(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        opt1 = reg.get_optimizer()
        opt2 = reg.get_optimizer()
        assert opt1 is opt2

    def test_get_parameter_engine(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        pe = reg.get_parameter_engine()
        assert pe is not None

    def test_get_fitness_calculator(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        fc = reg.get_fitness_calculator()
        assert fc is not None

    def test_get_profile_manager(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        pm = reg.get_profile_manager()
        assert pm is not None

    def test_get_request_validator(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        rv = reg.get_request_validator()
        assert rv is not None

    def test_get_result_validator(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        rv = reg.get_result_validator()
        assert rv is not None


class TestRegistryHistory:
    def test_add_and_get_history(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        run = OptimizationRun(run_id="test_1", symbol="THYAO")
        reg.add_run(run)
        history = reg.get_history()
        assert len(history) == 1

    def test_get_history_by_symbol(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        reg.add_run(OptimizationRun(run_id="r1", symbol="THYAO"))
        reg.add_run(OptimizationRun(run_id="r2", symbol="GARAN"))
        reg.add_run(OptimizationRun(run_id="r3", symbol="THYAO"))
        thy = reg.get_history_by_symbol("THYAO")
        assert len(thy) == 2

    def test_clear_history(self):
        reset_registry()
        reg = StrategyOptimizerRegistry()
        reg.add_run(OptimizationRun(run_id="r1"))
        reg.clear_history()
        assert len(reg.get_history()) == 0
