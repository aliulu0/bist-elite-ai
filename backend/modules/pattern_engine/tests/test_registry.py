from __future__ import annotations

import pytest
from modules.pattern_engine.registry.pattern_registry import PatternRegistry
from modules.pattern_engine.core.types import PatternCategory


class TestPatternRegistry:
    def test_default_plugins_count(self):
        reg = PatternRegistry()
        assert reg.count > 0

    def test_all_categories_registered(self):
        reg = PatternRegistry()
        classical = reg.list_by_category(PatternCategory.CLASSICAL)
        candlestick = reg.list_by_category(PatternCategory.CANDLESTICK)
        smc = reg.list_by_category(PatternCategory.SMC)
        wyckoff = reg.list_by_category(PatternCategory.WYCKOFF)
        elliott = reg.list_by_category(PatternCategory.ELLIOTT)
        assert len(classical) > 0
        assert len(candlestick) > 0
        assert len(smc) > 0
        assert len(wyckoff) > 0
        assert len(elliott) > 0

    def test_classical_count(self):
        reg = PatternRegistry()
        assert len(reg.list_by_category(PatternCategory.CLASSICAL)) == 18

    def test_candlestick_count(self):
        reg = PatternRegistry()
        assert len(reg.list_by_category(PatternCategory.CANDLESTICK)) == 18

    def test_smc_count(self):
        reg = PatternRegistry()
        assert len(reg.list_by_category(PatternCategory.SMC)) == 13

    def test_wyckoff_count(self):
        reg = PatternRegistry()
        assert len(reg.list_by_category(PatternCategory.WYCKOFF)) == 10

    def test_elliott_count(self):
        reg = PatternRegistry()
        assert len(reg.list_by_category(PatternCategory.ELLIOTT)) == 1

    def test_get_by_name(self):
        reg = PatternRegistry()
        plugin = reg.get("hammer")
        assert plugin is not None
        assert plugin.name == "hammer"

    def test_get_nonexistent_returns_none(self):
        reg = PatternRegistry()
        assert reg.get("nonexistent") is None

    def test_list_plugins(self):
        reg = PatternRegistry()
        plugins = reg.list_plugins()
        assert len(plugins) > 0
        assert all("name" in p for p in plugins)

    def test_contains(self):
        reg = PatternRegistry()
        assert "hammer" in reg
        assert "nonexistent" not in reg

    def test_len(self):
        reg = PatternRegistry()
        assert len(reg) == reg.count

    def test_register_custom_plugin(self):
        from modules.pattern_engine.core.base import BasePatternPlugin
        from modules.pattern_engine.core.types import PriceBar, PatternResult

        class CustomPlugin(BasePatternPlugin):
            @property
            def name(self): return "custom_test"
            @property
            def display_name(self): return "Custom Test"
            @property
            def category(self): return PatternCategory.CLASSICAL
            def initialize(self, **kwargs): pass
            def detect(self, prices, **params): return []
            def validate(self, prices, **params): return []
            def metadata(self): return {"name": self.name}
            def parameters(self): return {}

        reg = PatternRegistry()
        reg.register(CustomPlugin())
        assert "custom_test" in reg
        assert reg.get("custom_test") is not None

    def test_unregister(self):
        from modules.pattern_engine.core.base import BasePatternPlugin
        from modules.pattern_engine.core.types import PriceBar, PatternResult

        class TempPlugin(BasePatternPlugin):
            @property
            def name(self): return "temp_plugin"
            @property
            def display_name(self): return "Temp"
            @property
            def category(self): return PatternCategory.CLASSICAL
            def initialize(self, **kwargs): pass
            def detect(self, prices, **params): return []
            def validate(self, prices, **params): return []
            def metadata(self): return {"name": self.name}
            def parameters(self): return {}

        reg = PatternRegistry()
        reg.register(TempPlugin())
        assert reg.unregister("temp_plugin")
        assert "temp_plugin" not in reg
        assert not reg.unregister("temp_plugin")
