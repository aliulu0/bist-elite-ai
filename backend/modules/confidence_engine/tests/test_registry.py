import pytest
from modules.confidence_engine.registry.registry import ConfidenceRegistry, reset_confidence_registry


@pytest.fixture(autouse=True)
def fresh_registry():
    reset_confidence_registry()
    yield
    reset_confidence_registry()


class TestConfidenceRegistry:
    def test_singleton(self):
        r1 = ConfidenceRegistry()
        r2 = ConfidenceRegistry()
        assert r1 is r2

    def test_register_calculator(self):
        reg = ConfidenceRegistry()
        reg.register_calculator("test_calc", object())
        assert reg.has_calculator("test_calc")

    def test_get_calculator(self):
        reg = ConfidenceRegistry()
        calc = object()
        reg.register_calculator("my_calc", calc)
        assert reg.get_calculator("my_calc") is calc

    def test_get_unknown(self):
        reg = ConfidenceRegistry()
        assert reg.get_calculator("unknown") is None

    def test_list_calculators(self):
        reg = ConfidenceRegistry()
        reg.register_calculator("a", object())
        reg.register_calculator("b", object())
        assert "a" in reg.list_calculators()
        assert "b" in reg.list_calculators()

    def test_remove_calculator(self):
        reg = ConfidenceRegistry()
        reg.register_calculator("to_remove", object())
        assert reg.remove_calculator("to_remove") is True
        assert reg.has_calculator("to_remove") is False

    def test_remove_nonexistent(self):
        reg = ConfidenceRegistry()
        assert reg.remove_calculator("nonexistent") is False

    def test_register_factory(self):
        reg = ConfidenceRegistry()
        factory = lambda: object()
        reg.register_factory("test_factory", factory)
        assert reg.get_factory("test_factory") is factory

    def test_list_factories(self):
        reg = ConfidenceRegistry()
        reg.register_factory("f1", lambda: None)
        assert "f1" in reg.list_factories()

    def test_clear(self):
        reg = ConfidenceRegistry()
        reg.register_calculator("a", object())
        reg.register_factory("f", lambda: None)
        reg.clear()
        assert len(reg.list_calculators()) == 0
        assert len(reg.list_factories()) == 0

    def test_normalization(self):
        reg = ConfidenceRegistry()
        reg.register_calculator("MyCalc", object())
        assert reg.has_calculator("mycalc")
