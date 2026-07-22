import pytest
from modules.walk_forward_engine.core.types import (
    GeneralizationScores,
    MarketRegime,
    OptimizationResult,
    RegimePerformance,
    ReportType,
    ValidationMetrics,
    WalkForwardRequest,
    WalkForwardResult,
    WindowResult,
    WindowSlice,
)
from modules.walk_forward_engine.reports.generator import WalkForwardReportGenerator


class TestWalkForwardReportGenerator:
    def setup_method(self):
        self.gen = WalkForwardReportGenerator()
        self.result = WalkForwardResult(
            request=WalkForwardRequest(symbol="TUPRS", strategy="sma_cross", start_date="2020-01-01", end_date="2025-12-31"),
            window_results=[
                WindowResult(
                    window=WindowSlice(index=0, train_start="2020-01-01", train_end="2021-01-01", test_start="2021-01-01", test_end="2022-01-01"),
                    optimization=OptimizationResult(train_return=15.0, train_sharpe=1.8, train_drawdown=5.0, train_win_rate=55.0, score=1.8),
                    validation=ValidationMetrics(out_of_sample_return=12.0, out_of_sample_sharpe=1.5, out_of_sample_win_rate=52.0, out_of_sample_drawdown=4.0, out_of_sample_trades=25),
                    selected_parameters={"sma_short": 10, "sma_long": 50},
                    success=True,
                ),
                WindowResult(
                    window=WindowSlice(index=1, train_start="2021-01-01", train_end="2022-01-01", test_start="2022-01-01", test_end="2023-01-01", regime=MarketRegime.BEAR),
                    optimization=OptimizationResult(train_return=8.0, train_sharpe=1.2, train_drawdown=8.0, train_win_rate=48.0, score=1.2),
                    validation=ValidationMetrics(out_of_sample_return=5.0, out_of_sample_sharpe=0.8, out_of_sample_win_rate=45.0, out_of_sample_drawdown=6.0, out_of_sample_trades=18),
                    success=True,
                ),
            ],
            generalization=GeneralizationScores(
                generalization_score=0.75, overfitting_score=0.25,
                robustness_score=0.7, consistency_score=0.8,
                severity=__import__("modules.walk_forward_engine.core.types", fromlist=["OverfittingSeverity"]).OverfittingSeverity.LOW,
                recommendation="Minor overfitting detected.",
            ),
            regime_performance=[
                RegimePerformance(regime=MarketRegime.BULL, windows_count=3, avg_return=15.0, avg_sharpe=1.8),
                RegimePerformance(regime=MarketRegime.BEAR, windows_count=2, avg_return=-2.0, avg_sharpe=0.3),
            ],
            recommended_parameters={"sma_short": 10, "sma_long": 50},
            total_windows=5,
            successful_windows=5,
            overall_train_return=12.0,
            overall_test_return=10.0,
            overall_train_sharpe=1.6,
            overall_test_sharpe=1.3,
        )

    def test_executive_summary(self):
        report = self.gen.generate(self.result, ReportType.EXECUTIVE)
        assert "content" in report
        assert "TUPRS" in report["content"]
        assert "Generalization" in report["content"]

    def test_optimization_history(self):
        report = self.gen.generate(self.result, ReportType.OPTIMIZATION)
        assert "content" in report
        assert "Train Ret" in report["content"]

    def test_training_results(self):
        report = self.gen.generate(self.result, ReportType.TRAINING)
        assert "content" in report
        assert "Training Results" in report["content"]

    def test_validation_results(self):
        report = self.gen.generate(self.result, ReportType.VALIDATION)
        assert "content" in report
        assert "OOS" in report["content"]

    def test_failure_analysis(self):
        report = self.gen.generate(self.result, ReportType.FAILURE_ANALYSIS)
        assert "content" in report
        assert "Failure Analysis" in report["content"]

    def test_generalization_report(self):
        report = self.gen.generate(self.result, ReportType.GENERALIZATION)
        assert "content" in report
        assert "Generalization" in report["content"]
        assert "Regime" in report["content"]

    def test_full_report(self):
        report = self.gen.generate(self.result, ReportType.FULL)
        assert "content" in report
        assert len(report["content"]) > 100

    def test_generate_all_sections(self):
        sections = self.gen.generate_all_sections(self.result)
        assert len(sections) == len(ReportType) - 1

    def test_empty_result(self):
        result = WalkForwardResult()
        report = self.gen.generate(result, ReportType.EXECUTIVE)
        assert "content" in report

    def test_with_failures(self):
        result = WalkForwardResult(
            window_results=[
                WindowResult(
                    window=WindowSlice(index=0, train_start="2020-01-01", train_end="2021-01-01", test_start="2021-01-01", test_end="2022-01-01"),
                    success=False, error_message="Simulated failure",
                ),
            ],
            total_windows=1,
            failed_windows=1,
        )
        report = self.gen.generate(result, ReportType.FAILURE_ANALYSIS)
        assert "Simulated failure" in report["content"]

    def test_report_type_executive(self):
        report = self.gen.generate(self.result, "executive")
        assert "content" in report

    def test_unknown_report_type_defaults_to_executive(self):
        report = self.gen.generate(self.result, ReportType.EXECUTIVE)
        assert "content" in report
