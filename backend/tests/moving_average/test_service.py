import pytest
from modules.moving_average.services.ma_service import MAService
from modules.moving_average.schemas.ma_schemas import PriceBarSchema


def _price_bars(n=50, start=100.0, step=1.0) -> list[PriceBarSchema]:
    return [
        PriceBarSchema(
            date=f"2024-01-{i+1:02d}",
            open=start + i * step,
            high=start + i * step + 2,
            low=start + i * step - 1,
            close=start + i * step,
            volume=1000.0 + i * 10,
        )
        for i in range(n)
    ]


class TestMAService:
    def setup_method(self):
        self.service = MAService()

    def test_calculate_sma(self):
        result = self.service.calculate("sma", 10, _price_bars(30))
        assert result.indicator == "SMA"
        assert result.period == 10
        assert result.current_value is not None

    def test_calculate_invalid_period(self):
        with pytest.raises(ValueError):
            self.service.calculate("sma", 0, _price_bars(30))

    def test_calculate_invalid_ma_type(self):
        with pytest.raises(ValueError, match="Unknown MA type"):
            self.service.calculate("xyz", 10, _price_bars(30))

    def test_calculate_multiple(self):
        results = self.service.calculate_multiple("sma", [5, 10], _price_bars(30))
        assert len(results) == 2
        assert results[0].period == 5

    def test_calculate_crossovers(self):
        result = self.service.calculate_crossovers("sma", 5, 20, _price_bars(50))
        assert result.fast_period == 5
        assert result.slow_period == 20

    def test_get_available_types(self):
        result = self.service.get_available_types()
        assert "sma" in result.types
        assert "ema" in result.types

    def test_get_timeframes(self):
        result = self.service.get_timeframes()
        assert len(result.timeframes) == 7

    def test_get_timeframes_with_base(self):
        result = self.service.get_timeframes(timeframe="daily")
        assert len(result.higher) > 0
        assert len(result.lower) > 0

    def test_get_timeframes_with_alignment(self):
        result = self.service.get_timeframes(
            timeframe="daily",
            uptrend_timeframes=["daily", "weekly", "monthly"],
        )
        assert result.alignment_score is not None
        assert result.alignment_score > 0

    def test_validate_valid(self):
        result = self.service.validate("sma", 10, _price_bars(30))
        assert result.valid is True
        assert result.sufficient_data is True

    def test_validate_invalid_period(self):
        result = self.service.validate("sma", 0, _price_bars(30))
        assert result.valid is False
        assert len(result.errors) > 0

    def test_validate_unknown_type(self):
        result = self.service.validate("xyz", 10, _price_bars(30))
        assert result.valid is False

    def test_validate_insufficient_data(self):
        result = self.service.validate("sma", 100, _price_bars(30))
        assert result.sufficient_data is False
        assert len(result.warnings) > 0

    def test_validate_vwma_zero_volume_warning(self):
        bars = [
            PriceBarSchema(
                date=f"2024-01-{i+1:02d}", open=100, high=105, low=95,
                close=100, volume=0,
            )
            for i in range(30)
        ]
        result = self.service.validate("vwma", 10, bars)
        assert any("zero" in w.lower() for w in result.warnings)

    def test_calculate_with_all_options(self):
        result = self.service.calculate(
            "sma", 10, _price_bars(30),
            include_slope=True,
            include_distance=True,
            include_trend=True,
            include_signals=True,
            include_smart_signals=True,
            include_scores=True,
            fast_period=5,
            slow_period=20,
        )
        assert result.slope is not None
        assert result.distance_from_price is not None
        assert result.trend is not None

    def test_response_serialization(self):
        result = self.service.calculate("sma", 10, _price_bars(30))
        d = result.model_dump()
        assert d["indicator"] == "SMA"
        assert "values" in d
