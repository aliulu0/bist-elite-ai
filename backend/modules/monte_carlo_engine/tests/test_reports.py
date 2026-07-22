import pytest
from modules.monte_carlo_engine.core.types import (
    ConfidenceInterval,
    MarketScenario,
    MonteCarloRequest,
    MonteCarloResult,
    PortfolioMetrics,
    ProbabilityMetrics,
    ReportType,
    RiskMetrics,
    ScenarioResult,
    SimulationResult,
)
from modules.monte_carlo_engine.reports.generator import MonteCarloReportGenerator


class TestMonteCarloReportGenerator:
    def setup_method(self):
        self.gen = MonteCarloReportGenerator()
        self.result = MonteCarloResult(
            request=MonteCarloRequest(symbol="TUPRS", strategy="sma", num_simulations=10000, num_days=252),
            simulations=[SimulationResult(simulation_id=i, terminal_value=100000 + i*100, total_return=5.0 + i*0.1) for i in range(50)],
            risk_metrics=RiskMetrics(var_95=5000, cvar_95=8000, max_drawdown=15.0, var_90=3000, var_99=12000, cvar_99=15000),
            probability_metrics=ProbabilityMetrics(prob_loss_5pct=20.0, prob_gain_10pct=60.0, prob_double=5.0, prob_halve=1.0),
            portfolio_metrics=PortfolioMetrics(),
            scenario_results=[ScenarioResult(scenario=MarketScenario.BULL, label="Bull", impact_score=0.2)],
            confidence_intervals=[ConfidenceInterval(lower=80000, upper=130000, confidence_level=0.95)],
            terminal_values=[100000 + i*100 for i in range(50)],
            mean_return=5.0,
            median_return=5.0,
            std_return=3.0,
            worst_case_return=-10.0,
            best_case_return=20.0,
            expected_case_return=5.0,
        )

    def test_executive_summary(self):
        report = self.gen.generate(self.result, ReportType.EXECUTIVE)
        assert "content" in report
        assert "TUPRS" in report["content"]

    def test_simulation_summary(self):
        report = self.gen.generate(self.result, ReportType.SIMULATION_SUMMARY)
        assert "content" in report

    def test_worst_case(self):
        report = self.gen.generate(self.result, ReportType.WORST_CASE)
        assert "content" in report
        assert "Worst" in report["content"]

    def test_best_case(self):
        report = self.gen.generate(self.result, ReportType.BEST_CASE)
        assert "content" in report
        assert "Best" in report["content"]

    def test_expected_case(self):
        report = self.gen.generate(self.result, ReportType.EXPECTED_CASE)
        assert "content" in report
        assert "Confidence" in report["content"]

    def test_tail_risk(self):
        report = self.gen.generate(self.result, ReportType.TAIL_RISK)
        assert "content" in report
        assert "Tail" in report["content"]

    def test_capital_preservation(self):
        report = self.gen.generate(self.result, ReportType.CAPITAL_PRESERVATION)
        assert "content" in report
        assert "Capital" in report["content"]

    def test_full_report(self):
        report = self.gen.generate(self.result, ReportType.FULL)
        assert "content" in report
        assert len(report["content"]) > 100

    def test_generate_all_sections(self):
        sections = self.gen.generate_all_sections(self.result)
        assert len(sections) == len(ReportType) - 1

    def test_empty_result(self):
        report = self.gen.generate(MonteCarloResult(), ReportType.EXECUTIVE)
        assert "content" in report
