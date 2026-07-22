import pytest
from modules.volume_engine.services.volume_service import VolumeService
from modules.volume_engine.schemas.volume_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse,
    SmartMoneyResponse, LiquidityResponse, InstitutionalScoreResponse,
)
from tests.volume_engine.conftest import _bars


def _schema_bars(bars=None):
    if bars is None:
        bars = _bars(50)
    return [
        PriceBarSchema(
            date=b.date, open=b.open, high=b.high,
            low=b.low, close=b.close, volume=b.volume,
        )
        for b in bars
    ]


class TestVolumeService:
    def setup_method(self):
        self.service = VolumeService()

    def test_calculate_obv(self):
        result = self.service.calculate("obv", _schema_bars())
        assert isinstance(result, IndicatorResponse)
        assert result.indicator == "On Balance Volume"
        assert result.current_value is not None

    def test_calculate_cmf(self):
        result = self.service.calculate("cmf", _schema_bars())
        assert result.indicator == "Chaikin Money Flow"

    def test_calculate_mfi(self):
        result = self.service.calculate("mfi", _schema_bars())
        assert result.indicator == "Money Flow Index"

    def test_calculate_vwap(self):
        result = self.service.calculate("vwap", _schema_bars())
        assert result.indicator == "Volume Weighted Average Price"

    def test_calculate_rvol(self):
        result = self.service.calculate("rvol", _schema_bars())
        assert result.indicator == "Relative Volume"

    def test_calculate_unknown(self):
        with pytest.raises(ValueError, match="Unknown indicator"):
            self.service.calculate("xyz", _schema_bars())

    def test_calculate_with_signals(self):
        result = self.service.calculate(
            "obv", _schema_bars(), include_signals=True,
        )
        assert len(result.warnings) > 0

    def test_calculate_with_smart_money(self):
        result = self.service.calculate(
            "obv", _schema_bars(), include_smart_money=True,
        )
        assert result.current_value is not None

    def test_calculate_with_liquidity(self):
        result = self.service.calculate(
            "obv", _schema_bars(), include_liquidity=True,
        )
        assert result.current_value is not None

    def test_calculate_with_scoring(self):
        result = self.service.calculate(
            "obv", _schema_bars(), include_scoring=True,
        )
        assert result.current_value is not None

    def test_get_signals(self):
        signals = self.service.get_signals("obv", _schema_bars())
        assert len(signals) > 0
        assert isinstance(signals[0], SignalResponse)

    def test_get_available_indicators(self):
        resp = self.service.get_available_indicators()
        assert "obv" in resp.indicators
        assert len(resp.indicators) == 12

    def test_get_cache_stats(self):
        self.service.calculate("obv", _schema_bars())
        stats = self.service.get_cache_stats()
        assert stats.size >= 0

    def test_detect_smart_money(self):
        sm = self.service.detect_smart_money("obv", _schema_bars())
        assert isinstance(sm, SmartMoneyResponse)
        assert sm.detection_type in [
            "institutional_accumulation", "institutional_distribution",
            "hidden_buying", "hidden_selling", "silent_accumulation",
            "volume_spike", "absorption", "none",
        ]

    def test_analyze_liquidity(self):
        liq = self.service.analyze_liquidity(_schema_bars())
        assert isinstance(liq, LiquidityResponse)
        assert liq.liquidity_score >= 0

    def test_get_institutional_score(self):
        score = self.service.get_institutional_score(_schema_bars())
        assert isinstance(score, InstitutionalScoreResponse)
        assert score.smart_money_score >= 0

    def test_benchmark_indicator(self):
        resp = self.service.benchmark_indicator("obv", _schema_bars(), iterations=10)
        assert resp.indicator == "obv"
        assert resp.iterations == 10
        assert resp.total_seconds >= 0

    def test_benchmark_unknown(self):
        with pytest.raises(ValueError, match="Unknown indicator"):
            self.service.benchmark_indicator("xyz", _schema_bars())
