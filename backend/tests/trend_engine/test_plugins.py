import pytest
from modules.trend_engine.plugins.supertrend_plugin import SuperTrendPlugin
from modules.trend_engine.plugins.ichimoku_plugin import IchimokuPlugin
from modules.trend_engine.plugins.donchian_plugin import DonchianPlugin
from modules.trend_engine.plugins.parabolic_sar_plugin import ParabolicSARPlugin
from modules.trend_engine.plugins.bollinger_plugin import BollingerPlugin
from modules.trend_engine.plugins.keltner_plugin import KeltnerPlugin
from modules.trend_engine.plugins.ma_envelope_plugin import MAEnvelopePlugin
from modules.trend_engine.plugins.linear_regression_plugin import LinearRegressionPlugin
from tests.trend_engine.conftest import _bars, _trending_bars, _volatile_bars


class TestSuperTrendPlugin:
    def setup_method(self):
        self.plugin = SuperTrendPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "supertrend"

    def test_display_name(self):
        assert self.plugin.display_name == "SuperTrend"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "supertrend"
        assert m["category"] == "trend"

    def test_parameters(self):
        p = self.plugin.parameters()
        assert "period" in p
        assert "multiplier" in p

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100), period=10, multiplier=3.0)
        assert result.current_value is not None
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100), period=10)
        assert errors == []

    def test_validate_empty(self):
        errors = self.plugin.validate([], period=10)
        assert len(errors) > 0

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0
        assert signals[0].signal_type.value in [
            "BUY", "STRONG_BUY", "SELL", "STRONG_SELL", "NEUTRAL"
        ]

    def test_custom_period(self):
        result = self.plugin.calculate(_bars(100), period=14)
        assert result.parameters["period"] == 14

    def test_warnings(self):
        result = self.plugin.calculate(_bars(100))
        assert isinstance(result.warnings, list)


class TestIchimokuPlugin:
    def setup_method(self):
        self.plugin = IchimokuPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "ichimoku"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "ichimoku"
        assert m["category"] == "trend"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_periods(self):
        result = self.plugin.calculate(_bars(100), tenkan_period=7, kijun_period=22)
        assert result.parameters["tenkan_period"] == 7

    def test_warnings(self):
        result = self.plugin.calculate(_bars(100))
        assert isinstance(result.warnings, list)


class TestDonchianPlugin:
    def setup_method(self):
        self.plugin = DonchianPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "donchian"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_period(self):
        result = self.plugin.calculate(_bars(100), period=30)
        assert result.parameters["period"] == 30


class TestParabolicSARPlugin:
    def setup_method(self):
        self.plugin = ParabolicSARPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "parabolic_sar"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_af(self):
        result = self.plugin.calculate(_bars(100), af_start=0.03, af_max=0.3)
        assert result.parameters["af_start"] == 0.03


class TestBollingerPlugin:
    def setup_method(self):
        self.plugin = BollingerPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "bollinger"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_std_dev(self):
        result = self.plugin.calculate(_bars(100), std_dev=2.5)
        assert result.parameters["std_dev"] == 2.5


class TestKeltnerPlugin:
    def setup_method(self):
        self.plugin = KeltnerPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "keltner"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_params(self):
        result = self.plugin.calculate(_bars(100), ema_period=30, multiplier=2.5)
        assert result.parameters["ema_period"] == 30
        assert result.parameters["multiplier"] == 2.5


class TestMAEnvelopePlugin:
    def setup_method(self):
        self.plugin = MAEnvelopePlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "ma_envelope"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_envelope_pct(self):
        result = self.plugin.calculate(_bars(100), envelope_pct=0.03)
        assert result.parameters["envelope_pct"] == 0.03


class TestLinearRegressionPlugin:
    def setup_method(self):
        self.plugin = LinearRegressionPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "linear_regression"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(100))
        assert result.current_value is not None
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(100))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(100))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_period(self):
        result = self.plugin.calculate(_bars(100), period=30)
        assert result.parameters["period"] == 30

    def test_slope(self):
        result = self.plugin.calculate(_bars(100))
        assert result.slope is not None

    def test_trend_up(self):
        result = self.plugin.calculate(_trending_bars(100, "up"))
        assert result.trend.value in ["bullish", "neutral"]
