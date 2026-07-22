import pytest
from modules.trend_engine.core.engine import TrendEngine
from modules.trend_engine.core.registry import get_registry
from tests.trend_engine.conftest import _bars, _trending_bars


def _create_engine() -> TrendEngine:
    engine = TrendEngine()
    registry = get_registry()
    for name in registry.list_all():
        plugin = registry.get(name)
        if plugin:
            engine.register_plugin(plugin)
    return engine


class TestTrendEngine:
    def setup_method(self):
        self.engine = _create_engine()

    def test_list_plugins(self):
        plugins = self.engine.list_plugins()
        assert "supertrend" in plugins
        assert "ichimoku" in plugins
        assert "donchian" in plugins
        assert "parabolic_sar" in plugins
        assert "bollinger" in plugins
        assert "keltner" in plugins
        assert "ma_envelope" in plugins
        assert "linear_regression" in plugins
        assert len(plugins) == 8

    def test_get_plugin(self):
        assert self.engine.get_plugin("supertrend") is not None
        assert self.engine.get_plugin("unknown") is None

    def test_calculate_supertrend(self):
        result = self.engine.calculate("supertrend", _bars(100))
        assert result.indicator == "SuperTrend"
        assert result.current_value is not None
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_calculate_ichimoku(self):
        result = self.engine.calculate("ichimoku", _bars(100))
        assert result.indicator == "Ichimoku Cloud"
        assert result.current_value is not None

    def test_calculate_donchian(self):
        result = self.engine.calculate("donchian", _bars(100))
        assert result.indicator == "Donchian Channel"
        assert result.current_value is not None

    def test_calculate_parabolic_sar(self):
        result = self.engine.calculate("parabolic_sar", _bars(100))
        assert result.indicator == "Parabolic SAR"
        assert result.current_value is not None

    def test_calculate_bollinger(self):
        result = self.engine.calculate("bollinger", _bars(100))
        assert result.indicator == "Bollinger Bands"
        assert result.current_value is not None

    def test_calculate_keltner(self):
        result = self.engine.calculate("keltner", _bars(100))
        assert result.indicator == "Keltner Channel"
        assert result.current_value is not None

    def test_calculate_ma_envelope(self):
        result = self.engine.calculate("ma_envelope", _bars(100))
        assert result.indicator == "Moving Average Envelope"
        assert result.current_value is not None

    def test_calculate_linear_regression(self):
        result = self.engine.calculate("linear_regression", _bars(100))
        assert result.indicator == "Linear Regression Trend"
        assert result.current_value is not None

    def test_calculate_unknown(self):
        with pytest.raises(ValueError, match="Unknown indicator"):
            self.engine.calculate("xyz", _bars(100))

    def test_calculate_all(self):
        results = self.engine.calculate_all(_bars(100))
        assert len(results) == 8
        assert "supertrend" in results
        assert "bollinger" in results

    def test_custom_params(self):
        result = self.engine.calculate("supertrend", _bars(100), period=14)
        assert result.parameters["period"] == 14

    def test_cache(self):
        bars = _bars(100)
        self.engine.calculate("supertrend", bars)
        self.engine.calculate("supertrend", bars)
        stats = self.engine.cache_stats()
        assert stats["hits"] >= 1

    def test_clear_cache(self):
        self.engine.calculate("supertrend", _bars(100))
        self.engine.clear_cache()
        stats = self.engine.cache_stats()
        assert stats["size"] == 0

    def test_shutdown(self):
        self.engine.shutdown()
        assert len(self.engine.list_plugins()) == 0

    def test_calculation_time(self):
        result = self.engine.calculate("supertrend", _bars(100))
        assert result.calculation_time_ms >= 0

    def test_trend_analysis(self):
        result = self.engine.calculate(
            "supertrend", _bars(100), include_trend_analysis=True
        )
        assert len(result.warnings) > 0
        assert any("Primary:" in w for w in result.warnings)

    def test_breakout(self):
        result = self.engine.calculate(
            "bollinger", _bars(100), include_breakout=True
        )
        assert result.indicator == "Bollinger Bands"

    def test_pullback(self):
        result = self.engine.calculate(
            "supertrend", _bars(100), include_pullback=True
        )
        assert result.indicator == "SuperTrend"

    def test_scoring(self):
        result = self.engine.calculate(
            "bollinger", _bars(100), include_scoring=True
        )
        assert result.indicator == "Bollinger Bands"

    def test_analyze_trend(self):
        result = self.engine.calculate("supertrend", _trending_bars(100, "up"))
        trend = self.engine.analyze_trend(_trending_bars(100, "up"), result)
        assert trend.primary_trend.value in ["bullish", "bearish", "neutral"]
        assert 0.0 <= trend.strength <= 1.0
        assert 0.0 <= trend.stability <= 1.0
        assert 0.0 <= trend.exhaustion <= 1.0
        assert 0.0 <= trend.continuation <= 1.0
        assert 0.0 <= trend.reversal_probability <= 1.0
        assert trend.phase.value in [
            "emerging", "strengthening", "mature", "exhausting", "reversing", "sideways"
        ]
