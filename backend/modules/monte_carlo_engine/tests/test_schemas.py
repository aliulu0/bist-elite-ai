import pytest
from modules.monte_carlo_engine.schemas.schemas import (
    MonteCarloRunRequest,
    MonteCarloResultResponse,
    MonteCarloListResponse,
    MonteCarloListItem,
    MonteCarloReportRequest,
    MonteCarloReportResponse,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    SummaryResponse,
    RiskMetricsSchema,
    ProbabilityMetricsSchema,
    PortfolioMetricsSchema,
    ScenarioResultSchema,
    ConfidenceIntervalSchema,
)


class TestSchemas:
    def test_run_request_defaults(self):
        req = MonteCarloRunRequest(symbol="TUPRS")
        assert req.symbol == "TUPRS"
        assert req.num_simulations == 10000

    def test_run_request_validation(self):
        req = MonteCarloRunRequest(symbol="TUPRS", num_simulations=5000)
        assert req.num_simulations == 5000

    def test_risk_metrics_schema(self):
        r = RiskMetricsSchema()
        assert r.var_95 == 0.0

    def test_probability_metrics_schema(self):
        p = ProbabilityMetricsSchema()
        assert p.prob_loss_1pct == 0.0

    def test_portfolio_metrics_schema(self):
        p = PortfolioMetricsSchema()
        assert p.portfolio_return == 0.0

    def test_scenario_result_schema(self):
        s = ScenarioResultSchema(scenario="bull")
        assert s.scenario == "bull"

    def test_confidence_interval_schema(self):
        c = ConfidenceIntervalSchema()
        assert c.confidence_level == 0.95

    def test_list_item(self):
        item = MonteCarloListItem(symbol="TUPRS", strategy="sma", simulation_method="gbm", num_simulations=1000, mean_return=5.0, var_95=3000, max_drawdown=10.0)
        assert item.symbol == "TUPRS"

    def test_list_response(self):
        resp = MonteCarloListResponse(total=0)
        assert resp.total == 0

    def test_report_request(self):
        req = MonteCarloReportRequest(symbol="TUPRS")
        assert req.report_type == "executive"

    def test_benchmark_response(self):
        resp = BenchmarkResponse(operation="op", iterations=10, avg_time_ms=1.0, min_time_ms=0.5, max_time_ms=2.0, success=True)
        assert resp.success is True

    def test_cache_stats_response(self):
        resp = CacheStatsResponse(size=0, max_size=100, hits=0, misses=0, hit_rate=0.0, ttl_seconds=3600)
        assert resp.ttl_seconds == 3600

    def test_health_response(self):
        resp = HealthResponse()
        assert resp.status == "healthy"

    def test_summary_response(self):
        resp = SummaryResponse()
        assert resp.total_simulations == 0
