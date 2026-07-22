import pytest
from modules.backtest_engine.core.types import (
    BacktestType,
    InvestmentHorizon,
    MarketPeriod,
    SignalAction,
    BenchmarkType,
    ExportFormat,
    DataSource,
    TradeExitReason,
    ReportType,
    PriceBar,
    Signal,
    Trade,
    PerformanceMetrics,
    EquityPoint,
    TradeAnalysis,
    PortfolioAnalysis,
    BacktestRequest,
    BacktestResult,
    BacktestComparison,
    classify_market_period,
    classify_trade_quality,
    classify_sharpe,
)


class TestEnums:
    def test_backtest_type_values(self):
        values = [b.value for b in BacktestType]
        assert "single_strategy" in values
        assert "event_driven" in values
        assert len(values) == 6

    def test_investment_horizon_values(self):
        values = [h.value for h in InvestmentHorizon]
        assert "weekly" in values
        assert "12_months" in values
        assert len(values) == 5

    def test_market_period_values(self):
        values = [m.value for m in MarketPeriod]
        assert "bull" in values
        assert "crisis" in values
        assert len(values) == 7

    def test_signal_action_values(self):
        values = [s.value for s in SignalAction]
        assert "buy" in values
        assert "cover" in values
        assert len(values) == 5

    def test_benchmark_type_values(self):
        values = [b.value for b in BenchmarkType]
        assert "bist100" in values
        assert "custom" in values
        assert len(values) == 5

    def test_export_format_values(self):
        values = [e.value for e in ExportFormat]
        assert "pdf" in values
        assert "json" in values
        assert len(values) == 4

    def test_data_source_values(self):
        values = [d.value for d in DataSource]
        assert "strategy_engine" in values
        assert "confidence_engine" in values
        assert len(values) == 6

    def test_trade_exit_reason_values(self):
        values = [t.value for t in TradeExitReason]
        assert "stop_loss" in values
        assert "end_of_data" in values
        assert len(values) == 6

    def test_report_type_values(self):
        values = [r.value for r in ReportType]
        assert "executive" in values
        assert "full" in values
        assert len(values) == 6


class TestPriceBar:
    def test_creation(self):
        bar = PriceBar(timestamp="2024-01-01", open=100, high=105, low=95, close=102, volume=1000000)
        assert bar.close == 102
        assert bar.symbol == ""

    def test_typical_price(self):
        bar = PriceBar(timestamp="2024-01-01", open=100, high=110, low=90, close=100, volume=1000)
        assert bar.typical_price == 100.0

    def test_adjusted_close(self):
        bar = PriceBar(timestamp="2024-01-01", open=100, high=105, low=95, close=102, volume=1000, adjusted_close=98.0)
        assert bar.adjusted_close == 98.0


class TestSignal:
    def test_creation(self):
        sig = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        assert sig.action == SignalAction.BUY
        assert sig.score == 80.0


class TestTrade:
    def test_creation(self):
        t = Trade(symbol="TUPRS", entry_date="2024-01-01", entry_price=100.0)
        assert t.entry_price == 100.0
        assert t.pnl == 0.0


class TestPerformanceMetrics:
    def test_defaults(self):
        m = PerformanceMetrics()
        assert m.total_return == 0.0
        assert m.total_trades == 0


class TestEquityPoint:
    def test_creation(self):
        pt = EquityPoint(timestamp="2024-01-01", equity=100000.0, drawdown=5.0)
        assert pt.equity == 100000.0


class TestTradeAnalysis:
    def test_defaults(self):
        ta = TradeAnalysis()
        assert ta.total_signals == 0


class TestPortfolioAnalysis:
    def test_defaults(self):
        pa = PortfolioAnalysis()
        assert pa.portfolio_return == 0.0


class TestClassifyMarketPeriod:
    def test_bull(self):
        assert classify_market_period([0.2, 0.15, 0.1]) == MarketPeriod.BULL

    def test_bear(self):
        assert classify_market_period([-0.15, -0.12, -0.1]) == MarketPeriod.BEAR

    def test_sideways(self):
        assert classify_market_period([0.02, -0.01, 0.03]) == MarketPeriod.SIDEWAYS

    def test_high_volatility(self):
        assert classify_market_period([0.1, 0.05], volatility=50) == MarketPeriod.HIGH_VOLATILITY

    def test_empty(self):
        assert classify_market_period([]) == MarketPeriod.SIDEWAYS

    def test_recovery(self):
        assert classify_market_period([0.06, 0.08]) == MarketPeriod.RECOVERY


class TestClassifyTradeQuality:
    def test_excellent(self):
        t = Trade(symbol="X", entry_date="d", entry_price=100, pnl_pct=15, holding_days=10)
        assert classify_trade_quality(t) == "excellent"

    def test_good(self):
        t = Trade(symbol="X", entry_date="d", entry_price=100, pnl_pct=7)
        assert classify_trade_quality(t) == "good"

    def test_fair(self):
        t = Trade(symbol="X", entry_date="d", entry_price=100, pnl_pct=2)
        assert classify_trade_quality(t) == "fair"

    def test_poor(self):
        t = Trade(symbol="X", entry_date="d", entry_price=100, pnl_pct=-3)
        assert classify_trade_quality(t) == "poor"

    def test_terrible(self):
        t = Trade(symbol="X", entry_date="d", entry_price=100, pnl_pct=-10)
        assert classify_trade_quality(t) == "terrible"


class TestClassifySharpe:
    def test_exceptional(self):
        assert classify_sharpe(3.5) == "exceptional"

    def test_excellent(self):
        assert classify_sharpe(2.5) == "excellent"

    def test_good(self):
        assert classify_sharpe(1.5) == "good"

    def test_acceptable(self):
        assert classify_sharpe(0.7) == "acceptable"

    def test_poor(self):
        assert classify_sharpe(0.2) == "poor"

    def test_unacceptable(self):
        assert classify_sharpe(-0.5) == "unacceptable"


class TestBacktestRequest:
    def test_defaults(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        assert req.initial_capital == 100000.0
        assert req.commission_pct == 0.001


class TestBacktestResult:
    def test_defaults(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = BacktestResult(request=req)
        assert result.request.symbol == "TUPRS"
        assert len(result.trades) == 0


class TestBacktestComparison:
    def test_defaults(self):
        bc = BacktestComparison()
        assert len(bc.backtest_ids) == 0
