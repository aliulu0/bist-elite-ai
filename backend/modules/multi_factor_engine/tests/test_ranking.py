from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    FactorProfile,
    FactorScore,
    GroupScore,
    ScoreStrength,
)
from modules.multi_factor_engine.ranking.ranker import FactorRanker


def _make_factor_score(name: FactorName, score: float) -> FactorScore:
    return FactorScore(factor=name, score=score, strength=ScoreStrength.NEUTRAL)


def _make_group_score(group: FactorGroup, score: float, factors=None) -> GroupScore:
    return GroupScore(
        group=group,
        score=score,
        factors=factors or [],
        strength=ScoreStrength.NEUTRAL,
    )


class TestRank:
    def setup_method(self):
        self.ranker = FactorRanker()

    def test_basic_rank(self):
        gs = [_make_group_score(FactorGroup.VALUE, 80.0)]
        fs = [_make_factor_score(FactorName.RSI, 90.0)]
        ranking = self.ranker.rank(gs, fs, symbol="TEST")
        assert ranking.symbol == "TEST"
        assert len(ranking.group_ranks) == 1
        assert ranking.group_ranks["value"] == 1

    def test_sorted_group_scores(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 80.0),
            _make_group_score(FactorGroup.GROWTH, 90.0),
            _make_group_score(FactorGroup.QUALITY, 60.0),
        ]
        ranking = self.ranker.rank(gs, [])
        assert ranking.group_ranks["growth"] == 1
        assert ranking.group_ranks["value"] == 2
        assert ranking.group_ranks["quality"] == 3

    def test_group_ranks_assigned(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 70.0),
            _make_group_score(FactorGroup.MOMENTUM, 85.0),
        ]
        self.ranker.rank(gs, [])
        assert gs[1].rank == 1
        assert gs[0].rank == 2

    def test_factor_ranks(self):
        fs = [
            _make_factor_score(FactorName.RSI, 90.0),
            _make_factor_score(FactorName.ADX, 60.0),
            _make_factor_score(FactorName.ROC, 75.0),
        ]
        ranking = self.ranker.rank([], fs)
        assert ranking.factor_ranks["rsi"] == 1
        assert ranking.factor_ranks["roc"] == 2
        assert ranking.factor_ranks["adx"] == 3

    def test_strength_factors_top_20_percent(self):
        fs = [
            _make_factor_score(FactorName.RSI, 95.0),
            _make_factor_score(FactorName.ADX, 85.0),
            _make_factor_score(FactorName.ROC, 75.0),
            _make_factor_score(FactorName.CMF, 65.0),
            _make_factor_score(FactorName.OBV, 55.0),
        ]
        ranking = self.ranker.rank([], fs)
        assert len(ranking.strength_factors) == 1
        assert ranking.strength_factors[0] == "rsi"

    def test_weakness_factors_bottom_20_percent(self):
        fs = [
            _make_factor_score(FactorName.RSI, 95.0),
            _make_factor_score(FactorName.ADX, 85.0),
            _make_factor_score(FactorName.ROC, 75.0),
            _make_factor_score(FactorName.CMF, 65.0),
            _make_factor_score(FactorName.OBV, 25.0),
        ]
        ranking = self.ranker.rank([], fs)
        assert len(ranking.weakness_factors) == 1
        assert ranking.weakness_factors[0] == "obv"

    def test_percentile_equals_mean_group_score(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 80.0),
            _make_group_score(FactorGroup.GROWTH, 60.0),
        ]
        ranking = self.ranker.rank(gs, [])
        assert abs(ranking.percentile - 70.0) < 1e-6

    def test_empty_groups_and_factors(self):
        ranking = self.ranker.rank([], [])
        assert ranking.symbol == ""
        assert ranking.group_ranks == {}
        assert ranking.factor_ranks == {}
        assert ranking.percentile == 0.0

    def test_single_factor(self):
        fs = [_make_factor_score(FactorName.RSI, 80.0)]
        ranking = self.ranker.rank([], fs)
        assert ranking.strength_factors == ["rsi"]
        assert ranking.weakness_factors == ["rsi"]


class TestRankBatch:
    def setup_method(self):
        self.ranker = FactorRanker()

    def test_single_profile(self):
        p = FactorProfile(
            symbol="AAPL",
            reference_date="2024-01-01",
            overall_score=80.0,
            strengths=["value (80.0)"],
            weaknesses=["risk (30.0)"],
        )
        results = self.ranker.rank_batch([p])
        assert len(results) == 1
        assert results[0].symbol == "AAPL"
        assert results[0].percentile == 80.0
        assert results[0].strength_factors == ["value (80.0)"]

    def test_multiple_profiles_sorted_by_score(self):
        p1 = FactorProfile(symbol="AAPL", reference_date="2024-01-01", overall_score=80.0)
        p2 = FactorProfile(symbol="GOOG", reference_date="2024-01-01", overall_score=90.0)
        p3 = FactorProfile(symbol="MSFT", reference_date="2024-01-01", overall_score=70.0)
        results = self.ranker.rank_batch([p1, p2, p3])
        ranks = {r.symbol: r.overall_rank for r in results}
        assert ranks["GOOG"] == 1
        assert ranks["AAPL"] == 2
        assert ranks["MSFT"] == 3

    def test_empty_profiles(self):
        results = self.ranker.rank_batch([])
        assert results == []

    def test_ranking_preserves_original_list(self):
        p1 = FactorProfile(symbol="A", reference_date="2024-01-01", overall_score=50.0)
        p2 = FactorProfile(symbol="B", reference_date="2024-01-01", overall_score=90.0)
        results = self.ranker.rank_batch([p1, p2])
        assert results[0].symbol == "A"
        assert results[1].symbol == "B"

    def test_strengths_and_weaknesses_copied(self):
        p = FactorProfile(
            symbol="X",
            reference_date="2024-01-01",
            overall_score=60.0,
            strengths=["value", "growth"],
            weaknesses=["risk", "momentum"],
        )
        results = self.ranker.rank_batch([p])
        assert results[0].strength_factors == ["value", "growth"]
        assert results[0].weakness_factors == ["risk", "momentum"]
