import pytest
from modules.early_opportunity_engine.services.opportunity_service import OpportunityService
from modules.early_opportunity_engine.schemas.opportunity_schemas import (
    AnalyzeRequest, BatchAnalyzeRequest, ValidateRequest,
)


class TestOpportunityService:
    def setup_method(self):
        self.service = OpportunityService()

    def test_analyze(self):
        req = AnalyzeRequest(symbol="TEST", metrics={"close": 50.0, "rsi": 35.0, "volume": 1000000})
        resp = self.service.analyze(req)
        assert resp.result.symbol == "TEST"
        assert 0 <= resp.result.opportunity_score <= 100

    def test_analyze_cached(self):
        req = AnalyzeRequest(symbol="CACHED", metrics={"close": 50.0})
        r1 = self.service.analyze(req)
        r2 = self.service.analyze(req)
        assert r1.result.opportunity_score == r2.result.opportunity_score

    def test_batch_analyze(self):
        req = BatchAnalyzeRequest(
            symbols=["A", "B"],
            metrics={"A": {"close": 50.0}, "B": {"close": 30.0}},
        )
        resp = self.service.batch_analyze(req)
        assert resp.count == 2

    def test_batch_limit(self):
        req = BatchAnalyzeRequest(
            symbols=[f"S{i}" for i in range(20)],
            metrics={f"S{i}": {"close": float(i)} for i in range(20)},
            limit=5,
        )
        resp = self.service.batch_analyze(req)
        assert resp.count == 5

    def test_validate_valid(self):
        req = ValidateRequest(metrics={"close": 50.0, "volume": 100000})
        resp = self.service.validate(req)
        assert resp.valid is True

    def test_validate_invalid(self):
        req = ValidateRequest(metrics={})
        resp = self.service.validate(req)
        assert resp.valid is False

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert stats.size >= 0

    def test_clear_cache(self):
        self.service.analyze(AnalyzeRequest(symbol="X", metrics={"close": 50.0}))
        count = self.service.clear_cache()
        assert count >= 1

    def test_history(self):
        self.service.analyze(AnalyzeRequest(symbol="H", metrics={"close": 50.0}))
        hist = self.service.get_history()
        assert hist.total >= 1

    def test_get_top_empty(self):
        resp = self.service.get_top([])
        assert resp.total == 0

    def test_get_detail_empty(self):
        resp = self.service.get_detail([], "NONE")
        assert resp is None

    def test_get_summary_empty(self):
        resp = self.service.get_summary([])
        assert resp.total == 0
