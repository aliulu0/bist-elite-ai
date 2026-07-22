import pytest
from modules.strategy_engine.registry.strategy_registry import (
    StrategyRegistry,
    get_registry,
)
from modules.strategy_engine.core.base import BaseStrategy
from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyType,
)


class DummyStrategy(BaseStrategy):
    @property
    def name(self) -> str:
        return "dummy"

    @property
    def display_name(self) -> str:
        return "Dummy Strategy"

    @property
    def strategy_type(self) -> StrategyType:
        return StrategyType.CUSTOM

    def initialize(self, **kwargs) -> None:
        pass

    def build_definition(self) -> StrategyDefinition:
        return StrategyDefinition(
            name="Dummy",
            strategy_type=StrategyType.CUSTOM,
        )

    def evaluate(self, symbol: str, metrics: dict, **kwargs):
        pass

    def metadata(self) -> dict:
        return {"name": "dummy"}


class TestStrategyRegistry:
    def test_get_default_registry(self):
        registry = get_registry()
        assert registry is not None
        assert registry.count() >= 11

    def test_list_all(self):
        registry = get_registry()
        names = registry.list_all()
        assert "early_opportunity" in names
        assert "value_investing" in names
        assert "high_conviction" in names

    def test_get_definition(self):
        registry = get_registry()
        defn = registry.get_definition("value_investing")
        assert defn is not None
        assert defn.name == "Value Investing"

    def test_has(self):
        registry = get_registry()
        assert registry.has("value_investing") is True
        assert registry.has("nonexistent") is False

    def test_list_definitions(self):
        registry = get_registry()
        defs = registry.list_definitions()
        assert len(defs) >= 11


class TestCustomRegistry:
    def test_register_definition(self):
        registry = StrategyRegistry()
        defn = StrategyDefinition(name="Custom", strategy_type=StrategyType.CUSTOM)
        registry.register_definition(defn)
        assert registry.has("custom")
        assert registry.count() == 1

    def test_register_strategy(self):
        registry = StrategyRegistry()
        strategy = DummyStrategy()
        registry.register(strategy)
        assert registry.has("dummy")
        assert registry.get("dummy") is not None

    def test_remove(self):
        registry = StrategyRegistry()
        defn = StrategyDefinition(name="To Remove", strategy_type=StrategyType.CUSTOM)
        registry.register_definition(defn)
        assert registry.has("to_remove")
        removed = registry.remove("to_remove")
        assert removed is True
        assert registry.has("to_remove") is False

    def test_remove_nonexistent(self):
        registry = StrategyRegistry()
        removed = registry.remove("nonexistent")
        assert removed is False

    def test_clear(self):
        registry = StrategyRegistry()
        registry.register_definition(StrategyDefinition(name="A", strategy_type=StrategyType.CUSTOM))
        registry.register_definition(StrategyDefinition(name="B", strategy_type=StrategyType.CUSTOM))
        registry.clear()
        assert registry.count() == 0

    def test_case_insensitive(self):
        registry = StrategyRegistry()
        registry.register_definition(StrategyDefinition(name="MyStrategy", strategy_type=StrategyType.CUSTOM))
        assert registry.has("MyStrategy")
        assert registry.has("mystrategy")
        assert registry.has("MYSTRATEGY")
