import pytest
from modules.walk_forward_engine.benchmark.benchmark import WalkForwardBenchmark


class TestWalkForwardBenchmark:
    def setup_method(self):
        self.bm = WalkForwardBenchmark()

    def test_run_basic(self):
        result = self.bm.run("test_op", lambda: sum(range(100)))
        assert result.success is True
        assert result.iterations == 10
        assert result.avg_time_ms >= 0

    def test_run_with_warmup(self):
        result = self.bm.run("test_op", lambda: 1, iterations=5, warmup=2)
        assert result.iterations == 5

    def test_run_with_error(self):
        def failing():
            raise ValueError("test error")
        result = self.bm.run("error_op", failing)
        assert result.success is False
        assert "test error" in result.error_message

    def test_get_results(self):
        self.bm.run("op1", lambda: 1)
        results = self.bm.get_results()
        assert "op1" in results

    def test_compare(self):
        self.bm.run("fast", lambda: 1)
        self.bm.run("slow", lambda: sum(range(10000)))
        comparison = self.bm.compare("fast", "slow")
        assert comparison is not None
        assert comparison["a_faster"] is True

    def test_compare_missing(self):
        result = self.bm.compare("op1", "op2")
        assert result is None

    def test_clear(self):
        self.bm.run("op1", lambda: 1)
        self.bm.clear()
        assert self.bm.get_results() == {}

    def test_min_max_times(self):
        result = self.bm.run("op", lambda: 1)
        assert result.min_time_ms <= result.avg_time_ms <= result.max_time_ms

    def test_total_time_ms(self):
        result = self.bm.run("op", lambda: 1, iterations=5)
        assert result.total_time_ms > 0
