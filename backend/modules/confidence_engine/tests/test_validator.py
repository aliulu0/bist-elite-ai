import pytest
from modules.confidence_engine.validators.validator import ConfidenceValidator
from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    ConfidenceWeightConfig,
    ConfidenceResult,
    ConfidenceLabel,
)
from modules.confidence_engine.profiles.profiles import get_profile_weights


class TestConfidenceValidator:
    def setup_method(self):
        self.validator = ConfidenceValidator()

    def test_validate_input_data_valid(self):
        errors = self.validator.validate_input_data({"financial": 70.0})
        assert len(errors) == 0

    def test_validate_input_data_empty(self):
        errors = self.validator.validate_input_data({})
        assert len(errors) > 0

    def test_validate_config_valid(self):
        config = get_profile_weights("standard")
        errors = self.validator.validate_config(config)
        assert len(errors) == 0

    def test_validate_config_empty(self):
        config = ConfidenceWeightConfig(profile_name="empty", dimensions={})
        errors = self.validator.validate_config(config)
        assert len(errors) > 0

    def test_validate_result_valid(self):
        result = ConfidenceResult(
            symbol="TUPRS",
            confidence_score=75.0,
            confidence_label=ConfidenceLabel.HIGH,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            warnings=[],
            raw_score=70.0,
            total_weight=1.0,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) == 0

    def test_validate_result_wrong_label(self):
        result = ConfidenceResult(
            symbol="TUPRS",
            confidence_score=50.0,
            confidence_label=ConfidenceLabel.EXCEPTIONAL,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            warnings=[],
            raw_score=50.0,
            total_weight=1.0,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) > 0

    def test_validate_result_out_of_range(self):
        result = ConfidenceResult(
            symbol="TUPRS",
            confidence_score=150.0,
            confidence_label=ConfidenceLabel.EXCEPTIONAL,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            warnings=[],
            raw_score=150.0,
            total_weight=1.0,
        )
        errors = self.validator.validate_result(result)
        assert any("outside" in e for e in errors)

    def test_is_valid_true(self):
        result = ConfidenceResult(
            symbol="TUPRS",
            confidence_score=75.0,
            confidence_label=ConfidenceLabel.HIGH,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            warnings=[],
            raw_score=70.0,
            total_weight=1.0,
        )
        assert self.validator.is_valid(result) is True
