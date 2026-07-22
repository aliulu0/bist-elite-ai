from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.core.types import (
    StockCandidate,
    SortField,
    compute_composite_score,
)
from modules.portfolio_engine.ranking.ranker import StockRanker


def _make_candidates():
    return [
        StockCandidate(symbol="THYAO", sector="aviation", elite_score=85, decision_score=80, confidence=75, risk=30, liquidity=70),
        StockCandidate(symbol="GARAN", sector="banking", elite_score=78, decision_score=72, confidence=68, risk=40, liquidity=65),
        StockCandidate(symbol="ASELS", sector="defense", elite_score=72, decision_score=68, confidence=62, risk=35, liquidity=55),
        StockCandidate(symbol="SISE", sector="glass", elite_score=68, decision_score=65, confidence=58, risk=45, liquidity=50),
        StockCandidate(symbol="EREGL", sector="steel", elite_score=65, decision_score=62, confidence=55, risk=50, liquidity=48),
        StockCandidate(symbol="KCHOL", sector="auto", elite_score=62, decision_score=58, confidence=52, risk=55, liquidity=45),
        StockCandidate(symbol="BIMAS", sector="retail", elite_score=58, decision_score=55, confidence=48, risk=42, liquidity=60),
        StockCandidate(symbol="AKBNK", sector="banking", elite_score=55, decision_score=52, confidence=45, risk=48, liquidity=58),
        StockCandidate(symbol="TUPRS", sector="energy", elite_score=50, decision_score=48, confidence=40, risk=60, liquidity=42),
        StockCandidate(symbol="SAHOL", sector="banking", elite_score=35, decision_score=30, confidence=25, risk=70, liquidity=30),
        StockCandidate(symbol="KRDMD", sector="steel", elite_score=28, decision_score=25, confidence=20, risk=75, liquidity=25),
        StockCandidate(symbol="VESTL", sector="electronics", elite_score=20, decision_score=18, confidence=15, risk=85, liquidity=20),
    ]


@pytest.fixture
def ranker():
    return StockRanker()


class TestRankComposite:
    def test_returns_all_candidates(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        assert len(result) == len(candidates)

    def test_ranked_descending_composite(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        for i in range(len(result) - 1):
            assert result[i].composite_score >= result[i + 1].composite_score

    def test_ranks_assigned_sequentially(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        for i, c in enumerate(result, start=1):
            assert c.rank == i

    def test_first_is_best(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        assert result[0].symbol == "THYAO"

    def test_last_is_worst(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        assert result[-1].symbol == "VESTL"


class TestRankByComposite:
    def test_composite_scores_set(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_composite(candidates)
        for c in result:
            assert c.composite_score > 0

    def test_descending_order(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_composite(candidates)
        scores = [c.composite_score for c in result]
        assert scores == sorted(scores, reverse=True)


class TestRankByElite:
    def test_elite_descending(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_elite(candidates)
        elites = [c.elite_score for c in result]
        assert elites == sorted(elites, reverse=True)

    def test_top_is_highest_elite(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_elite(candidates)
        assert result[0].symbol == "THYAO"


class TestRankByDecision:
    def test_decision_descending(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_decision(candidates)
        decisions = [c.decision_score for c in result]
        assert decisions == sorted(decisions, reverse=True)


class TestRankByConfidence:
    def test_confidence_descending(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_confidence(candidates)
        confs = [c.confidence for c in result]
        assert confs == sorted(confs, reverse=True)


class TestRankByRisk:
    def test_risk_ascending(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_risk(candidates)
        risks = [c.risk for c in result]
        assert risks == sorted(risks)

    def test_lowest_risk_first(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_risk(candidates)
        assert result[0].risk <= result[-1].risk


class TestRankByLiquidity:
    def test_liquidity_descending(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank_by_liquidity(candidates)
        liqs = [c.liquidity for c in result]
        assert liqs == sorted(liqs, reverse=True)


class TestComputeCompositeScores:
    def test_sets_composite_on_all(self, ranker):
        candidates = _make_candidates()
        ranker.compute_composite_scores(candidates)
        for c in candidates:
            assert c.composite_score > 0

    def test_matches_formula(self, ranker):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=60, confidence=40, risk=50, liquidity=70)
        ranker.compute_composite_scores([c])
        expected = compute_composite_score(80, 60, 40, 50, 70)
        assert c.composite_score == pytest.approx(expected)


class TestRankEmptyCandidates:
    def test_empty_list(self, ranker):
        result = ranker.rank([], sort_by=SortField.COMPOSITE)
        assert result == []

    def test_empty_rank_by_elite(self, ranker):
        assert ranker.rank_by_elite([]) == []

    def test_empty_rank_by_composite(self, ranker):
        assert ranker.rank_by_composite([]) == []


class TestRankSingleCandidate:
    def test_single_gets_rank_1(self, ranker):
        candidates = [StockCandidate(symbol="SOLO", sector="tech", elite_score=50, decision_score=50, confidence=50, risk=50, liquidity=50)]
        result = ranker.rank(candidates, sort_by=SortField.COMPOSITE)
        assert len(result) == 1
        assert result[0].rank == 1
        assert result[0].symbol == "SOLO"

    def test_single_rank_by_risk(self, ranker):
        candidates = [StockCandidate(symbol="R1", risk=25)]
        result = ranker.rank_by_risk(candidates)
        assert len(result) == 1
        assert result[0].symbol == "R1"


class TestRankSortFieldDispatch:
    def test_sort_by_elite_score_dispatch(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.ELITE_SCORE)
        elites = [c.elite_score for c in result]
        assert elites == sorted(elites, reverse=True)

    def test_sort_by_risk_dispatch(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.RISK)
        risks = [c.risk for c in result]
        assert risks == sorted(risks)

    def test_sort_by_confidence_dispatch(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.CONFIDENCE)
        confs = [c.confidence for c in result]
        assert confs == sorted(confs, reverse=True)

    def test_sort_by_decision_dispatch(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.DECISION_SCORE)
        decisions = [c.decision_score for c in result]
        assert decisions == sorted(decisions, reverse=True)

    def test_sort_by_liquidity_dispatch(self, ranker):
        candidates = _make_candidates()
        result = ranker.rank(candidates, sort_by=SortField.LIQUIDITY)
        liqs = [c.liquidity for c in result]
        assert liqs == sorted(liqs, reverse=True)
