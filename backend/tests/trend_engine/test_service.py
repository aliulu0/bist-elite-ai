import pytest
from modules.trend_engine.services.trend_service import TrendService
from modules.trend_engine.schemas.trend_schemas import PriceBarSchema
from tests.trend_engine.conftest import _bars


def _price_schemas(bars=None):
    if bars is None:
        bars = _bars(100)
    return [
        PriceBarSchema(
            date=b.date, open=b.open, high=b.high,
            low=b.low, close=b.close, volume=b.volume,
        )
        for b in bars
    ]


class TestTrendService:
    def setup_method(self):
        self.service = TrendService()

    def test_calculate_supertrend(self):
        resp = self.service.calculate("supertrend", _price_schemas())
        assert resp.indicator == "SuperTrend"
        assert resp.current_value is not None

    def test_calculate_bollinger(self):
        resp = self.service.calculate("bollinger", _price_schemas())
        assert resp.indicator == "Bollinger Bands"

    def test_calculate_unknown(self):
        with pytest.raises(ValueError):
            self.service.calculate("xyz", _price_schemas())

    def test_get_signals(self):
        signals = self.service.get_signals("supertrend", _price_schemas())
        assert len(signals) > 0
        assert signals[0].signal_type in ["BUY", "SELL", "NEUTRAL", "STRONG_BUY", "STRONG_SELL", "WAIT"]

    def test_get_available_indicators(self):
        resp = self.service.get_available_indicators()
        assert len(resp.indicators) == 8
        assert "supertrend" in resp.indicators
        assert "bollinger" in resp.indicators

    def test_get_cache_stats(self):
        resp = self.service.get_cache_stats()
        assert resp.max_size == 1000

    def test_analyze_trend(self):
        resp = self.service.analyze_trend("supertrend", _price_schemas())
        assert resp.primary_trend in ["bullish", "bearish", "neutral"]
        assert 0 <= resp.strength <= 1.0

    def test_custom_params(self):
        resp = self.service.calculate("supertrend", _price_schemas(), period=14)
        assert resp.parameters["period"] == 14
