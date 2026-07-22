from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    FeatureVector,
    SimilarityMethod,
    SimilarityResult,
)
from modules.similarity_engine.similarity_models.models import SimilarityEngine


def _make_vector(symbol: str, date: str, features: dict) -> FeatureVector:
    return FeatureVector(symbol=symbol, date=date, features=features)


FEATURES_A = {"rsi": 55.0, "macd": 1.2, "ma_short": 100.0, "ma_long": 200.0, "adx": 25.0}
FEATURES_B = {"rsi": 56.0, "macd": 1.3, "ma_short": 101.0, "ma_long": 199.0, "adx": 24.0}
FEATURES_C = {"rsi": 30.0, "macd": -0.5, "ma_short": 80.0, "ma_long": 250.0, "adx": 45.0}
FEATURES_D = {"rsi": 55.5, "macd": 1.25, "ma_short": 100.5, "ma_long": 200.5, "adx": 25.5}


class TestSimilarityEngineConstruction:
    def test_default_construction(self):
        engine = SimilarityEngine()
        assert engine.get_weights() == SimilarityEngine.DEFAULT_WEIGHTS

    def test_custom_weights(self):
        custom = {"rsi": 2.0, "macd": 3.0}
        engine = SimilarityEngine(weights=custom)
        weights = engine.get_weights()
        assert weights["rsi"] == 2.0
        assert weights["macd"] == 3.0


class TestComputeSimilarity:
    def test_identical_vectors(self):
        engine = SimilarityEngine()
        vec = _make_vector("SYM", "2024-01-01", FEATURES_A.copy())
        result = engine.compute_similarity(vec, vec)
        assert result.similarity_score == pytest.approx(1.0, abs=1e-4)

    def test_different_vectors(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_C)
        result = engine.compute_similarity(vec_a, vec_b)
        assert result.similarity_score < 1.0

    def test_no_common_features(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", {"x": 1.0})
        vec_b = _make_vector("B", "2024-01-01", {"y": 2.0})
        result = engine.compute_similarity(vec_a, vec_b)
        assert result.similarity_score == 0.0

    def test_weighted_feature_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.WEIGHTED_FEATURE)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.WEIGHTED_FEATURE

    def test_cosine_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.COSINE)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.COSINE

    def test_euclidean_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.EUCLIDEAN)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.EUCLIDEAN

    def test_manhattan_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.MANHATTAN)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.MANHATTAN

    def test_dtw_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.DYNAMIC_TIME_WARPING)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.DYNAMIC_TIME_WARPING

    def test_hybrid_method(self):
        engine = SimilarityEngine()
        vec_a = _make_vector("A", "2024-01-01", FEATURES_A)
        vec_b = _make_vector("B", "2024-01-01", FEATURES_B)
        result = engine.compute_similarity(vec_a, vec_b, method=SimilarityMethod.HYBRID)
        assert 0.0 <= result.similarity_score <= 1.0
        assert result.method == SimilarityMethod.HYBRID


class TestFindMostSimilar:
    def test_returns_top_n(self):
        engine = SimilarityEngine()
        query = _make_vector("Q", "2024-01-01", FEATURES_A)
        candidates = [
            _make_vector("A", "2024-01-01", FEATURES_A),
            _make_vector("B", "2024-01-01", FEATURES_B),
            _make_vector("C", "2024-01-01", FEATURES_C),
            _make_vector("D", "2024-01-01", FEATURES_D),
        ]
        results = engine.find_most_similar(query, candidates, top_n=2)
        assert len(results) == 2
        assert results[0].similarity_score >= results[1].similarity_score

    def test_excludes_query_symbol(self):
        engine = SimilarityEngine()
        query = _make_vector("Q", "2024-01-01", FEATURES_A)
        candidates = [
            _make_vector("Q", "2024-01-01", FEATURES_A),
            _make_vector("B", "2024-01-01", FEATURES_B),
        ]
        results = engine.find_most_similar(query, candidates, top_n=5)
        for r in results:
            assert not (r.target_symbol == "Q" and r.target_date == "2024-01-01")

    def test_min_score_filter(self):
        engine = SimilarityEngine()
        query = _make_vector("Q", "2024-01-01", FEATURES_A)
        candidates = [
            _make_vector("C", "2024-01-01", FEATURES_C),
            _make_vector("D", "2024-01-01", FEATURES_D),
        ]
        results = engine.find_most_similar(query, candidates, top_n=5, min_score=0.99)
        for r in results:
            assert r.similarity_score >= 0.99


class TestBatchSimilarity:
    def test_multiple_methods(self):
        engine = SimilarityEngine()
        query = _make_vector("Q", "2024-01-01", FEATURES_A)
        candidates = [
            _make_vector("B", "2024-01-01", FEATURES_B),
            _make_vector("C", "2024-01-01", FEATURES_C),
        ]
        methods = [SimilarityMethod.WEIGHTED_FEATURE, SimilarityMethod.COSINE]
        results = engine.batch_similarity(query, candidates, methods, top_n=2)
        assert set(results.keys()) == set(methods)
        for m in methods:
            assert isinstance(results[m], list)
            assert len(results[m]) <= 2


class TestEnsembleSimilarity:
    def test_combines_methods(self):
        engine = SimilarityEngine()
        query = _make_vector("Q", "2024-01-01", FEATURES_A)
        candidates = [
            _make_vector("B", "2024-01-01", FEATURES_B),
            _make_vector("C", "2024-01-01", FEATURES_C),
        ]
        methods = [SimilarityMethod.WEIGHTED_FEATURE, SimilarityMethod.COSINE]
        results = engine.ensemble_similarity(query, candidates, methods=methods, top_n=2)
        assert len(results) <= 2
        for r in results:
            assert 0.0 <= r.similarity_score <= 1.0
            assert r.method == SimilarityMethod.HYBRID


class TestWeights:
    def test_set_and_get_weights(self):
        engine = SimilarityEngine()
        engine.set_weights({"rsi": 5.0, "adx": 99.0})
        w = engine.get_weights()
        assert w["rsi"] == 5.0
        assert w["adx"] == 99.0
