import pytest
from modules.momentum_engine.plugins.rsi_plugin import RSIPlugin
from modules.momentum_engine.plugins.stoch_rsi_plugin import StochRSIPlugin
from modules.momentum_engine.plugins.macd_plugin import MACDPlugin
from modules.momentum_engine.plugins.adx_plugin import ADXPlugin
from modules.momentum_engine.plugins.cci_plugin import CCIPlugin
from modules.momentum_engine.plugins.roc_plugin import ROCPlugin
from modules.momentum_engine.plugins.momentum_plugin import MomentumPlugin
from modules.momentum_engine.plugins.williams_r_plugin import WilliamsRPlugin
from modules.momentum_engine.plugins.tsi_plugin import TSIPlugin
from modules.momentum_engine.plugins.ao_plugin import AwesomeOscillatorPlugin
from tests.momentum_engine.conftest import _bars, _trending_bars, _volatile_bars


class TestRSIPlugin:
    def setup_method(self):
        self.plugin = RSIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "rsi"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "rsi"
        assert m["category"] == "momentum"

    def test_parameters(self):
        p = self.plugin.parameters()
        assert "period" in p

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100), period=14)
        assert result.current_value is not None
        assert 0 <= result.current_value <= 100

    def test_overbought(self):
        bars = _trending_bars(100, "up")
        result = self.plugin.calculate(bars, period=14)
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100), period=14)
        assert errors == []

    def test_validate_empty(self):
        errors = self.plugin.validate([], period=14)
        assert len(errors) > 0

    def test_signals(self):
        result = self.plugin.calculate(_bars(100), period=14)
        signals = self.plugin.signals(result)
        assert len(signals) > 0
        assert signals[0].signal_type.value in ["BUY", "STRONG_BUY", "SELL", "STRONG_SELL", "NEUTRAL"]

    def test_slope(self):
        result = self.plugin.calculate(_bars(100), period=14)
        assert result.slope is not None

    def test_trend(self):
        result = self.plugin.calculate(_bars(100), period=14)
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_custom_period(self):
        result = self.plugin.calculate(_bars(100), period=21)
        assert result.parameters["period"] == 21

    def test_warnings(self):
        bars = _trending_bars(100, "up")
        result = self.plugin.calculate(bars, period=14)
        assert isinstance(result.warnings, list)


class TestMACDPlugin:
    def setup_method(self):
        self.plugin = MACDPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "macd"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_fast_gte_slow(self):
        errors = self.plugin.validate(_bars(100), fast_period=30, slow_period=26)
        assert any("fast_period must be less" in e for e in errors)

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestADXPlugin:
    def setup_method(self):
        self.plugin = ADXPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "adx"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestCCIPlugin:
    def setup_method(self):
        self.plugin = CCIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "cci"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None


class TestROCPlugin:
    def setup_method(self):
        self.plugin = ROCPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "roc"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None


class TestMomentumPlugin:
    def setup_method(self):
        self.plugin = MomentumPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "momentum"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None


class TestWilliamsRPlugin:
    def setup_method(self):
        self.plugin = WilliamsRPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "williams_r"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None
        assert -100 <= result.current_value <= 0


class TestTSIPlugin:
    def setup_method(self):
        self.plugin = TSIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "tsi"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None


class TestAOPlugin:
    def setup_method(self):
        self.plugin = AwesomeOscillatorPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "ao"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestStochRSIPlugin:
    def setup_method(self):
        self.plugin = StochRSIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "stoch_rsi"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None
