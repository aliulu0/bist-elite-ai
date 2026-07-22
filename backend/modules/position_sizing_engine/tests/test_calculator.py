from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.allocation.calculator import PositionCalculator
from modules.position_sizing_engine.core.types import (
    DEFAULT_ATR_STOP_MULTIPLIER,
    DEFAULT_MAX_POSITION_PCT,
    DEFAULT_MIN_POSITION_PCT,
    DEFAULT_VOLATILITY_STOP_MULTIPLIER,
    InvestmentHorizon,
    PositionGrade,
    PositionInput,
    PositionSizingRequest,
    RiskProfile,
    StopLossType,
)

BALANCED_PARAMS = {
    "max_position": 12.0,
    "min_position": 2.0,
    "max_sector_exposure": 25.0,
    "cash_reserve": 10.0,
    "max_risk_per_trade": 2.0,
}

CONSERVATIVE_PARAMS = {
    "max_position": 8.0,
    "min_position": 1.0,
    "max_sector_exposure": 20.0,
    "cash_reserve": 15.0,
    "max_risk_per_trade": 1.0,
}


@pytest.fixture
def calc():
    return PositionCalculator()


class TestCalculate:
    def test_bullish_input_reasonable_size(self, calc: PositionCalculator):
        inp = PositionInput(
            symbol="BULL", elite_score=90, confidence=80, risk=15,
            liquidity=80, avg_daily_volume=1000000, atr=2.0, volatility=20,
            beta=0.9, market_regime="bull", price=100.0,
        )
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert result.symbol == "BULL"
        assert result.recommended_pct > 0
        assert result.recommended_pct <= BALANCED_PARAMS["max_position"]
        assert result.stop_loss is not None
        assert result.take_profit is not None

    def test_bearish_input_smaller_size(self, calc: PositionCalculator):
        bullish = PositionInput(
            symbol="BULL", elite_score=85, confidence=75, risk=20,
            liquidity=70, avg_daily_volume=1000000, atr=2.0, volatility=20,
            beta=1.0, market_regime="bull", price=100.0,
        )
        bearish = PositionInput(
            symbol="BEAR", elite_score=30, confidence=20, risk=80,
            liquidity=30, avg_daily_volume=100000, atr=4.0, volatility=50,
            beta=1.6, market_regime="bear", price=100.0,
        )
        bull_result = calc.calculate(bullish, BALANCED_PARAMS)
        bear_result = calc.calculate(bearish, BALANCED_PARAMS)
        assert bear_result.recommended_pct < bull_result.recommended_pct

    def test_calculate_returns_position_sizing(self, calc: PositionCalculator):
        inp = PositionInput(symbol="TEST", elite_score=50, confidence=50, risk=50, price=50.0)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert hasattr(result, "symbol")
        assert hasattr(result, "recommended_pct")
        assert hasattr(result, "position_grade")
        assert hasattr(result, "explanation")
        assert hasattr(result, "metadata")

    def test_calculate_metadata_contains_raw_size(self, calc: PositionCalculator):
        inp = PositionInput(symbol="META", elite_score=70, confidence=60, risk=30, price=50.0)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "raw_size" in result.metadata
        assert "regime" in result.metadata
        assert "elite_score" in result.metadata

    def test_calculate_portfolio_weight_matches_pct(self, calc: PositionCalculator):
        inp = PositionInput(symbol="W", elite_score=50, confidence=50, risk=50, price=50.0)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert abs(result.portfolio_weight - result.recommended_pct / 100.0) < 1e-4


class TestComputeRawSize:
    def test_raw_size_proportional_to_scores(self, calc: PositionCalculator):
        high = PositionInput(symbol="H", elite_score=90, confidence=90, risk=10)
        low = PositionInput(symbol="L", elite_score=10, confidence=10, risk=90)
        h_size = calc._compute_raw_size(high, BALANCED_PARAMS)
        l_size = calc._compute_raw_size(low, BALANCED_PARAMS)
        assert h_size > l_size

    def test_raw_size_zero_scores(self, calc: PositionCalculator):
        inp = PositionInput(symbol="Z", elite_score=0, confidence=0, risk=100)
        size = calc._compute_raw_size(inp, BALANCED_PARAMS)
        assert size == 0.0

    def test_raw_size_max_scores(self, calc: PositionCalculator):
        inp = PositionInput(symbol="M", elite_score=100, confidence=100, risk=0)
        size = calc._compute_raw_size(inp, BALANCED_PARAMS)
        assert size == BALANCED_PARAMS["max_position"]

    def test_raw_size_clamped_to_max(self, calc: PositionCalculator):
        inp = PositionInput(symbol="C", elite_score=100, confidence=100, risk=0)
        size = calc._compute_raw_size(inp, CONSERVATIVE_PARAMS)
        assert size <= CONSERVATIVE_PARAMS["max_position"]

    def test_raw_size_default_params(self, calc: PositionCalculator):
        inp = PositionInput(symbol="D", elite_score=50, confidence=50, risk=50)
        size = calc._compute_raw_size(inp, {})
        assert 0.0 <= size <= DEFAULT_MAX_POSITION_PCT


class TestRiskAdjustment:
    def test_high_risk_reduces(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 80, 0.0, 1.0)
        assert result < 10.0

    def test_medium_high_risk_reduces(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 60, 0.0, 1.0)
        assert result < 10.0

    def test_low_risk_increases(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 20, 0.0, 1.0)
        assert result > 10.0

    def test_medium_risk_no_change(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.0, 1.0)
        assert result == 10.0

    def test_high_volatility_reduces(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.5, 1.0)
        assert result < 10.0

    def test_medium_volatility_reduces(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.35, 1.0)
        assert result < 10.0

    def test_low_volatility_no_change(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.2, 1.0)
        assert result == 10.0

    def test_high_beta_reduces(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.0, 2.0)
        assert result < 10.0

    def test_low_beta_increases(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 50, 0.0, 0.3)
        assert result > 10.0

    def test_combined_adjustments(self, calc: PositionCalculator):
        result = calc._apply_risk_adjustment(10.0, 80, 0.5, 2.0)
        expected = 10.0 * 0.7 * 0.8 * 0.85
        assert abs(result - expected) < 1e-9


class TestRegimeAdjustment:
    def test_bull_increases(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "bull") == pytest.approx(11.0)

    def test_bullish_increases(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "bullish") == pytest.approx(11.0)

    def test_bear_decreases(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "bear") == pytest.approx(8.0)

    def test_bearish_decreases(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "bearish") == pytest.approx(8.0)

    def test_sideways_neutral(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "sideways") == pytest.approx(10.0)

    def test_volatile_decreases(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "volatile") == pytest.approx(8.5)

    def test_unknown_regime_neutral(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "unknown") == pytest.approx(10.0)

    def test_empty_regime_neutral(self, calc: PositionCalculator):
        assert calc._apply_regime_adjustment(10.0, "") == pytest.approx(10.0)


class TestLiquidityAdjustment:
    def test_low_liquidity_reduces(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 10, 1000000)
        assert result < 10.0

    def test_medium_low_liquidity_reduces(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 30, 1000000)
        assert result < 10.0

    def test_high_liquidity_increases(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 90, 1000000)
        assert result > 10.0

    def test_normal_liquidity_no_change(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 60, 1000000)
        assert result == 10.0

    def test_low_volume_reduces(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 60, 50000)
        assert result < 10.0

    def test_medium_volume_reduces(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 60, 300000)
        assert result < 10.0

    def test_zero_volume_no_volume_adjustment(self, calc: PositionCalculator):
        result = calc._apply_liquidity_adjustment(10.0, 60, 0)
        assert result == 10.0


class TestStopLoss:
    def test_atr_based(self, calc: PositionCalculator):
        inp = PositionInput(symbol="A", price=100.0, atr=5.0, volatility=25)
        sl = calc._compute_stop_loss(inp, StopLossType.ATR_BASED)
        expected_price = 100.0 - 5.0 * DEFAULT_ATR_STOP_MULTIPLIER
        assert sl.stop_loss_price == round(expected_price, 2)
        assert sl.stop_loss_pct > 0
        assert sl.stop_loss_type == StopLossType.ATR_BASED

    def test_volatility_based(self, calc: PositionCalculator):
        inp = PositionInput(symbol="V", price=100.0, atr=0, volatility=0.2)
        sl = calc._compute_stop_loss(inp, StopLossType.VOLATILITY)
        expected_price = 100.0 * (1.0 - 0.2 * DEFAULT_VOLATILITY_STOP_MULTIPLIER)
        assert sl.stop_loss_price == round(expected_price, 2)
        assert sl.stop_loss_pct > 0

    def test_suggested_fallback(self, calc: PositionCalculator):
        inp = PositionInput(symbol="S", price=100.0, atr=0, volatility=0)
        sl = calc._compute_stop_loss(inp, StopLossType.SUGGESTED)
        expected_price = 100.0 * (1.0 - 7.0 / 100.0)
        assert sl.stop_loss_price == round(expected_price, 2)
        assert sl.stop_loss_pct == 7.0

    def test_trailing_uses_default(self, calc: PositionCalculator):
        inp = PositionInput(symbol="T", price=100.0, atr=0, volatility=0)
        sl = calc._compute_stop_loss(inp, StopLossType.TRAILING)
        assert sl.stop_loss_price == round(100.0 * 0.93, 2)
        assert sl.stop_loss_pct == 7.0

    def test_zero_price(self, calc: PositionCalculator):
        inp = PositionInput(symbol="Z", price=0.0, atr=5.0)
        sl = calc._compute_stop_loss(inp, StopLossType.ATR_BASED)
        assert sl.stop_loss_price == 0.0
        assert sl.stop_loss_pct == 0.0
        assert "missing" in sl.explanation.lower()

    def test_stop_loss_symbol_matches(self, calc: PositionCalculator):
        inp = PositionInput(symbol="SYM", price=50.0, atr=2.0)
        sl = calc._compute_stop_loss(inp, StopLossType.ATR_BASED)
        assert sl.symbol == "SYM"


class TestTakeProfit:
    def test_with_atr(self, calc: PositionCalculator):
        inp = PositionInput(symbol="TP", price=100.0, atr=5.0)
        tp = calc._compute_take_profit(inp)
        assert tp.primary_target == round(100.0 + 5.0 * 2.0, 2)
        assert tp.secondary_target == round(100.0 + 5.0 * 3.5, 2)
        assert tp.risk_reward_ratio == 2.0

    def test_without_atr(self, calc: PositionCalculator):
        inp = PositionInput(symbol="TP2", price=100.0, atr=0)
        tp = calc._compute_take_profit(inp)
        assert tp.primary_target == round(100.0 * 1.15, 2)
        assert tp.secondary_target == round(100.0 * 1.25, 2)

    def test_zero_price(self, calc: PositionCalculator):
        inp = PositionInput(symbol="TP3", price=0.0, atr=5.0)
        tp = calc._compute_take_profit(inp)
        assert tp.primary_target == 0.0
        assert tp.secondary_target == 0.0
        assert "missing" in tp.explanation.lower()


class TestComputeGrade:
    def test_high_scores_a_plus(self, calc: PositionCalculator):
        grade = calc._compute_grade(100, 100, 0)
        assert grade == PositionGrade.A_PLUS

    def test_medium_scores_a(self, calc: PositionCalculator):
        grade = calc._compute_grade(80, 70, 20)
        assert grade in (PositionGrade.A, PositionGrade.A_PLUS)

    def test_low_scores_d(self, calc: PositionCalculator):
        grade = calc._compute_grade(5, 5, 95)
        assert grade == PositionGrade.D

    def test_boundary_a_plus(self, calc: PositionCalculator):
        grade = calc._compute_grade(90, 80, 10)
        score = 90 * 0.5 + 80 * 0.3 + 90 * 0.2
        assert score >= 85
        assert grade == PositionGrade.A_PLUS

    def test_boundary_d(self, calc: PositionCalculator):
        grade = calc._compute_grade(10, 10, 90)
        score = 10 * 0.5 + 10 * 0.3 + 10 * 0.2
        assert score < 30
        assert grade == PositionGrade.D


class TestGenerateExplanation:
    def test_returns_nonempty(self, calc: PositionCalculator):
        inp = PositionInput(symbol="E", elite_score=50, confidence=50, risk=50,
                            market_regime="bull", sector="tech", liquidity=60)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert len(result.explanation) > 0

    def test_contains_symbol(self, calc: PositionCalculator):
        inp = PositionInput(symbol="XYZ", elite_score=50, confidence=50, risk=50, liquidity=60)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "XYZ" in result.explanation

    def test_contains_grade(self, calc: PositionCalculator):
        inp = PositionInput(symbol="G", elite_score=50, confidence=50, risk=50, liquidity=60)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "grade" in result.explanation.lower()

    def test_low_liquidity_warning(self, calc: PositionCalculator):
        inp = PositionInput(symbol="LQ", elite_score=50, confidence=50, risk=50, liquidity=10)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "liquidity" in result.explanation.lower()

    def test_high_risk_warning(self, calc: PositionCalculator):
        inp = PositionInput(symbol="HR", elite_score=50, confidence=50, risk=80, liquidity=60)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "high risk" in result.explanation.lower()

    def test_high_beta_note(self, calc: PositionCalculator):
        inp = PositionInput(symbol="HB", elite_score=50, confidence=50, risk=50,
                            beta=2.0, liquidity=60)
        result = calc.calculate(inp, BALANCED_PARAMS)
        assert "high beta" in result.explanation.lower()
