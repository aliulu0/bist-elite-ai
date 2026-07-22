import pytest
from modules.monte_carlo_engine.core.types import (
    BenchmarkResult,
    ConfidenceInterval,
    MarketScenario,
    MonteCarloRequest,
    MonteCarloResult,
    PortfolioMetrics,
    ProbabilityMetrics,
    ReportType,
    RiskMetrics,
    ScenarioResult,
    SimulationConfig,
    SimulationMethod,
    SimulationResult,
    ValidationTarget,
    _kurtosis,
    _mean,
    _median,
    _percentile,
    _skewness,
    _stdev,
    _max_drawdown_from_values,
    _sharpe_from_returns,
    classify_severity,
)


class TestEnums:
    def test_simulation_method_values(self):
        assert SimulationMethod.GEOMETRIC_BROWNIAN_MOTION.value == "geometric_brownian_motion"
        assert SimulationMethod.HISTORICAL_BOOTSTRAP.value == "historical_bootstrap"
        assert SimulationMethod.JUMP_DIFFUSION.value == "jump_diffusion"

    def test_market_scenario_values(self):
        assert MarketScenario.BULL.value == "bull"
        assert MarketScenario.BLACK_SWAN.value == "black_swan"

    def test_report_type_values(self):
        assert ReportType.EXECUTIVE.value == "executive"
        assert ReportType.FULL.value == "full"

    def test_validation_target_values(self):
        assert ValidationTarget.STRATEGY.value == "strategy"
        assert ValidationTarget.ELITE_SCORE.value == "elite_score"


class TestHelperFunctions:
    def test_mean(self):
        assert _mean([1.0, 2.0, 3.0]) == 2.0
        assert _mean([]) == 0.0

    def test_stdev(self):
        assert _stdev([]) == 0.0
        assert _stdev([1.0]) == 0.0
        assert _stdev([1.0, 2.0, 3.0, 4.0, 5.0]) > 0

    def test_median(self):
        assert _median([]) == 0.0
        assert _median([3.0, 1.0, 2.0]) == 2.0
        assert _median([1.0, 2.0]) == 1.5

    def test_percentile(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert _percentile(values, 0.5) == 3.0
        assert _percentile([], 0.5) == 0.0

    def test_skewness(self):
        assert _skewness([]) == 0.0
        assert _skewness([1.0, 2.0]) == 0.0
        assert isinstance(_skewness([1.0, 2.0, 3.0, 4.0, 5.0]), float)

    def test_kurtosis(self):
        assert _kurtosis([]) == 0.0
        assert _kurtosis([1.0, 2.0]) == 0.0
        assert isinstance(_kurtosis([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]), float)

    def test_max_drawdown_from_values(self):
        assert _max_drawdown_from_values([]) == 0.0
        assert _max_drawdown_from_values([100]) == 0.0
        assert _max_drawdown_from_values([100, 110, 90, 105]) > 0

    def test_sharpe_from_returns(self):
        assert _sharpe_from_returns([]) == 0.0
        assert _sharpe_from_returns([0.01, 0.02, 0.015, 0.005, -0.01]) != 0

    def test_classify_severity(self):
        assert classify_severity(0.1) == "none"
        assert classify_severity(0.3) == "low"
        assert classify_severity(0.5) == "moderate"
        assert classify_severity(0.7) == "high"
        assert classify_severity(0.9) == "critical"


class TestDataclasses:
    def test_simulation_config_defaults(self):
        c = SimulationConfig()
        assert c.method == SimulationMethod.GEOMETRIC_BROWNIAN_MOTION
        assert c.num_simulations == 10000

    def test_simulation_result_defaults(self):
        s = SimulationResult()
        assert s.total_return == 0.0

    def test_risk_metrics_defaults(self):
        r = RiskMetrics()
        assert r.value_at_risk == 0.0

    def test_probability_metrics_defaults(self):
        p = ProbabilityMetrics()
        assert p.prob_loss_1pct == 0.0

    def test_portfolio_metrics_defaults(self):
        p = PortfolioMetrics()
        assert p.portfolio_return == 0.0

    def test_scenario_result_defaults(self):
        s = ScenarioResult()
        assert s.scenario == MarketScenario.SIDEWAYS

    def test_confidence_interval_defaults(self):
        c = ConfidenceInterval()
        assert c.confidence_level == 0.95

    def test_monte_carlo_request_defaults(self):
        r = MonteCarloRequest(symbol="TUPRS")
        assert r.num_simulations == 10000

    def test_monte_carlo_result_defaults(self):
        r = MonteCarloResult()
        assert r.total_windows == 0 if hasattr(r, 'total_windows') else r.mean_return == 0.0

    def test_benchmark_result_defaults(self):
        b = BenchmarkResult()
        assert b.success is True
