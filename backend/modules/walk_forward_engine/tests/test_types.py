import pytest
from modules.walk_forward_engine.core.types import (
    BenchmarkResult,
    GeneralizationScores,
    MarketRegime,
    OptimizationResult,
    OverfittingSeverity,
    RegimePerformance,
    TrainTestSplit,
    ValidationMetrics,
    WalkForwardRequest,
    WalkForwardResult,
    WindowMode,
    WindowPeriod,
    WindowSlice,
    WindowResult,
    WalkForwardComparison,
    ValidationTarget,
    ReportType,
    _mean,
    _stdev,
    _median,
    compute_generalization_score,
    compute_overfitting_score,
    compute_robustness_score,
    compute_consistency_score,
    classify_overfitting_severity,
    classify_market_regime,
    get_split_ratios,
    generate_overfitting_recommendation,
)


class TestEnums:
    def test_window_mode_values(self):
        assert WindowMode.ROLLING.value == "rolling"
        assert WindowMode.EXPANDING.value == "expanding"
        assert WindowMode.ANCHORED.value == "anchored"
        assert WindowMode.SLIDING.value == "sliding"
        assert WindowMode.HYBRID.value == "hybrid"

    def test_train_test_split_values(self):
        assert TrainTestSplit.EIGHTY_TWENTY.value == "80_20"
        assert TrainTestSplit.SEVENTY_THIRTY.value == "70_30"

    def test_window_period_values(self):
        assert WindowPeriod.WEEKLY.value == "weekly"
        assert WindowPeriod.MONTHLY.value == "monthly"
        assert WindowPeriod.QUARTERLY.value == "quarterly"

    def test_validation_target_values(self):
        assert ValidationTarget.STRATEGY.value == "strategy"
        assert ValidationTarget.SCORE.value == "score"

    def test_market_regime_values(self):
        assert MarketRegime.BULL.value == "bull"
        assert MarketRegime.BEAR.value == "bear"
        assert MarketRegime.SIDEWAYS.value == "sideways"

    def test_report_type_values(self):
        assert ReportType.EXECUTIVE.value == "executive"
        assert ReportType.FULL.value == "full"

    def test_overfitting_severity_values(self):
        assert OverfittingSeverity.NONE.value == "none"
        assert OverfittingSeverity.CRITICAL.value == "critical"


class TestHelperFunctions:
    def test_mean(self):
        assert _mean([1.0, 2.0, 3.0]) == 2.0
        assert _mean([]) == 0.0
        assert _mean([5.0]) == 5.0

    def test_stdev(self):
        assert _stdev([]) == 0.0
        assert _stdev([1.0]) == 0.0
        result = _stdev([1.0, 2.0, 3.0, 4.0, 5.0])
        assert result > 0

    def test_median(self):
        assert _median([]) == 0.0
        assert _median([3.0, 1.0, 2.0]) == 2.0
        assert _median([1.0, 2.0]) == 1.5

    def test_compute_generalization_score(self):
        assert compute_generalization_score(10.0, 10.0) == 1.0
        assert compute_generalization_score(5.0, 10.0) == 0.5
        assert compute_generalization_score(0.0, 0.0) == 0.0
        assert compute_generalization_score(10.0, 0.0) == 0.0

    def test_compute_overfitting_score(self):
        assert compute_overfitting_score(2.0, 2.0) == 0.0
        assert compute_overfitting_score(2.0, 1.0) == 0.5
        assert compute_overfitting_score(0.0, 1.0) == 0.0

    def test_compute_robustness_score(self):
        score = compute_robustness_score(0.8, 0.7, 0.6)
        assert 0.0 <= score <= 1.0

    def test_compute_consistency_score(self):
        assert compute_consistency_score([]) == 1.0
        assert compute_consistency_score([1.0]) == 1.0
        score = compute_consistency_score([1.0, 0.5, 0.8, 1.2])
        assert 0.0 <= score <= 1.0

    def test_classify_overfitting_severity(self):
        assert classify_overfitting_severity(0.0) == OverfittingSeverity.NONE
        assert classify_overfitting_severity(0.3) == OverfittingSeverity.LOW
        assert classify_overfitting_severity(0.5) == OverfittingSeverity.MODERATE
        assert classify_overfitting_severity(0.7) == OverfittingSeverity.HIGH
        assert classify_overfitting_severity(0.9) == OverfittingSeverity.CRITICAL

    def test_classify_market_regime(self):
        assert classify_market_regime([]) == MarketRegime.SIDEWAYS
        assert classify_market_regime([0.2, 0.3, 0.25]) == MarketRegime.BULL
        assert classify_market_regime([-0.2, -0.15, -0.3]) == MarketRegime.BEAR
        assert classify_market_regime([0.01, -0.01, 0.005]) == MarketRegime.SIDEWAYS

    def test_get_split_ratios(self):
        t, v = get_split_ratios(TrainTestSplit.EIGHTY_TWENTY)
        assert t == 0.8
        assert v == 0.2
        t, v = get_split_ratios(TrainTestSplit.CUSTOM, 0.7)
        assert abs(t - 0.7) < 0.01

    def test_generate_overfitting_recommendation(self):
        scores = GeneralizationScores(performance_degradation=0.6, regime_dependency=0.7)
        rec = generate_overfitting_recommendation(OverfittingSeverity.CRITICAL, scores)
        assert "curve-fit" in rec.lower() or "overfitting" in rec.lower() or "unreliable" in rec.lower()


class TestDataclasses:
    def test_window_slice_defaults(self):
        ws = WindowSlice(index=0, train_start="2020-01-01", train_end="2021-01-01", test_start="2021-01-01", test_end="2022-01-01")
        assert ws.index == 0
        assert ws.train_rows == 0
        assert ws.regime == MarketRegime.SIDEWAYS

    def test_optimization_result_defaults(self):
        o = OptimizationResult()
        assert o.score == 0.0
        assert o.parameters == {}

    def test_validation_metrics_defaults(self):
        v = ValidationMetrics()
        assert v.out_of_sample_return == 0.0
        assert v.out_of_sample_sharpe == 0.0

    def test_generalization_scores_defaults(self):
        g = GeneralizationScores()
        assert g.generalization_score == 0.0
        assert g.severity == OverfittingSeverity.NONE

    def test_walk_forward_request_defaults(self):
        r = WalkForwardRequest(symbol="TUPRS")
        assert r.window_mode == WindowMode.ROLLING
        assert r.train_test_split == TrainTestSplit.EIGHTY_TWENTY

    def test_walk_forward_result_defaults(self):
        r = WalkForwardResult()
        assert r.total_windows == 0
        assert r.generalization.generalization_score == 0.0

    def test_walk_forward_comparison(self):
        c = WalkForwardComparison()
        assert c.symbols == []
        assert c.avg_generalization == 0.0

    def test_benchmark_result_defaults(self):
        b = BenchmarkResult()
        assert b.success is True
        assert b.iterations == 0

    def test_window_result_defaults(self):
        wr = WindowResult()
        assert wr.success is True
        assert wr.error_message == ""

    def test_regime_performance_defaults(self):
        rp = RegimePerformance()
        assert rp.regime == MarketRegime.SIDEWAYS
        assert rp.windows_count == 0
