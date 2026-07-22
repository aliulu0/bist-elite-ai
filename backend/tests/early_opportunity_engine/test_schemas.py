import pytest
from modules.early_opportunity_engine.schemas.opportunity_schemas import (
    AnalysisSignalSchema, StageResultSchema, RiskAssessmentSchema,
    SimilarityAnalysisSchema, ExpectedReturnSchema, OpportunityResultSchema,
    RankedOpportunitySchema, AnalyzeRequest, AnalyzeResponse,
    BatchAnalyzeRequest, BatchAnalyzeResponse, OpportunityListResponse,
    OpportunityDetailResponse, OpportunityHistoryEntry, OpportunityHistoryResponse,
    OpportunitySummaryResponse, ValidateRequest, ValidateResponse,
    CacheStatsResponse,
)


class TestSchemas:
    def test_analysis_signal_schema(self):
        s = AnalysisSignalSchema(name="test", category="financial", strength=0.8, confidence=0.9, description="d")
        assert s.name == "test"

    def test_stage_result_schema(self):
        s = StageResultSchema(category="financial", score=0.75, signal_count=3)
        assert s.signal_count == 3

    def test_risk_assessment_schema(self):
        r = RiskAssessmentSchema(score=0.3, drawdown_probability=0.2, liquidity_risk=0.1, volatility_risk=0.3, sector_risk=0.2)
        assert r.score == 0.3

    def test_similarity_schema(self):
        s = SimilarityAnalysisSchema(score=0.6, similar_symbols=["A", "B"], historical_success_rate=0.7)
        assert len(s.similar_symbols) == 2

    def test_expected_return_schema(self):
        e = ExpectedReturnSchema(conservative=5.0, expected=15.0, optimistic=30.0)
        assert e.expected == 15.0

    def test_opportunity_result_schema(self):
        o = OpportunityResultSchema(
            symbol="TEST", opportunity_score=75.0, rating="High",
            stage="stage_5_breakout", confidence=80.0,
            risk=RiskAssessmentSchema(score=0.3, drawdown_probability=0.2, liquidity_risk=0.1, volatility_risk=0.3, sector_risk=0.2),
            expected_window="2w", expected_return=ExpectedReturnSchema(),
            market_regime="sideways",
        )
        assert o.symbol == "TEST"

    def test_ranked_schema(self):
        r = RankedOpportunitySchema(symbol="TST", opportunity_score=80.0, rating="High", stage="s5", confidence=75, risk_score=0.3, expected_return=20, rank=1)
        assert r.rank == 1

    def test_analyze_request(self):
        r = AnalyzeRequest(symbol="TEST", metrics={"close": 50.0})
        assert r.symbol == "TEST"

    def test_batch_request(self):
        r = BatchAnalyzeRequest(symbols=["A", "B"], metrics={"A": {"close": 50.0}})
        assert len(r.symbols) == 2

    def test_validate_request(self):
        r = ValidateRequest(metrics={"close": 50.0})
        assert r.symbol == "TEST"

    def test_cache_stats_response(self):
        c = CacheStatsResponse(size=10, hits=5, misses=5, hit_rate=0.5, ttl=3600, max_size=200)
        assert c.hit_rate == 0.5

    def test_history_entry(self):
        h = OpportunityHistoryEntry(symbol="TEST", score=75.0, rating="High", stage="s5", timestamp="2026-01-01")
        assert h.symbol == "TEST"

    def test_summary_response(self):
        s = OpportunitySummaryResponse(total=10, avg_score=60.0, avg_confidence=70.0, avg_risk=0.3, exceptional=2, very_high=3, high=3, medium=2, low=0, very_low=0)
        assert s.total == 10

    def test_list_response(self):
        r = OpportunityListResponse(results=[], total=0)
        assert r.total == 0
