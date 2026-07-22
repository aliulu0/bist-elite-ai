from modules.explainability_engine.registry.registry import ExplanationRegistry, get_registry, reset_registry


class TestExplanationRegistry:
    def setup_method(self):
        reset_registry()
        self.registry = ExplanationRegistry()

    def test_singleton(self):
        r1 = get_registry()
        r2 = get_registry()
        assert r1 is r2

    def test_register_and_get(self):
        self.registry.register("mock_builder", "builder_obj")
        assert self.registry.get("mock_builder") == "builder_obj"

    def test_register_with_config(self):
        self.registry.register("configured", "obj", config={"enabled": True})
        assert self.registry.get_config("configured") == {"enabled": True}

    def test_register_duplicate(self):
        self.registry.register("dup", "v1")
        self.registry.register("dup", "v2")
        assert self.registry.get("dup") == "v2"

    def test_unregister(self):
        self.registry.register("to_delete", "obj")
        assert self.registry.unregister("to_delete") is True
        assert self.registry.get("to_delete") is None

    def test_unregister_nonexistent(self):
        assert self.registry.unregister("nonexistent") is False

    def test_has(self):
        self.registry.register("exists", "obj")
        assert self.registry.has("exists") is True
        assert self.registry.has("nope") is False

    def test_count(self):
        self.registry.register("a", "1")
        self.registry.register("b", "2")
        assert self.registry.count() >= 2

    def test_list_builders(self):
        self.registry.register("x", "1")
        assert "x" in self.registry.list_builders()

    def test_clear(self):
        self.registry.register("y", "1")
        self.registry.clear()
        assert self.registry.count() == 0

    def test_normalize_key(self):
        assert self.registry._normalize_key("Fundamental") == "fundamental"
        assert self.registry._normalize_key("FUNDAMENTAL") == "fundamental"
        assert self.registry._normalize_key("test key") == "test_key"
        assert self.registry._normalize_key("test-key") == "test_key"

    def test_reset_registry(self):
        reset_registry()
        registry = get_registry()
        assert registry is not None
        assert registry.count() == 0
