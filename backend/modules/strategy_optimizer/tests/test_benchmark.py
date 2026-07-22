from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import time

import pytest

from modules.strategy_optimizer.benchmark.benchmark import BenchmarkRunner


class TestBenchmarkRunnerConstruction:
    def test_init(self):
        runner = BenchmarkRunner()
        assert runner is not None


class TestRunBenchmark:
    def test_simple_benchmark(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda: time.sleep(0.001),
            iterations=3,
            operation_name="sleep_op",
        )
        assert result.operation == "sleep_op"
        assert result.iterations == 3
        assert result.avg_time_ms > 0
        assert result.min_time_ms > 0
        assert result.max_time_ms > 0
        assert result.success is True

    def test_benchmark_with_args(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda x, y: x + y,
            args=(3, 4),
            iterations=5,
            operation_name="add_op",
        )
        assert result.success is True
        assert result.iterations == 5

    def test_benchmark_with_kwargs(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda x=0: x * 2,
            kwargs={"x": 5},
            iterations=3,
            operation_name="multiply_op",
        )
        assert result.success is True

    def test_benchmark_error(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda: (_ for _ in ()).throw(ValueError("test")),
            iterations=3,
            operation_name="error_op",
        )
        assert result.success is False
        assert "test" in result.error_message

    def test_benchmark_std_dev(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda: time.sleep(0.001),
            iterations=5,
            operation_name="std_op",
        )
        assert result.std_dev_ms >= 0

    def test_benchmark_single_iteration(self):
        runner = BenchmarkRunner()
        result = runner.run(
            func=lambda: 42,
            iterations=1,
            operation_name="single_op",
        )
        assert result.success is True
        assert result.std_dev_ms == 0.0


class TestBenchmarkHistory:
    def test_get_results(self):
        runner = BenchmarkRunner()
        runner.run(func=lambda: 1, iterations=2, operation_name="op1")
        runner.run(func=lambda: 2, iterations=2, operation_name="op2")
        results = runner.get_results()
        assert len(results) == 2

    def test_clear_results(self):
        runner = BenchmarkRunner()
        runner.run(func=lambda: 1, iterations=2, operation_name="op1")
        runner.clear_results()
        assert len(runner.get_results()) == 0
