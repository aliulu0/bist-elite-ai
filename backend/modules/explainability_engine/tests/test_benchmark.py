import time
from modules.explainability_engine.benchmark.benchmark import ExplanationBenchmark


class TestExplanationBenchmark:
    def setup_method(self):
        self.benchmark = ExplanationBenchmark()

    def test_run(self):
        result = self.benchmark.run(lambda: time.sleep(0.001), iterations=5)
        assert result.iterations == 5
        assert result.total_seconds > 0
        assert result.avg_ms > 0
        assert result.ops_per_second > 0

    def test_run_comparison(self):
        results = self.benchmark.run_comparison(
            {"fast": lambda: None, "slow": lambda: time.sleep(0.001)},
            iterations=5,
        )
        assert "fast" in results
        assert "slow" in results

    def test_get_results(self):
        self.benchmark.run(lambda: None, iterations=3)
        results = self.benchmark.get_results()
        assert len(results) >= 1

    def test_get_summary(self):
        self.benchmark.run(lambda: None, iterations=3)
        summary = self.benchmark.get_summary()
        assert isinstance(summary, dict)

    def test_clear(self):
        self.benchmark.run(lambda: None, iterations=3)
        self.benchmark.clear()
        assert len(self.benchmark.get_results()) == 0

    def test_warmup(self):
        result = self.benchmark.run(lambda: None, iterations=10, warmup=3)
        assert result.iterations == 10
