from pydantic import ValidationError
from modules.explainability_engine.schemas.schemas import (
    EvidenceObjectSchema, ExplanationSectionSchema, ConflictInfoSchema,
    RiskSummarySchema, ExplainabilityScoreSchema, ExplanationResultSchema,
    GenerateExplanationRequest, GenerateComprehensiveRequest,
    ExplanationSummaryResponse, ExplanationDetailResponse,
    ExplanationReportResponse, ExplanationHistoryEntry, ExplanationHistoryResponse,
    ExplanationListResponse, ValidateExplanationRequest, ValidateExplanationResponse,
    CacheStatsResponse, BenchmarkResponse,
)


class TestEvidenceObjectSchema:
    def test_default(self):
        e = EvidenceObjectSchema(reference="test", description="test desc", source_engine="financial")
        assert e.reference == "test"
        assert e.confidence == 0.0

    def test_with_values(self):
        e = EvidenceObjectSchema(reference="pe", description="P/E", source_engine="financial", value=15.0, confidence=0.8)
        assert e.value == 15.0
        assert e.confidence == 0.8


class TestExplanationSectionSchema:
    def test_default(self):
        s = ExplanationSectionSchema(title="T", content="C", category="evidence")
        assert s.title == "T"
        assert s.strength == 0.0


class TestConflictInfoSchema:
    def test_default(self):
        c = ConflictInfoSchema(conflict_type="trend", description="d")
        assert c.severity == "medium"


class TestRiskSummarySchema:
    def test_default(self):
        r = RiskSummarySchema(description="d", risk_type="volatility")
        assert r.probability == 0.0


class TestExplainabilityScoreSchema:
    def test_default(self):
        s = ExplainabilityScoreSchema()
        assert s.overall == 0.0


class TestExplanationResultSchema:
    def test_default(self):
        r = ExplanationResultSchema(symbol="TEST", explanation_type="fundamental", level="detailed", language="en")
        assert r.symbol == "TEST"
        assert r.evidence_count == 0


class TestGenerateExplanationRequest:
    def test_default(self):
        req = GenerateExplanationRequest(symbol="TEST", metrics={"pe": 15})
        assert req.symbol == "TEST"
        assert req.explanation_type == "elite_score"
        assert req.level == "detailed"
        assert req.language == "en"

    def test_custom(self):
        req = GenerateExplanationRequest(
            symbol="X", metrics={}, explanation_type="risk",
            level="summary", language="tr",
        )
        assert req.explanation_type == "risk"


class TestGenerateComprehensiveRequest:
    def test_default(self):
        req = GenerateComprehensiveRequest(symbol="TEST", metrics={})
        assert req.explanation_types == []


class TestExplanationSummaryResponse:
    def test_default(self):
        r = ExplanationSummaryResponse(
            symbol="TEST", explanation_type="fundamental",
            level="detailed", language="en",
            section_count=3, evidence_count=10,
            conflict_count=1, risk_count=2,
            scores=ExplainabilityScoreSchema(),
        )
        assert r.section_count == 3


class TestExplanationDetailResponse:
    def test_default(self):
        r = ExplanationDetailResponse(
            result=ExplanationResultSchema(symbol="TEST", explanation_type="fundamental", level="detailed", language="en"),
        )
        assert r.result.symbol == "TEST"


class TestExplanationHistoryEntry:
    def test_default(self):
        e = ExplanationHistoryEntry(
            symbol="TEST", explanation_type="fundamental",
            level="detailed", evidence_count=5,
            generation_time_ms=10.0, timestamp="2024-01-01",
        )
        assert e.symbol == "TEST"


class TestExplanationHistoryResponse:
    def test_default(self):
        r = ExplanationHistoryResponse(history=[], total=0)
        assert r.total == 0


class TestValidateExplanationRequest:
    def test_default(self):
        req = ValidateExplanationRequest(symbol="TEST", metrics={"pe": 15})
        assert req.explanation_type == "elite_score"


class TestValidateExplanationResponse:
    def test_valid(self):
        r = ValidateExplanationResponse(valid=True, errors=[], evidence_count=5)
        assert r.valid is True

    def test_invalid(self):
        r = ValidateExplanationResponse(valid=False, errors=["bad input"], evidence_count=0)
        assert r.valid is False


class TestCacheStatsResponse:
    def test_default(self):
        r = CacheStatsResponse(size=0, hits=0, misses=0, hit_rate=0.0, ttl=3600, max_size=500)
        assert r.ttl == 3600


class TestBenchmarkResponse:
    def test_default(self):
        r = BenchmarkResponse(iterations=100, avg_ms=5.0, ops_per_second=200.0, total_seconds=0.5)
        assert r.iterations == 100
