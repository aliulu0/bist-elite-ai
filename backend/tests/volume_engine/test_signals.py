import pytest
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.core.types import IndicatorResult, Signal, TrendDirection, SignalType
from tests.volume_engine.conftest import _bars


class TestVolumeSignalEngine:
    def setup_method(self):
        self.engine = VolumeSignalEngine()

    def test_generate_obv_signals(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100, 200, 300],
            dates=["2024-01-01", "2024-01-02", "2024-01-03"],
            current_value=300, previous_value=200, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_obv_signals(result)
        assert len(signals) > 0
        assert signals[0].signal_type == SignalType.BUY

    def test_generate_obv_signals_bearish(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[300, 200, 100],
            dates=["2024-01-01", "2024-01-02", "2024-01-03"],
            current_value=100, previous_value=200, trend=TrendDirection.BEARISH,
        )
        signals = self.engine.generate_obv_signals(result)
        assert signals[0].signal_type == SignalType.SELL

    def test_generate_obv_signals_neutral(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100, 100, 100],
            dates=["2024-01-01", "2024-01-02", "2024-01-03"],
            current_value=100, previous_value=100, trend=TrendDirection.NEUTRAL,
        )
        signals = self.engine.generate_obv_signals(result)
        assert signals[0].signal_type == SignalType.NEUTRAL

    def test_generate_obv_signals_none(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[None],
            dates=["2024-01-01"], current_value=None,
        )
        signals = self.engine.generate_obv_signals(result)
        assert len(signals) == 0

    def test_generate_cmf_signals(self):
        result = IndicatorResult(
            indicator="CMF", parameters={}, values=[0.15],
            dates=["2024-01-01"], current_value=0.15,
        )
        signals = self.engine.generate_cmf_signals(result)
        assert signals[0].signal_type == SignalType.BUY

    def test_generate_cmf_signals_selling(self):
        result = IndicatorResult(
            indicator="CMF", parameters={}, values=[-0.15],
            dates=["2024-01-01"], current_value=-0.15,
        )
        signals = self.engine.generate_cmf_signals(result)
        assert signals[0].signal_type == SignalType.SELL

    def test_generate_cmf_signals_neutral(self):
        result = IndicatorResult(
            indicator="CMF", parameters={}, values=[0.02],
            dates=["2024-01-01"], current_value=0.02,
        )
        signals = self.engine.generate_cmf_signals(result)
        assert signals[0].signal_type == SignalType.NEUTRAL

    def test_generate_mfi_signals_overbought(self):
        result = IndicatorResult(
            indicator="MFI", parameters={}, values=[85],
            dates=["2024-01-01"], current_value=85,
        )
        signals = self.engine.generate_mfi_signals(result)
        assert signals[0].signal_type == SignalType.SELL

    def test_generate_mfi_signals_oversold(self):
        result = IndicatorResult(
            indicator="MFI", parameters={}, values=[15],
            dates=["2024-01-01"], current_value=15,
        )
        signals = self.engine.generate_mfi_signals(result)
        assert signals[0].signal_type == SignalType.BUY

    def test_generate_mfi_signals_neutral(self):
        result = IndicatorResult(
            indicator="MFI", parameters={}, values=[50],
            dates=["2024-01-01"], current_value=50,
        )
        signals = self.engine.generate_mfi_signals(result)
        assert signals[0].signal_type == SignalType.NEUTRAL

    def test_generate_vwap_signals_bullish(self):
        result = IndicatorResult(
            indicator="VWAP", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_vwap_signals(result)
        assert signals[0].signal_type == SignalType.BUY

    def test_generate_vwap_signals_bearish(self):
        result = IndicatorResult(
            indicator="VWAP", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
            trend=TrendDirection.BEARISH,
        )
        signals = self.engine.generate_vwap_signals(result)
        assert signals[0].signal_type == SignalType.SELL

    def test_generate_rvol_signals_high(self):
        result = IndicatorResult(
            indicator="RVOL", parameters={}, values=[2.5],
            dates=["2024-01-01"], current_value=2.5,
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_rvol_signals(result)
        assert signals[0].signal_type in [SignalType.BUY, SignalType.STRONG_BUY]

    def test_generate_rvol_signals_low(self):
        result = IndicatorResult(
            indicator="RVOL", parameters={}, values=[0.3],
            dates=["2024-01-01"], current_value=0.3,
            trend=TrendDirection.NEUTRAL,
        )
        signals = self.engine.generate_rvol_signals(result)
        assert signals[0].signal_type == SignalType.WAIT

    def test_generate_generic_volume_signals_bullish(self):
        result = IndicatorResult(
            indicator="ADL", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_generic_volume_signals(result, "ADL")
        assert signals[0].signal_type == SignalType.BUY

    def test_generate_generic_volume_signals_bearish(self):
        result = IndicatorResult(
            indicator="ADL", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
            trend=TrendDirection.BEARISH,
        )
        signals = self.engine.generate_generic_volume_signals(result, "ADL")
        assert signals[0].signal_type == SignalType.SELL

    def test_aggregate_signals_empty(self):
        agg = self.engine.aggregate_signals([])
        assert agg.signal_type == SignalType.WAIT

    def test_aggregate_signals_buy(self):
        signals = [
            Signal(signal_type=SignalType.BUY, indicator="A",
                   confidence=0.7, strength=0.5, description="buy"),
            Signal(signal_type=SignalType.BUY, indicator="B",
                   confidence=0.7, strength=0.5, description="buy"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type == SignalType.BUY

    def test_aggregate_signals_sell(self):
        signals = [
            Signal(signal_type=SignalType.SELL, indicator="A",
                   confidence=0.7, strength=0.5, description="sell"),
            Signal(signal_type=SignalType.SELL, indicator="B",
                   confidence=0.7, strength=0.5, description="sell"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type == SignalType.SELL

    def test_aggregate_signals_neutral(self):
        signals = [
            Signal(signal_type=SignalType.NEUTRAL, indicator="A",
                   confidence=0.5, strength=0.0, description="neutral"),
            Signal(signal_type=SignalType.NEUTRAL, indicator="B",
                   confidence=0.5, strength=0.0, description="neutral"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type == SignalType.NEUTRAL
