import pytest
from modules.monte_carlo_engine.core.types import SimulationResult
from modules.monte_carlo_engine.statistics.metrics import MonteCarloStatistics


class TestMonteCarloStatistics:
    def setup_method(self):
        self.stats = MonteCarloStatistics()

    def _simulations(self, n=100) -> list:
        sims = []
        for i in range(n):
            ret = (i - n // 2) * 0.5
            sims.append(SimulationResult(
                simulation_id=i, terminal_value=100000 * (1 + ret / 100),
                total_return=ret, max_drawdown=5.0,
                sharpe_ratio=1.0,
            ))
        return sims

    def test_probability_metrics(self):
        pm = self.stats.calculate_probability_metrics(self._simulations())
        assert 0 <= pm.prob_loss_5pct <= 100
        assert 0 <= pm.prob_gain_10pct <= 100

    def test_probability_metrics_empty(self):
        pm = self.stats.calculate_probability_metrics([])
        assert pm.prob_loss_1pct == 0.0

    def test_summary_statistics(self):
        summary = self.stats.calculate_summary_statistics(self._simulations())
        assert summary["num_simulations"] == 100
        assert "mean_return" in summary

    def test_summary_statistics_empty(self):
        summary = self.stats.calculate_summary_statistics([])
        assert summary == {}

    def test_terminal_values(self):
        tv = self.stats.summarize_terminal_values(self._simulations())
        assert "mean" in tv
        assert "p5" in tv

    def test_terminal_values_empty(self):
        tv = self.stats.summarize_terminal_values([])
        assert tv == {}

    def test_skewness_kurtosis(self):
        pm = self.stats.calculate_probability_metrics(self._simulations())
        assert isinstance(pm.skewness, float)
        assert isinstance(pm.kurtosis, float)
