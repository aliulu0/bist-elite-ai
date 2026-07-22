import pytest
from modules.elite_score_engine.services.service import EliteScoreService
from modules.elite_score_engine.core.types import (
    EliteCalculationRequest,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    RankingPeriod,
    ScoringDimension,
)
from modules.elite_score_engine.weights.manager import reset_weight_manager
from modules.elite_score_engine.profiles.manager import reset_profile_manager
from modules.elite_score_engine.cache.cache import reset_elite_cache


@pytest.fixture(autouse=True)
def fresh_service():
    reset_weight_manager()
    reset_profile_manager()
    reset_elite_cache()
    yield
    reset_weight_manager()
    reset_profile_manager()
    reset_elite_cache()


class TestEliteScoreService:
    def setup_method(self):
        self.service = EliteScoreService()

    def test_calculate(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0, "momentum": 65.0},
        )
        result = self.service.calculate(request)
        assert result.symbol == "TUPRS"
        assert 0 <= result.elite_score <= 100

    def test_calculate_with_dimension_scores(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
            dimension_scores={"momentum": 80.0, "risk": 30.0},
        )
        result = self.service.calculate(request)
        assert result.symbol == "TUPRS"

    def test_calculate_cached(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        r1 = self.service.calculate(request)
        r2 = self.service.calculate(request)
        assert r1.calculation_id == r2.calculation_id

    def test_calculate_list(self):
        symbols = ["TUPRS", "GARAN", "THYAO"]
        scores_map = {
            "TUPRS": {"financial": 70.0},
            "GARAN": {"financial": 60.0},
        }
        results = self.service.calculate_list(symbols, scores_map)
        assert len(results) == 3

    def test_get_history(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        self.service.calculate(request)
        history = self.service.get_history("TUPRS")
        assert len(history) >= 1

    def test_get_trend(self):
        request1 = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        self.service.calculate(request1)
        self.service.clear_cache()
        request2 = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 75.0},
        )
        self.service.calculate(request2)
        trend = self.service.get_trend("TUPRS")
        assert trend is not None

    def test_update_ranking(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        result = self.service.calculate(request)
        entries = self.service.update_ranking([result])
        assert len(entries) == 1

    def test_get_ranking(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        result = self.service.calculate(request)
        self.service.update_ranking([result])
        ranking = self.service.get_ranking()
        assert len(ranking) >= 1

    def test_get_top_n(self):
        results = []
        for i, sym in enumerate(["A", "B", "C"]):
            request = EliteCalculationRequest(
                symbol=sym,
                scores={"financial": float(70 + i * 10)},
            )
            result = self.service.calculate(request)
            results.append(result)
        self.service.update_ranking(results)
        top = self.service.get_top_n(2)
        assert len(top) == 2

    def test_get_profiles(self):
        profiles = self.service.get_profiles()
        assert "balanced" in profiles

    def test_get_weight_config(self):
        config = self.service.get_weight_config()
        assert config.profile_name == "balanced"

    def test_validate_valid(self):
        errors = self.service.validate(scores={"financial": 70.0})
        assert len(errors) == 0

    def test_validate_invalid(self):
        errors = self.service.validate(scores={})
        assert len(errors) > 0

    def test_cache_stats(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        self.service.calculate(request)
        stats = self.service.cache_stats()
        assert stats["size"] >= 1

    def test_clear_cache(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        self.service.calculate(request)
        cleared = self.service.clear_cache()
        assert cleared >= 1

    def test_run_benchmark(self):
        result = self.service.run_benchmark(iterations=3, warmup=1)
        assert result.success is True
        assert result.iterations == 3

    def test_get_details_no_data(self):
        assert self.service.get_details("NONEXIST") is None

    def test_get_details_with_data(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        self.service.calculate(request)
        details = self.service.get_details("TUPRS")
        assert details is not None
        assert details["symbol"] == "TUPRS"
