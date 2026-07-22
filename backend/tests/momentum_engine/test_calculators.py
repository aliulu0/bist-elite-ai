import pytest
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.calculators.divergence_calculator import DivergenceCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator
from modules.momentum_engine.core.types import PriceBar
import math


class TestSmoothingCalculator:
    def test_sma(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = SmoothingCalculator.sma(values, 3)
        assert result[2] == pytest.approx(11.0)
        assert result[0] is None

    def test_ema(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = SmoothingCalculator.ema(values, 3)
        assert result[2] is not None
        assert result[0] is None

    def test_wma(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = SmoothingCalculator.wma(values, 3)
        assert result[2] is not None
        expected = (10 * 1 + 11 * 2 + 12 * 3) / 6
        assert result[2] == pytest.approx(expected)

    def test_wilder_smoothing(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = SmoothingCalculator.wilder_smoothing(values, 3)
        assert result[2] == pytest.approx(11.0)
        assert result[0] is None

    def test_insufficient_data(self):
        result = SmoothingCalculator.sma([10.0], 3)
        assert result == [None]


class TestSlopeCalculator:
    def test_first_derivative(self):
        values = [10.0, 11.0, 12.0]
        d = SlopeCalculator.first_derivative(values, 1)
        assert d is not None
        assert d > 0

    def test_first_derivative_zero_index(self):
        values = [10.0, 11.0]
        assert SlopeCalculator.first_derivative(values, 0) is None

    def test_second_derivative(self):
        values = [10.0, 11.0, 13.0]
        d = SlopeCalculator.second_derivative(values, 2)
        assert d is not None

    def test_angle_degrees(self):
        angle = SlopeCalculator.angle_degrees(1.0)
        assert angle == pytest.approx(45.0)

    def test_angle_none(self):
        assert SlopeCalculator.angle_degrees(None) is None

    def test_calculate(self):
        values = [10.0, 11.0, 12.0, 13.0]
        result = SlopeCalculator.calculate(values, 3)
        assert "slope" in result
        assert "acceleration" in result
        assert "angle_degrees" in result


class TestDivergenceCalculator:
    def test_find_swing_highs(self):
        values = [10.0, 20.0, 15.0, 25.0, 12.0]
        highs = DivergenceCalculator.find_swing_highs(values, window=1)
        assert len(highs) > 0

    def test_find_swing_lows(self):
        values = [20.0, 10.0, 15.0, 5.0, 18.0]
        lows = DivergenceCalculator.find_swing_lows(values, window=1)
        assert len(lows) > 0


class TestMomentumValidator:
    def test_validate_prices_valid(self):
        prices = [PriceBar(date="d", open=100, high=105, low=95, close=100, volume=1000)]
        assert MomentumValidator.validate_prices(prices) == []

    def test_validate_prices_empty(self):
        assert len(MomentumValidator.validate_prices([])) == 1

    def test_validate_period_valid(self):
        assert MomentumValidator.validate_period(14) == []

    def test_validate_period_zero(self):
        assert len(MomentumValidator.validate_period(0)) == 1

    def test_validate_period_too_large(self):
        assert len(MomentumValidator.validate_period(600)) == 1

    def test_handle_nan(self):
        values = [1.0, float("nan"), 3.0]
        result = MomentumValidator.handle_nan(values)
        assert result[1] is None

    def test_check_division_safety(self):
        assert MomentumValidator.check_division_safety(10, 2) == 5.0
        assert MomentumValidator.check_division_safety(10, 0) is None

    def test_clamp(self):
        assert MomentumValidator.clamp(15, 0, 10) == 10
        assert MomentumValidator.clamp(-5, 0, 10) == 0
        assert MomentumValidator.clamp(5, 0, 10) == 5

    def test_benchmark(self):
        result = MomentumValidator.benchmark(lambda: sum(range(100)), iterations=100)
        assert result.iterations == 100
        assert result.total_seconds > 0
