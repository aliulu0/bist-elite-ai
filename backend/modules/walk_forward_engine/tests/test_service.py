import pytest
from modules.walk_forward_engine.core.types import WalkForwardRequest, WindowMode
from modules.walk_forward_engine.services.service import WalkForwardService
from modules.walk_forward_engine.cache.cache import reset_walk_forward_cache
from modules.walk_forward_engine.registry.registry import reset_walk_forward_registry


class TestWalkForwardService:
    def setup_method(self):
        reset_walk_forward_cache()
        reset_walk_forward_registry()
        self.service = WalkForwardService()

    def teardown_method(self):
        reset_walk_forward_cache()
        reset_walk_forward_registry()

    def _default_request(self, **kwargs) -> WalkForwardRequest:
        defaults = {
            "symbol": "TUPRS",
            "strategy": "sma_cross",
            "start_date": "2022-01-01",
            "end_date": "2024-12-31",
            "window_mode": WindowMode.ROLLING,
        }
        defaults.update(kwargs)
        return WalkForwardRequest(**defaults)

    def test_run_analysis(self):
        result = self.service.run_analysis(self._default_request())
        assert result.total_windows >= 0
        assert result.request.symbol == "TUPRS"

    def test_run_analysis_caching(self):
        req = self._default_request()
        r1 = self.service.run_analysis(req)
        r2 = self.service.run_analysis(req)
        assert r1 is r2

    def test_get_result(self):
        self.service.run_analysis(self._default_request())
        result = self.service.get_result("TUPRS")
        assert result is not None

    def test_get_result_missing(self):
        assert self.service.get_result("MISSING") is None

    def test_list_results(self):
        self.service.run_analysis(self._default_request())
        results = self.service.list_results()
        assert len(results) == 1

    def test_get_history(self):
        self.service.run_analysis(self._default_request())
        history = self.service.get_history("TUPRS")
        assert len(history) == 1

    def test_generate_report(self):
        self.service.run_analysis(self._default_request())
        report = self.service.generate_report("TUPRS", "executive")
        assert "content" in report

    def test_generate_report_missing(self):
        report = self.service.generate_report("MISSING")
        assert "error" in report

    def test_summary_empty(self):
        s = self.service.summary()
        assert s["total_analyses"] == 0

    def test_summary_with_results(self):
        self.service.run_analysis(self._default_request())
        s = self.service.summary()
        assert s["total_analyses"] == 1

    def test_clear_cache(self):
        self.service.run_analysis(self._default_request())
        cleared = self.service.clear_cache()
        assert cleared >= 0

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert "size" in stats

    def test_health_check(self):
        h = self.service.health_check()
        assert h.status == "healthy"

    def test_result_to_response(self):
        result = self.service.run_analysis(self._default_request())
        resp = self.service.result_to_response(result)
        assert resp.symbol == "TUPRS"
        assert resp.window_mode == "rolling"

    def test_run_with_strategy_fn(self):
        def my_fn(data, params):
            return 1.0
        result = self.service.run_analysis(self._default_request(), strategy_fn=my_fn)
        assert result.total_windows >= 0

    def test_run_benchmark(self):
        resp = self.service.run_engine_benchmark(iterations=2)
        assert resp.iterations == 2

    def test_parse_window_mode(self):
        assert self.service._parse_window_mode("rolling") == WindowMode.ROLLING
        assert self.service._parse_window_mode("invalid") == WindowMode.ROLLING

    def test_generate_dates(self):
        dates = self.service._generate_dates("2023-01-01", "2023-01-10")
        assert len(dates) > 0
        assert all(d for d in dates)
