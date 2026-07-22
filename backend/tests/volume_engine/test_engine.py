import pytest
from modules.volume_engine.core.engine import VolumeEngine
from modules.volume_engine.core.registry import get_registry
from tests.volume_engine.conftest import _bars, _trending_bars, _volume_spike_bars


def _create_engine() -> VolumeEngine:
    engine = VolumeEngine()
    registry = get_registry()
    for name in registry.list_all():
        plugin = registry.get(name)
        if plugin:
            engine.register_plugin(plugin)
    return engine


class TestVolumeEngine:
    def setup_method(self):
        self.engine = _create_engine()

    def test_list_plugins(self):
        plugins = self.engine.list_plugins()
        assert "obv" in plugins
        assert "cmf" in plugins
        assert "mfi" in plugins
        assert "vwap" in plugins
        assert "rvol" in plugins
        assert "adl" in plugins
        assert "chaikin" in plugins
        assert "volume_oscillator" in plugins
        assert "eom" in plugins
        assert "force_index" in plugins
        assert "nvi" in plugins
        assert "pvi" in plugins
        assert len(plugins) == 12

    def test_get_plugin(self):
        assert self.engine.get_plugin("obv") is not None
        assert self.engine.get_plugin("unknown") is None

    def test_calculate_obv(self):
        result = self.engine.calculate("obv", _bars(50))
        assert result.indicator == "On Balance Volume"
        assert result.current_value is not None

    def test_calculate_cmf(self):
        result = self.engine.calculate("cmf", _bars(50))
        assert result.indicator == "Chaikin Money Flow"
        assert result.current_value is not None

    def test_calculate_mfi(self):
        result = self.engine.calculate("mfi", _bars(50))
        assert result.indicator == "Money Flow Index"
        assert result.current_value is not None

    def test_calculate_vwap(self):
        result = self.engine.calculate("vwap", _bars(50))
        assert result.indicator == "Volume Weighted Average Price"
        assert result.current_value is not None

    def test_calculate_rvol(self):
        result = self.engine.calculate("rvol", _bars(50))
        assert result.indicator == "Relative Volume"
        assert result.current_value is not None

    def test_calculate_adl(self):
        result = self.engine.calculate("adl", _bars(50))
        assert result.indicator == "Accumulation Distribution Line"
        assert result.current_value is not None

    def test_calculate_chaikin(self):
        result = self.engine.calculate("chaikin", _bars(50))
        assert result.indicator == "Chaikin Oscillator"
        assert result.current_value is not None

    def test_calculate_volume_oscillator(self):
        result = self.engine.calculate("volume_oscillator", _bars(50))
        assert result.indicator == "Volume Oscillator"
        assert result.current_value is not None

    def test_calculate_eom(self):
        result = self.engine.calculate("eom", _bars(50))
        assert result.indicator == "Ease of Movement"
        assert result.current_value is not None

    def test_calculate_force_index(self):
        result = self.engine.calculate("force_index", _bars(50))
        assert result.indicator == "Force Index"
        assert result.current_value is not None

    def test_calculate_nvi(self):
        result = self.engine.calculate("nvi", _bars(50))
        assert result.indicator == "Negative Volume Index"
        assert result.current_value is not None

    def test_calculate_pvi(self):
        result = self.engine.calculate("pvi", _bars(50))
        assert result.indicator == "Positive Volume Index"
        assert result.current_value is not None

    def test_calculate_unknown(self):
        with pytest.raises(ValueError, match="Unknown indicator"):
            self.engine.calculate("xyz", _bars(50))

    def test_calculate_with_signals(self):
        result = self.engine.calculate("obv", _bars(50), include_signals=True)
        assert len(result.warnings) > 0

    def test_calculate_with_smart_money(self):
        result = self.engine.calculate(
            "obv", _bars(50), include_smart_money=True,
        )
        assert result.current_value is not None

    def test_calculate_with_liquidity(self):
        result = self.engine.calculate(
            "obv", _bars(50), include_liquidity=True,
        )
        assert result.current_value is not None

    def test_calculate_with_scoring(self):
        result = self.engine.calculate(
            "obv", _bars(50), include_scoring=True,
        )
        assert result.current_value is not None

    def test_calculate_all(self):
        results = self.engine.calculate_all(_bars(50), include_signals=False)
        assert len(results) == 12
        for name, result in results.items():
            assert result.current_value is not None

    def test_detect_smart_money(self):
        result = self.engine.calculate("obv", _bars(50))
        sm = self.engine.detect_smart_money(_bars(50), result)
        assert sm.detection_type.value in [
            "institutional_accumulation", "institutional_distribution",
            "hidden_buying", "hidden_selling", "silent_accumulation",
            "volume_spike", "absorption", "none",
        ]

    def test_analyze_liquidity(self):
        liq = self.engine.analyze_liquidity(_bars(50))
        assert liq.liquidity_score >= 0
        assert liq.trade_activity >= 0

    def test_get_institutional_score(self):
        results = self.engine.calculate_all(_bars(50), include_signals=False)
        score = self.engine.get_institutional_score(_bars(50), results)
        assert score.smart_money_score >= 0
        assert score.institutional_confidence >= 0

    def test_clear_cache(self):
        self.engine.calculate("obv", _bars(50))
        self.engine.clear_cache()
        stats = self.engine.cache_stats()
        assert stats["size"] == 0

    def test_cache_stats(self):
        self.engine.calculate("obv", _bars(50))
        stats = self.engine.cache_stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats

    def test_shutdown(self):
        self.engine.calculate("obv", _bars(50))
        self.engine.shutdown()
        assert len(self.engine.list_plugins()) == 0

    def test_validation_failure(self):
        result = self.engine.calculate("obv", [])
        assert result.warnings
        assert result.current_value is None
