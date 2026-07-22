import pytest
from pydantic import ValidationError
from modules.elite_score_engine.schemas.schemas import (
    CalculateEliteRequest,
    EliteScoreResponse,
    DimensionContributionResponse,
    BonusResponse,
    PenaltyResponse,
    EliteListRequest,
    EliteListResponse,
    EliteTopRequest,
    EliteRankingEntryResponse,
    EliteRankingResponse,
    EliteHistoryResponse,
    EliteDetailsResponse,
    ProfileResponse,
    ProfileListResponse,
    CacheStatsResponse,
    BenchmarkRequest,
    BenchmarkResponse,
    ValidateRequest,
    ValidateResponse,
    ErrorResponse,
)


class TestCalculateEliteRequest:
    def test_valid(self):
        req = CalculateEliteRequest(symbol="TUPRS", scores={"financial": 70.0})
        assert req.profile_name == "balanced"

    def test_empty_symbol(self):
        with pytest.raises(ValidationError):
            CalculateEliteRequest(symbol="", scores={"financial": 70.0})

    def test_defaults(self):
        req = CalculateEliteRequest(symbol="TUPRS", scores={"financial": 70.0})
        assert req.horizon == "one_month"
        assert req.regime == "sideways"
        assert req.sector == "other"


class TestEliteScoreResponse:
    def test_valid(self):
        resp = EliteScoreResponse(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category="good",
            label="early_opportunity",
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=70.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon="one_month",
            regime="sideways",
            sector="other",
            calculated_at="2024-01-01T00:00:00",
            calculation_id="abc123",
        )
        assert resp.symbol == "TUPRS"


class TestDimensionContributionResponse:
    def test_valid(self):
        resp = DimensionContributionResponse(
            dimension="momentum",
            raw_score=70.0,
            normalized_score=70.0,
            weighted_score=4.9,
            contribution=4.9,
            direction="higher_is_better",
            weight=0.07,
            confidence=1.0,
            evidence_count=1,
        )
        assert resp.dimension == "momentum"


class TestBonusResponse:
    def test_valid(self):
        resp = BonusResponse(factor="golden_cross", points=5.0, condition="", applied_count=1)
        assert resp.factor == "golden_cross"


class TestPenaltyResponse:
    def test_valid(self):
        resp = PenaltyResponse(factor="weak_liquidity", points=-5.0, condition="", applied_count=1)
        assert resp.points == -5.0


class TestEliteListRequest:
    def test_valid(self):
        req = EliteListRequest(symbols=["TUPRS", "GARAN"])
        assert len(req.symbols) == 2

    def test_empty_symbols(self):
        with pytest.raises(ValidationError):
            EliteListRequest(symbols=[])


class TestEliteTopRequest:
    def test_defaults(self):
        req = EliteTopRequest()
        assert req.n == 10
        assert req.horizon == "one_month"


class TestEliteRankingEntryResponse:
    def test_valid(self):
        resp = EliteRankingEntryResponse(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category="good",
            label="early_opportunity",
            rank=1,
            previous_rank=None,
            rank_change=0,
            trend="stable",
            sector="other",
            horizon="one_month",
            period="daily",
            calculated_at="2024-01-01T00:00:00",
        )
        assert resp.rank == 1


class TestProfileResponse:
    def test_valid(self):
        resp = ProfileResponse(
            name="balanced",
            description="Balanced",
            dimensions={"momentum": 0.07},
            bonus_count=3,
            penalty_count=3,
            is_active=True,
        )
        assert resp.name == "balanced"


class TestCacheStatsResponse:
    def test_valid(self):
        resp = CacheStatsResponse(size=10, max_size=500, hits=5, misses=2, hit_rate=0.71, ttl_seconds=3600)
        assert resp.size == 10


class TestBenchmarkRequest:
    def test_defaults(self):
        req = BenchmarkRequest()
        assert req.iterations == 10
        assert req.warmup == 3


class TestBenchmarkResponse:
    def test_valid(self):
        resp = BenchmarkResponse(
            operation="test",
            execution_time_ms=10.0,
            memory_mb=1.0,
            iterations=10,
            avg_time_ms=10.0,
            min_time_ms=8.0,
            max_time_ms=12.0,
            p95_time_ms=11.0,
            success=True,
        )
        assert resp.success is True


class TestValidateRequest:
    def test_valid(self):
        req = ValidateRequest(scores={"financial": 70.0})
        assert req.scores == {"financial": 70.0}


class TestValidateResponse:
    def test_valid(self):
        resp = ValidateResponse(is_valid=True, errors=[])
        assert resp.is_valid is True


class TestErrorResponse:
    def test_valid(self):
        resp = ErrorResponse(detail="Not found")
        assert resp.detail == "Not found"
