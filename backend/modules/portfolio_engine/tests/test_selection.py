from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.core.types import (
    StockCandidate,
    PortfolioRequest,
    RejectionReason,
    MIN_ELITE_SCORE,
    MIN_CONFIDENCE,
    MIN_LIQUIDITY,
    MAX_RISK_FOR_INCLUSION,
    MIN_DECISION_SCORE,
)
from modules.portfolio_engine.selection.selector import PortfolioSelector


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
def selector():
    return PortfolioSelector()


@pytest.fixture
def default_request():
    return PortfolioRequest(
        reference_date="2026-01-15",
        min_elite_score=MIN_ELITE_SCORE,
        min_confidence=MIN_CONFIDENCE,
        min_liquidity=MIN_LIQUIDITY,
        max_risk=MAX_RISK_FOR_INCLUSION,
        min_decision_score=MIN_DECISION_SCORE,
    )


class TestSelectAllPass:
    def test_select_with_all_passing(self, selector, default_request):
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, default_request)
        assert len(selected) > 0
        assert len(selected) + len(rejected) == len(candidates)

    def test_selected_have_correct_attributes(self, selector, default_request):
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, default_request)
        for s in selected:
            assert s.elite_score >= MIN_ELITE_SCORE
            assert s.confidence >= MIN_CONFIDENCE
            assert s.liquidity >= MIN_LIQUIDITY
            assert s.risk <= MAX_RISK_FOR_INCLUSION
            assert s.decision_score >= MIN_DECISION_SCORE

    def test_rejected_have_rejection_reasons(self, selector, default_request):
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, default_request)
        for r in rejected:
            assert r.selected is False
            assert r.rejection_reason is not None
            assert isinstance(r.rejection_reason, RejectionReason)

    def test_total_count_preserved(self, selector, default_request):
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, default_request)
        assert len(selected) + len(rejected) == 12


class TestSelectFailsLowEliteScore:
    def test_low_elite_rejected(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=50.0,
            min_confidence=0.0,
            min_liquidity=0.0,
            max_risk=100.0,
            min_decision_score=0.0,
        )
        candidates = [
            StockCandidate(symbol="GOOD", elite_score=60, decision_score=50, confidence=50, risk=50, liquidity=50),
            StockCandidate(symbol="BAD", elite_score=30, decision_score=50, confidence=50, risk=50, liquidity=50),
        ]
        selected, rejected = selector.select(candidates, request)
        selected_symbols = [s.symbol for s in selected]
        rejected_symbols = [r.symbol for r in rejected]
        assert "GOOD" in selected_symbols
        assert "BAD" in rejected_symbols

    def test_low_elite_reason(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=50.0,
            min_confidence=0.0,
            min_liquidity=0.0,
            max_risk=100.0,
            min_decision_score=0.0,
        )
        candidates = [
            StockCandidate(symbol="FAIL", elite_score=20, decision_score=50, confidence=50, risk=50, liquidity=50),
        ]
        _, rejected = selector.select(candidates, request)
        assert len(rejected) == 1
        assert rejected[0].rejection_reason == RejectionReason.LOW_ELITE_SCORE


class TestSelectFailsLowConfidence:
    def test_low_confidence_rejected(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=0.0,
            min_confidence=50.0,
            min_liquidity=0.0,
            max_risk=100.0,
            min_decision_score=0.0,
        )
        candidates = [
            StockCandidate(symbol="GOOD", elite_score=80, decision_score=50, confidence=60, risk=50, liquidity=50),
            StockCandidate(symbol="FAIL", elite_score=80, decision_score=50, confidence=30, risk=50, liquidity=50),
        ]
        selected, rejected = selector.select(candidates, request)
        rejected_symbols = [r.symbol for r in rejected]
        assert "FAIL" in rejected_symbols
        assert rejected[0].rejection_reason == RejectionReason.LOW_CONFIDENCE


class TestSelectFailsLowLiquidity:
    def test_low_liquidity_rejected(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=0.0,
            min_confidence=0.0,
            min_liquidity=40.0,
            max_risk=100.0,
            min_decision_score=0.0,
        )
        candidates = [
            StockCandidate(symbol="GOOD", elite_score=80, decision_score=50, confidence=50, risk=50, liquidity=60),
            StockCandidate(symbol="FAIL", elite_score=80, decision_score=50, confidence=50, risk=50, liquidity=20),
        ]
        selected, rejected = selector.select(candidates, request)
        rejected_symbols = [r.symbol for r in rejected]
        assert "FAIL" in rejected_symbols
        assert rejected[0].rejection_reason == RejectionReason.LOW_LIQUIDITY


class TestSelectFailsHighRisk:
    def test_high_risk_rejected(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=0.0,
            min_confidence=0.0,
            min_liquidity=0.0,
            max_risk=50.0,
            min_decision_score=0.0,
        )
        candidates = [
            StockCandidate(symbol="GOOD", elite_score=80, decision_score=50, confidence=50, risk=30, liquidity=50),
            StockCandidate(symbol="FAIL", elite_score=80, decision_score=50, confidence=50, risk=85, liquidity=50),
        ]
        selected, rejected = selector.select(candidates, request)
        rejected_symbols = [r.symbol for r in rejected]
        assert "FAIL" in rejected_symbols
        assert rejected[0].rejection_reason == RejectionReason.VERY_HIGH_RISK


class TestSelectFailsLowDecisionScore:
    def test_low_decision_rejected(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=0.0,
            min_confidence=0.0,
            min_liquidity=0.0,
            max_risk=100.0,
            min_decision_score=50.0,
        )
        candidates = [
            StockCandidate(symbol="GOOD", elite_score=80, decision_score=60, confidence=50, risk=50, liquidity=50),
            StockCandidate(symbol="FAIL", elite_score=80, decision_score=20, confidence=50, risk=50, liquidity=50),
        ]
        selected, rejected = selector.select(candidates, request)
        rejected_symbols = [r.symbol for r in rejected]
        assert "FAIL" in rejected_symbols
        assert rejected[0].rejection_reason == RejectionReason.LOW_DECISION_SCORE


class TestPassesAllRules:
    def test_passes_returns_none_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=60, confidence=50, risk=30, liquidity=60)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is True
        assert reason is None

    def test_fails_elite_returns_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=10, decision_score=60, confidence=50, risk=30, liquidity=60)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is False
        assert reason == RejectionReason.LOW_ELITE_SCORE

    def test_fails_confidence_returns_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=60, confidence=10, risk=30, liquidity=60)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is False
        assert reason == RejectionReason.LOW_CONFIDENCE

    def test_fails_liquidity_returns_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=60, confidence=50, risk=30, liquidity=5)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is False
        assert reason == RejectionReason.LOW_LIQUIDITY

    def test_fails_risk_returns_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=60, confidence=50, risk=95, liquidity=60)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is False
        assert reason == RejectionReason.VERY_HIGH_RISK

    def test_fails_decision_returns_reason(self, selector, default_request):
        c = StockCandidate(symbol="X", elite_score=80, decision_score=10, confidence=50, risk=30, liquidity=60)
        passes, reason = selector._passes_all_rules(c, default_request)
        assert passes is False
        assert reason == RejectionReason.LOW_DECISION_SCORE


class TestSelectMixed:
    def test_mixed_candidates_split(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=50.0,
            min_confidence=40.0,
            min_liquidity=30.0,
            max_risk=60.0,
            min_decision_score=40.0,
        )
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, request)
        assert len(selected) >= 1
        assert len(rejected) >= 1
        assert len(selected) + len(rejected) == len(candidates)

    def test_all_rejected_when_thresholds_high(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=99.0,
            min_confidence=99.0,
            min_liquidity=99.0,
            max_risk=0.0,
            min_decision_score=99.0,
        )
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, request)
        assert len(selected) == 0
        assert len(rejected) == len(candidates)

    def test_all_pass_when_thresholds_zero(self, selector):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            min_elite_score=0.0,
            min_confidence=0.0,
            min_liquidity=0.0,
            max_risk=100.0,
            min_decision_score=0.0,
        )
        candidates = _make_candidates()
        selected, rejected = selector.select(candidates, request)
        assert len(selected) == len(candidates)
        assert len(rejected) == 0

    def test_empty_candidates(self, selector, default_request):
        selected, rejected = selector.select([], default_request)
        assert selected == []
        assert rejected == []
