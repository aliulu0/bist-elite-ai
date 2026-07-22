import pytest
from modules.decision_engine.schemas.schemas import (
    DecisionGenerateRequest,
    EngineDataSchema,
    RecommendationResponse,
    DecisionListResponse,
    DecisionTopResponse,
    DecisionHistoryResponse,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    ReportRequest,
    ReportResponse,
    EntryGuidanceSchema,
    ExitGuidanceSchema,
    PortfolioImpactSchema,
    HorizonRecommendationSchema,
    DimensionScoreSchema,
    ConflictSchema,
    BonusPenaltySchema,
)


class TestEngineDataSchema:
    def test_defaults(self):
        s = EngineDataSchema()
        assert s.score == 0.0
        assert s.confidence == 0.0
        assert s.signals == {}

    def test_custom(self):
        s = EngineDataSchema(score=75.0, confidence=80.0, signals={"pe": 15})
        assert s.score == 75.0


class TestDecisionGenerateRequest:
    def test_valid(self):
        r = DecisionGenerateRequest(symbol="TUPRS")
        assert r.symbol == "TUPRS"
        assert r.profile == "balanced"

    def test_with_data(self):
        r = DecisionGenerateRequest(
            symbol="GARAN",
            engine_data={"financial": EngineDataSchema(score=80.0)},
            sector="banking",
        )
        assert r.sector == "banking"


class TestEntryGuidanceSchema:
    def test_defaults(self):
        s = EntryGuidanceSchema()
        assert s.timing == "no_entry"
        assert s.max_position_pct == 0.0


class TestExitGuidanceSchema:
    def test_defaults(self):
        s = ExitGuidanceSchema()
        assert s.action == "hold"
        assert s.review_days == 30


class TestPortfolioImpactSchema:
    def test_defaults(self):
        s = PortfolioImpactSchema()
        assert s.diversification_effect == 0.0
        assert s.position_size_suggestion == 0.0


class TestRecommendationResponse:
    def test_creation(self):
        r = RecommendationResponse(
            symbol="TUPRS",
            decision="buy",
            decision_score=82.0,
            decision_confidence=75.0,
            decision_risk=18.0,
            decision_urgency="high",
            decision_stability=85.0,
            summary="TUPRS: Buy",
            entry=EntryGuidanceSchema(),
            exit=ExitGuidanceSchema(),
            portfolio_impact=PortfolioImpactSchema(),
        )
        assert r.symbol == "TUPRS"
        assert r.decision == "buy"


class TestDecisionListResponse:
    def test_defaults(self):
        r = DecisionListResponse()
        assert r.total == 0
        assert r.items == []


class TestDecisionTopResponse:
    def test_defaults(self):
        r = DecisionTopResponse()
        assert r.count == 0


class TestBenchmarkResponse:
    def test_creation(self):
        r = BenchmarkResponse(
            operation="test",
            iterations=10,
            avg_time_ms=1.5,
            min_time_ms=0.5,
            max_time_ms=3.0,
            success=True,
        )
        assert r.success is True


class TestCacheStatsResponse:
    def test_creation(self):
        r = CacheStatsResponse(
            size=10,
            max_size=1000,
            hits=50,
            misses=5,
            hit_rate=0.91,
            ttl_seconds=300,
        )
        assert r.hit_rate == 0.91


class TestHealthResponse:
    def test_defaults(self):
        r = HealthResponse()
        assert r.status == "healthy"
        assert r.version == "1.0.0"


class TestReportRequest:
    def test_defaults(self):
        r = ReportRequest(symbol="TUPRS")
        assert r.report_type == "executive"


class TestReportResponse:
    def test_creation(self):
        r = ReportResponse(
            symbol="TUPRS",
            report_type="executive",
            content="Test report",
            generated_at="2026-01-01",
        )
        assert r.content == "Test report"
