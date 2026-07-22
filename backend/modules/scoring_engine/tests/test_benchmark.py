import time
from modules.scoring_engine.benchmark.benchmark import ScoringBenchmark


class TestScoringBenchmark:
    def setup_method(self):
        self.bench = ScoringBenchmark()

    def test_run(self):
        result = self.bench.run(lambda: time.sleep(0.001), iterations=5)
        assert result.iterations == 5
        assert result.total_seconds > 0
        assert result.avg_ms > 0

    def test_run_comparison(self):
        results = self.bench.run_comparison(
            {"fast": lambda: None, "slow": lambda: time.sleep(0.001)},
            iterations=5,
        )
        assert "fast" in results
        assert "slow" in results

    def test_get_results(self):
        self.bench.run(lambda: None, iterations=3)
        assert len(self.bench.get_results()) >= 1

    def test_get_summary(self):
        self.bench.run(lambda: None, iterations=3)
        summary = self.bench.get_summary()
        assert summary["total_runs"] >= 1

    def test_clear(self):
        self.bench.run(lambda: None, iterations=3)
        self.bench.clear()
        assert len(self.bench.get_results()) == 0

    def test_warmup(self):
        result = self.bench.run(lambda: None, iterations=10, warmup=3)
        assert result.iterations == 10

    def test_memory_tracking(self):
        result = self.bench.run(lambda: None, iterations=5)
        assert result.memory_bytes >= 0
