import pytest
from modules.walk_forward_engine.registry.registry import (
    WalkForwardRegistry,
    reset_walk_forward_registry,
)


class TestWalkForwardRegistry:
    def setup_method(self):
        reset_walk_forward_registry()

    def teardown_method(self):
        reset_walk_forward_registry()

    def test_singleton(self):
        r1 = WalkForwardRegistry()
        r2 = WalkForwardRegistry()
        assert r1 is r2

    def test_register_strategy(self):
        reg = WalkForwardRegistry()
        reg.register_strategy("sma", {"type": "sma"})
        assert reg.get_strategy("sma") == {"type": "sma"}

    def test_list_strategies(self):
        reg = WalkForwardRegistry()
        reg.register_strategy("sma", {})
        reg.register_strategy("rsi", {})
        assert "sma" in reg.list_strategies()
        assert "rsi" in reg.list_strategies()

    def test_register_optimizer(self):
        reg = WalkForwardRegistry()
        reg.register_optimizer("grid", {"type": "grid"})
        assert reg.get_optimizer("grid") == {"type": "grid"}

    def test_list_optimizers(self):
        reg = WalkForwardRegistry()
        reg.register_optimizer("grid", {})
        assert "grid" in reg.list_optimizers()

    def test_register_validator(self):
        reg = WalkForwardRegistry()
        reg.register_validator("basic", {"type": "basic"})
        assert reg.get_validator("basic") == {"type": "basic"}

    def test_list_validators(self):
        reg = WalkForwardRegistry()
        reg.register_validator("basic", {})
        assert "basic" in reg.list_validators()

    def test_register_factory(self):
        reg = WalkForwardRegistry()
        reg.register_factory("builder", lambda: "factory")
        assert reg.get_factory("builder")() == "factory"

    def test_list_factories(self):
        reg = WalkForwardRegistry()
        reg.register_factory("builder", lambda: None)
        assert "builder" in reg.list_factories()

    def test_clear(self):
        reg = WalkForwardRegistry()
        reg.register_strategy("sma", {})
        reg.register_optimizer("grid", {})
        reg.clear()
        assert reg.list_strategies() == []
        assert reg.list_optimizers() == []

    def test_get_missing_returns_none(self):
        reg = WalkForwardRegistry()
        assert reg.get_strategy("missing") is None
        assert reg.get_optimizer("missing") is None
        assert reg.get_validator("missing") is None
        assert reg.get_factory("missing") is None

    def test_reset_singleton(self):
        r1 = WalkForwardRegistry()
        reset_walk_forward_registry()
        r2 = WalkForwardRegistry()
        assert r1 is not r2
