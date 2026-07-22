import pytest
from modules.moving_average.plugins.sma_plugin import SMAPlugin
from modules.moving_average.plugins.ema_plugin import EMAPlugin
from modules.moving_average.plugins.wma_plugin import WMAPlugin
from modules.moving_average.plugins.hma_plugin import HMAPlugin
from modules.moving_average.plugins.smma_plugin import SMMAPlugin
from modules.moving_average.plugins.vwma_plugin import VWMAPlugin


class TestSMAPlugin:
    def setup_method(self):
        self.plugin = SMAPlugin()

    def test_name(self):
        assert self.plugin.name == "sma"

    def test_display_name(self):
        assert self.plugin.display_name == "Simple Moving Average"

    def test_basic(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = self.plugin.calculate(closes, 3)
        assert result[:2] == [None, None]
        assert result[2] == pytest.approx(11.0)
        assert result[3] == pytest.approx(12.0)
        assert result[4] == pytest.approx(13.0)

    def test_single_period(self):
        closes = [10.0, 20.0, 30.0]
        result = self.plugin.calculate(closes, 1)
        assert result == [10.0, 20.0, 30.0]

    def test_period_equals_length(self):
        closes = [10.0, 20.0, 30.0]
        result = self.plugin.calculate(closes, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] == pytest.approx(20.0)

    def test_insufficient_data(self):
        closes = [10.0, 20.0]
        result = self.plugin.calculate(closes, 5)
        assert all(v is None for v in result)

    def test_empty_closes(self):
        result = self.plugin.calculate([], 3)
        assert result == []

    def test_constant_prices(self):
        closes = [100.0] * 10
        result = self.plugin.calculate(closes, 5)
        assert all(v == pytest.approx(100.0) for v in result[4:])

    def test_single_value(self):
        result = self.plugin.calculate([42.0], 1)
        assert result == [42.0]


class TestEMAPlugin:
    def setup_method(self):
        self.plugin = EMAPlugin()

    def test_name(self):
        assert self.plugin.name == "ema"

    def test_display_name(self):
        assert self.plugin.display_name == "Exponential Moving Average"

    def test_basic(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0]
        result = self.plugin.calculate(closes, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] == pytest.approx(11.0)
        assert result[3] is not None
        assert result[3] > result[2]

    def test_insufficient_data(self):
        closes = [10.0, 20.0]
        result = self.plugin.calculate(closes, 5)
        assert all(v is None for v in result)

    def test_ema_smoothing(self):
        closes = list(range(1, 21))
        result = self.plugin.calculate(closes, 10)
        assert result[9] is not None
        assert result[-1] is not None
        assert result[-1] > result[9]

    def test_constant_prices(self):
        closes = [50.0] * 10
        result = self.plugin.calculate(closes, 5)
        for v in result[4:]:
            assert v == pytest.approx(50.0)


class TestWMAPlugin:
    def setup_method(self):
        self.plugin = WMAPlugin()

    def test_name(self):
        assert self.plugin.name == "wma"

    def test_display_name(self):
        assert self.plugin.display_name == "Weighted Moving Average"

    def test_basic(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = self.plugin.calculate(closes, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] is not None
        expected = (10 * 1 + 11 * 2 + 12 * 3) / 6
        assert result[2] == pytest.approx(expected)

    def test_insufficient_data(self):
        closes = [10.0]
        result = self.plugin.calculate(closes, 3)
        assert all(v is None for v in result)

    def test_single_period(self):
        closes = [5.0, 10.0, 15.0]
        result = self.plugin.calculate(closes, 1)
        assert result == [5.0, 10.0, 15.0]


class TestHMAPlugin:
    def setup_method(self):
        self.plugin = HMAPlugin()

    def test_name(self):
        assert self.plugin.name == "hma"

    def test_display_name(self):
        assert self.plugin.display_name == "Hull Moving Average"

    def test_basic(self):
        closes = list(range(1, 30))
        result = self.plugin.calculate(closes, 9)
        assert any(v is not None for v in result)

    def test_insufficient_data(self):
        closes = [10.0, 20.0]
        result = self.plugin.calculate(closes, 18)
        assert all(v is None for v in result)


class TestSMMAPlugin:
    def setup_method(self):
        self.plugin = SMMAPlugin()

    def test_name(self):
        assert self.plugin.name == "smma"

    def test_display_name(self):
        assert self.plugin.display_name == "Smoothed Moving Average"

    def test_basic(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0]
        result = self.plugin.calculate(closes, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] == pytest.approx(11.0)
        assert result[3] is not None

    def test_insufficient_data(self):
        closes = [10.0]
        result = self.plugin.calculate(closes, 5)
        assert all(v is None for v in result)

    def test_constant_prices(self):
        closes = [100.0] * 10
        result = self.plugin.calculate(closes, 5)
        for v in result[4:]:
            assert v == pytest.approx(100.0)


class TestVWMAPlugin:
    def setup_method(self):
        self.plugin = VWMAPlugin()

    def test_name(self):
        assert self.plugin.name == "vwma"

    def test_display_name(self):
        assert self.plugin.display_name == "Volume Weighted Moving Average"

    def test_requires_volumes(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0]
        result = self.plugin.calculate(closes, 3)
        assert all(v is None for v in result)

    def test_with_volumes(self):
        closes = [10.0, 11.0, 12.0, 13.0, 14.0]
        volumes = [100.0, 200.0, 150.0, 300.0, 250.0]
        result = self.plugin.calculate_with_volumes(closes, volumes, 3)
        assert result[2] is not None
        assert result[0] is None
        assert result[1] is None

    def test_zero_volume(self):
        closes = [10.0, 11.0, 12.0]
        volumes = [0.0, 0.0, 0.0]
        result = self.plugin.calculate_with_volumes(closes, volumes, 3)
        assert result[2] is None

    def test_insufficient_data(self):
        closes = [10.0]
        volumes = [100.0]
        result = self.plugin.calculate_with_volumes(closes, volumes, 3)
        assert all(v is None for v in result)

    def test_high_volume_pulls_toward(self):
        closes = [10.0, 20.0, 10.0]
        volumes = [1.0, 1000.0, 1.0]
        result = self.plugin.calculate_with_volumes(closes, volumes, 3)
        assert result[2] is not None
        assert result[2] > 10.0

    def test_equal_volume_matches_sma(self):
        closes = [10.0, 11.0, 12.0]
        volumes = [100.0, 100.0, 100.0]
        result = self.plugin.calculate_with_volumes(closes, volumes, 3)
        assert result[2] == pytest.approx(11.0)
