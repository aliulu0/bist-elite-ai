import pytest
import math
from modules.moving_average.calculators.slope_calculator import SlopeCalculator
from modules.moving_average.calculators.distance_calculator import DistanceCalculator


class TestSlopeCalculator:
    def setup_method(self):
        self.calc = SlopeCalculator()

    def test_positive_slope(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = self.calc.calculate(values, 4)
        assert result.slope is not None
        assert result.slope > 0
        assert result.angle_degrees is not None
        assert result.angle_degrees > 0

    def test_negative_slope(self):
        values = [14.0, 13.0, 12.0, 11.0, 10.0]
        result = self.calc.calculate(values, 4)
        assert result.slope is not None
        assert result.slope < 0
        assert result.angle_degrees is not None
        assert result.angle_degrees < 0

    def test_zero_slope(self):
        values = [10.0, 10.0, 10.0, 10.0, 10.0]
        result = self.calc.calculate(values, 4)
        assert result.slope == pytest.approx(0.0)

    def test_insufficient_index(self):
        values = [10.0, 11.0]
        result = self.calc.calculate(values, 0)
        assert result.slope is None

    def test_acceleration_positive(self):
        values = [10.0, 11.0, 13.0, 16.0, 20.0]
        result = self.calc.calculate(values, 4)
        assert result.acceleration is not None
        assert result.is_accelerating is True

    def test_acceleration_negative(self):
        values = [10.0, 12.0, 13.0, 13.5, 13.8]
        result = self.calc.calculate(values, 4)
        assert result.acceleration is not None
        assert result.is_accelerating is False

    def test_calculate_all(self):
        values = [10.0, 11.0, 12.0, 13.0, 14.0]
        results = self.calc.calculate_all(values)
        assert len(results) == 5
        assert results[0].slope is None
        assert results[1].slope is not None

    def test_none_values(self):
        values = [10.0, None, 12.0, 13.0, 14.0]
        result = self.calc.calculate(values, 4)
        assert result.slope is not None


class TestDistanceCalculator:
    def test_distance_from_price_above(self):
        result = DistanceCalculator.distance_from_price(100.0, 110.0)
        assert result.distance_pct == pytest.approx(0.1)
        assert result.distance_abs == pytest.approx(10.0)

    def test_distance_from_price_below(self):
        result = DistanceCalculator.distance_from_price(100.0, 90.0)
        assert result.distance_pct == pytest.approx(-0.1)
        assert result.distance_abs == pytest.approx(-10.0)

    def test_distance_from_price_at(self):
        result = DistanceCalculator.distance_from_price(100.0, 100.0)
        assert result.distance_pct == pytest.approx(0.0)
        assert result.distance_abs == pytest.approx(0.0)

    def test_distance_from_price_zero_ma(self):
        result = DistanceCalculator.distance_from_price(0.0, 100.0)
        assert result.distance_pct is None

    def test_distance_between(self):
        fast = [None, None, 100.0, 105.0, 110.0]
        slow = [None, None, 100.0, 102.0, 104.0]
        result = DistanceCalculator.distance_between(fast, slow)
        assert result.distance_pct is not None
        assert result.distance_pct > 0

    def test_distance_between_empty(self):
        result = DistanceCalculator.distance_between([], [])
        assert result.distance_pct is None

    def test_distance_between_none_values(self):
        fast = [None, None]
        slow = [None, None]
        result = DistanceCalculator.distance_between(fast, slow)
        assert result.distance_pct is None

    def test_distance_between_zero_slow(self):
        fast = [100.0]
        slow = [0.0]
        result = DistanceCalculator.distance_between(fast, slow)
        assert result.distance_pct is None
