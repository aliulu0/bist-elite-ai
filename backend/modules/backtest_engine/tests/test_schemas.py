import pytest
from modules.backtest_engine.schemas.schemas import (
    BacktestRunRequest,
    BacktestResultResponse,
    BacktestListResponse,
    BacktestCompareRequest,
    BacktestCompareResponse,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    ReportRequest,
    ReportResponse,
    SummaryResponse,
    HistoryResponse,
    PerformanceMetricsSchema,
    TradeSchema,
    EquityPointSchema,
    TradeAnalysisSchema,
    PortfolioAnalysisSchema,
    PriceBarSchema,
    SignalSchema,
)


class TestBacktestRunRequest:
    def test_defaults(self):
        r = BacktestRunRequest(symbol="TUPRS")
        assert r.strategy == "default"
        assert r.initial_capital == 100000.0

    def test_custom(self):
        r = BacktestRunRequest(symbol="GARAN", strategy="momentum", stop_loss_pct=3.0)
        assert r.stop_loss_pct == 3.0


class TestPerformanceMetricsSchema:
    def test_defaults(self):
        m = PerformanceMetricsSchema()
        assert m.total_return == 0.0
        assert m.total_trades == 0

    def test_custom(self):
        m = PerformanceMetricsSchema(total_return=15.5, sharpe_ratio=1.8)
        assert m.total_return == 15.5


class TestTradeSchema:
    def test_creation(self):
        t = TradeSchema(symbol="TUPRS", entry_date="2024-01-01", entry_price=100.0)
        assert t.symbol == "TUPRS"


class TestEquityPointSchema:
    def test_creation(self):
        pt = EquityPointSchema(timestamp="2024-01-01", equity=100000.0)
        assert pt.equity == 100000.0


class TestBacktestResultResponse:
    def test_creation(self):
        r = BacktestResultResponse(
            symbol="TUPRS",
            strategy="test",
            market_period="bull",
            metrics=PerformanceMetricsSchema(),
            trade_analysis=TradeAnalysisSchema(),
            portfolio_analysis=PortfolioAnalysisSchema(),
        )
        assert r.symbol == "TUPRS"


class TestBacktestListResponse:
    def test_defaults(self):
        r = BacktestListResponse()
        assert r.total == 0


class TestBacktestCompareRequest:
    def test_creation(self):
        r = BacktestCompareRequest(symbols=["TUPRS", "GARAN"])
        assert len(r.symbols) == 2


class TestHealthResponse:
    def test_defaults(self):
        r = HealthResponse()
        assert r.status == "healthy"


class TestSummaryResponse:
    def test_defaults(self):
        r = SummaryResponse()
        assert r.total_backtests == 0


class TestReportRequest:
    def test_defaults(self):
        r = ReportRequest(symbol="TUPRS")
        assert r.report_type == "executive"


class TestReportResponse:
    def test_creation(self):
        r = ReportResponse(symbol="TUPRS", report_type="executive", content="test", generated_at="2024-01-01")
        assert r.content == "test"


class TestBenchmarkResponse:
    def test_creation(self):
        r = BenchmarkResponse(operation="test", iterations=10, avg_time_ms=1.0, min_time_ms=0.5, max_time_ms=2.0, success=True)
        assert r.success is True


class TestCacheStatsResponse:
    def test_creation(self):
        r = CacheStatsResponse(size=10, max_size=500, hits=50, misses=5, hit_rate=0.91, ttl_seconds=3600)
        assert r.hit_rate == 0.91
