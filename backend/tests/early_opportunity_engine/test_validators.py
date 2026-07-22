import pytest
from modules.early_opportunity_engine.validators.opportunity_validator import OpportunityValidator
from modules.early_opportunity_engine.core.types import (
    StageResult, AnalysisCategory, RiskAssessment, MarketRegimeType,
)


class TestOpportunityValidator:
    def setup_method(self):
        self.validator = OpportunityValidator()

    def test_valid_metrics(self):
        errors = self.validator.validate_metrics({"close": 50.0, "volume": 100000})
        assert errors == []

    def test_empty_metrics(self):
        errors = self.validator.validate_metrics({})
        assert len(errors) > 0

    def test_invalid_close(self):
        errors = self.validator.validate_metrics({"close": -10.0})
        assert len(errors) > 0

    def test_invalid_rsi(self):
        errors = self.validator.validate_metrics({"rsi": 150.0})
        assert len(errors) > 0

    def test_non_dict_metrics(self):
        errors = self.validator.validate_metrics("not a dict")
        assert len(errors) > 0

    def test_invalid_volume(self):
        errors = self.validator.validate_metrics({"volume": -100})
        assert len(errors) > 0

    def test_valid_symbol(self):
        assert self.validator.validate_symbol("THYAO") is True

    def test_empty_symbol(self):
        assert self.validator.validate_symbol("") is False

    def test_none_symbol(self):
        assert self.validator.validate_symbol(None) is False

    def test_analyzable_with_data(self):
        ok, msg = self.validator.is_analyzable({"close": 50.0, "rsi": 45.0})
        assert ok is True

    def test_not_analyzable(self):
        ok, msg = self.validator.is_analyzable({})
        assert ok is False

    def test_validate_pipeline_input(self):
        errors = self.validator.validate_pipeline_input("TEST", {"close": 50.0})
        assert errors == []

    def test_validate_pipeline_input_bad_regime(self):
        errors = self.validator.validate_pipeline_input("TEST", {"close": 50.0}, "INVALID")
        assert len(errors) > 0

    def test_validate_stage_result(self):
        sr = StageResult(category=AnalysisCategory.FINANCIAL, score=0.5, signals=[], warnings=[])
        errors = self.validator.validate_stage_result(sr)
        assert errors == []

    def test_validate_stage_result_bad_score(self):
        sr = StageResult(category=AnalysisCategory.FINANCIAL, score=1.5, signals=[], warnings=[])
        errors = self.validator.validate_stage_result(sr)
        assert len(errors) > 0
