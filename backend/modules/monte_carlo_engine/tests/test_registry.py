import pytest
from modules.monte_carlo_engine.registry.registry import MonteCarloRegistry, reset_monte_carlo_registry


class TestMonteCarloRegistry:
    def setup_method(self):
        reset_monte_carlo_registry()

    def teardown_method(self):
        reset_monte_carlo_registry()

    def test_singleton(self):
        r1 = MonteCarloRegistry()
        r2 = MonteCarloRegistry()
        assert r1 is r2

    def test_register_simulator(self):
        reg = MonteCarloRegistry()
        reg.register_simulator("gbm", {"type": "gbm"})
        assert reg.get_simulator("gbm") == {"type": "gbm"}

    def test_list_simulators(self):
        reg = MonteCarloRegistry()
        reg.register_simulator("gbm", {})
        reg.register_simulator("bootstrap", {})
        assert len(reg.list_simulators()) == 2

    def test_register_risk_model(self):
        reg = MonteCarloRegistry()
        reg.register_risk_model("var", {"type": "var"})
        assert reg.get_risk_model("var") == {"type": "var"}

    def test_list_risk_models(self):
        reg = MonteCarloRegistry()
        reg.register_risk_model("var", {})
        assert "var" in reg.list_risk_models()

    def test_register_scenario_generator(self):
        reg = MonteCarloRegistry()
        reg.register_scenario_generator("basic", {"type": "basic"})
        assert reg.get_scenario_generator("basic") == {"type": "basic"}

    def test_register_factory(self):
        reg = MonteCarloRegistry()
        reg.register_factory("builder", lambda: "factory")
        assert reg.get_factory("builder")() == "factory"

    def test_clear(self):
        reg = MonteCarloRegistry()
        reg.register_simulator("gbm", {})
        reg.clear()
        assert reg.list_simulators() == []

    def test_get_missing(self):
        reg = MonteCarloRegistry()
        assert reg.get_simulator("missing") is None
        assert reg.get_risk_model("missing") is None
        assert reg.get_scenario_generator("missing") is None

    def test_reset(self):
        r1 = MonteCarloRegistry()
        reset_monte_carlo_registry()
        r2 = MonteCarloRegistry()
        assert r1 is not r2
