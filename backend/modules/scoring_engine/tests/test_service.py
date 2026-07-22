from modules.scoring_engine.services.service import ScoringService
from modules.scoring_engine.schemas.schemas import (
    CalculateScoreRequest, OptimizationRequest, ValidateRequest,
)


class TestScoringService:
    def setup_method(self):
        self.service = ScoringService()

    def test_calculate(self):
        req = CalculateScoreRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0, "roe": 12.0, "rsi": 45.0},
        )
        resp = self.service.calculate(req)
        assert resp.symbol == "TEST"
        assert resp.composite_score > 0
        assert len(resp.scores) > 0
        assert resp.timestamp != ""

    def test_calculate_caching(self):
        req = CalculateScoreRequest(
            symbol="CACHE_TEST", metrics={"pe_ratio": 15.0},
        )
        resp1 = self.service.calculate(req)
        resp2 = self.service.calculate(req)
        assert resp1.composite_score == resp2.composite_score

    def test_calculate_specific_types(self):
        req = CalculateScoreRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0},
            score_types=["financial", "value"],
        )
        resp = self.service.calculate(req)
        assert "financial" in resp.scores

    def test_calculate_profiles(self):
        for profile in ["balanced", "aggressive", "conservative"]:
            req = CalculateScoreRequest(
                symbol="TEST", metrics={"pe_ratio": 15.0}, profile=profile,
            )
            resp = self.service.calculate(req)
            assert resp.profile == profile

    def test_get_list(self):
        results = self.service.get_list(["T1", "T2"])
        assert len(results) == 2

    def test_get_details(self):
        resp = self.service.get_details(
            "TEST", "financial", {"pe_ratio": 15.0},
        )
        assert resp.symbol == "TEST"
        assert resp.score_type == "financial"

    def test_get_history(self):
        self.service.calculate(CalculateScoreRequest(symbol="HIST", metrics={"pe_ratio": 15.0}))
        history = self.service.get_history("HIST")
        assert history.total >= 1

    def test_get_weights(self):
        resp = self.service.get_weights()
        assert len(resp.weights) > 0
        assert resp.profile == "balanced"

    def test_get_profiles(self):
        resp = self.service.get_profiles()
        assert resp.total >= 5

    def test_optimize(self):
        req = OptimizationRequest(iterations=10)
        resp = self.service.optimize(req)
        assert resp.iterations == 10
        assert len(resp.original_weights) > 0

    def test_validate_valid(self):
        resp = self.service.validate(ValidateRequest(symbol="TEST", metrics={"pe": 15}))
        assert resp.valid is True

    def test_validate_invalid(self):
        resp = self.service.validate(ValidateRequest(symbol="TEST", metrics={}))
        assert resp.valid is False

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert stats.size >= 0

    def test_clear_cache(self):
        self.service.calculate(CalculateScoreRequest(symbol="CLR", metrics={"pe_ratio": 15.0}))
        count = self.service.clear_cache()
        assert count >= 0

    def test_turkish_regime(self):
        req = CalculateScoreRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0},
            regime="bull",
        )
        resp = self.service.calculate(req)
        assert resp.regime == "bull"

    def test_weekly_horizon(self):
        req = CalculateScoreRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0, "rsi": 30.0},
            horizon="weekly",
        )
        resp = self.service.calculate(req)
        assert resp.horizon == "weekly"
