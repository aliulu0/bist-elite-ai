import pytest
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.signals.divergence_engine import DivergenceEngine
from modules.momentum_engine.signals.scoring_engine import ScoringEngine
from modules.momentum_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection, MomentumScore,
)


class TestSignalEngine:
    def setup_method(self):
        self.engine = SignalEngine()

    def test_rsi_oversold(self):
        result = IndicatorResult(
            indicator="RSI", parameters={"period": 14},
            values=[30, 25, 20], dates=["d1", "d2", "d3"],
            current_value=25, previous_value=30,
            slope=-0.01, trend=TrendDirection.BEARISH,
        )
        signals = self.engine.generate_rsi_signals(result)
        assert any(s.signal_type in (SignalType.BUY, SignalType.STRONG_BUY) for s in signals)

    def test_rsi_overbought(self):
        result = IndicatorResult(
            indicator="RSI", parameters={"period": 14},
            values=[70, 75, 80], dates=["d1", "d2", "d3"],
            current_value=75, previous_value=70,
            slope=0.01, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_rsi_signals(result)
        assert any(s.signal_type in (SignalType.SELL, SignalType.STRONG_SELL) for s in signals)

    def test_rsi_neutral(self):
        result = IndicatorResult(
            indicator="RSI", parameters={"period": 14},
            values=[50], dates=["d1"],
            current_value=50,
        )
        signals = self.engine.generate_rsi_signals(result)
        assert any(s.signal_type == SignalType.NEUTRAL for s in signals)

    def test_macd_bullish_cross(self):
        result = IndicatorResult(
            indicator="MACD", parameters={},
            values=[-0.5, -0.2, 0.1], dates=["d1", "d2", "d3"],
            current_value=0.1, previous_value=-0.2,
        )
        signals = self.engine.generate_macd_signals(result)
        assert any(s.signal_type == SignalType.BUY for s in signals)

    def test_macd_bearish_cross(self):
        result = IndicatorResult(
            indicator="MACD", parameters={},
            values=[0.5, 0.2, -0.1], dates=["d1", "d2", "d3"],
            current_value=-0.1, previous_value=0.2,
        )
        signals = self.engine.generate_macd_signals(result)
        assert any(s.signal_type == SignalType.SELL for s in signals)

    def test_adx_strong_trend(self):
        result = IndicatorResult(
            indicator="ADX", parameters={},
            values=[30], dates=["d1"],
            current_value=30, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_adx_signals(result)
        assert len(signals) > 0

    def test_adx_weak_trend(self):
        result = IndicatorResult(
            indicator="ADX", parameters={},
            values=[15], dates=["d1"],
            current_value=15,
        )
        signals = self.engine.generate_adx_signals(result)
        assert any(s.signal_type == SignalType.WAIT for s in signals)

    def test_generic_signals_oversold(self):
        result = IndicatorResult(
            indicator="CCI", parameters={},
            values=[-150], dates=["d1"],
            current_value=-150,
        )
        signals = self.engine.generate_generic_signals(result, "CCI", overbought=100, oversold=-100)
        assert any(s.signal_type == SignalType.BUY for s in signals)

    def test_aggregate_signals(self):
        signals = [
            Signal(SignalType.BUY, "test", 0.7, 0.5, "buy"),
            Signal(SignalType.SELL, "test", 0.6, 0.4, "sell"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type.value in ["BUY", "SELL", "NEUTRAL", "WAIT"]

    def test_aggregate_empty(self):
        agg = self.engine.aggregate_signals([])
        assert agg.signal_type == SignalType.WAIT

    def test_stoch_rsi_signals(self):
        result = IndicatorResult(
            indicator="StochRSI", parameters={},
            values=[15], dates=["d1"],
            current_value=15,
        )
        signals = self.engine.generate_stoch_rsi_signals(result)
        assert len(signals) > 0


class TestDivergenceEngine:
    def setup_method(self):
        self.engine = DivergenceEngine()

    def test_detect(self):
        indicator = [None] * 20 + [50, 55, 52, 58, 54, 56, 60, 62, 58, 55]
        prices = [100 + i * 0.5 for i in range(30)]
        divs = self.engine.detect(indicator, prices)
        assert isinstance(divs, list)

    def test_detect_latest_none(self):
        indicator = [None] * 5
        prices = [100.0] * 5
        assert self.engine.detect_latest(indicator, prices) is None


class TestScoringEngine:
    def setup_method(self):
        self.engine = ScoringEngine()

    def test_momentum_score(self):
        result = IndicatorResult(
            indicator="test", parameters={},
            values=[50], dates=["d1"],
            current_value=50, slope=0.01,
        )
        score = self.engine.calculate_momentum_score(result)
        assert 0 <= score <= 100

    def test_trend_score(self):
        result = IndicatorResult(
            indicator="test", parameters={},
            values=[50], dates=["d1"],
            current_value=50, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_trend_score(result)
        assert score == 70.0

    def test_signal_score(self):
        signals = [Signal(SignalType.BUY, "test", 0.7, 0.5, "buy")]
        score = self.engine.calculate_signal_score(signals)
        assert 0 <= score <= 100

    def test_signal_score_empty(self):
        assert self.engine.calculate_signal_score([]) == 50.0

    def test_confidence_score(self):
        result = IndicatorResult(
            indicator="test", parameters={},
            values=[50], dates=["d1"],
            current_value=50,
        )
        score = self.engine.calculate_confidence_score(result, [1, 2, 3, 4, 5])
        assert 0 <= score <= 100

    def test_composite(self):
        result = IndicatorResult(
            indicator="test", parameters={},
            values=[50], dates=["d1"],
            current_value=50, slope=0.01,
            trend=TrendDirection.BULLISH,
        )
        signals = [Signal(SignalType.BUY, "test", 0.7, 0.5, "buy")]
        score = self.engine.calculate_composite(result, signals, [1, 2, 3])
        assert 0 <= score.composite_score <= 100
        assert isinstance(score, MomentumScore)
