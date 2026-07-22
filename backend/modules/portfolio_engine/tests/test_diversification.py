from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.core.types import (
    StockCandidate,
    SelectionResult,
    RejectionReason,
)
from modules.portfolio_engine.diversification.diversifier import Diversifier


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
def diversifier():
    return Diversifier()


class TestDiversifyMaxPerSector:
    def test_no_sector_exceeds_max(self, diversifier):
        candidates = _make_candidates()
        selected = candidates[:10]
        diversified, overflow = diversifier.diversify(selected, [], max_per_sector=2)
        dist = diversifier.compute_sector_distribution(diversified)
        for sector, count in dist.items():
            assert count <= 2

    def test_overflow_receives_sector_concentration_reason(self, diversifier):
        three_banking = [
            StockCandidate(symbol="B1", sector="banking", elite_score=80, decision_score=70, confidence=60, risk=30, liquidity=60),
            StockCandidate(symbol="B2", sector="banking", elite_score=75, decision_score=65, confidence=55, risk=35, liquidity=55),
            StockCandidate(symbol="B3", sector="banking", elite_score=70, decision_score=60, confidence=50, risk=40, liquidity=50),
        ]
        diversified, overflow = diversifier.diversify(three_banking, [], max_per_sector=2)
        assert len(diversified) == 2
        assert len(overflow) == 1
        assert overflow[0].rejection_reason == RejectionReason.SECTOR_CONCENTRATION

    def test_preserves_existing_rejected(self, diversifier):
        c1 = StockCandidate(symbol="X", sector="tech", elite_score=80, decision_score=70, confidence=60, risk=30, liquidity=60)
        existing_rejected = [
            SelectionResult(symbol="OLD", selected=False, reason="low_elite_score", rejection_reason=RejectionReason.LOW_ELITE_SCORE),
        ]
        diversified, overflow = diversifier.diversify([c1], existing_rejected, max_per_sector=2)
        overflow_symbols = [r.symbol for r in overflow]
        assert "OLD" in overflow_symbols

    def test_single_sector_two_allowed(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech", elite_score=80, decision_score=70, confidence=60, risk=30, liquidity=60),
            StockCandidate(symbol="B", sector="tech", elite_score=75, decision_score=65, confidence=55, risk=35, liquidity=55),
        ]
        diversified, overflow = diversifier.diversify(candidates, [], max_per_sector=2)
        assert len(diversified) == 2
        assert len(overflow) == 0


class TestCountSector:
    def test_count_zero(self, diversifier):
        assert diversifier._count_sector("banking", []) == 0

    def test_count_matches(self, diversifier):
        candidates = [
            StockCandidate(symbol="B1", sector="banking"),
            StockCandidate(symbol="B2", sector="banking"),
            StockCandidate(symbol="T1", sector="tech"),
        ]
        assert diversifier._count_sector("banking", candidates) == 2
        assert diversifier._count_sector("tech", candidates) == 1
        assert diversifier._count_sector("energy", candidates) == 0


class TestCanAdd:
    def test_can_add_empty(self, diversifier):
        assert diversifier._can_add("banking", [], 2) is True

    def test_can_add_below_limit(self, diversifier):
        candidates = [StockCandidate(symbol="B1", sector="banking")]
        assert diversifier._can_add("banking", candidates, 2) is True

    def test_cannot_add_at_limit(self, diversifier):
        candidates = [
            StockCandidate(symbol="B1", sector="banking"),
            StockCandidate(symbol="B2", sector="banking"),
        ]
        assert diversifier._can_add("banking", candidates, 2) is False

    def test_can_add_different_sector(self, diversifier):
        candidates = [
            StockCandidate(symbol="B1", sector="banking"),
            StockCandidate(symbol="B2", sector="banking"),
        ]
        assert diversifier._can_add("tech", candidates, 2) is True


class TestSectorDistribution:
    def test_empty(self, diversifier):
        assert diversifier.compute_sector_distribution([]) == {}

    def test_mixed_sectors(self, diversifier):
        candidates = [
            StockCandidate(symbol="B1", sector="banking"),
            StockCandidate(symbol="B2", sector="banking"),
            StockCandidate(symbol="T1", sector="tech"),
        ]
        dist = diversifier.compute_sector_distribution(candidates)
        assert dist == {"banking": 2, "tech": 1}


class TestDiversificationScore:
    def test_empty(self, diversifier):
        assert diversifier.compute_diversification_score([]) == 0.0

    def test_single_stock(self, diversifier):
        candidates = [StockCandidate(symbol="X", sector="tech")]
        assert diversifier.compute_diversification_score(candidates) == 0.0

    def test_diversified_high_score(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="banking"),
            StockCandidate(symbol="C", sector="energy"),
            StockCandidate(symbol="D", sector="retail"),
        ]
        score = diversifier.compute_diversification_score(candidates)
        assert score > 70.0

    def test_concentrated_single_sector(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="tech"),
            StockCandidate(symbol="C", sector="tech"),
            StockCandidate(symbol="D", sector="tech"),
        ]
        score = diversifier.compute_diversification_score(candidates)
        assert score == pytest.approx(100.0)

    def test_mostly_concentrated_lower_score(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="tech"),
            StockCandidate(symbol="C", sector="tech"),
            StockCandidate(symbol="D", sector="banking"),
        ]
        score = diversifier.compute_diversification_score(candidates)
        assert score < 80.0

    def test_two_sector_score(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="tech"),
            StockCandidate(symbol="C", sector="banking"),
            StockCandidate(symbol="D", sector="banking"),
        ]
        score = diversifier.compute_diversification_score(candidates)
        assert score == pytest.approx(100.0)

    def test_three_sectors_uneven(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="tech"),
            StockCandidate(symbol="C", sector="tech"),
            StockCandidate(symbol="D", sector="banking"),
            StockCandidate(symbol="E", sector="energy"),
        ]
        score = diversifier.compute_diversification_score(candidates)
        assert 0.0 < score < 100.0


class TestConcentrationRisk:
    def test_empty(self, diversifier):
        assert diversifier.compute_concentration_risk([]) == 0.0

    def test_single_stock(self, diversifier):
        candidates = [StockCandidate(symbol="X", sector="tech")]
        assert diversifier.compute_concentration_risk(candidates) == 100.0

    def test_even_distribution(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="banking"),
            StockCandidate(symbol="C", sector="energy"),
            StockCandidate(symbol="D", sector="retail"),
        ]
        risk = diversifier.compute_concentration_risk(candidates)
        assert risk == pytest.approx(25.0)

    def test_concentrated_high_risk(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", sector="tech"),
            StockCandidate(symbol="B", sector="tech"),
            StockCandidate(symbol="C", sector="tech"),
            StockCandidate(symbol="D", sector="banking"),
        ]
        risk = diversifier.compute_concentration_risk(candidates)
        assert risk == pytest.approx(75.0)


class TestLiquidityDistribution:
    def test_empty(self, diversifier):
        result = diversifier.compute_liquidity_distribution([])
        assert result == {"low": 0, "medium": 0, "high": 0}

    def test_low_bucket(self, diversifier):
        candidates = [StockCandidate(symbol="A", liquidity=20.0)]
        result = diversifier.compute_liquidity_distribution(candidates)
        assert result["low"] == 1

    def test_medium_bucket(self, diversifier):
        candidates = [StockCandidate(symbol="A", liquidity=50.0)]
        result = diversifier.compute_liquidity_distribution(candidates)
        assert result["medium"] == 1

    def test_high_bucket(self, diversifier):
        candidates = [StockCandidate(symbol="A", liquidity=80.0)]
        result = diversifier.compute_liquidity_distribution(candidates)
        assert result["high"] == 1

    def test_boundary_low_medium(self, diversifier):
        candidates = [StockCandidate(symbol="A", liquidity=32.9)]
        result = diversifier.compute_liquidity_distribution(candidates)
        assert result["low"] == 1

    def test_boundary_medium_high(self, diversifier):
        candidates = [StockCandidate(symbol="A", liquidity=65.9)]
        result = diversifier.compute_liquidity_distribution(candidates)
        assert result["medium"] == 1


class TestRiskDistribution:
    def test_empty(self, diversifier):
        result = diversifier.compute_risk_distribution([])
        assert all(v == 0 for v in result.values())

    def test_very_low(self, diversifier):
        candidates = [StockCandidate(symbol="A", risk=15.0)]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["very_low"] == 1

    def test_low(self, diversifier):
        candidates = [StockCandidate(symbol="A", risk=35.0)]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["low"] == 1

    def test_moderate(self, diversifier):
        candidates = [StockCandidate(symbol="A", risk=55.0)]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["moderate"] == 1

    def test_high(self, diversifier):
        candidates = [StockCandidate(symbol="A", risk=75.0)]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["high"] == 1

    def test_very_high(self, diversifier):
        candidates = [StockCandidate(symbol="A", risk=90.0)]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["very_high"] == 1

    def test_boundary_values(self, diversifier):
        candidates = [
            StockCandidate(symbol="A", risk=20.0),
            StockCandidate(symbol="B", risk=40.0),
            StockCandidate(symbol="C", risk=60.0),
            StockCandidate(symbol="D", risk=80.0),
        ]
        result = diversifier.compute_risk_distribution(candidates)
        assert result["very_low"] == 1
        assert result["low"] == 1
        assert result["moderate"] == 1
        assert result["high"] == 1

    def test_mixed(self, diversifier):
        candidates = _make_candidates()[:6]
        result = diversifier.compute_risk_distribution(candidates)
        total = sum(result.values())
        assert total == 6


class TestDiversifyOverflow:
    def test_all_same_sector(self, diversifier):
        candidates = [
            StockCandidate(symbol=f"B{i}", sector="banking", elite_score=80 - i, decision_score=70, confidence=60, risk=30, liquidity=50)
            for i in range(5)
        ]
        diversified, overflow = diversifier.diversify(candidates, [], max_per_sector=2)
        assert len(diversified) == 2
        assert len(overflow) == 3
        for r in overflow:
            assert r.rejection_reason == RejectionReason.SECTOR_CONCENTRATION

    def test_diversified_plus_overflow(self, diversifier):
        candidates = [
            StockCandidate(symbol="A1", sector="tech", elite_score=80, decision_score=70, confidence=60, risk=30, liquidity=50),
            StockCandidate(symbol="A2", sector="tech", elite_score=78, decision_score=68, confidence=58, risk=32, liquidity=48),
            StockCandidate(symbol="B1", sector="banking", elite_score=76, decision_score=66, confidence=56, risk=34, liquidity=46),
            StockCandidate(symbol="B2", sector="banking", elite_score=74, decision_score=64, confidence=54, risk=36, liquidity=44),
            StockCandidate(symbol="B3", sector="banking", elite_score=72, decision_score=62, confidence=52, risk=38, liquidity=42),
        ]
        diversified, overflow = diversifier.diversify(candidates, [], max_per_sector=2)
        assert len(diversified) == 4
        assert len(overflow) == 1
        assert overflow[0].symbol == "B3"
