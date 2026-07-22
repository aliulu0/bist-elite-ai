import pytest
from modules.elite_score_engine.benchmark.benchmark import EliteBenchmark


class TestEliteBenchmark:
    def test_run(self):
        bench = EliteBenchmark()
        result = bench.run("test_op", lambda: sum(range(100)), iterations=5, warmup=1)
        assert result.success is True
        assert result.iterations == 5
        assert result.avg_time_ms >= 0

    def test_run_with_error(self):
        bench = EliteBenchmark()
        def failing():
            raise ValueError("boom")
        result = bench.run("fail_op", failing, iterations=3, warmup=1)
        assert result.success is False
        assert "boom" in result.error_message

    def test_get_results(self):
        bench = EliteBenchmark()
        bench.run("op1", lambda: None, iterations=2, warmup=0)
        bench.run("op2", lambda: None, iterations=2, warmup=0)
        results = bench.get_results()
        assert len(results) == 2

    def test_compare(self):
        bench = EliteBenchmark()
        bench.run("fast", lambda: None, iterations=5, warmup=0)
        bench.run("slow", lambda: sum(range(10000)), iterations=5, warmup=0)
        comparison = bench.compare("fast", "slow")
        assert comparison is not None
        assert comparison["a_avg_ms"] < comparison["b_avg_ms"]

    def test_compare_missing(self):
        bench = EliteBenchmark()
        assert bench.compare("a", "b") is None

    def test_clear(self):
        bench = EliteBenchmark()
        bench.run("op", lambda: None, iterations=2, warmup=0)
        bench.clear()
        assert len(bench.get_results()) == 0

    def test_memory_tracking(self):
        bench = EliteBenchmark()
        result = bench.run("mem_op", lambda: [0] * 10000, iterations=3, warmup=1)
        assert result.memory_mb >= 0
