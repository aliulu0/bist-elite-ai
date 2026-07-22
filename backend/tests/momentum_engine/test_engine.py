import pytest
from modules.momentum_engine.core.engine import MomentumEngine
from modules.momentum_engine.core.registry import get_registry
from tests.momentum_engine.conftest import _bars, _trending_bars


def _create_engine() -> MomentumEngine:
    engine = MomentumEngine()
    registry = get_registry()
    for name in registry.list_all():
        plugin = registry.get(name)
        if plugin:
            engine.register_plugin(plugin)
    return engine


class TestMomentumEngine:
    def setup_method(self):
        self.engine = _create_engine()

    def test_list_plugins(self):
        plugins = self.engine.list_plugins()
        assert "rsi" in plugins
        assert "macd" in plugins
        assert "adx" in plugins
        assert len(plugins) >= 10

    def test_get_plugin(self):
        assert self.engine.get_plugin("rsi") is not None
        assert self.engine.get_plugin("unknown") is None

    def test_calculate_rsi(self):
        result = self.engine.calculate("rsi", _bars(100))
        assert result.indicator == "Relative Strength Index"
        assert result.current_value is not None
        assert 0 <= result.current_value <= 100

    def test_calculate_macd(self):
        result = self.engine.calculate("macd", _bars(100))
        assert result.indicator == "MACD"
        assert result.current_value is not None

    def test_calculate_adx(self):
        result = self.engine.calculate("adx", _bars(100))
        assert result.indicator == "Average Directional Index"

    def test_calculate_cci(self):
        result = self.engine.calculate("cci", _bars(100))
        assert result.indicator == "Commodity Channel Index"

    def test_calculate_roc(self):
        result = self.engine.calculate("roc", _bars(100))
        assert result.indicator == "Rate of Change"

    def test_calculate_momentum(self):
        result = self.engine.calculate("momentum", _bars(100))
        assert result.indicator == "Momentum"

    def test_calculate_williams_r(self):
        result = self.engine.calculate("williams_r", _bars(100))
        assert result.indicator == "Williams %R"
        assert result.current_value is not None
        assert -100 <= result.current_value <= 0

    def test_calculate_tsi(self):
        result = self.engine.calculate("tsi", _bars(100))
        assert result.indicator == "True Strength Index"

    def test_calculate_ao(self):
        result = self.engine.calculate("ao", _bars(100))
        assert result.indicator == "Awesome Oscillator"

    def test_calculate_stoch_rsi(self):
        result = self.engine.calculate("stoch_rsi", _bars(100))
        assert result.indicator == "Stochastic RSI"

    def test_calculate_unknown(self):
        with pytest.raises(ValueError, match="Unknown indicator"):
            self.engine.calculate("xyz", _bars(100))

    def test_calculate_all(self):
        results = self.engine.calculate_all(_bars(100))
        assert len(results) >= 10
        assert "rsi" in results
        assert "macd" in results

    def test_custom_params(self):
        result = self.engine.calculate("rsi", _bars(100), period=21)
        assert result.parameters["period"] == 21

    def test_cache(self):
        bars = _bars(100)
        self.engine.calculate("rsi", bars)
        self.engine.calculate("rsi", bars)
        stats = self.engine.cache_stats()
        assert stats["hits"] >= 1

    def test_clear_cache(self):
        self.engine.calculate("rsi", _bars(100))
        self.engine.clear_cache()
        stats = self.engine.cache_stats()
        assert stats["size"] == 0

    def test_shutdown(self):
        self.engine.shutdown()
        assert len(self.engine.list_plugins()) == 0

    def test_calculation_time(self):
        result = self.engine.calculate("rsi", _bars(100))
        assert result.calculation_time_ms >= 0
