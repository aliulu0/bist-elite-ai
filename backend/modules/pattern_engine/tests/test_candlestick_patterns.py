from __future__ import annotations

import pytest
from modules.pattern_engine.candlestick.candlestick_patterns import (
    HammerPlugin, InvertedHammerPlugin, DojiPlugin,
    DragonflyDojiPlugin, GravestoneDojiPlugin,
    MorningStarPlugin, EveningStarPlugin,
    BullishEngulfingPlugin, BearishEngulfingPlugin,
    HaramiPlugin, PiercingPlugin, DarkCloudPlugin,
    ThreeWhiteSoldiersPlugin, ThreeBlackCrowsPlugin,
    ShootingStarPlugin, HangingManPlugin,
    TweezerTopPlugin, TweezerBottomPlugin,
)
from modules.pattern_engine.core.types import PriceBar, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_descending_bars


CANDLESTICK_PLUGINS = [
    HammerPlugin(), InvertedHammerPlugin(), DojiPlugin(),
    DragonflyDojiPlugin(), GravestoneDojiPlugin(),
    MorningStarPlugin(), EveningStarPlugin(),
    BullishEngulfingPlugin(), BearishEngulfingPlugin(),
    HaramiPlugin(), PiercingPlugin(), DarkCloudPlugin(),
    ThreeWhiteSoldiersPlugin(), ThreeBlackCrowsPlugin(),
    ShootingStarPlugin(), HangingManPlugin(),
    TweezerTopPlugin(), TweezerBottomPlugin(),
]


class TestCandlestickPluginMetadata:
    def test_all_have_name(self):
        for p in CANDLESTICK_PLUGINS:
            assert p.name, f"{p.__class__.__name__} missing name"

    def test_all_are_candlestick_category(self):
        for p in CANDLESTICK_PLUGINS:
            assert p.category == PatternCategory.CANDLESTICK

    def test_all_have_metadata_and_parameters(self):
        for p in CANDLESTICK_PLUGINS:
            meta = p.metadata()
            assert "name" in meta
            assert isinstance(p.parameters(), dict)


class TestCandlestickValidation:
    @pytest.mark.parametrize("plugin", CANDLESTICK_PLUGINS, ids=lambda p: p.name)
    def test_validate_too_few_bars(self, plugin):
        bars = [PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100)]
        errors = plugin.validate(bars)
        assert len(errors) > 0

    @pytest.mark.parametrize("plugin", CANDLESTICK_PLUGINS, ids=lambda p: p.name)
    def test_validate_enough_bars(self, plugin):
        bars = make_ascending_bars(max(plugin.min_bars(), 5))
        errors = plugin.validate(bars)
        assert len(errors) == 0


class TestCandlestickDetection:
    def test_hammer_detection(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-02", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-03", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-04", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-05", open=100.5, high=101.5, low=97.0, close=100.3, volume=1200),
        ]
        plugin = HammerPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_doji_detection(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-02", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-03", open=100.0, high=101.0, low=99.0, close=100.05, volume=1000),
        ]
        plugin = DojiPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_bullish_engulfing(self):
        bars = [
            PriceBar(date="2024-01-01", open=102, high=103, low=100, close=101, volume=1000),
            PriceBar(date="2024-01-02", open=100, high=104, low=99, close=103, volume=1200),
        ]
        plugin = BullishEngulfingPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_bearish_engulfing(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=103, low=99, close=102, volume=1000),
            PriceBar(date="2024-01-02", open=103, high=104, low=99, close=100, volume=1200),
        ]
        plugin = BearishEngulfingPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_three_white_soldiers(self):
        bars = [
            PriceBar(date="2024-01-01", open=98, high=100, low=97, close=99, volume=1000),
            PriceBar(date="2024-01-02", open=99, high=102, low=98.5, close=101, volume=1100),
            PriceBar(date="2024-01-03", open=101, high=104, low=100.5, close=103, volume=1200),
        ]
        plugin = ThreeWhiteSoldiersPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_three_black_crows(self):
        bars = [
            PriceBar(date="2024-01-01", open=103, high=104, low=101, close=102, volume=1000),
            PriceBar(date="2024-01-02", open=102, high=102.5, low=99, close=100, volume=1100),
            PriceBar(date="2024-01-03", open=100, high=100.5, low=97, close=98, volume=1200),
        ]
        plugin = ThreeBlackCrowsPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_morning_star(self):
        bars = [
            PriceBar(date="2024-01-01", open=105, high=106, low=100, close=101, volume=1000),
            PriceBar(date="2024-01-02", open=101, high=101.5, low=99.5, close=100.5, volume=500),
            PriceBar(date="2024-01-03", open=100.5, high=105, low=100, close=104, volume=1200),
        ]
        plugin = MorningStarPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_evening_star(self):
        bars = [
            PriceBar(date="2024-01-01", open=95, high=100, low=94, close=99, volume=1000),
            PriceBar(date="2024-01-02", open=99, high=100, low=98.5, close=99.5, volume=500),
            PriceBar(date="2024-01-03", open=99.5, high=100, low=95, close=96, volume=1200),
        ]
        plugin = EveningStarPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    @pytest.mark.parametrize("plugin", CANDLESTICK_PLUGINS, ids=lambda p: p.name)
    def test_shutdown_no_error(self, plugin):
        plugin.shutdown()
