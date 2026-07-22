from __future__ import annotations

import pytest
from modules.pattern_engine.classical.classical_patterns import (
    CupHandlePlugin, DoubleBottomPlugin, DoubleTopPlugin,
    TripleBottomPlugin, TripleTopPlugin,
    AscendingTrianglePlugin, DescendingTrianglePlugin, SymmetricalTrianglePlugin,
    BullFlagPlugin, BearFlagPlugin, PennantPlugin, RectanglePlugin,
    ChannelUpPlugin, ChannelDownPlugin,
    FallingWedgePlugin, RisingWedgePlugin, DiamondPlugin, MegaphonePlugin,
)
from modules.pattern_engine.core.types import PriceBar, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_descending_bars, make_ranging_bars


CLASSICAL_PLUGINS = [
    CupHandlePlugin(), DoubleBottomPlugin(), DoubleTopPlugin(),
    TripleBottomPlugin(), TripleTopPlugin(),
    AscendingTrianglePlugin(), DescendingTrianglePlugin(), SymmetricalTrianglePlugin(),
    BullFlagPlugin(), BearFlagPlugin(), PennantPlugin(), RectanglePlugin(),
    ChannelUpPlugin(), ChannelDownPlugin(),
    FallingWedgePlugin(), RisingWedgePlugin(), DiamondPlugin(), MegaphonePlugin(),
]


class TestClassicalPluginMetadata:
    def test_all_have_name(self):
        for p in CLASSICAL_PLUGINS:
            assert p.name, f"{p.__class__.__name__} missing name"
            assert isinstance(p.name, str)

    def test_all_have_display_name(self):
        for p in CLASSICAL_PLUGINS:
            assert p.display_name, f"{p.__class__.__name__} missing display_name"

    def test_all_are_classical_category(self):
        for p in CLASSICAL_PLUGINS:
            assert p.category == PatternCategory.CLASSICAL

    def test_all_have_metadata(self):
        for p in CLASSICAL_PLUGINS:
            meta = p.metadata()
            assert "name" in meta
            assert "display_name" in meta
            assert "category" in meta

    def test_all_have_parameters(self):
        for p in CLASSICAL_PLUGINS:
            params = p.parameters()
            assert isinstance(params, dict)


class TestClassicalValidation:
    @pytest.mark.parametrize("plugin", CLASSICAL_PLUGINS, ids=lambda p: p.name)
    def test_validate_too_few_bars(self, plugin):
        bars = make_ascending_bars(3)
        errors = plugin.validate(bars)
        assert len(errors) > 0

    @pytest.mark.parametrize("plugin", CLASSICAL_PLUGINS, ids=lambda p: p.name)
    def test_validate_enough_bars(self, plugin):
        bars = make_ascending_bars(max(plugin.min_bars(), 30))
        errors = plugin.validate(bars)
        assert len(errors) == 0


class TestClassicalDetection:
    @pytest.mark.parametrize("plugin", CLASSICAL_PLUGINS, ids=lambda p: p.name)
    def test_detect_returns_list(self, plugin):
        bars = make_ascending_bars(max(plugin.min_bars(), 40))
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_double_bottom_with_ranging_data(self):
        bars = make_ranging_bars(40, base=100, amplitude=3.0)
        plugin = DoubleBottomPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_double_top_with_descending_data(self):
        bars = make_descending_bars(40)
        plugin = DoubleTopPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_bull_flag_with_ascending_data(self):
        bars = make_ascending_bars(30, start=50, step=1.0)
        plugin = BullFlagPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_bear_flag_with_descending_data(self):
        bars = make_descending_bars(30, start=150, step=-1.0)
        plugin = BearFlagPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_rectangle_with_ranging_data(self):
        bars = make_ranging_bars(40, base=100, amplitude=2.0)
        plugin = RectanglePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_megaphone_expanding_data(self):
        bars = []
        for i in range(40):
            amp = 1.0 + i * 0.15
            bars.append(PriceBar(
                date=f"2024-01-{i+1:02d}",
                open=100 + (i % 2) * amp,
                high=100 + amp,
                low=100 - amp,
                close=100 - (i % 2) * amp,
                volume=1000,
            ))
        plugin = MegaphonePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)


class TestClassicalShutdown:
    @pytest.mark.parametrize("plugin", CLASSICAL_PLUGINS, ids=lambda p: p.name)
    def test_shutdown_no_error(self, plugin):
        plugin.shutdown()
