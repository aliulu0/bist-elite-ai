import pytest
from modules.backtest_engine.reports.generator import ReportGenerator
from modules.backtest_engine.core.types import (
    BacktestRequest,
    BacktestResult,
    EquityPoint,
    PerformanceMetrics,
    ReportType,
    Trade,
)


class TestReportGenerator:
    def setup_method(self):
        self.gen = ReportGenerator()
        req = BacktestRequest(
            symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31",
        )
        self.result = BacktestResult(
            request=req,
            trades=[
                Trade("TUPRS", "2024-01-01", 100.0, "2024-01-10", 110.0, 100.0, pnl=1000.0, pnl_pct=10.0, holding_days=9, entry_score=80.0, entry_confidence=75.0),
                Trade("TUPRS", "2024-01-15", 110.0, "2024-01-20", 105.0, 90.0, pnl=-450.0, pnl_pct=-4.5, holding_days=5, entry_score=70.0, entry_confidence=65.0),
            ],
            equity_curve=[
                EquityPoint("2024-01-01", 100000.0),
                EquityPoint("2024-01-10", 110000.0),
                EquityPoint("2024-01-20", 105000.0),
            ],
            metrics=PerformanceMetrics(
                total_return=5.0,
                annualized_return=3.0,
                max_drawdown=4.5,
                sharpe_ratio=1.2,
                sortino_ratio=1.5,
                calmar_ratio=0.67,
                win_rate=50.0,
                profit_factor=2.22,
                total_trades=2,
                winning_trades=1,
                losing_trades=1,
                avg_holding_days=7.0,
            ),
        )

    def test_executive_summary(self):
        report = self.gen.generate(self.result, ReportType.EXECUTIVE)
        assert "content" in report
        assert "TUPRS" in report["content"]

    def test_trade_list(self):
        report = self.gen.generate(self.result, ReportType.TRADE_LIST)
        assert "content" in report
        assert "Entry" in report["content"]

    def test_performance_report(self):
        report = self.gen.generate(self.result, ReportType.PERFORMANCE)
        assert "content" in report
        assert "Win Rate" in report["content"]

    def test_risk_report(self):
        report = self.gen.generate(self.result, ReportType.RISK)
        assert "content" in report
        assert "Drawdown" in report["content"]

    def test_benchmark_report(self):
        report = self.gen.generate(self.result, ReportType.BENCHMARK)
        assert "content" in report
        assert "Benchmark" in report["content"]

    def test_full_report(self):
        report = self.gen.generate(self.result, ReportType.FULL)
        assert "content" in report
        assert len(report["content"]) > 100

    def test_generate_all_sections(self):
        sections = self.gen.generate_all_sections(self.result)
        assert len(sections) == 5
        assert "executive" in sections
        assert "performance" in sections

    def test_executive_contains_key_metrics(self):
        report = self.gen.generate(self.result, ReportType.EXECUTIVE)
        content = report["content"]
        assert "Total Return" in content
        assert "Max Drawdown" in content
        assert "Sharpe Ratio" in content
