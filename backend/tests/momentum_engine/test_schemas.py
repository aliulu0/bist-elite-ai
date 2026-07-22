import pytest
from modules.momentum_engine.schemas.momentum_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse, CalculateRequest,
    AvailableIndicatorsResponse, CacheStatsResponse, BenchmarkResponse,
)
from pydantic import ValidationError


class TestPriceBarSchema:
    def test_valid(self):
        bar = PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)
        assert bar.close == 102


class TestIndicatorResponse:
    def test_valid(self):
        r = IndicatorResponse(
            indicator="RSI", parameters={"period": 14},
            values=[50], dates=["d1"],
            trend="bullish",
        )
        assert r.indicator == "RSI"


class TestSignalResponse:
    def test_valid(self):
        s = SignalResponse(signal_type="BUY", indicator="RSI", confidence=0.7, strength=0.5, description="test")
        assert s.signal_type == "BUY"


class TestCalculateRequest:
    def test_valid(self):
        req = CalculateRequest(
            indicator="rsi",
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
        )
        assert req.indicator == "rsi"

    def test_empty_prices_fails(self):
        with pytest.raises(ValidationError):
            CalculateRequest(indicator="rsi", prices=[])


class TestAvailableIndicatorsResponse:
    def test_valid(self):
        r = AvailableIndicatorsResponse(indicators=["rsi"], details={"rsi": {}})
        assert "rsi" in r.indicators


class TestCacheStatsResponse:
    def test_valid(self):
        r = CacheStatsResponse(size=0, max_size=100, hits=0, misses=0, hit_ratio=0.0)
        assert r.size == 0
