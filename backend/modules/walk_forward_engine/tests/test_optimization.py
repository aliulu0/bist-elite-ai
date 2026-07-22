import pytest
from modules.walk_forward_engine.core.types import WalkForwardRequest, WindowMode
from modules.walk_forward_engine.optimization.module import ParameterOptimizer


class TestParameterOptimizer:
    def setup_method(self):
        self.opt = ParameterOptimizer()

    def _default_request(self, **kwargs) -> WalkForwardRequest:
        defaults = {"symbol": "TUPRS", "max_combinations": 10}
        defaults.update(kwargs)
        return WalkForwardRequest(**defaults)

    def test_optimize_basic(self):
        req = self._default_request(
            parameter_space={"sma_period": [10, 20, 50], "threshold": [0.5, 0.7]}
        )
        result = self.opt.optimize(req, list(range(200)))
        assert result.parameters
        assert result.execution_time_ms >= 0

    def test_optimize_empty_space(self):
        req = self._default_request()
        result = self.opt.optimize(req, list(range(200)))
        assert result.parameters == {}

    def test_optimize_grid(self):
        space = {"a": [1, 2, 3], "b": [10, 20]}
        result = self.opt.optimize_grid(space, lambda p: p["a"] * p["b"])
        assert result.parameters["a"] == 3
        assert result.parameters["b"] == 20

    def test_optimize_grid_max_combinations(self):
        space = {"a": list(range(50)), "b": list(range(50))}
        result = self.opt.optimize_grid(space, lambda p: p["a"] + p["b"], max_combinations=5)
        assert result.parameters

    def test_get_history(self):
        req = self._default_request(parameter_space={"x": [1, 2]})
        self.opt.optimize(req, list(range(100)))
        assert len(self.opt.get_history()) == 1

    def test_clear_history(self):
        req = self._default_request(parameter_space={"x": [1, 2]})
        self.opt.optimize(req, list(range(100)))
        self.opt.clear_history()
        assert len(self.opt.get_history()) == 0

    def test_optimize_with_strategy_fn(self):
        def my_strategy(data, params):
            return 1.5
        req = self._default_request(parameter_space={"x": [1, 2]})
        result = self.opt.optimize(req, list(range(100)), strategy_fn=my_strategy)
        assert result.score == 1.5

    def test_optimize_with_failing_strategy_fn(self):
        def bad_strategy(data, params):
            raise ValueError("fail")
        req = self._default_request(parameter_space={"x": [1, 2]})
        result = self.opt.optimize(req, list(range(100)), strategy_fn=bad_strategy)
        assert result.score == 0.0

    def test_combinations_limit(self):
        req = self._default_request(
            max_combinations=3,
            parameter_space={"a": list(range(20)), "b": list(range(20))},
        )
        result = self.opt.optimize(req, list(range(100)))
        assert result.parameters

    def test_optimize_metric_return(self):
        req = self._default_request(
            optimization_metric="return",
            parameter_space={"x": [1, 2]},
        )
        result = self.opt.optimize(req, list(range(100)))
        assert result.execution_time_ms >= 0

    def test_optimize_metric_sortino(self):
        req = self._default_request(
            optimization_metric="sortino",
            parameter_space={"x": [1, 2]},
        )
        result = self.opt.optimize(req, list(range(100)))
        assert result.execution_time_ms >= 0
