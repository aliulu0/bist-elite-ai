import pytest
from modules.early_opportunity_engine.registry.opportunity_registry import (
    OpportunityRegistry, get_registry, reset_registry,
)


class TestOpportunityRegistry:
    def setup_method(self):
        self.registry = reset_registry()

    def test_singleton(self):
        r1 = get_registry()
        r2 = get_registry()
        assert r1 is r2

    def test_register_and_get(self):
        self.registry.register("test_analyzer", {"type": "test"})
        assert self.registry.get("test_analyzer") == {"type": "test"}

    def test_get_nonexistent(self):
        assert self.registry.get("none") is None

    def test_has(self):
        self.registry.register("my_analyzer", {"type": "x"})
        assert self.registry.has("my_analyzer") is True
        assert self.registry.has("other") is False

    def test_unregister(self):
        self.registry.register("to_remove", {"type": "x"})
        assert self.registry.unregister("to_remove") is True
        assert self.registry.get("to_remove") is None

    def test_unregister_nonexistent(self):
        assert self.registry.unregister("none") is False

    def test_list_analyzers(self):
        self.registry.register("a", {"a": 1})
        self.registry.register("b", {"b": 2})
        names = self.registry.list_analyzers()
        assert "a" in names
        assert "b" in names

    def test_count(self):
        assert self.registry.count() == 0
        self.registry.register("x", {"x": 1})
        assert self.registry.count() == 1

    def test_clear(self):
        self.registry.register("a", {"a": 1})
        self.registry.register("b", {"b": 2})
        self.registry.clear()
        assert self.registry.count() == 0

    def test_config(self):
        self.registry.register("c", {"c": 1}, {"threshold": 0.5})
        assert self.registry.get_config("c") == {"threshold": 0.5}

    def test_normalize_key(self):
        self.registry.register("Value Investing", {"type": "vi"})
        assert self.registry.get("value_investing") == {"type": "vi"}
        assert self.registry.has("Value-Investing") is True
