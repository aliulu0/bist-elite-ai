from __future__ import annotations

import pytest
from modules.pattern_engine.similarity.pattern_similarity import PatternSimilarityEngine
from modules.pattern_engine.core.types import (
    PatternResult, PatternCategory, PatternDirection, PatternStatus,
)


def _make_result(
    name: str = "Test",
    direction: PatternDirection = PatternDirection.BULLISH,
    confidence: float = 0.75,
    risk: float = 0.02,
) -> PatternResult:
    return PatternResult(
        pattern_name=name,
        category=PatternCategory.CLASSICAL,
        direction=direction,
        status=PatternStatus.CONFIRMED,
        confidence=confidence,
        probability=confidence * 0.8,
        risk=risk,
        expected_pullback=risk * 0.5,
        pattern_quality=confidence * 0.9,
        confirmation_score=0.8,
    )


class TestPatternSimilarity:
    def test_cosine_identical(self):
        a = [1.0, 2.0, 3.0]
        assert PatternSimilarityEngine.cosine_similarity(a, a) == pytest.approx(1.0, abs=1e-6)

    def test_cosine_orthogonal(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert PatternSimilarityEngine.cosine_similarity(a, b) == pytest.approx(0.0, abs=1e-6)

    def test_cosine_empty(self):
        assert PatternSimilarityEngine.cosine_similarity([], []) == 0.0

    def test_cosine_different_lengths(self):
        assert PatternSimilarityEngine.cosine_similarity([1.0], [1.0, 2.0]) == 0.0

    def test_find_similar_empty_history(self):
        target = _make_result()
        result = PatternSimilarityEngine.find_similar(target, [])
        assert result.similarity_score == 0.0
        assert result.similar_patterns == []
        assert result.top_historical_match == ""

    def test_find_similar_with_matches(self):
        target = _make_result(confidence=0.8, risk=0.02)
        history = [
            _make_result("A", confidence=0.8, risk=0.02),
            _make_result("B", confidence=0.3, risk=0.10),
            _make_result("C", confidence=0.79, risk=0.025),
        ]
        result = PatternSimilarityEngine.find_similar(target, history, top_k=2)
        assert result.similarity_score > 0
        assert len(result.similar_patterns) == 2
        assert result.top_historical_match in ["A", "B", "C"]

    def test_find_similar_top_k_limit(self):
        target = _make_result()
        history = [_make_result(f"P{i}") for i in range(10)]
        result = PatternSimilarityEngine.find_similar(target, history, top_k=3)
        assert len(result.similar_patterns) == 3

    def test_find_similar_different_directions(self):
        target = _make_result(direction=PatternDirection.BULLISH)
        history = [
            _make_result("Bear", direction=PatternDirection.BEARISH, confidence=0.8),
            _make_result("Bull", direction=PatternDirection.BULLISH, confidence=0.8),
        ]
        result = PatternSimilarityEngine.find_similar(target, history, top_k=2)
        assert result.similar_patterns[0]["direction"] == "bullish"
