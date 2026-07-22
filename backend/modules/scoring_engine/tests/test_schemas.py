from pydantic import ValidationError
from modules.scoring_engine.schemas.schemas import (
    CalculateScoreRequest, ScoreBreakdownSchema, ScoreResultResponse,
    ScoreDetailResponse, ScoreListResponse, WeightsResponse, ProfileInfo,
    ProfilesResponse, CacheStatsResponse, BenchmarkResponse,
    OptimizationRequest, OptimizationResponse,
    ValidateRequest, ValidateResponse, ProfileCreateRequest,
    ScoreHistoryEntry, ScoreHistoryResponse, WeightInfo,
)


class TestCalculateScoreRequest:
    def test_default(self):
        req = CalculateScoreRequest(symbol="TEST", metrics={})
        assert req.profile == "balanced"
        assert req.horizon == "one_month"
        assert req.regime == "sideways"
        assert req.score_types == []

    def test_custom(self):
        req = CalculateScoreRequest(symbol="X", metrics={}, profile="aggressive")
        assert req.profile == "aggressive"


class TestScoreBreakdownSchema:
    def test_default(self):
        bd = ScoreBreakdownSchema(score_type="financial", raw_score=80.0, normalized_score=80.0,
                                   weight=0.2, contribution=16.0, penalty=0.0, bonus=0.0, final_contribution=16.0)
        assert bd.confidence == 1.0


class TestScoreResultResponse:
    def test_default(self):
        resp = ScoreResultResponse(symbol="TEST", scores={}, breakdowns={}, profile="balanced",
                                    horizon="one_month", regime="sideways", composite_score=50.0,
                                    confidence=0.0, method="weighted", timestamp="", calculation_time_ms=0.0)
        assert resp.symbol == "TEST"


class TestScoreDetailResponse:
    def test_default(self):
        resp = ScoreDetailResponse(symbol="TEST", score_type="financial", score=75.0)
        assert resp.score == 75.0


class TestScoreListResponse:
    def test_default(self):
        resp = ScoreListResponse(symbol="TEST", scores={}, composite_score=50.0,
                                  profile="balanced", horizon="one_month", regime="sideways", timestamp="")
        assert resp.composite_score == 50.0


class TestWeightsResponse:
    def test_default(self):
        resp = WeightsResponse(profile="balanced", horizon="one_month", regime="sideways",
                                weights=[], total_weight=0.0)
        assert resp.total_weight == 0.0


class TestProfilesResponse:
    def test_default(self):
        resp = ProfilesResponse(profiles=[], total=0)
        assert resp.total == 0


class TestCacheStatsResponse:
    def test_default(self):
        resp = CacheStatsResponse(size=0, hits=0, misses=0, hit_rate=0.0, ttl=3600, max_size=500)
        assert resp.ttl == 3600


class TestBenchmarkResponse:
    def test_default(self):
        resp = BenchmarkResponse(iterations=100, avg_ms=5.0, ops_per_second=200.0,
                                  total_seconds=0.5, memory_bytes=1024)
        assert resp.memory_bytes == 1024


class TestOptimizationResponse:
    def test_default(self):
        resp = OptimizationResponse(original_weights={}, optimized_weights={},
                                     improvement_pct=0.0, iterations=0, method="rule_based", timestamp="")
        assert resp.method == "rule_based"


class TestValidateRequest:
    def test_default(self):
        req = ValidateRequest(symbol="TEST", metrics={})
        assert req.symbol == "TEST"


class TestValidateResponse:
    def test_valid(self):
        resp = ValidateResponse(valid=True, errors=[], message="OK")
        assert resp.valid is True


class TestProfileCreateRequest:
    def test_default(self):
        req = ProfileCreateRequest(name="Test")
        assert req.profile == "balanced"


class TestScoreHistoryEntry:
    def test_default(self):
        e = ScoreHistoryEntry(score_type="composite", score=75.0, timestamp="2024-01-01")
        assert e.profile == "balanced"


class TestWeightInfo:
    def test_default(self):
        w = WeightInfo(score_type="financial", weight=0.2)
        assert w.min_threshold == 0.0


class TestProfileInfo:
    def test_default(self):
        p = ProfileInfo(name="Test", profile="balanced", description="desc", is_active=True)
        assert p.is_active is True
