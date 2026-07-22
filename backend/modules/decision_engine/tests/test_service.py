import pytest
from modules.decision_engine.services.service import DecisionService
from modules.decision_engine.schemas.schemas import DecisionGenerateRequest, EngineDataSchema


class TestDecisionService:
    def setup_method(self):
        self.service = DecisionService()

    def _make_request(self, symbol="TUPRS", score=72.0):
        return DecisionGenerateRequest(
            symbol=symbol,
            engine_data={
                "unified_scoring": EngineDataSchema(score=score, confidence=80.0, signals={"financial": 75.0}),
                "elite_score": EngineDataSchema(score=score, confidence=75.0, signals={"trend": 70.0, "momentum": 65.0}),
                "confidence": EngineDataSchema(score=score, confidence=70.0, signals={"risk": 60.0, "market": 68.0}),
            },
        )

    def test_generate_decision(self):
        result = self.service.generate_decision(self._make_request())
        assert result.symbol == "TUPRS"
        assert 0 <= result.decision_score <= 100

    def test_get_decision(self):
        self.service.generate_decision(self._make_request())
        result = self.service.get_decision("TUPRS")
        assert result is not None
        assert result.symbol == "TUPRS"

    def test_get_decision_miss(self):
        assert self.service.get_decision("NONEXISTENT") is None

    def test_list_decisions(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        self.service.generate_decision(self._make_request("GARAN"))
        results = self.service.list_decisions()
        assert len(results) == 2

    def test_top_decisions(self):
        self.service.generate_decision(self._make_request("TUPRS", 90.0))
        self.service.generate_decision(self._make_request("GARAN", 50.0))
        top = self.service.get_top_decisions(1)
        assert len(top) == 1
        assert top[0].symbol == "TUPRS"

    def test_history(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        history = self.service.get_history("TUPRS")
        assert len(history) == 1

    def test_report(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        report = self.service.generate_report("TUPRS", "executive")
        assert "content" in report
        assert "TUPRS" in report["content"]

    def test_report_missing(self):
        report = self.service.generate_report("NONEXISTENT", "executive")
        assert "error" in report

    def test_cache(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        stats = self.service.cache_stats()
        assert stats["hits"] >= 0

    def test_clear_cache(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        cleared = self.service.clear_cache()
        assert cleared >= 0

    def test_health(self):
        health = self.service.health_check()
        assert health.status == "healthy"
        assert health.version == "1.0.0"

    def test_benchmark(self):
        result = self.service.run_benchmark(iterations=3)
        assert result.success is True
        assert result.iterations == 3

    def test_result_to_response(self):
        result = self.service.generate_decision(self._make_request())
        response = self.service.result_to_response(result)
        assert response.symbol == "TUPRS"
        assert response.decision_score >= 0
        assert response.entry is not None
        assert response.exit is not None

    def test_caching_works(self):
        req = self._make_request("TUPRS")
        self.service.generate_decision(req)
        stats_after_first = self.service.cache_stats()
        self.service.generate_decision(req)
        stats_after_second = self.service.cache_stats()
        assert stats_after_second["hits"] > stats_after_first["hits"]

    def test_multiple_reports(self):
        self.service.generate_decision(self._make_request("TUPRS"))
        for rtype in ("executive", "detailed", "evidence", "risk_analysis", "timeline"):
            report = self.service.generate_report("TUPRS", rtype)
            assert "content" in report
