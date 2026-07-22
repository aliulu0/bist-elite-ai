from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.core.types import (
    DEFAULT_CASH_RESERVE,
    DEFAULT_MAX_CORRELATION,
    PositionInput,
    PositionSizing,
    PositionSizingRequest,
    PortfolioExposure,
    RiskProfile,
    StopLoss,
    StopLossType,
)
from modules.position_sizing_engine.risk.allocator import RiskAllocator


def _make_positions():
    return [
        PositionInput(symbol="THYAO", sector="aviation", elite_score=85, confidence=75, risk=30, liquidity=70, avg_daily_volume=1000000, atr=2.5, volatility=25, beta=1.1, market_regime="bull", sector_exposure=15, correlation=0.3, agreement_score=0.8, price=100),
        PositionInput(symbol="GARAN", sector="banking", elite_score=78, confidence=68, risk=40, liquidity=65, avg_daily_volume=800000, atr=3.0, volatility=30, beta=1.2, market_regime="bull", sector_exposure=20, correlation=0.4, agreement_score=0.7, price=50),
        PositionInput(symbol="ASELS", sector="defense", elite_score=72, confidence=62, risk=35, liquidity=55, avg_daily_volume=500000, atr=2.0, volatility=22, beta=0.9, market_regime="sideways", sector_exposure=10, correlation=0.2, agreement_score=0.6, price=80),
        PositionInput(symbol="SISE", sector="glass", elite_score=68, confidence=58, risk=45, liquidity=50, avg_daily_volume=300000, atr=3.5, volatility=35, beta=1.3, market_regime="bull", sector_exposure=12, correlation=0.5, agreement_score=0.5, price=40),
        PositionInput(symbol="SAHOL", sector="banking", elite_score=35, confidence=25, risk=70, liquidity=30, avg_daily_volume=200000, atr=4.0, volatility=40, beta=1.5, market_regime="bear", sector_exposure=25, correlation=0.6, agreement_score=0.3, price=20),
    ]


def _make_request(positions=None):
    return PositionSizingRequest(
        reference_date="2025-01-01",
        horizon=InvestmentHorizon.MONTH_3,
        risk_profile=RiskProfile.BALANCED,
        total_capital=100000.0,
        positions=positions or _make_positions(),
        max_sector_exposure=30.0,
        max_correlation=0.7,
    )


def _make_sizing(symbol, pct, sector="unknown"):
    return PositionSizing(
        symbol=symbol,
        recommended_pct=pct,
        min_pct=1.0,
        max_pct=15.0,
        portfolio_weight=round(pct / 100.0, 4),
        cash_allocation_pct=round(100.0 - pct, 2),
        stop_loss=StopLoss(symbol=symbol, stop_loss_price=50.0, stop_loss_pct=5.0, stop_loss_type=StopLossType.ATR_BASED),
    )


from modules.position_sizing_engine.core.types import InvestmentHorizon


@pytest.fixture
def allocator():
    return RiskAllocator()


class TestAllocateSectorLimits:
    def test_respects_sector_limits(self, allocator: RiskAllocator):
        positions = [
            _make_sizing("A", 25.0),
            _make_sizing("B", 20.0),
            _make_sizing("C", 20.0),
        ]
        pos_inputs = [
            PositionInput(symbol="A", sector="banking"),
            PositionInput(symbol="B", sector="banking"),
            PositionInput(symbol="C", sector="tech"),
        ]
        request = _make_request(pos_inputs)
        request.max_sector_exposure = 25.0
        result = allocator._apply_sector_limits(list(positions), request)
        b_pos = next(p for p in result if p.symbol == "B")
        assert b_pos.recommended_pct == 0.0

    def test_different_sectors_not_limited(self, allocator: RiskAllocator):
        positions = [
            _make_sizing("A", 15.0),
            _make_sizing("B", 15.0),
        ]
        pos_inputs = [
            PositionInput(symbol="A", sector="banking"),
            PositionInput(symbol="B", sector="tech"),
        ]
        request = _make_request(pos_inputs)
        result = allocator.allocate(positions, request)
        assert len(result) == 2


class TestCheckSectorExposure:
    def test_within_limit(self, allocator: RiskAllocator):
        assert allocator._check_sector_exposure("A", "banking", 10.0, 30.0) is True

    def test_at_limit(self, allocator: RiskAllocator):
        assert allocator._check_sector_exposure("A", "banking", 30.0, 30.0) is False

    def test_over_limit(self, allocator: RiskAllocator):
        assert allocator._check_sector_exposure("A", "banking", 40.0, 30.0) is False

    def test_zero_exposure(self, allocator: RiskAllocator):
        assert allocator._check_sector_exposure("A", "banking", 0.0, 30.0) is True


class TestConcentrationRisk:
    def test_equal_weights(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 25.0), _make_sizing("B", 25.0),
                      _make_sizing("C", 25.0), _make_sizing("D", 25.0)]
        hhi = allocator._compute_concentration_risk(positions)
        expected = 4 * (25.0 / 100.0) ** 2
        assert abs(hhi - round(expected, 4)) < 1e-4

    def test_concentrated(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 80.0), _make_sizing("B", 20.0)]
        hhi = allocator._compute_concentration_risk(positions)
        expected = (80.0 / 100.0) ** 2 + (20.0 / 100.0) ** 2
        assert abs(hhi - round(expected, 4)) < 1e-4

    def test_empty_positions(self, allocator: RiskAllocator):
        assert allocator._compute_concentration_risk([]) == 0.0

    def test_zero_total(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 0.0), _make_sizing("B", 0.0)]
        assert allocator._compute_concentration_risk(positions) == 0.0

    def test_single_position(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        hhi = allocator._compute_concentration_risk(positions)
        assert abs(hhi - 1.0) < 1e-4


class TestCashRatio:
    def test_normal(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 30.0), _make_sizing("B", 40.0)]
        ratio = allocator._compute_cash_ratio(positions, 100000.0)
        assert ratio == 30.0

    def test_full_allocation(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 60.0), _make_sizing("B", 40.0)]
        ratio = allocator._compute_cash_ratio(positions, 100000.0)
        assert ratio == 0.0

    def test_zero_capital(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 30.0)]
        ratio = allocator._compute_cash_ratio(positions, 0.0)
        assert ratio == DEFAULT_CASH_RESERVE

    def test_no_positions(self, allocator: RiskAllocator):
        ratio = allocator._compute_cash_ratio([], 100000.0)
        assert ratio == 100.0


class TestBearMarketReduction:
    def test_reduces_positions(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0), _make_sizing("B", 15.0)]
        result = allocator._apply_bear_market_reduction(positions, "bear")
        for orig, adj in zip(positions, result):
            assert adj.recommended_pct == round(orig.recommended_pct * 0.85, 2)

    def test_preserves_other_fields(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        result = allocator._apply_bear_market_reduction(positions, "bear")
        assert result[0].symbol == "A"
        assert result[0].min_pct == positions[0].min_pct

    def test_adds_explanation(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        result = allocator._apply_bear_market_reduction(positions, "bearish")
        assert "bear market" in result[0].explanation.lower()


class TestHighVolatilityCash:
    def test_high_volatility_reduces(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0), _make_sizing("B", 15.0)]
        result = allocator._apply_high_volatility_cash(positions, 0.5, 10.0)
        for orig, adj in zip(positions, result):
            assert adj.recommended_pct < orig.recommended_pct

    def test_low_volatility_no_change(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        result = allocator._apply_high_volatility_cash(positions, 0.2, 10.0)
        assert result[0].recommended_pct == 10.0

    def test_extreme_volatility_clamped(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        result = allocator._apply_high_volatility_cash(positions, 1.0, 10.0)
        scale = max(0.5, 1.0 - (1.0 - 0.3) * 0.5)
        assert abs(result[0].recommended_pct - round(10.0 * scale, 2)) < 0.01

    def test_adds_explanation(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0)]
        result = allocator._apply_high_volatility_cash(positions, 0.5, 10.0)
        assert "volatility" in result[0].explanation.lower()


class TestAllocateGeneral:
    def test_empty_positions(self, allocator: RiskAllocator):
        result = allocator.allocate([], _make_request([]))
        assert result == []

    def test_normalize_weights(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 50.0), _make_sizing("B", 50.0)]
        pos_inputs = [
            PositionInput(symbol="A", sector="tech"),
            PositionInput(symbol="B", sector="finance"),
        ]
        request = _make_request(pos_inputs)
        result = allocator.allocate(positions, request)
        total = sum(p.recommended_pct for p in result)
        assert abs(total - 100.0) < 0.5

    def test_bear_regime_reduces(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 10.0), _make_sizing("B", 15.0)]
        pos_inputs = [
            PositionInput(symbol="A", sector="tech", market_regime="bear"),
            PositionInput(symbol="B", sector="finance", market_regime="bear"),
        ]
        request = _make_request(pos_inputs)
        result = allocator.allocate(positions, request)
        total_after = sum(p.recommended_pct for p in result)
        assert total_after < 100.0

    def test_concentration_high_triggers_reduction(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 80.0), _make_sizing("B", 80.0)]
        pos_inputs = [
            PositionInput(symbol="A", sector="tech"),
            PositionInput(symbol="B", sector="finance"),
        ]
        request = _make_request(pos_inputs)
        result = allocator.allocate(positions, request)
        for r in result:
            assert "[adjusted for concentration risk]" in r.explanation


class TestComputePortfolioExposure:
    def test_basic_exposure(self, allocator: RiskAllocator):
        positions = [
            _make_sizing("A", 30.0),
            _make_sizing("B", 20.0),
        ]
        pos_inputs = [
            PositionInput(symbol="A", sector="tech"),
            PositionInput(symbol="B", sector="finance"),
        ]
        request = _make_request(pos_inputs)
        exposure = allocator.compute_portfolio_exposure(positions, request)
        assert exposure.market_exposure == 50.0
        assert "tech" in exposure.sector_exposure
        assert "finance" in exposure.sector_exposure
        assert exposure.sector_count == 2

    def test_cash_ratio_in_exposure(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 40.0)]
        pos_inputs = [PositionInput(symbol="A", sector="tech")]
        request = _make_request(pos_inputs)
        exposure = allocator.compute_portfolio_exposure(positions, request)
        assert exposure.cash_ratio == 60.0

    def test_concentration_in_exposure(self, allocator: RiskAllocator):
        positions = [_make_sizing("A", 50.0), _make_sizing("B", 50.0)]
        pos_inputs = [
            PositionInput(symbol="A", sector="tech"),
            PositionInput(symbol="B", sector="finance"),
        ]
        request = _make_request(pos_inputs)
        exposure = allocator.compute_portfolio_exposure(positions, request)
        assert exposure.concentration_risk > 0

    def test_empty_positions_exposure(self, allocator: RiskAllocator):
        exposure = allocator.compute_portfolio_exposure([], _make_request([]))
        assert exposure.market_exposure == 0.0
        assert exposure.sector_count == 0
