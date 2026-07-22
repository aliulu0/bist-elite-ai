import pytest
from modules.walk_forward_engine.core.types import (
    GeneralizationScores,
    MarketRegime,
    OptimizationResult,
    RegimePerformance,
    ValidationMetrics,
    WalkForwardResult,
    WindowResult,
    WindowSlice,
)
from modules.walk_forward_engine.statistics.performance import WalkForwardStatistics


class TestWalkForwardStatistics:
    def setup_method(self):
        self.stats = WalkForwardStatistics()

    def _make_window_result(self, idx, train_ret=10.0, train_sharpe=1.5, test_ret=8.0, test_sharpe=1.2, regime=MarketRegime.SIDEWAYS) -> WindowResult:
        return WindowResult(
            window=WindowSlice(
                index=idx, train_start="2020-01-01", train_end="2021-01-01",
                test_start="2021-01-01", test_end="2022-01-01", regime=regime,
            ),
            optimization=OptimizationResult(
                train_return=train_ret, train_sharpe=train_sharpe,
                train_drawdown=5.0, train_win_rate=55.0, score=train_sharpe,
            ),
            validation=ValidationMetrics(
                out_of_sample_return=test_ret, out_of_sample_sharpe=test_sharpe,
                out_of_sample_win_rate=50.0, out_of_sample_drawdown=4.0,
            ),
            success=True,
        )

    def test_generalization_scores_basic(self):
        results = [self._make_window_result(i) for i in range(5)]
        scores = self.stats.calculate_generalization_scores(results)
        assert 0 <= scores.generalization_score <= 1
        assert 0 <= scores.overfitting_score <= 1
        assert 0 <= scores.robustness_score <= 1

    def test_generalization_scores_empty(self):
        scores = self.stats.calculate_generalization_scores([])
        assert scores.generalization_score == 0.0

    def test_generalization_high_overfitting(self):
        results = [
            self._make_window_result(0, train_sharpe=5.0, test_sharpe=0.5),
            self._make_window_result(1, train_sharpe=5.0, test_sharpe=0.5),
        ]
        scores = self.stats.calculate_generalization_scores(results)
        assert scores.overfitting_score > 0.5

    def test_regime_performance(self):
        results = [
            self._make_window_result(0, regime=MarketRegime.BULL),
            self._make_window_result(1, regime=MarketRegime.BULL),
            self._make_window_result(2, regime=MarketRegime.BEAR),
        ]
        regimes = self.stats.calculate_regime_performance(results)
        assert len(regimes) == 2
        assert all(rp.windows_count > 0 for rp in regimes)

    def test_regime_performance_empty(self):
        regimes = self.stats.calculate_regime_performance([])
        assert regimes == []

    def test_calculate_window_metrics(self):
        train_m = {"total_return": 10.0, "sharpe_ratio": 1.5, "win_rate": 55.0}
        test_m = {"total_return": 8.0, "sharpe_ratio": 1.2, "win_rate": 50.0, "total_trades": 20}
        vm = self.stats.calculate_window_metrics(train_m, test_m)
        assert vm.out_of_sample_return == 8.0
        assert vm.out_of_sample_trades == 20

    def test_summarize_results(self):
        result = WalkForwardResult(
            window_results=[self._make_window_result(i) for i in range(3)],
            total_windows=3,
            successful_windows=3,
            generalization=GeneralizationScores(
                generalization_score=0.8, overfitting_score=0.2,
                robustness_score=0.7, consistency_score=0.9,
            ),
        )
        summary = self.stats.summarize_results(result)
        assert summary["total_windows"] == 3
        assert summary["avg_test_sharpe"] > 0

    def test_summarize_results_empty(self):
        result = WalkForwardResult()
        summary = self.stats.summarize_results(result)
        assert summary["total_windows"] == 0

    def test_consistency_score_range(self):
        results = [self._make_window_result(i, test_sharpe=1.0 + i * 0.1) for i in range(5)]
        scores = self.stats.calculate_generalization_scores(results)
        assert 0 <= scores.consistency_score <= 1

    def test_performance_degradation(self):
        results = [
            self._make_window_result(0, train_ret=20.0, test_ret=5.0),
            self._make_window_result(1, train_ret=20.0, test_ret=5.0),
        ]
        scores = self.stats.calculate_generalization_scores(results)
        assert scores.performance_degradation > 0.5

    def test_historical_drift(self):
        results = [self._make_window_result(i, test_sharpe=1.0 + i * 0.5) for i in range(6)]
        scores = self.stats.calculate_generalization_scores(results)
        assert scores.historical_drift >= 0
