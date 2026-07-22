import pytest
from modules.monte_carlo_engine.core.types import MonteCarloRequest, SimulationMethod
from modules.monte_carlo_engine.services.service import MonteCarloService
from modules.monte_carlo_engine.cache.cache import reset_monte_carlo_cache
from modules.monte_carlo_engine.registry.registry import reset_monte_carlo_registry


class TestMonteCarloService:
    def setup_method(self):
        reset_monte_carlo_cache()
        reset_monte_carlo_registry()
        self.service = MonteCarloService()

    def teardown_method(self):
        reset_monte_carlo_cache()
        reset_monte_carlo_registry()

    def _default_request(self, **kwargs) -> MonteCarloRequest:
        defaults = {
            "symbol": "TUPRS",
            "strategy": "sma_cross",
            "num_simulations": 200,
            "num_days": 30,
            "seed": 42,
        }
        defaults.update(kwargs)
        return MonteCarloRequest(**defaults)

    def test_run_simulation(self):
        result = self.service.run_simulation(self._default_request())
        assert len(result.simulations) == 200
        assert result.request.symbol == "TUPRS"

    def test_caching(self):
        req = self._default_request()
        r1 = self.service.run_simulation(req)
        r2 = self.service.run_simulation(req)
        assert r1 is r2

    def test_get_result(self):
        self.service.run_simulation(self._default_request())
        assert self.service.get_result("TUPRS") is not None

    def test_get_result_missing(self):
        assert self.service.get_result("MISSING") is None

    def test_list_results(self):
        self.service.run_simulation(self._default_request())
        assert len(self.service.list_results()) == 1

    def test_generate_report(self):
        self.service.run_simulation(self._default_request())
        report = self.service.generate_report("TUPRS", "executive")
        assert "content" in report

    def test_generate_report_missing(self):
        report = self.service.generate_report("MISSING")
        assert "error" in report

    def test_get_scenarios(self):
        scenarios = self.service.get_scenarios()
        assert len(scenarios) == 9

    def test_summary_empty(self):
        s = self.service.summary()
        assert s["total_simulations"] == 0

    def test_summary_with_results(self):
        self.service.run_simulation(self._default_request())
        s = self.service.summary()
        assert s["total_simulations"] == 1

    def test_clear_cache(self):
        self.service.run_simulation(self._default_request())
        self.service.clear_cache()

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert "size" in stats

    def test_health_check(self):
        h = self.service.health_check()
        assert h.status == "healthy"

    def test_result_to_response(self):
        result = self.service.run_simulation(self._default_request())
        resp = self.service.result_to_response(result)
        assert resp.symbol == "TUPRS"
        assert resp.num_simulations == 200

    def test_run_benchmark(self):
        resp = self.service.run_engine_benchmark(iterations=2)
        assert resp.iterations == 2

    def test_parse_simulation_method(self):
        assert self.service._parse_simulation_method("gbm") == SimulationMethod.GEOMETRIC_BROWNIAN_MOTION
        assert self.service._parse_simulation_method("invalid") == SimulationMethod.GEOMETRIC_BROWNIAN_MOTION

    def test_parse_scenarios(self):
        scenarios = self.service._parse_scenarios(["bull", "bear", "invalid"])
        assert len(scenarios) == 2
