import pytest
from modules.volume_engine.schemas.volume_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse, CalculateRequest,
    AvailableIndicatorsResponse, CacheStatsResponse, BenchmarkResponse,
    SmartMoneyResponse, LiquidityResponse, InstitutionalScoreResponse,
    VolumeScoreResponse,
)
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SignalType, TrendDirection,
    SmartMoneyResult, LiquidityResult, InstitutionalScore, VolumeScore,
)


class TestPriceBarSchema:
    def test_create(self):
        p = PriceBarSchema(
            date="2024-01-01", open=100, high=105, low=95,
            close=100, volume=1000,
        )
        assert p.date == "2024-01-01"
        assert p.close == 100
        assert p.turnover == 0.0

    def test_with_turnover(self):
        p = PriceBarSchema(
            date="2024-01-01", open=100, high=105, low=95,
            close=100, volume=1000, turnover=50000,
        )
        assert p.turnover == 50000


class TestIndicatorResponse:
    def test_create(self):
        r = IndicatorResponse(
            indicator="OBV", parameters={}, values=[100, 200],
            dates=["2024-01-01", "2024-01-02"],
            current_value=200, trend="bullish",
        )
        assert r.indicator == "OBV"
        assert r.trend == "bullish"
        assert r.warnings == []
        assert r.calculation_time_ms == 0.0


class TestSignalResponse:
    def test_create(self):
        s = SignalResponse(
            signal_type="BUY", indicator="OBV",
            confidence=0.7, strength=0.5, description="test",
        )
        assert s.signal_type == "BUY"
        assert s.parameters == {}


class TestSmartMoneyResponse:
    def test_create(self):
        r = SmartMoneyResponse()
        assert r.detection_type == "none"
        assert r.confidence == 0.0


class TestLiquidityResponse:
    def test_create(self):
        r = LiquidityResponse()
        assert r.liquidity_score == 0.0


class TestInstitutionalScoreResponse:
    def test_create(self):
        r = InstitutionalScoreResponse()
        assert r.smart_money_score == 0.0


class TestVolumeScoreResponse:
    def test_create(self):
        r = VolumeScoreResponse()
        assert r.volume_score == 0.0


class TestCalculateRequest:
    def test_create(self):
        req = CalculateRequest(
            indicator="obv",
            prices=[PriceBarSchema(
                date="2024-01-01", open=100, high=105,
                low=95, close=100, volume=1000,
            )],
        )
        assert req.indicator == "obv"
        assert req.include_signals is True
        assert req.include_smart_money is False
        assert req.include_liquidity is False
        assert req.include_scoring is False
        assert req.params == {}

    def test_with_params(self):
        req = CalculateRequest(
            indicator="cmf",
            prices=[PriceBarSchema(
                date="2024-01-01", open=100, high=105,
                low=95, close=100, volume=1000,
            )],
            params={"period": 20},
        )
        assert req.params == {"period": 20}


class TestAvailableIndicatorsResponse:
    def test_create(self):
        r = AvailableIndicatorsResponse(indicators=["obv"], details={})
        assert r.indicators == ["obv"]


class TestCacheStatsResponse:
    def test_create(self):
        r = CacheStatsResponse(
            size=0, max_size=100, hits=0, misses=0, hit_ratio=0.0,
        )
        assert r.size == 0


class TestBenchmarkResponse:
    def test_create(self):
        r = BenchmarkResponse(
            indicator="obv", iterations=1000, total_seconds=1.0,
            avg_ms=1.0, ops_per_second=1000, memory_bytes=0,
        )
        assert r.indicator == "obv"
