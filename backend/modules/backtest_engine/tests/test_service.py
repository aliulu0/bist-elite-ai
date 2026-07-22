import pytest
from modules.backtest_engine.services.service import BacktestService
from modules.backtest_engine.core.types import BacktestRequest


class TestBacktestService:
    def setup_method(self):
        self.service = BacktestService()

    def _make_request(self, symbol="TUPRS"):
        return BacktestRequest(
            symbol=symbol, strategy="test", start_date="2023-01-01", end_date="2025-12-31",
            initial_capital=100000.0,
        )

    def test_run_backtest(self):
        result = self.service.run_backtest(self._make_request())
        assert result.request.symbol == "TUPRS"
        assert len(result.equity_curve) > 0

    def test_get_result(self):
        self.service.run_backtest(self._make_request())
        result = self.service.get_result("TUPRS")
        assert result is not None

    def test_get_result_miss(self):
        assert self.service.get_result("NONEXISTENT") is None

    def test_list_results(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        self.service.run_backtest(self._make_request("GARAN"))
        results = self.service.list_results()
        assert len(results) == 2

    def test_get_history(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        history = self.service.get_history("TUPRS")
        assert len(history) == 1

    def test_summary(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        summary = self.service.summary()
        assert summary["total_backtests"] >= 1
        assert "best_symbol" in summary

    def test_summary_empty(self):
        summary = self.service.summary()
        assert summary["total_backtests"] == 0

    def test_report(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        report = self.service.generate_report("TUPRS", "executive")
        assert "content" in report

    def test_report_missing(self):
        report = self.service.generate_report("NONEXISTENT")
        assert "error" in report

    def test_cache(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        stats = self.service.cache_stats()
        assert stats["hits"] >= 0

    def test_clear_cache(self):
        self.service.run_backtest(self._make_request("TUPRS"))
        cleared = self.service.clear_cache()
        assert cleared >= 0

    def test_health(self):
        health = self.service.health_check()
        assert health.status == "healthy"

    def test_benchmark(self):
        result = self.service.run_engine_benchmark(iterations=2)
        assert result.success is True

    def test_result_to_response(self):
        result = self.service.run_backtest(self._make_request())
        response = self.service.result_to_response(result)
        assert response.symbol == "TUPRS"
        assert response.metrics is not None

    def test_compare(self):
        requests = [self._make_request("TUPRS"), self._make_request("GARAN")]
        result = self.service.compare(requests)
        assert "best_performer" in result

    def test_caching(self):
        req = self._make_request("TUPRS")
        self.service.run_backtest(req)
        stats_before = self.service.cache_stats()
        self.service.run_backtest(req)
        stats_after = self.service.cache_stats()
        assert stats_after["hits"] > stats_before["hits"]
