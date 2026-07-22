import pytest
from modules.decision_engine.benchmark.benchmark import DecisionBenchmark


class TestDecisionBenchmark:
    def test_run(self):
        bench = DecisionBenchmark()
        result = bench.run("test_op", lambda: sum(range(100)), iterations=5, warmup=1)
        assert result.success is True
        assert result.iterations == 5
        assert result.avg_time_ms >= 0

    def test_run_with_error(self):
        bench = DecisionBenchmark()
        def failing():
            raise ValueError("boom")
        result = bench.run("fail_op", failing, iterations=3, warmup=1)
        assert result.success is False
        assert "boom" in result.error_message

    def test_get_results(self):
        bench = DecisionBenchmark()
        bench.run("op1", lambda: None, iterations=2, warmup=0)
        bench.run("op2", lambda: None, iterations=2, warmup=0)
        results = bench.get_results()
        assert len(results) == 2

    def test_compare(self):
        bench = DecisionBenchmark()
        bench.run("fast", lambda: None, iterations=5, warmup=0)
        bench.run("slow", lambda: sum(range(10000)), iterations=5, warmup=0)
        comparison = bench.compare("fast", "slow")
        assert comparison is not None
        assert comparison["a_avg_ms"] < comparison["b_avg_ms"]

    def test_compare_missing(self):
        bench = DecisionBenchmark()
        assert bench.compare("a", "b") is None

    def test_clear(self):
        bench = DecisionBenchmark()
        bench.run("op", lambda: None, iterations=2, warmup=0)
        bench.clear()
        assert len(bench.get_results()) == 0

    def test_memory_tracking(self):
        bench = DecisionBenchmark()
        result = bench.run("mem_op", lambda: [0] * 10000, iterations=3, warmup=1)
        assert result.memory_mb >= 0

    def test_percentiles(self):
        bench = DecisionBenchmark()
        result = bench.run("pct_op", lambda: sum(range(100)), iterations=20, warmup=2)
        assert "p50" in result.percentiles
        assert "p90" in result.percentiles
        assert "p99" in result.percentiles
