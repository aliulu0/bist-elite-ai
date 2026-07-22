import pytest
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.signals.breakout_engine import BreakoutEngine
from modules.trend_engine.signals.pullback_engine import PullbackEngine
from modules.trend_engine.signals.trend_scoring_engine import TrendScoringEngine
from modules.trend_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection, PriceBar,
    BreakoutResult, BreakoutType, PullbackResult, PullbackType,
)
from tests.trend_engine.conftest import _bars


class TestTrendSignalEngine:
    def setup_method(self):
        self.engine = TrendSignalEngine()

    def test_trend_signals_bullish(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, trend=TrendDirection.BULLISH, slope=0.01,
        )
        signals = self.engine.generate_trend_signals(result)
        assert len(signals) == 1
        assert signals[0].signal_type.value == "BUY"

    def test_trend_signals_bearish(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, trend=TrendDirection.BEARISH, slope=-0.01,
        )
        signals = self.engine.generate_trend_signals(result)
        assert signals[0].signal_type.value == "SELL"

    def test_trend_signals_neutral(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, trend=TrendDirection.NEUTRAL,
        )
        signals = self.engine.generate_trend_signals(result)
        assert signals[0].signal_type.value == "NEUTRAL"

    def test_trend_signals_none_value(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=None,
        )
        signals = self.engine.generate_trend_signals(result)
        assert len(signals) == 0

    def test_supertrend_signals_bullish_flip(self):
        result = IndicatorResult(
            indicator="SuperTrend", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=5.0, previous_value=-5.0,
        )
        signals = self.engine.generate_supertrend_signals(result)
        assert len(signals) == 1
        assert signals[0].signal_type.value == "BUY"

    def test_supertrend_signals_bearish_flip(self):
        result = IndicatorResult(
            indicator="SuperTrend", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=-5.0, previous_value=5.0,
        )
        signals = self.engine.generate_supertrend_signals(result)
        assert signals[0].signal_type.value == "SELL"

    def test_supertrend_neutral(self):
        result = IndicatorResult(
            indicator="SuperTrend", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=0.0, previous_value=0.0,
        )
        signals = self.engine.generate_supertrend_signals(result)
        assert signals[0].signal_type.value == "NEUTRAL"

    def test_bollinger_signals_overbought(self):
        result = IndicatorResult(
            indicator="Bollinger", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=2.5,
        )
        signals = self.engine.generate_bollinger_signals(result)
        assert signals[0].signal_type.value == "STRONG_SELL"

    def test_bollinger_signals_oversold(self):
        result = IndicatorResult(
            indicator="Bollinger", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=-2.5,
        )
        signals = self.engine.generate_bollinger_signals(result)
        assert signals[0].signal_type.value == "STRONG_BUY"

    def test_bollinger_neutral(self):
        result = IndicatorResult(
            indicator="Bollinger", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=0.0,
        )
        signals = self.engine.generate_bollinger_signals(result)
        assert signals[0].signal_type.value == "NEUTRAL"

    def test_aggregate_empty(self):
        agg = self.engine.aggregate_signals([])
        assert agg.signal_type.value == "WAIT"

    def test_aggregate_bullish(self):
        signals = [
            Signal(signal_type=SignalType.BUY, indicator="a", confidence=0.7, strength=0.5, description="a"),
            Signal(signal_type=SignalType.BUY, indicator="b", confidence=0.8, strength=0.6, description="b"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type.value == "BUY"

    def test_aggregate_bearish(self):
        signals = [
            Signal(signal_type=SignalType.SELL, indicator="a", confidence=0.7, strength=0.5, description="a"),
            Signal(signal_type=SignalType.SELL, indicator="b", confidence=0.8, strength=0.6, description="b"),
        ]
        agg = self.engine.aggregate_signals(signals)
        assert agg.signal_type.value == "SELL"

    def test_keltner_signals(self):
        result = IndicatorResult(
            indicator="Keltner", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=2.0,
        )
        signals = self.engine.generate_keltner_signals(result)
        assert signals[0].signal_type.value == "SELL"

    def test_donchian_signals(self):
        result = IndicatorResult(
            indicator="Donchian", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=0.5, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_donchian_signals(result)
        assert signals[0].signal_type.value == "BUY"

    def test_ma_envelope_signals(self):
        result = IndicatorResult(
            indicator="MAEnvelope", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=1.5,
        )
        signals = self.engine.generate_ma_envelope_signals(result)
        assert signals[0].signal_type.value == "SELL"

    def test_linear_reg_signals(self):
        result = IndicatorResult(
            indicator="LinReg", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=0.01, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_linear_reg_signals(result)
        assert signals[0].signal_type.value == "BUY"

    def test_ichimoku_signals(self):
        result = IndicatorResult(
            indicator="Ichimoku", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=0.5, trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_ichimoku_signals(result)
        assert signals[0].signal_type.value == "BUY"


class TestBreakoutEngine:
    def setup_method(self):
        self.engine = BreakoutEngine()

    def test_detect(self):
        from modules.trend_engine.core.types import PriceBar
        bars = [
            PriceBar(date=f"2024-01-{i+1:02d}", open=100+i, high=103+i, low=97+i, close=100+i, volume=1000)
            for i in range(30)
        ]
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*30,
            dates=[b.date for b in bars], trend=TrendDirection.NEUTRAL
        )
        breakout = self.engine.detect(bars, result)
        assert breakout.breakout_type.value in [
            "resistance_breakout", "support_breakdown", "fake_breakout",
            "false_breakdown", "none"
        ]

    def test_detect_retest(self):
        bars = [
            PriceBar(date=f"2024-01-{i+1:02d}", open=100, high=103, low=97, close=100, volume=1000)
            for i in range(30)
        ]
        retest = self.engine.detect_retest(bars, 100.0)
        assert isinstance(retest, bool)

    def test_signals_resistance_breakout(self):
        breakout = BreakoutResult(
            breakout_type=BreakoutType.RESISTANCE_BREAKOUT,
            level=100.0, confidence=0.8, confirmed=True,
            description="Breakout",
        )
        signals = self.engine.generate_signals(breakout)
        assert len(signals) == 1
        assert signals[0].signal_type.value == "BUY"

    def test_signals_fake_breakout(self):
        breakout = BreakoutResult(
            breakout_type=BreakoutType.FAKE_BREAKOUT,
            level=100.0, confidence=0.6, description="Fake",
        )
        signals = self.engine.generate_signals(breakout)
        assert signals[0].signal_type.value == "SELL"

    def test_signals_support_breakdown(self):
        breakout = BreakoutResult(
            breakout_type=BreakoutType.SUPPORT_BREAKDOWN,
            level=100.0, confidence=0.8, confirmed=True,
            description="Breakdown",
        )
        signals = self.engine.generate_signals(breakout)
        assert signals[0].signal_type.value == "SELL"

    def test_signals_none(self):
        signals = self.engine.generate_signals(BreakoutResult())
        assert len(signals) == 0


class TestPullbackEngine:
    def setup_method(self):
        self.engine = PullbackEngine()

    def test_detect(self):
        bars = [
            PriceBar(date=f"2024-01-{i+1:02d}", open=100+i, high=103+i, low=97+i, close=100+i, volume=1000)
            for i in range(30)
        ]
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*30,
            dates=[b.date for b in bars], trend=TrendDirection.BULLISH
        )
        pullback = self.engine.detect(bars, result)
        assert pullback.pullback_type.value in ["healthy", "weak", "deep", "none"]

    def test_signals_healthy(self):
        pullback = PullbackResult(
            pullback_type=PullbackType.HEALTHY, depth=0.01, recovery=0.99,
            description="Healthy",
        )
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_signals(pullback, result)
        assert len(signals) == 1
        assert signals[0].signal_type.value == "BUY"

    def test_signals_weak(self):
        pullback = PullbackResult(
            pullback_type=PullbackType.WEAK, depth=0.03, recovery=0.5,
            description="Weak",
        )
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_signals(pullback, result)
        assert signals[0].signal_type.value == "WAIT"

    def test_signals_none(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            trend=TrendDirection.BULLISH,
        )
        signals = self.engine.generate_signals(PullbackResult(), result)
        assert len(signals) == 0

    def test_is_trend_resuming(self):
        bars = _bars(10)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[b.date for b in bars], trend=TrendDirection.BULLISH,
        )
        pullback = PullbackResult(pullback_type=PullbackType.HEALTHY)
        resuming = self.engine.is_trend_resuming(bars, result, pullback)
        assert isinstance(resuming, bool)


class TestTrendScoringEngine:
    def setup_method(self):
        self.engine = TrendScoringEngine()

    def test_trend_score_bullish(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, slope=0.01, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_trend_score(result)
        assert 0 <= score <= 100

    def test_trend_score_none(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=None,
        )
        assert self.engine.calculate_trend_score(result) == 50.0

    def test_breakout_score(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_breakout_score(result)
        assert 0 <= score <= 100

    def test_continuation_score(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, slope=0.01, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_continuation_score(result)
        assert 0 <= score <= 100

    def test_reversal_score(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, slope=-0.01, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_reversal_score(result)
        assert 0 <= score <= 100

    def test_confidence(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0,
        )
        score = self.engine.calculate_confidence(result, _bars(100))
        assert 0 <= score <= 100

    def test_confidence_empty(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0,
        )
        score = self.engine.calculate_confidence(result, [])
        assert score == 0.0

    def test_composite(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0, slope=0.01, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_composite(result, [], _bars(100))
        assert 0 <= score.trend_score <= 100
        assert 0 <= score.breakout_score <= 100
        assert 0 <= score.continuation_score <= 100
        assert 0 <= score.reversal_score <= 100
        assert 0 <= score.confidence <= 100
        assert 0 <= score.confidence <= 100
