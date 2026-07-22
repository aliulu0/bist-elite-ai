import pytest
from modules.walk_forward_engine.schemas.schemas import (
    WalkForwardRunRequest,
    WalkForwardResultResponse,
    WalkForwardListResponse,
    WalkForwardListItem,
    WalkForwardHistoryResponse,
    WalkForwardHistoryItem,
    WalkForwardReportRequest,
    WalkForwardReportResponse,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    SummaryResponse,
    GeneralizationScoresSchema,
    WindowResultSchema,
    WindowSliceSchema,
    OptimizationResultSchema,
    ValidationMetricsSchema,
    RegimePerformanceSchema,
)


class TestSchemas:
    def test_run_request_defaults(self):
        req = WalkForwardRunRequest(symbol="TUPRS")
        assert req.symbol == "TUPRS"
        assert req.window_mode == "rolling"
        assert req.train_test_split == "80_20"

    def test_run_request_validation(self):
        req = WalkForwardRunRequest(symbol="TUPRS", min_train_rows=50, min_test_rows=10)
        assert req.min_train_rows == 50

    def test_generalization_schema(self):
        g = GeneralizationScoresSchema()
        assert g.generalization_score == 0.0
        assert g.severity == "none"

    def test_window_result_schema(self):
        wr = WindowResultSchema(window=WindowSliceSchema(index=0, train_start="2020-01-01", train_end="2021-01-01", test_start="2021-01-01", test_end="2022-01-01"))
        assert wr.success is True

    def test_list_item(self):
        item = WalkForwardListItem(symbol="TUPRS", strategy="sma", window_mode="rolling", total_windows=5, generalization_score=0.8, overfitting_score=0.2, robustness_score=0.7, test_return=10.0, test_sharpe=1.5)
        assert item.symbol == "TUPRS"

    def test_list_response(self):
        resp = WalkForwardListResponse(total=0)
        assert resp.total == 0

    def test_history_item(self):
        item = WalkForwardHistoryItem(symbol="TUPRS", strategy="sma", window_mode="rolling", start_date="2020-01-01", end_date="2025-12-31", total_windows=5, generalization_score=0.8, severity="low", execution_time_ms=100.0)
        assert item.severity == "low"

    def test_report_request(self):
        req = WalkForwardReportRequest(symbol="TUPRS")
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
        assert resp.total_analyses == 0

    def test_regime_performance_schema(self):
        rp = RegimePerformanceSchema(regime="bull")
        assert rp.regime == "bull"
        assert rp.windows_count == 0

    def test_optimization_result_schema(self):
        o = OptimizationResultSchema()
        assert o.score == 0.0

    def test_validation_metrics_schema(self):
        v = ValidationMetricsSchema()
        assert v.out_of_sample_return == 0.0
