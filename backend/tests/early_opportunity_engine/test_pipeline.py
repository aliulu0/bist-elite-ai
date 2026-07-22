import pytest
from modules.early_opportunity_engine.pipeline.opportunity_pipeline import OpportunityPipeline
from modules.early_opportunity_engine.core.types import (
    OpportunityStage, OpportunityRating, MarketRegimeType,
)


class TestOpportunityPipeline:
    def setup_method(self):
        self.pipeline = OpportunityPipeline()

    def test_stages_loaded(self):
        assert len(self.pipeline.stages) == 7

    def test_analyze_strong(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.symbol == "TEST"
        assert 0 <= result.opportunity_score <= 100
        assert isinstance(result.stage, OpportunityStage)
        assert isinstance(result.rating, OpportunityRating)
        assert result.confidence >= 0.0
        assert len(result.stage_results) == 7

    def test_analyze_weak(self, weak_metrics):
        result = self.pipeline.analyze("WEAK", weak_metrics)
        assert result.symbol == "WEAK"
        assert result.opportunity_score < 60

    def test_analyze_empty(self, empty_metrics):
        result = self.pipeline.analyze("EMPTY", empty_metrics)
        assert result.opportunity_score == 0.0
        assert result.stage == OpportunityStage.STAGE_0_IGNORE
        assert result.rating == OpportunityRating.VERY_LOW

    def test_analyze_minimal(self, minimal_metrics):
        result = self.pipeline.analyze("MIN", minimal_metrics)
        assert result.opportunity_score >= 0.0

    def test_explicit_regime(self, strong_metrics):
        result = self.pipeline.analyze(
            "TEST", strong_metrics, market_regime=MarketRegimeType.BULL,
        )
        assert result.market_regime == MarketRegimeType.BULL

    def test_has_expected_return(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.expected_return.conservative >= 0.0
        assert result.expected_return.optimistic >= result.expected_return.expected

    def test_has_risk(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.risk.score >= 0.0

    def test_has_evidence(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.evidence is not None

    def test_has_similarity(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.similarity is not None

    def test_has_explanations(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert len(result.explanations) > 0

    def test_has_timestamp(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert result.timestamp != ""

    def test_weak_gets_red_flags(self, weak_metrics):
        result = self.pipeline.analyze("WEAK", weak_metrics)
        assert len(result.red_flags) > 0

    def test_strong_minimal_red_flags(self, strong_metrics):
        result = self.pipeline.analyze("TEST", strong_metrics)
        assert isinstance(result.red_flags, list)
