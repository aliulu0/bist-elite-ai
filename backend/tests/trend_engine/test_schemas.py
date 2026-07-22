import pytest
from modules.trend_engine.schemas.trend_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse, TrendResultResponse,
    BreakoutResultResponse, PullbackResultResponse, TrendScoreResponse,
    CalculateRequest, AvailableIndicatorsResponse, CacheStatsResponse,
    BenchmarkResponse, SignalAggregateResponse, CalculateWithAnalysisResponse,
)


class TestPriceBarSchema:
    def test_valid(self):
        p = PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=100, volume=1000)
        assert p.close == 100.0

    def test_with_turnover(self):
        p = PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=100, volume=1000, turnover=500)
        assert p.turnover == 500


class TestIndicatorResponse:
    def test_valid(self):
        r = IndicatorResponse(indicator="test", parameters={}, values=[1.0], dates=["2024-01-01"])
        assert r.indicator == "test"
        assert r.trend == "neutral"

    def test_defaults(self):
        r = IndicatorResponse(indicator="test", parameters={}, values=[], dates=[])
        assert r.warnings == []
        assert r.calculation_time_ms == 0.0


class TestSignalResponse:
    def test_valid(self):
        s = SignalResponse(signal_type="BUY", indicator="test", confidence=0.7, strength=0.5, description="test")
        assert s.signal_type == "BUY"


class TestTrendResultResponse:
    def test_valid(self):
        t = TrendResultResponse()
        assert t.primary_trend == "neutral"
        assert t.strength == 0.0

    def test_custom(self):
        t = TrendResultResponse(primary_trend="bullish", phase="mature", strength=0.8)
        assert t.primary_trend == "bullish"
        assert t.phase == "mature"


class TestCalculateRequest:
    def test_valid(self):
        req = CalculateRequest(
            indicator="supertrend",
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=100, volume=1000)],
        )
        assert req.indicator == "supertrend"
        assert req.include_signals is True

    def test_empty_prices_fails(self):
        with pytest.raises(Exception):
            CalculateRequest(indicator="supertrend", prices=[])


class TestAvailableIndicatorsResponse:
    def test_valid(self):
        r = AvailableIndicatorsResponse(indicators=["supertrend"], details={"supertrend": {}})
        assert len(r.indicators) == 1


class TestCacheStatsResponse:
    def test_valid(self):
        r = CacheStatsResponse(size=0, max_size=1000, hits=0, misses=0, hit_ratio=0.0)
        assert r.size == 0


class TestBenchmarkResponse:
    def test_valid(self):
        r = BenchmarkResponse(
            indicator="test", iterations=100, total_seconds=0.1,
            avg_ms=1.0, ops_per_second=1000, memory_bytes=0,
        )
        assert r.iterations == 100


class TestSignalAggregateResponse:
    def test_valid(self):
        r = SignalAggregateResponse(
            signal_type="BUY", confidence=0.7, strength=0.5, description="test",
        )
        assert r.signal_type == "BUY"
        assert r.individual_signals == []


class TestCalculateWithAnalysisResponse:
    def test_valid(self):
        r = CalculateWithAnalysisResponse(
            indicator=IndicatorResponse(indicator="test", parameters={}, values=[], dates=[]),
        )
        assert r.signals == []
        assert r.trend_analysis is None
