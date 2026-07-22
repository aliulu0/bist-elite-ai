import pytest
from modules.elite_score_engine.validators.validator import EliteValidator
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    EliteWeightConfig,
    EliteScoreResult,
    EliteCategory,
    EliteLabel,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
)
from modules.elite_score_engine.weights.profiles import get_profile_weights


class TestEliteValidator:
    def setup_method(self):
        self.validator = EliteValidator()

    def test_validate_input_scores_valid(self):
        errors = self.validator.validate_input_scores({"financial": 70.0, "momentum": 65.0})
        assert len(errors) == 0

    def test_validate_input_scores_empty(self):
        errors = self.validator.validate_input_scores({})
        assert len(errors) > 0

    def test_validate_input_scores_non_numeric(self):
        errors = self.validator.validate_input_scores({"financial": "bad"})
        assert len(errors) > 0

    def test_validate_input_scores_out_of_range(self):
        errors = self.validator.validate_input_scores({"financial": 300.0})
        assert len(errors) > 0

    def test_validate_dimension_scores_valid(self):
        errors = self.validator.validate_dimension_scores(
            {ScoringDimension.MOMENTUM: 50.0, ScoringDimension.RISK: 30.0}
        )
        assert len(errors) == 0

    def test_validate_dimension_scores_empty(self):
        errors = self.validator.validate_dimension_scores({})
        assert len(errors) > 0

    def test_validate_config_valid(self):
        config = get_profile_weights("balanced")
        errors = self.validator.validate_config(config)
        assert len(errors) == 0

    def test_validate_config_empty(self):
        config = EliteWeightConfig(profile_name="empty", dimensions={})
        errors = self.validator.validate_config(config)
        assert len(errors) > 0

    def test_validate_result_valid(self):
        result = EliteScoreResult(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category=EliteCategory.GOOD,
            label=EliteLabel.EARLY_OPPORTUNITY,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=70.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            sector=SectorType.OTHER,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) == 0

    def test_validate_result_wrong_category(self):
        result = EliteScoreResult(
            symbol="TUPRS",
            elite_score=50.0,
            elite_category=EliteCategory.EXCEPTIONAL,
            label=EliteLabel.HIGH_CONVICTION,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=50.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            sector=SectorType.OTHER,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) > 0

    def test_validate_result_out_of_range(self):
        result = EliteScoreResult(
            symbol="TUPRS",
            elite_score=150.0,
            elite_category=EliteCategory.EXCEPTIONAL,
            label=EliteLabel.HIGH_CONVICTION,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=150.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            sector=SectorType.OTHER,
        )
        errors = self.validator.validate_result(result)
        assert any("outside" in e for e in errors)

    def test_is_valid_true(self):
        result = EliteScoreResult(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category=EliteCategory.GOOD,
            label=EliteLabel.EARLY_OPPORTUNITY,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=70.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            sector=SectorType.OTHER,
        )
        assert self.validator.is_valid(result) is True
