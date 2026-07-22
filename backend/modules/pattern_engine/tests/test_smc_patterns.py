from __future__ import annotations

import pytest
from modules.pattern_engine.smc.smc_patterns import (
    BreakOfStructurePlugin, ChangeOfCharacterPlugin,
    OrderBlockPlugin, BreakerBlockPlugin, MitigationBlockPlugin,
    FairValueGapPlugin, LiquidityGrabPlugin, LiquiditySweepPlugin,
    EqualHighsPlugin, EqualLowsPlugin,
    PremiumZonePlugin, DiscountZonePlugin, InducementPlugin,
)
from modules.pattern_engine.core.types import PriceBar, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_descending_bars, make_ranging_bars


SMC_PLUGINS = [
    BreakOfStructurePlugin(), ChangeOfCharacterPlugin(),
    OrderBlockPlugin(), BreakerBlockPlugin(), MitigationBlockPlugin(),
    FairValueGapPlugin(), LiquidityGrabPlugin(), LiquiditySweepPlugin(),
    EqualHighsPlugin(), EqualLowsPlugin(),
    PremiumZonePlugin(), DiscountZonePlugin(), InducementPlugin(),
]


class TestSMCPluginMetadata:
    def test_all_have_name(self):
        for p in SMC_PLUGINS:
            assert p.name, f"{p.__class__.__name__} missing name"

    def test_all_are_smc_category(self):
        for p in SMC_PLUGINS:
            assert p.category == PatternCategory.SMC

    def test_all_have_metadata_and_parameters(self):
        for p in SMC_PLUGINS:
            meta = p.metadata()
            assert "name" in meta
            assert isinstance(p.parameters(), dict)


class TestSMCValidation:
    @pytest.mark.parametrize("plugin", SMC_PLUGINS, ids=lambda p: p.name)
    def test_validate_too_few_bars(self, plugin):
        bars = make_ascending_bars(3)
        errors = plugin.validate(bars)
        assert len(errors) > 0

    @pytest.mark.parametrize("plugin", SMC_PLUGINS, ids=lambda p: p.name)
    def test_validate_enough_bars(self, plugin):
        bars = make_ascending_bars(max(plugin.min_bars(), 30))
        errors = plugin.validate(bars)
        assert len(errors) == 0


class TestSMCDetection:
    def test_bos_with_uptrend(self):
        bars = make_ascending_bars(30, start=100, step=1.0)
        plugin = BreakOfStructurePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_bos_with_downtrend(self):
        bars = make_descending_bars(30, start=200, step=-1.0)
        plugin = BreakOfStructurePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_order_block_bullish(self):
        bars = []
        for i in range(20):
            if i < 10:
                bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=100 - i * 0.5, high=100 - i * 0.5 + 0.5, low=100 - i * 0.5 - 0.5, close=100 - i * 0.5 - 0.3, volume=1000))
            else:
                bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=95 + (i-10) * 1.0, high=95 + (i-10) * 1.0 + 1.0, low=95 + (i-10) * 1.0 - 0.2, close=95 + (i-10) * 1.0 + 0.8, volume=1200))
        plugin = OrderBlockPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_order_block_bearish(self):
        bars = []
        for i in range(20):
            if i < 10:
                bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=95 + i * 0.5, high=95 + i * 0.5 + 0.5, low=95 + i * 0.5 - 0.2, close=95 + i * 0.5 + 0.3, volume=1000))
            else:
                bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=100 - (i-10) * 1.0, high=100 - (i-10) * 1.0 + 0.2, low=100 - (i-10) * 1.0 - 1.0, close=100 - (i-10) * 1.0 - 0.8, volume=1200))
        plugin = OrderBlockPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_fvg_bullish_gap(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100, volume=1000),
            PriceBar(date="2024-01-02", open=101, high=105, low=100.5, close=104, volume=1500),
            PriceBar(date="2024-01-03", open=102, high=103, low=101.5, close=102.5, volume=1200),
            PriceBar(date="2024-01-04", open=103, high=104, low=102, close=103.5, volume=1100),
        ]
        plugin = FairValueGapPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_equal_highs(self):
        bars = []
        for i in range(30):
            if i < 15:
                v = 100 + (i % 5) * 0.1
            else:
                v = 100 - ((i - 15) % 5) * 0.1
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.5, low=v - 0.5, close=v + 0.1, volume=1000))
        plugin = EqualHighsPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_equal_lows(self):
        bars = []
        for i in range(30):
            if i < 15:
                v = 100 - (i % 5) * 0.1
            else:
                v = 100 + ((i - 15) % 5) * 0.1
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.5, low=v - 0.5, close=v - 0.1, volume=1000))
        plugin = EqualLowsPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_premium_zone(self):
        bars = []
        for i in range(30):
            if i < 15:
                v = 100 + i * 0.5
            else:
                v = 107.5 - (i - 15) * 0.1
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.5, low=v - 0.5, close=v + 0.1, volume=1000))
        plugin = PremiumZonePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_discount_zone(self):
        bars = []
        for i in range(30):
            if i < 15:
                v = 110 - i * 0.5
            else:
                v = 102.5 + (i - 15) * 0.1
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.5, low=v - 0.5, close=v - 0.1, volume=1000))
        plugin = DiscountZonePlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_liquidity_grab(self):
        bars = []
        for i in range(25):
            if i < 10:
                v = 100 + i * 0.5
            elif i < 15:
                v = 105 + (i - 10) * 0.3
            else:
                v = 106.5 - (i - 15) * 0.8
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.3, low=v - 0.3, close=v + 0.1, volume=1000))
        plugin = LiquidityGrabPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    def test_inducement(self):
        bars = []
        for i in range(30):
            if i < 10:
                v = 100 + i * 0.2
            elif i < 15:
                v = 102 - (i - 10) * 0.3
            elif i < 20:
                v = 100.5 + (i - 15) * 0.2
            else:
                v = 101.5 - (i - 20) * 0.15
            bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=v, high=v + 0.2, low=v - 0.2, close=v + 0.05, volume=1000))
        plugin = InducementPlugin()
        results = plugin.detect(bars)
        assert isinstance(results, list)

    @pytest.mark.parametrize("plugin", SMC_PLUGINS, ids=lambda p: p.name)
    def test_shutdown_no_error(self, plugin):
        plugin.shutdown()
