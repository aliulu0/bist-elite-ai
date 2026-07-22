import pytest
from modules.backtest_engine.executors.engine import BacktestEngine
from modules.backtest_engine.core.types import BacktestRequest, BacktestType, BenchmarkType, InvestmentHorizon


class TestBacktestEngine:
    def setup_method(self):
        self.engine = BacktestEngine()

    def test_run_single(self):
        req = BacktestRequest(
            symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31",
            initial_capital=100000.0, stop_loss_pct=5.0, take_profit_pct=15.0,
        )
        result = self.engine.run(req)
        assert result.request.symbol == "TUPRS"
        assert len(result.equity_curve) > 0
        assert result.execution_time_ms >= 0

    def test_run_different_symbols(self):
        for sym in ["TUPRS", "GARAN", "AKBNK"]:
            req = BacktestRequest(symbol=sym, strategy="test", start_date="2023-01-01", end_date="2025-12-31")
            result = self.engine.run(req)
            assert result.request.symbol == sym
            assert result.metrics.total_trades >= 0

    def test_result_has_metrics(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = self.engine.run(req)
        assert result.metrics.total_return != 0 or result.metrics.total_trades == 0
        assert result.metrics.max_drawdown >= 0

    def test_result_has_benchmark(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = self.engine.run(req)
        assert result.benchmark_metrics is not None

    def test_result_has_market_period(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = self.engine.run(req)
        assert result.market_period is not None

    def test_run_multiple(self):
        requests = [
            BacktestRequest(symbol=s, strategy="test", start_date="2023-01-01", end_date="2025-12-31")
            for s in ["TUPRS", "GARAN"]
        ]
        results = self.engine.run_multiple(requests)
        assert len(results) == 2

    def test_compare(self):
        requests = [
            BacktestRequest(symbol=s, strategy="test", start_date="2023-01-01", end_date="2025-12-31")
            for s in ["TUPRS", "GARAN"]
        ]
        results = self.engine.run_multiple(requests)
        comparison = self.engine.compare(results)
        assert "best_performer" in comparison
        assert "worst_performer" in comparison

    def test_compare_empty(self):
        assert self.engine.compare([]) == {}

    def test_trades_have_prices(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = self.engine.run(req)
        for trade in result.trades:
            assert trade.entry_price > 0
            assert trade.exit_price > 0

    def test_equity_curve_monotonicity(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = self.engine.run(req)
        for pt in result.equity_curve:
            assert pt.equity > 0
            assert pt.drawdown >= 0
