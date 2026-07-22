import pytest
from modules.volume_engine.validators.volume_validator import VolumeValidator
from modules.volume_engine.core.types import PriceBar
from tests.volume_engine.conftest import _bars


class TestVolumeValidator:
    def test_validate_prices_valid(self):
        errors = VolumeValidator.validate_prices(_bars(10))
        assert errors == []

    def test_validate_prices_empty(self):
        errors = VolumeValidator.validate_prices([])
        assert len(errors) > 0
        assert "required" in errors[0]

    def test_validate_prices_negative_close(self):
        bars = [PriceBar(date="2024-01-01", open=100, high=105, low=95, close=-10, volume=1000)]
        errors = VolumeValidator.validate_prices(bars)
        assert len(errors) > 0

    def test_validate_prices_high_less_than_low(self):
        bars = [PriceBar(date="2024-01-01", open=100, high=90, low=110, close=100, volume=1000)]
        errors = VolumeValidator.validate_prices(bars)
        assert len(errors) > 0

    def test_validate_prices_negative_volume(self):
        bars = [PriceBar(date="2024-01-01", open=100, high=105, low=95, close=100, volume=-1000)]
        errors = VolumeValidator.validate_prices(bars)
        assert len(errors) > 0

    def test_validate_period_valid(self):
        errors = VolumeValidator.validate_period(20)
        assert errors == []

    def test_validate_period_zero(self):
        errors = VolumeValidator.validate_period(0)
        assert len(errors) > 0

    def test_validate_period_negative(self):
        errors = VolumeValidator.validate_period(-5)
        assert len(errors) > 0

    def test_validate_period_too_large(self):
        errors = VolumeValidator.validate_period(600)
        assert len(errors) > 0

    def test_handle_nan(self):
        values = [1.0, float('nan'), 3.0]
        result = VolumeValidator.handle_nan(values)
        assert result[0] == 1.0
        assert result[1] is None
        assert result[2] == 3.0

    def test_handle_missing(self):
        values = [1.0, None, 3.0]
        result = VolumeValidator.handle_missing(values)
        assert result[0] == 1.0
        assert result[1] == 2.0
        assert result[2] == 3.0

    def test_handle_missing_start(self):
        values = [None, None, 3.0, 4.0]
        result = VolumeValidator.handle_missing(values)
        assert result[0] == 3.0

    def test_handle_missing_end(self):
        values = [1.0, 2.0, None, None]
        result = VolumeValidator.handle_missing(values)
        assert result[-1] == 2.0

    def test_check_division_safety(self):
        result = VolumeValidator.check_division_safety(10, 2)
        assert result == 5.0

    def test_check_division_safety_zero(self):
        result = VolumeValidator.check_division_safety(10, 0)
        assert result is None

    def test_clamp(self):
        assert VolumeValidator.clamp(5, 0, 10) == 5
        assert VolumeValidator.clamp(-5, 0, 10) == 0
        assert VolumeValidator.clamp(15, 0, 10) == 10
