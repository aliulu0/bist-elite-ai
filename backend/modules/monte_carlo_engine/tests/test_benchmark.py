import pytest
from modules.monte_carlo_engine.benchmark.benchmark import MonteCarloBenchmark


class TestMonteCarloBenchmark:
    def setup_method(self):
        self.bm = MonteCarloBenchmark()

    def test_run_basic(self):
        result = self.bm.run("test_op", lambda: sum(range(100)))
        assert result.success is True
        assert result.iterations == 10

    def test_run_with_warmup(self):
        result = self.bm.run("op", lambda: 1, iterations=5, warmup=2)
        assert result.iterations == 5

    def test_run_with_error(self):
        def failing():
            raise ValueError("test error")
        result = self.bm.run("error_op", failing)
        assert result.success is False
        assert "test error" in result.error_message

    def test_get_results(self):
        self.bm.run("op1", lambda: 1)
        assert "op1" in self.bm.get_results()

    def test_compare(self):
        self.bm.run("fast", lambda: 1)
        self.bm.run("slow", lambda: sum(range(10000)))
        c = self.bm.compare("fast", "slow")
        assert c is not None
        assert c["a_faster"] is True

    def test_compare_missing(self):
        assert self.bm.compare("a", "b") is None

    def test_clear(self):
        self.bm.run("op1", lambda: 1)
        self.bm.clear()
        assert self.bm.get_results() == {}
