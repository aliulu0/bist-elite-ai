import pytest
from modules.volume_engine.plugins.obv_plugin import OBVPlugin
from modules.volume_engine.plugins.cmf_plugin import CMFPlugin
from modules.volume_engine.plugins.mfi_plugin import MFIPlugin
from modules.volume_engine.plugins.vwap_plugin import VWAPPlugin
from modules.volume_engine.plugins.rvol_plugin import RVOLPlugin
from modules.volume_engine.plugins.adl_plugin import ADLPlugin
from modules.volume_engine.plugins.chaikin_plugin import ChaikinPlugin
from modules.volume_engine.plugins.volume_oscillator_plugin import VolumeOscillatorPlugin
from modules.volume_engine.plugins.eom_plugin import EoMPlugin
from modules.volume_engine.plugins.force_index_plugin import ForceIndexPlugin
from modules.volume_engine.plugins.nvi_plugin import NVIPlugin
from modules.volume_engine.plugins.pvi_plugin import PVIPlugin
from tests.volume_engine.conftest import _bars, _trending_bars, _volatile_bars


class TestOBVPlugin:
    def setup_method(self):
        self.plugin = OBVPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "obv"

    def test_display_name(self):
        assert self.plugin.display_name == "On Balance Volume"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "obv"
        assert m["category"] == "volume"

    def test_parameters(self):
        p = self.plugin.parameters()
        assert isinstance(p, dict)

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert result.trend.value in ["bullish", "bearish", "neutral"]

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50))
        assert errors == []

    def test_validate_empty(self):
        errors = self.plugin.validate([])
        assert len(errors) > 0

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0
        assert signals[0].signal_type.value in [
            "BUY", "STRONG_BUY", "SELL", "STRONG_SELL", "NEUTRAL"
        ]

    def test_min_bars(self):
        assert self.plugin.min_bars() == 5


class TestCMFPlugin:
    def setup_method(self):
        self.plugin = CMFPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "cmf"

    def test_display_name(self):
        assert self.plugin.display_name == "Chaikin Money Flow"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "cmf"

    def test_parameters(self):
        p = self.plugin.parameters()
        assert "period" in p

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), period=20)
        assert errors == []

    def test_validate_empty(self):
        errors = self.plugin.validate([], period=20)
        assert len(errors) > 0

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_custom_period(self):
        result = self.plugin.calculate(_bars(50), period=10)
        assert result.parameters["period"] == 10

    def test_min_bars(self):
        assert self.plugin.min_bars() == 25


class TestMFIPlugin:
    def setup_method(self):
        self.plugin = MFIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "mfi"

    def test_display_name(self):
        assert self.plugin.display_name == "Money Flow Index"

    def test_metadata(self):
        m = self.plugin.metadata()
        assert m["name"] == "mfi"

    def test_parameters(self):
        p = self.plugin.parameters()
        assert "period" in p

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert 0 <= result.current_value <= 100

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), period=14)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_warnings(self):
        result = self.plugin.calculate(_bars(50))
        assert isinstance(result.warnings, list)


class TestVWAPPlugin:
    def setup_method(self):
        self.plugin = VWAPPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "vwap"

    def test_display_name(self):
        assert self.plugin.display_name == "Volume Weighted Average Price"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert result.current_value > 0

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_min_bars(self):
        assert self.plugin.min_bars() == 5


class TestRVOLPlugin:
    def setup_method(self):
        self.plugin = RVOLPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "rvol"

    def test_display_name(self):
        assert self.plugin.display_name == "Relative Volume"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert result.current_value > 0

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), period=20)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0

    def test_min_bars(self):
        assert self.plugin.min_bars() == 25


class TestADLPlugin:
    def setup_method(self):
        self.plugin = ADLPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "adl"

    def test_display_name(self):
        assert self.plugin.display_name == "Accumulation Distribution Line"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestChaikinPlugin:
    def setup_method(self):
        self.plugin = ChaikinPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "chaikin"

    def test_display_name(self):
        assert self.plugin.display_name == "Chaikin Oscillator"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), fast_period=3, slow_period=10)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestVolumeOscillatorPlugin:
    def setup_method(self):
        self.plugin = VolumeOscillatorPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "volume_oscillator"

    def test_display_name(self):
        assert self.plugin.display_name == "Volume Oscillator"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), fast_period=5, slow_period=20)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestEoMPlugin:
    def setup_method(self):
        self.plugin = EoMPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "eom"

    def test_display_name(self):
        assert self.plugin.display_name == "Ease of Movement"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), period=14)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestForceIndexPlugin:
    def setup_method(self):
        self.plugin = ForceIndexPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "force_index"

    def test_display_name(self):
        assert self.plugin.display_name == "Force Index"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50), period=13)
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestNVIPlugin:
    def setup_method(self):
        self.plugin = NVIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "nvi"

    def test_display_name(self):
        assert self.plugin.display_name == "Negative Volume Index"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert result.current_value > 0

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0


class TestPVIPlugin:
    def setup_method(self):
        self.plugin = PVIPlugin()
        self.plugin.initialize()

    def test_name(self):
        assert self.plugin.name == "pvi"

    def test_display_name(self):
        assert self.plugin.display_name == "Positive Volume Index"

    def test_calculate(self):
        result = self.plugin.calculate(_bars(50))
        assert result.current_value is not None
        assert result.current_value > 0

    def test_validate_valid(self):
        errors = self.plugin.validate(_bars(50))
        assert errors == []

    def test_signals(self):
        result = self.plugin.calculate(_bars(50))
        signals = self.plugin.signals(result)
        assert len(signals) > 0
