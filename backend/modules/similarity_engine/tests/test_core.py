from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    BenchmarkResult,
    FeatureVector,
    HistoricalOutcome,
    MarketRegime,
    PatternMemory,
    PatternOutcome,
    SimilarityAnalysis,
    SimilarityLabel,
    SimilarityMethod,
    SimilarityRequest,
    SimilarityResult,
    ValidationPeriod,
    _mean,
    _median,
    _stdev,
    classify_similarity_label,
    cosine_similarity,
    dynamic_time_warping_distance,
    hybrid_similarity_score,
    manhattan_distance,
    weighted_euclidean_distance,
    VALIDATION_PERIOD_DAYS,
)


class TestEnums:
    def test_similarity_methods(self):
        assert len(SimilarityMethod) == 6
        assert SimilarityMethod.WEIGHTED_FEATURE.value == "weighted_feature"
        assert SimilarityMethod.COSINE.value == "cosine"
        assert SimilarityMethod.EUCLIDEAN.value == "euclidean"
        assert SimilarityMethod.MANHATTAN.value == "manhattan"
        assert SimilarityMethod.DYNAMIC_TIME_WARPING.value == "dynamic_time_warping"
        assert SimilarityMethod.HYBRID.value == "hybrid"

    def test_similarity_labels(self):
        assert len(SimilarityLabel) == 6

    def test_market_regimes(self):
        assert len(MarketRegime) == 5

    def test_pattern_outcomes(self):
        assert len(PatternOutcome) == 3

    def test_feature_categories(self):
        from modules.similarity_engine.core.types import FeatureCategory
        assert len(FeatureCategory) == 10

    def test_report_types(self):
        from modules.similarity_engine.core.types import ReportType
        assert len(ReportType) == 7

    def test_validation_periods(self):
        assert len(ValidationPeriod) == 5


class TestFeatureVector:
    def test_default(self):
        fv = FeatureVector()
        assert fv.symbol == ""
        assert fv.features == {}

    def test_with_data(self):
        fv = FeatureVector(
            symbol="THYAO",
            date="2024-01-01",
            features={"rsi": 50.0, "macd": 1.5},
        )
        assert fv.symbol == "THYAO"
        assert fv.features["rsi"] == 50.0


class TestSimilarityResult:
    def test_default(self):
        sr = SimilarityResult()
        assert sr.similarity_score == 0.0
        assert sr.similarity_label == SimilarityLabel.MODERATE

    def test_with_data(self):
        sr = SimilarityResult(
            source_symbol="THYAO",
            target_symbol="GARAN",
            similarity_score=0.85,
            similarity_label=SimilarityLabel.VERY_STRONG,
        )
        assert sr.source_symbol == "THYAO"
        assert sr.similarity_score == 0.85


class TestClassifySimilarityLabel:
    def test_exceptional(self):
        assert classify_similarity_label(0.95) == SimilarityLabel.EXCEPTIONAL

    def test_very_strong(self):
        assert classify_similarity_label(0.85) == SimilarityLabel.VERY_STRONG

    def test_strong(self):
        assert classify_similarity_label(0.65) == SimilarityLabel.STRONG

    def test_moderate(self):
        assert classify_similarity_label(0.45) == SimilarityLabel.MODERATE

    def test_weak(self):
        assert classify_similarity_label(0.25) == SimilarityLabel.WEAK

    def test_very_weak(self):
        assert classify_similarity_label(0.05) == SimilarityLabel.VERY_WEAK

    def test_boundary_0_9(self):
        assert classify_similarity_label(0.9) == SimilarityLabel.EXCEPTIONAL

    def test_boundary_0_8(self):
        assert classify_similarity_label(0.8) == SimilarityLabel.VERY_STRONG

    def test_boundary_0_6(self):
        assert classify_similarity_label(0.6) == SimilarityLabel.STRONG


class TestWeightedEuclideanDistance:
    def test_identical_vectors(self):
        a = {"x": 1.0, "y": 2.0}
        assert weighted_euclidean_distance(a, a) == 0.0

    def test_different_vectors(self):
        a = {"x": 0.0, "y": 0.0}
        b = {"x": 1.0, "y": 1.0}
        d = weighted_euclidean_distance(a, b)
        assert d > 0

    def test_with_weights(self):
        a = {"x": 0.0, "y": 0.0}
        b = {"x": 1.0, "y": 0.0}
        d1 = weighted_euclidean_distance(a, b, {"x": 1.0, "y": 1.0})
        d2 = weighted_euclidean_distance(a, b, {"x": 4.0, "y": 1.0})
        assert d2 > d1

    def test_empty_vectors(self):
        assert weighted_euclidean_distance({}, {}) == 0.0


class TestCosineSimilarity:
    def test_identical(self):
        a = {"x": 1.0, "y": 2.0}
        assert abs(cosine_similarity(a, a) - 1.0) < 0.001

    def test_orthogonal(self):
        a = {"x": 1.0, "y": 0.0}
        b = {"x": 0.0, "y": 1.0}
        assert abs(cosine_similarity(a, b)) < 0.001

    def test_opposite(self):
        a = {"x": 1.0}
        b = {"x": -1.0}
        assert abs(cosine_similarity(a, b) - (-1.0)) < 0.001

    def test_empty(self):
        assert cosine_similarity({}, {}) == 0.0

    def test_zero_vector(self):
        a = {"x": 0.0, "y": 0.0}
        b = {"x": 1.0, "y": 1.0}
        assert cosine_similarity(a, b) == 0.0


class TestManhattanDistance:
    def test_identical(self):
        a = {"x": 1.0, "y": 2.0}
        assert manhattan_distance(a, a) == 0.0

    def test_different(self):
        a = {"x": 0.0}
        b = {"x": 3.0}
        assert manhattan_distance(a, b) == 3.0

    def test_with_weights(self):
        a = {"x": 0.0}
        b = {"x": 1.0}
        d = manhattan_distance(a, b, {"x": 5.0})
        assert d == 5.0


class TestDTW:
    def test_identical_series(self):
        s = [1.0, 2.0, 3.0]
        assert dynamic_time_warping_distance(s, s) == 0.0

    def test_different_series(self):
        a = [1.0, 2.0, 3.0]
        b = [3.0, 2.0, 1.0]
        d = dynamic_time_warping_distance(a, b)
        assert d > 0

    def test_empty_series(self):
        assert dynamic_time_warping_distance([], [1.0]) == float("inf")
        assert dynamic_time_warping_distance([1.0], []) == float("inf")
        assert dynamic_time_warping_distance([], []) == float("inf")

    def test_single_element(self):
        assert dynamic_time_warping_distance([1.0], [1.0]) == 0.0


class TestHybridSimilarity:
    def test_identical(self):
        a = {"x": 1.0, "y": 2.0}
        score = hybrid_similarity_score(a, a)
        assert abs(score - 1.0) < 0.01

    def test_different(self):
        a = {"x": 0.0, "y": 0.0}
        b = {"x": 1.0, "y": 1.0}
        score = hybrid_similarity_score(a, b)
        assert 0.0 <= score <= 1.0

    def test_range(self):
        a = {"x": 0.5, "y": 0.3, "z": 0.8}
        b = {"x": 0.6, "y": 0.4, "z": 0.7}
        score = hybrid_similarity_score(a, b)
        assert 0.0 <= score <= 1.0


class TestHelperFunctions:
    def test_mean_empty(self):
        assert _mean([]) == 0.0

    def test_mean_values(self):
        assert _mean([1.0, 2.0, 3.0]) == 2.0

    def test_stdev_empty(self):
        assert _stdev([]) == 0.0

    def test_stdev_single(self):
        assert _stdev([5.0]) == 0.0

    def test_stdev_multiple(self):
        result = _stdev([1.0, 2.0, 3.0])
        assert abs(result - 1.0) < 0.001

    def test_median_empty(self):
        assert _median([]) == 0.0

    def test_median_odd(self):
        assert _median([1.0, 2.0, 3.0]) == 2.0

    def test_median_even(self):
        assert _median([1.0, 2.0, 3.0, 4.0]) == 2.5


class TestDataclasses:
    def test_historical_outcome(self):
        ho = HistoricalOutcome(
            period_return={"1w": 2.5, "1m": 5.0},
            max_drawdown=-10.0,
            win_rate=65.0,
        )
        assert ho.period_return["1w"] == 2.5
        assert ho.max_drawdown == -10.0

    def test_pattern_memory(self):
        pm = PatternMemory(
            symbol="THYAO",
            outcome=PatternOutcome.SUCCESSFUL,
            return_pct=15.0,
        )
        assert pm.outcome == PatternOutcome.SUCCESSFUL

    def test_similarity_request(self):
        sr = SimilarityRequest(
            symbol="THYAO",
            reference_date="2024-01-01",
            top_n=10,
        )
        assert sr.top_n == 10

    def test_similarity_analysis(self):
        sa = SimilarityAnalysis(
            overall_similarity=0.75,
            confidence_score=0.8,
        )
        assert sa.overall_similarity == 0.75

    def test_benchmark_result(self):
        br = BenchmarkResult(
            operation="test",
            iterations=10,
            avg_time_ms=1.5,
            success=True,
        )
        assert br.success is True

    def test_validation_period_days(self):
        assert VALIDATION_PERIOD_DAYS[ValidationPeriod.ONE_WEEK] == 5
        assert VALIDATION_PERIOD_DAYS[ValidationPeriod.ONE_MONTH] == 21
        assert VALIDATION_PERIOD_DAYS[ValidationPeriod.THREE_MONTHS] == 63
        assert VALIDATION_PERIOD_DAYS[ValidationPeriod.SIX_MONTHS] == 126
        assert VALIDATION_PERIOD_DAYS[ValidationPeriod.TWELVE_MONTHS] == 252
