import pytest
from modules.moving_average.validators.ma_validator import MAValidator
from modules.moving_average.core.types import PriceBar


class TestMAValidator:
    def test_valid_period(self):
        errors = MAValidator.validate_period(10)
        assert errors == []

    def test_zero_period(self):
        errors = MAValidator.validate_period(0)
        assert len(errors) == 1

    def test_negative_period(self):
        errors = MAValidator.validate_period(-5)
        assert len(errors) == 1

    def test_exceeds_max(self):
        errors = MAValidator.validate_period(1001)
        assert len(errors) == 1

    def test_valid_periods(self):
        errors = MAValidator.validate_periods([5, 10, 20])
        assert errors == []

    def test_empty_periods(self):
        errors = MAValidator.validate_periods([])
        assert len(errors) == 1

    def test_valid_prices(self):
        prices = [
            PriceBar(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000),
            PriceBar(date="2024-01-02", open=102, high=108, low=100, close=105, volume=1200),
        ]
        errors = MAValidator.validate_prices(prices)
        assert errors == []

    def test_empty_prices(self):
        errors = MAValidator.validate_prices([])
        assert len(errors) == 1

    def test_negative_close(self):
        prices = [PriceBar(date="2024-01-01", open=10, high=12, low=8, close=-5, volume=100)]
        errors = MAValidator.validate_prices(prices)
        assert any("close price must be positive" in e for e in errors)

    def test_high_less_than_low(self):
        prices = [PriceBar(date="2024-01-01", open=10, high=5, low=15, close=12, volume=100)]
        errors = MAValidator.validate_prices(prices)
        assert any("high cannot be less than low" in e for e in errors)

    def test_negative_volume(self):
        prices = [PriceBar(date="2024-01-01", open=10, high=12, low=8, close=10, volume=-100)]
        errors = MAValidator.validate_prices(prices)
        assert any("volume cannot be negative" in e for e in errors)

    def test_handle_missing_data_interpolate(self):
        values = [10.0, None, 12.0]
        result = MAValidator.handle_missing_data(values)
        assert result[1] == pytest.approx(11.0)

    def test_handle_missing_data_prev_fill(self):
        values = [10.0, None, None]
        result = MAValidator.handle_missing_data(values)
        assert result[1] == pytest.approx(10.0)

    def test_handle_missing_data_next_fill(self):
        values = [None, None, 12.0]
        result = MAValidator.handle_missing_data(values)
        assert result[0] == pytest.approx(12.0)

    def test_fill_initial_nulls(self):
        values = [None, None, 10.0, 11.0, 12.0]
        result = MAValidator.fill_initial_nulls(values, 3)
        assert result[0] == pytest.approx(10.0)
        assert result[1] == pytest.approx(10.0)

    def test_benchmark(self):
        result = MAValidator.benchmark_calculation(lambda: sum(range(100)), iterations=100)
        assert result["iterations"] == 100
        assert result["total_seconds"] > 0
