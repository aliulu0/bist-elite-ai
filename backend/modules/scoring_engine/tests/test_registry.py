from modules.scoring_engine.registry.registry import ScoringRegistry, get_registry, reset_registry


class TestScoringRegistry:
    def setup_method(self):
        reset_registry()
        self.registry = get_registry()

    def test_singleton(self):
        assert get_registry() is get_registry()

    def test_register_and_get(self):
        self.registry.register("test_calc", "calculator_obj")
        assert self.registry.get("test_calc") == "calculator_obj"

    def test_register_with_config(self):
        self.registry.register("configured", "obj", config={"enabled": True})
        assert self.registry.get_config("configured") == {"enabled": True}

    def test_unregister(self):
        self.registry.register("to_del", "obj")
        assert self.registry.unregister("to_del") is True
        assert self.registry.get("to_del") is None

    def test_unregister_nonexistent(self):
        assert self.registry.unregister("nope") is False

    def test_has(self):
        self.registry.register("exists", "obj")
        assert self.registry.has("exists") is True
        assert self.registry.has("nope") is False

    def test_count(self):
        self.registry.register("a", "1")
        self.registry.register("b", "2")
        assert self.registry.count() >= 2

    def test_list_calculators(self):
        self.registry.register("x", "1")
        assert "x" in self.registry.list_calculators()

    def test_clear(self):
        self.registry.register("y", "1")
        self.registry.clear()
        assert self.registry.count() == 0

    def test_normalize_key(self):
        assert self.registry._normalize_key("Fundamental") == "fundamental"
        assert self.registry._normalize_key("test key") == "test_key"
