from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    HistoricalOutcome,
    MarketRegime,
    PatternOutcome,
    SimilarityLabel,
    SimilarityMethod,
    SimilarityResult,
    ValidationPeriod,
)
from modules.similarity_engine.ranking.engine import RankingEngine


def _result(symbol: str, date: str, score: float, regime: MarketRegime = MarketRegime.SIDEWAYS, outcome: PatternOutcome = PatternOutcome.NEUTRAL) -> SimilarityResult:
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


def _outcome(win_rate: float = 60.0, max_dd: float = -10.0, period_return: dict = None) -> HistoricalOutcome:
    return HistoricalOutcome(
        period_return=period_return or {"1m": 5.0, "3m": 8.0},
        max_drawdown=max_dd,
        win_rate=win_rate,
        holding_period_days=30,
        avg_return=5.0,
        total_cases=10,
        successful_cases=6,
        failed_cases=4,
    )


class TestRankingEngineConstruction:
    def test_init(self):
        engine = RankingEngine()
        assert engine._all_results == []
        assert engine._rankings == {}


class TestRankByScore:
    def test_rank_by_score(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.5),
            _result("B", "2024-01-01", 0.9),
            _result("C", "2024-01-01", 0.7),
        ]
        ranked = engine.rank_by_score(results, top_n=2)
        assert len(ranked) == 2
        assert ranked[0].target_symbol == "B"
        assert ranked[1].target_symbol == "C"


class TestRankByConsistency:
    def test_rank_by_consistency(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9),
            _result("B", "2024-01-01", 0.7),
            _result("C", "2024-01-01", 0.5),
        ]
        outcomes = {
            "A_2024-01-01": _outcome(win_rate=40.0),
            "B_2024-01-01": _outcome(win_rate=90.0),
            "C_2024-01-01": _outcome(win_rate=60.0),
        }
        ranked = engine.rank_by_consistency(results, outcomes, top_n=2)
        assert ranked[0].target_symbol == "B"
        assert ranked[1].target_symbol == "C"


class TestRankByReturn:
    def test_rank_by_return(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9),
            _result("B", "2024-01-01", 0.7),
        ]
        outcomes = {
            "A_2024-01-01": _outcome(period_return={"1m": 2.0}),
            "B_2024-01-01": _outcome(period_return={"1m": 10.0}),
        }
        ranked = engine.rank_by_return(results, outcomes, ValidationPeriod.ONE_MONTH, top_n=2)
        assert ranked[0].target_symbol == "B"


class TestRankByRisk:
    def test_rank_by_risk_lower_is_better(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9),
            _result("B", "2024-01-01", 0.7),
        ]
        outcomes = {
            "A_2024-01-01": _outcome(max_dd=-30.0),
            "B_2024-01-01": _outcome(max_dd=-5.0),
        }
        ranked = engine.rank_by_risk(results, outcomes, top_n=2)
        assert ranked[0].target_symbol == "B"


class TestCompositeRank:
    def test_composite_rank(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9),
            _result("B", "2024-01-01", 0.7),
            _result("C", "2024-01-01", 0.5),
        ]
        outcomes = {
            "A_2024-01-01": _outcome(win_rate=70.0, max_dd=-8.0, period_return={"1m": 7.0}),
            "B_2024-01-01": _outcome(win_rate=50.0, max_dd=-20.0, period_return={"1m": 3.0}),
        }
        ranked = engine.composite_rank(results, outcomes, top_n=2)
        assert len(ranked) == 2
        assert ranked[0].similarity_score >= ranked[1].similarity_score


class TestRankByRegime:
    def test_rank_by_regime(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9, regime=MarketRegime.BULL),
            _result("B", "2024-01-01", 0.7, regime=MarketRegime.BEAR),
            _result("C", "2024-01-01", 0.8, regime=MarketRegime.BULL),
        ]
        ranked = engine.rank_by_regime(results, MarketRegime.BULL, top_n=2)
        symbols = [r.target_symbol for r in ranked]
        assert "A" in symbols
        assert "C" in symbols
        assert "B" not in symbols

    def test_rank_by_regime_fallback(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9, regime=MarketRegime.BEAR),
        ]
        ranked = engine.rank_by_regime(results, MarketRegime.BULL, top_n=5)
        assert len(ranked) == 1


class TestRankByPatternOutcome:
    def test_rank_by_pattern_outcome(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.9, outcome=PatternOutcome.SUCCESSFUL),
            _result("B", "2024-01-01", 0.8, outcome=PatternOutcome.FAILED),
            _result("C", "2024-01-01", 0.7, outcome=PatternOutcome.SUCCESSFUL),
        ]
        ranked = engine.rank_by_pattern_outcome(results, PatternOutcome.SUCCESSFUL, top_n=5)
        for r in ranked:
            assert r.pattern_outcome == PatternOutcome.SUCCESSFUL


class TestDeduplicate:
    def test_deduplicate(self):
        engine = RankingEngine()
        results = [
            _result("A", "2024-01-01", 0.5),
            _result("A", "2024-01-01", 0.9),
            _result("B", "2024-01-01", 0.7),
        ]
        deduped = engine.deduplicate(results)
        assert len(deduped) == 2
        a_results = [r for r in deduped if r.target_symbol == "A"]
        assert len(a_results) == 1
        assert a_results[0].similarity_score == 0.9


class TestFilterByLabel:
    def test_filter_by_label(self):
        engine = RankingEngine()
        results = [
            SimilarityResult(source_symbol="S", target_symbol="A", target_date="2024-01-01", similarity_score=0.9, similarity_label=SimilarityLabel.EXCEPTIONAL),
            SimilarityResult(source_symbol="S", target_symbol="B", target_date="2024-01-01", similarity_score=0.3, similarity_label=SimilarityLabel.WEAK),
            SimilarityResult(source_symbol="S", target_symbol="C", target_date="2024-01-01", similarity_score=0.7, similarity_label=SimilarityLabel.STRONG),
        ]
        filtered = engine.filter_by_label(results, SimilarityLabel.STRONG)
        for r in filtered:
            assert r.similarity_label in (SimilarityLabel.STRONG, SimilarityLabel.VERY_STRONG, SimilarityLabel.EXCEPTIONAL)


class TestStoreAndGetRankings:
    def test_store_and_get(self):
        engine = RankingEngine()
        results = [_result("A", "2024-01-01", 0.9)]
        engine.store_results(results, key="test")
        got = engine.get_rankings("test")
        assert len(got) == 1

    def test_get_empty_key(self):
        engine = RankingEngine()
        assert engine.get_rankings("nonexistent") == []


class TestClear:
    def test_clear(self):
        engine = RankingEngine()
        engine.store_results([_result("A", "2024-01-01", 0.9)], key="k")
        engine.clear()
        assert engine.get_rankings("k") == []
        assert engine._all_results == []
