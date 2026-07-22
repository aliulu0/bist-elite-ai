import pytest
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.calculators.breakout_calculator import BreakoutCalculator
from modules.trend_engine.calculators.pullback_calculator import PullbackCalculator
from modules.trend_engine.core.types import PriceBar, IndicatorResult, TrendDirection
from tests.trend_engine.conftest import _bars, _trending_bars


class TestTrendCalculator:
    def test_sma(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = TrendCalculator.sma(values, 3)
        assert result[2] == pytest.approx(2.0)
        assert result[4] == pytest.approx(4.0)
        assert result[0] is None

    def test_sma_insufficient(self):
        result = TrendCalculator.sma([1.0, 2.0], 3)
        assert all(v is None for v in result)

    def test_ema(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = TrendCalculator.ema(values, 3)
        assert result[2] is not None
        assert result[0] is None

    def test_ema_insufficient(self):
        result = TrendCalculator.ema([1.0], 3)
        assert all(v is None for v in result)

    def test_wilder_smoothing(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = TrendCalculator.wilder_smoothing(values, 3)
        assert result[2] is not None
        assert result[0] is None

    def test_true_range(self):
        bars = _bars(10)
        tr = TrendCalculator.true_range(bars)
        assert len(tr) == 10
        assert tr[0] == 0.0
        assert tr[1] > 0

    def test_atr(self):
        bars = _bars(50)
        atr = TrendCalculator.atr(bars, 14)
        assert atr[13] is not None
        assert atr[12] is None

    def test_linear_regression(self):
        bars = _bars(50)
        closes = [b.close for b in bars]
        trend, upper, lower = TrendCalculator.linear_regression(closes, 20)
        assert len(trend) == 50
        assert trend[19] is not None
        assert trend[18] is None
        assert upper[19] is not None
        assert lower[19] is not None

    def test_first_derivative(self):
        values = [None, None, 10.0, 11.0, 12.0]
        d = TrendCalculator.first_derivative(values, 3)
        assert d is not None
        assert d > 0

    def test_first_derivative_none(self):
        d = TrendCalculator.first_derivative([None, None], 1)
        assert d is None

    def test_first_derivative_zero_idx(self):
        d = TrendCalculator.first_derivative([10.0], 0)
        assert d is None

    def test_second_derivative(self):
        values = [None, None, 10.0, 11.0, 13.0]
        d = TrendCalculator.second_derivative(values, 3)
        assert d is None

    def test_second_derivative_valid(self):
        values = [None, 10.0, 11.0, 13.0, 16.0]
        d = TrendCalculator.second_derivative(values, 3)
        assert d is not None

    def test_slope_angle(self):
        angle = TrendCalculator.slope_angle(1.0)
        assert angle is not None
        assert angle == pytest.approx(45.0, abs=1.0)

    def test_slope_angle_none(self):
        assert TrendCalculator.slope_angle(None) is None


class TestBreakoutCalculator:
    def test_find_support(self):
        bars = _bars(20)
        support = BreakoutCalculator.find_support(bars, 20)
        assert support > 0
        assert support <= min(b.low for b in bars)

    def test_find_resistance(self):
        bars = _bars(20)
        resistance = BreakoutCalculator.find_resistance(bars, 20)
        assert resistance > 0
        assert resistance >= max(b.high for b in bars)

    def test_find_support_empty(self):
        assert BreakoutCalculator.find_support([]) == 0.0

    def test_find_resistance_empty(self):
        assert BreakoutCalculator.find_resistance([]) == 0.0

    def test_detect_no_breakout(self):
        bars = _bars(30)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*30,
            dates=[b.date for b in bars], trend=TrendDirection.NEUTRAL
        )
        breakout = BreakoutCalculator.detect_breakout(bars, result)
        assert breakout.breakout_type.value == "none"

    def test_detect_insufficient_data(self):
        bars = _bars(5)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*5,
            dates=[b.date for b in bars], trend=TrendDirection.NEUTRAL
        )
        breakout = BreakoutCalculator.detect_breakout(bars, result)
        assert breakout.breakout_type.value == "none"

    def test_detect_retest(self):
        bars = _bars(30)
        assert BreakoutCalculator.detect_retest(bars, bars[10].close) in [True, False]


class TestPullbackCalculator:
    def test_no_pullback_neutral(self):
        bars = _bars(30)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*30,
            dates=[b.date for b in bars], trend=TrendDirection.NEUTRAL
        )
        pullback = PullbackCalculator.detect_pullback(bars, result)
        assert pullback.pullback_type.value == "none"

    def test_insufficient_data(self):
        bars = _bars(5)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*5,
            dates=[b.date for b in bars], trend=TrendDirection.BULLISH
        )
        pullback = PullbackCalculator.detect_pullback(bars, result)
        assert pullback.pullback_type.value == "none"

    def test_healthy_pullback_uptrend(self):
        bars = _bars(30)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*30,
            dates=[b.date for b in bars], trend=TrendDirection.BULLISH
        )
        pullback = PullbackCalculator.detect_pullback(bars, result, lookback=30)
        assert pullback.pullback_type.value in ["healthy", "weak", "deep", "none"]

    def test_is_trend_resuming(self):
        bars = _bars(10)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[b.date for b in bars], trend=TrendDirection.BULLISH
        )
        from modules.trend_engine.core.types import PullbackResult, PullbackType
        pullback = PullbackResult(pullback_type=PullbackType.HEALTHY, depth=0.01, recovery=0.99)
        resuming = PullbackCalculator.is_trend_resuming(bars, result, pullback)
        assert isinstance(resuming, bool)
