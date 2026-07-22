from modules.explainability_engine.services.service import ExplanationService
from modules.explainability_engine.schemas.schemas import (
    GenerateExplanationRequest, GenerateComprehensiveRequest,
    ValidateExplanationRequest,
)


class TestExplanationService:
    def setup_method(self):
        self.service = ExplanationService()

    def test_generate(self):
        req = GenerateExplanationRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0},
            explanation_type="fundamental",
        )
        resp = self.service.generate(req)
        assert resp.result.symbol == "TEST"
        assert resp.result.explanation_type == "fundamental"

    def test_generate_caching(self):
        req = GenerateExplanationRequest(
            symbol="CACHED", metrics={"pe_ratio": 15.0},
            explanation_type="fundamental",
        )
        resp1 = self.service.generate(req)
        resp2 = self.service.generate(req)
        assert resp1.result.symbol == resp2.result.symbol

    def test_generate_comprehensive(self):
        req = GenerateComprehensiveRequest(
            symbol="TEST",
            metrics={"pe_ratio": 15.0, "rsi": 45.0},
        )
        resp = self.service.generate_comprehensive(req)
        assert resp.result.symbol == "TEST"
        assert len(resp.result.sections) > 0

    def test_generate_comprehensive_with_types(self):
        req = GenerateComprehensiveRequest(
            symbol="TEST",
            metrics={"pe_ratio": 15.0, "rsi": 45.0, "volume_ratio": 1.0},
            explanation_types=["fundamental", "technical"],
        )
        resp = self.service.generate_comprehensive(req)
        assert resp.result.symbol == "TEST"

    def test_get_summary(self):
        resp = self.service.get_summary("TEST", {"pe_ratio": 15.0}, "fundamental")
        assert resp.symbol == "TEST"
        assert resp.explanation_type == "fundamental"
        assert resp.evidence_count > 0

    def test_get_history(self):
        self.service.generate(GenerateExplanationRequest(
            symbol="T1", metrics={"pe_ratio": 15.0}, explanation_type="fundamental",
        ))
        history = self.service.get_history()
        assert history.total >= 1

    def test_validate_valid(self):
        req = ValidateExplanationRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0}, explanation_type="fundamental",
        )
        resp = self.service.validate(req)
        assert resp.valid is True
        assert resp.evidence_count > 0

    def test_validate_invalid(self):
        req = ValidateExplanationRequest(
            symbol="", metrics={}, explanation_type="fundamental",
        )
        resp = self.service.validate(req)
        assert resp.valid is False

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert stats.size >= 0
        assert stats.hits >= 0

    def test_clear_cache(self):
        self.service.generate(GenerateExplanationRequest(
            symbol="CLR", metrics={"pe_ratio": 15.0}, explanation_type="fundamental",
        ))
        count = self.service.clear_cache()
        assert count >= 0

    def test_get_templates(self):
        templates = self.service.get_templates()
        assert len(templates) > 0

    def test_get_localization_keys(self):
        keys = self.service.get_localization_keys("en")
        assert len(keys) > 0

    def test_run_benchmark(self):
        resp = self.service.run_benchmark(iterations=10)
        assert resp.iterations == 10
        assert resp.avg_ms >= 0

    def test_generate_turkish(self):
        req = GenerateExplanationRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0},
            explanation_type="fundamental", language="tr",
        )
        resp = self.service.generate(req)
        assert resp.result.language == "tr"

    def test_generate_expert_level(self):
        req = GenerateExplanationRequest(
            symbol="TEST", metrics={"pe_ratio": 15.0, "roe": 12.0},
            explanation_type="fundamental", level="expert",
        )
        resp = self.service.generate(req)
        assert resp.result.level == "expert"
