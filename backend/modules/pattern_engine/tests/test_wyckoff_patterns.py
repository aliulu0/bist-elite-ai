from __future__ import annotations

import pytest
from modules.pattern_engine.wyckoff.wyckoff_patterns import (
    AccumulationPlugin, DistributionPlugin,
    SpringPlugin, UpthrustPlugin,
    AutomaticRallyPlugin, SecondaryTestPlugin,
    SignOfStrengthPlugin, SignOfWeaknessPlugin,
    LastPointOfSupportPlugin, LastPointOfSupplyPlugin,
)
from modules.pattern_engine.core.types import PriceBar, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_descending_bars, make_ranging_bars


WYCKOFF_PLUGINS = [
    AccumulationPlugin(), DistributionPlugin(),
    SpringPlugin(), UpthrustPlugin(),
    AutomaticRallyPlugin(), SecondaryTestPlugin(),
    SignOfStrengthPlugin(), SignOfWeaknessPlugin(),
    LastPointOfSupportPlugin(), LastPointOfSupplyPlugin(),
]


class TestWyckoffPluginMetadata:
    def test_all_have_name(self):
        for p in WYCKOFF_PLUGINS:
            assert p.name, f"{p.__class__.__name__} missing name"

    def test_all_are_wyckoff_category(self):
        for p in WYCKOFF_PLUGINS:
            assert p.category == PatternCategory.WYCKOFF

    def test_all_have_metadata_and_parameters(self):
        for p in WYCKOFF_PLUGINS:
            meta = p.metadata()
            assert "name" in meta
            assert isinstance(p.parameters(), dict)


class TestWyckoffValidation:
    @pytest.mark.parametrize("plugin", WYCKOFF_PLUGINS, ids=lambda p: p.name)
    def test_validate_too_few_bars(self, plugin):
        bars = make_ascending_bars(3)
        errors = plugin.validate(bars)
        assert len(errors) > 0

    @pytest.mark.parametrize("plugin", WYCKOFF_PLUGINS, ids=lambda p: p.name)
    def test_validate_enough_bars(self, plugin):
        bars = make_ascending_bars(max(plugin.min_bars(), 40))
        errors = plugin.validate(bars)
        assert len(errors) == 0


class TestWyckoffDetection:
    def test_accumulation_ranging_data(self):
        bars = make_ranging_bars(50, base=100, amplitude=2.0)
        plugin = AccumulationPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_distribution_ranging_data(self):
        bars = make_ranging_bars(50, base=100, amplitude=2.0)
        plugin = DistributionPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_spring_detection(self):
        bars = []
        for i in range(30):
            if i < 20:
                v = 100 - (i % 5) * 0.1
            else:
                v = 99.5 + (i - 20) * 0.3
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.3, low=v - 0.3, close=v + 0.1, volume=1000))
        plugin = SpringPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_upthrust_detection(self):
        bars = []
        for i in range(30):
            if i < 20:
                v = 100 + (i % 5) * 0.1
            else:
                v = 100.5 - (i - 20) * 0.3
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.3, low=v - 0.3, close=v - 0.1, volume=1000))
        plugin = UpthrustPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_automatic_rally(self):
        bars = []
        for i in range(30):
            if i < 15:
                v = 110 - i * 0.8
            else:
                v = 98 + (i - 15) * 0.4
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.3, low=v - 0.3, close=v + 0.1, volume=1000))
        plugin = AutomaticRallyPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_secondary_test(self):
        bars = []
        for i in range(40):
            if i < 10:
                v = 100 - i * 0.5
            elif i < 15:
                v = 95 + (i - 10) * 0.3
            elif i < 25:
                v = 96.5 - (i - 15) * 0.15
            else:
                v = 95 + (i - 25) * 0.2
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.2, low=v - 0.2, close=v + 0.05, volume=1000))
        plugin = SecondaryTestPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_sign_of_strength(self):
        bars = make_ascending_bars(25, start=100, step=1.5)
        plugin = SignOfStrengthPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_sign_of_weakness(self):
        bars = make_descending_bars(25, start=150, step=-1.5)
        plugin = SignOfWeaknessPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_lps_detection(self):
        bars = []
        for i in range(40):
            if i < 10:
                v = 100 - i * 0.5
            elif i < 20:
                v = 95 + (i - 10) * 0.1
            else:
                v = 96 + (i - 20) * 0.3
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.2, low=v - 0.2, close=v + 0.05, volume=1000))
        plugin = LastPointOfSupportPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_lpsupply_detection(self):
        bars = []
        for i in range(40):
            if i < 10:
                v = 90 + i * 0.5
            elif i < 20:
                v = 95 - (i - 10) * 0.1
            else:
                v = 94 - (i - 20) * 0.3
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.2, low=v - 0.2, close=v - 0.05, volume=1000))
        plugin = LastPointOfSupplyPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    @pytest.mark.parametrize("plugin", WYCKOFF_PLUGINS, ids=lambda p: p.name)
    def test_shutdown_no_error(self, plugin):
        plugin.shutdown()
