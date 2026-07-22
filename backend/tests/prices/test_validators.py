import pytest
from datetime import date, timedelta

from modules.prices.validators.price_validator import PriceValidator, ValidationResult


class TestValidationResult:
    def test_initial_state(self):
        result = ValidationResult()
        assert result.is_valid is True
        assert result.errors == []
        assert result.warnings == []

    def test_add_error(self):
        result = ValidationResult()
        result.add_error("something broke")
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0] == "something broke"

    def test_add_warning(self):
        result = ValidationResult()
        result.add_warning("heads up")
        assert result.is_valid is True
        assert len(result.warnings) == 1


class TestValidateSinglePrice:
    def test_valid_price(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000000}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is True

    def test_missing_ohlc(self):
        data = {"open": 100, "high": None, "low": 95, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("OHLC" in e for e in result.errors)

    def test_missing_all_ohlc(self):
        data = {"volume": 1000}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False

    def test_negative_open(self):
        data = {"open": -10, "high": 110, "low": 5, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Open" in e for e in result.errors)

    def test_negative_high(self):
        data = {"open": 100, "high": -1, "low": 5, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("High" in e for e in result.errors)

    def test_negative_low(self):
        data = {"open": 100, "high": 110, "low": -5, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False

    def test_negative_close(self):
        data = {"open": 100, "high": 110, "low": 5, "close": -105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False

    def test_high_less_than_low(self):
        data = {"open": 100, "high": 50, "low": 60, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("High" in e and "Low" in e for e in result.errors)

    def test_open_greater_than_high(self):
        data = {"open": 200, "high": 110, "low": 5, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Open" in e and "High" in e for e in result.errors)

    def test_open_less_than_low(self):
        data = {"open": 3, "high": 110, "low": 5, "close": 105}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Open" in e and "Low" in e for e in result.errors)

    def test_close_greater_than_high(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 200}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Close" in e and "High" in e for e in result.errors)

    def test_close_less_than_low(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 50}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Close" in e and "Low" in e for e in result.errors)

    def test_negative_volume(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 105, "volume": -100}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Volume" in e for e in result.errors)

    def test_negative_turnover(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 105, "turnover": -500}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Turnover" in e for e in result.errors)

    def test_negative_trade_count(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 105, "trade_count": -5}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert any("Trade count" in e for e in result.errors)

    def test_valid_with_trade_count(self):
        data = {"open": 100, "high": 110, "low": 95, "close": 105, "trade_count": 50}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is True

    def test_zero_prices_all_invalid(self):
        data = {"open": 0, "high": 0, "low": 0, "close": 0}
        result = PriceValidator.validate_single_price(data)
        assert result.is_valid is False
        assert len(result.errors) >= 4


class TestValidateBatch:
    def test_empty_list(self):
        result = PriceValidator.validate_batch([])
        assert result.is_valid is False
        assert any("empty" in e.lower() for e in result.errors)

    def test_valid_batch(self):
        prices = [
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105},
            {"date": date(2025, 1, 3), "stock_code": "THYAO", "open": 105, "high": 115, "low": 100, "close": 110},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is True

    def test_duplicate_dates(self):
        prices = [
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105},
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": 105, "high": 115, "low": 100, "close": 110},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("duplicate" in e.lower() for e in result.errors)

    def test_non_chronological_dates(self):
        prices = [
            {"date": date(2025, 1, 5), "stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105},
            {"date": date(2025, 1, 3), "stock_code": "THYAO", "open": 105, "high": 115, "low": 100, "close": 110},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("not after" in e.lower() for e in result.errors)

    def test_future_date(self):
        future = date.today() + timedelta(days=10)
        prices = [
            {"date": future, "stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("future" in e.lower() for e in result.errors)

    def test_missing_date(self):
        prices = [{"stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105}]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("missing date" in e.lower() for e in result.errors)

    def test_empty_stock_code(self):
        prices = [
            {"date": date(2025, 1, 2), "stock_code": "", "open": 100, "high": 110, "low": 95, "close": 105},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("stock_code" in e.lower() for e in result.errors)

    def test_invalid_ohlc_in_batch(self):
        prices = [
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": -100, "high": 110, "low": 95, "close": 105},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False

    def test_mixed_valid_and_invalid(self):
        prices = [
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": 100, "high": 110, "low": 95, "close": 105},
            {"date": date(2025, 1, 2), "stock_code": "THYAO", "open": 105, "high": 115, "low": 100, "close": 110},
        ]
        result = PriceValidator.validate_batch(prices)
        assert result.is_valid is False
        assert any("duplicate" in e.lower() for e in result.errors)


class TestValidateDateRange:
    def test_valid_range(self):
        result = PriceValidator.validate_date_range(date(2025, 1, 1), date(2025, 12, 31))
        assert result.is_valid is True

    def test_start_after_end(self):
        result = PriceValidator.validate_date_range(date(2025, 12, 31), date(2025, 1, 1))
        assert result.is_valid is False
        assert any("after" in e.lower() for e in result.errors)

    def test_future_end_date_warning(self):
        future = date.today() + timedelta(days=10)
        result = PriceValidator.validate_date_range(date(2025, 1, 1), future)
        assert result.is_valid is True
        assert len(result.warnings) == 1

    def test_none_dates(self):
        result = PriceValidator.validate_date_range(None, None)
        assert result.is_valid is True


class TestValidateStockCode:
    def test_valid_code(self):
        result = PriceValidator.validate_stock_code("THYAO")
        assert result.is_valid is True

    def test_empty_code(self):
        result = PriceValidator.validate_stock_code("")
        assert result.is_valid is False

    def test_whitespace_code(self):
        result = PriceValidator.validate_stock_code("   ")
        assert result.is_valid is False

    def test_none_like_code(self):
        result = PriceValidator.validate_stock_code("  ")
        assert result.is_valid is False

    def test_too_long(self):
        result = PriceValidator.validate_stock_code("A" * 11)
        assert result.is_valid is False

    def test_special_characters(self):
        result = PriceValidator.validate_stock_code("TH@AO")
        assert result.is_valid is False

    def test_valid_alphanumeric(self):
        result = PriceValidator.validate_stock_code("TUPRS1")
        assert result.is_valid is True
