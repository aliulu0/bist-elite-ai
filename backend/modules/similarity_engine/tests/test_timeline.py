from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    HistoricalOutcome,
    MarketRegime,
    PatternMemory,
    PatternOutcome,
    SimilarityResult,
    SimilarityLabel,
    SimilarityMethod,
    ValidationPeriod,
)
from modules.similarity_engine.timeline.analyzer import TimelineAnalyzer


def _result(symbol: str, date: str, score: float = 0.8, regime: MarketRegime = MarketRegime.SIDEWAYS, outcome: PatternOutcome = PatternOutcome.NEUTRAL) -> SimilarityResult:
    return SimilarityResult(
        source_symbol="SRC",
        target_symbol=symbol,
        target_date=date,
        similarity_score=score,
        similarity_label=SimilarityLabel.STRONG,
        method=SimilarityMethod.WEIGHTED_FEATURE,
        market_regime=regime,
        pattern_outcome=outcome,
    )


class TestTimelineAnalyzerConstruction:
    def test_init(self):
        analyzer = TimelineAnalyzer()
        assert analyzer._outcomes == {}
        assert analyzer._memories == []


class TestComputeHistoricalOutcomes:
    def test_synthetic_outcomes(self):
        analyzer = TimelineAnalyzer()
        results = [
            _result("A", "2024-01-01"),
            _result("B", "2024-01-01"),
        ]
        outcomes = analyzer.compute_historical_outcomes(results)
        assert len(outcomes) == 2
        assert "A_2024-01-01" in outcomes
        assert "B_2024-01-01" in outcomes
        for o in outcomes.values():
            assert isinstance(o, HistoricalOutcome)

    def test_with_price_data(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01")]
        prices = {"A": [100.0, 105.0, 110.0, 108.0, 115.0]}
        outcomes = analyzer.compute_historical_outcomes(results, price_data=prices)
        assert "A_2024-01-01" in outcomes
        assert outcomes["A_2024-01-01"].holding_period_days == 5


class TestAnalyzePeriodReturns:
    def test_analyze_period_returns(self):
        analyzer = TimelineAnalyzer()
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(
                period_return={"1w": 1.0, "1m": 3.0, "3m": 7.0},
                max_drawdown=-5.0,
                win_rate=60.0,
            ),
            "B_2024-01-01": HistoricalOutcome(
                period_return={"1w": -1.0, "1m": 2.0, "3m": 5.0},
                max_drawdown=-8.0,
                win_rate=55.0,
            ),
        }
        analysis = analyzer.analyze_period_returns(outcomes)
        assert "1w" in analysis
        assert "1m" in analysis
        assert analysis["1w"]["count"] == 2


class TestComputeRegimeDistribution:
    def test_regime_distribution(self):
        analyzer = TimelineAnalyzer()
        results = [
            _result("A", "2024-01-01", regime=MarketRegime.BULL),
            _result("B", "2024-01-01", regime=MarketRegime.BULL),
            _result("C", "2024-01-01", regime=MarketRegime.BEAR),
        ]
        dist = analyzer.compute_regime_distribution(results)
        assert dist["bull"] == 2
        assert dist["bear"] == 1


class TestComputePatternDistribution:
    def test_pattern_distribution(self):
        analyzer = TimelineAnalyzer()
        results = [
            _result("A", "2024-01-01", outcome=PatternOutcome.SUCCESSFUL),
            _result("B", "2024-01-01", outcome=PatternOutcome.SUCCESSFUL),
            _result("C", "2024-01-01", outcome=PatternOutcome.FAILED),
        ]
        dist = analyzer.compute_pattern_distribution(results)
        assert dist["successful"] == 2
        assert dist["failed"] == 1


class TestAnalyzeConfidence:
    def test_analyze_confidence(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01", score=0.8)]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(
                period_return={"1m": 5.0}, max_drawdown=-5.0, win_rate=70.0, total_cases=10,
            ),
        }
        confidence = analyzer.analyze_confidence(results, outcomes)
        assert 0.0 <= confidence <= 1.0

    def test_analyze_confidence_empty(self):
        analyzer = TimelineAnalyzer()
        assert analyzer.analyze_confidence([], {}) == 0.0


class TestBuildPatternMemory:
    def test_classifies_successful(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01", score=0.8)]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(
                period_return={"1m": 10.0, "3m": 15.0}, max_drawdown=-5.0, win_rate=70.0,
            ),
        }
        memories = analyzer.build_pattern_memory(results, outcomes)
        assert len(memories) == 1
        assert memories[0].outcome == PatternOutcome.SUCCESSFUL

    def test_classifies_failed(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01", score=0.8)]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(
                period_return={"1m": -10.0, "3m": -15.0}, max_drawdown=-20.0, win_rate=30.0,
            ),
        }
        memories = analyzer.build_pattern_memory(results, outcomes)
        assert len(memories) == 1
        assert memories[0].outcome == PatternOutcome.FAILED

    def test_classifies_neutral(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01", score=0.8)]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(
                period_return={"1m": 0.5, "3m": -0.5}, max_drawdown=-3.0, win_rate=50.0,
            ),
        }
        memories = analyzer.build_pattern_memory(results, outcomes)
        assert len(memories) == 1
        assert memories[0].outcome == PatternOutcome.NEUTRAL


class TestGetPatterns:
    def _setup_memories(self):
        analyzer = TimelineAnalyzer()
        results = [
            _result("A", "2024-01-01", score=0.8),
            _result("B", "2024-01-01", score=0.7),
            _result("C", "2024-01-01", score=0.6),
        ]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(period_return={"1m": 10.0}, max_drawdown=-5.0, win_rate=70.0),
            "B_2024-01-01": HistoricalOutcome(period_return={"1m": -10.0}, max_drawdown=-20.0, win_rate=30.0),
            "C_2024-01-01": HistoricalOutcome(period_return={"1m": 0.5}, max_drawdown=-3.0, win_rate=50.0),
        }
        memories = analyzer.build_pattern_memory(results, outcomes)
        return analyzer, memories

    def test_get_successful_patterns(self):
        analyzer, memories = self._setup_memories()
        successful = analyzer.get_successful_patterns(memories)
        assert all(m.outcome == PatternOutcome.SUCCESSFUL for m in successful)

    def test_get_failed_patterns(self):
        analyzer, memories = self._setup_memories()
        failed = analyzer.get_failed_patterns(memories)
        assert all(m.outcome == PatternOutcome.FAILED for m in failed)

    def test_get_neutral_patterns(self):
        analyzer, memories = self._setup_memories()
        neutral = analyzer.get_neutral_patterns(memories)
        assert all(m.outcome == PatternOutcome.NEUTRAL for m in neutral)


class TestSummarizeTimeline:
    def test_summarize_timeline(self):
        analyzer = TimelineAnalyzer()
        results = [
            _result("A", "2024-01-01", score=0.8, regime=MarketRegime.BULL, outcome=PatternOutcome.SUCCESSFUL),
            _result("B", "2024-01-01", score=0.6, regime=MarketRegime.BEAR, outcome=PatternOutcome.FAILED),
        ]
        outcomes = {
            "A_2024-01-01": HistoricalOutcome(period_return={"1m": 5.0}, max_drawdown=-5.0, win_rate=70.0, total_cases=10),
            "B_2024-01-01": HistoricalOutcome(period_return={"1m": -3.0}, max_drawdown=-15.0, win_rate=40.0, total_cases=10),
        }
        summary = analyzer.summarize_timeline(results, outcomes)
        assert summary["total_results"] == 2
        assert "avg_similarity_score" in summary
        assert "regime_distribution" in summary
        assert "pattern_distribution" in summary

    def test_summarize_empty(self):
        analyzer = TimelineAnalyzer()
        summary = analyzer.summarize_timeline([], {})
        assert summary["total_results"] == 0


class TestClear:
    def test_clear(self):
        analyzer = TimelineAnalyzer()
        results = [_result("A", "2024-01-01")]
        analyzer.compute_historical_outcomes(results)
        analyzer.build_pattern_memory(results, {"A_2024-01-01": HistoricalOutcome(period_return={"1m": 5.0})})
        analyzer.clear()
        assert analyzer._outcomes == {}
        assert analyzer._memories == []
