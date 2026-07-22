import pytest
from modules.moving_average.trend.trend_analyzer import TrendAnalyzer
from modules.moving_average.core.types import TrendDirection


class TestTrendAnalyzer:
    def setup_method(self):
        self.analyzer = TrendAnalyzer()

    def test_uptrend(self):
        ma_values = [100 + i * 2 for i in range(20)]
        closes = [102 + i * 2 for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.direction == TrendDirection.UPTREND
        assert result.strength > 0

    def test_downtrend(self):
        ma_values = [200 - i * 2 for i in range(20)]
        closes = [198 - i * 2 for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.direction == TrendDirection.DOWNTREND
        assert result.strength > 0

    def test_sideways(self):
        ma_values = [100.0 + (i % 2) * 0.01 for i in range(20)]
        closes = [100.0 + (i % 2) * 0.01 for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.direction == TrendDirection.SIDEWAYS

    def test_insufficient_data(self):
        result = self.analyzer.analyze([100.0, 101.0], [100.0, 101.0], 10)
        assert result.direction == TrendDirection.SIDEWAYS
        assert result.strength == 0.0

    def test_price_position_above(self):
        ma_values = [100 + i for i in range(20)]
        closes = [110 + i for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.price_position == "above"

    def test_price_position_below(self):
        ma_values = [100 + i for i in range(20)]
        closes = [80 + i for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.price_position == "below"

    def test_price_position_at(self):
        ma_values = [100.0] * 20
        closes = [100.5] * 20
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.price_position == "at"

    def test_trend_age(self):
        ma_values = [100 + i for i in range(20)]
        closes = [102 + i for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.age > 0

    def test_stability(self):
        ma_values = [100.0 + i * 0.001 for i in range(20)]
        closes = [100.0 + i * 0.001 for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert 0 <= result.stability <= 1.0

    def test_ma_value_set(self):
        ma_values = [100 + i for i in range(20)]
        closes = [102 + i for i in range(20)]
        result = self.analyzer.analyze(ma_values, closes, 10)
        assert result.ma_value is not None
