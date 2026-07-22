from modules.scoring_engine.validators.validator import ScoringValidator
from modules.scoring_engine.core.types import (
    ScoreType, ScoreResult, WeightConfig, WeightProfile,
    InvestmentHorizon, MarketRegime, ScoreBreakdown, ScoreDirection,
)


class TestScoringValidator:
    def setup_method(self):
        self.validator = ScoringValidator()

    def test_validate_metrics_valid(self):
        assert len(self.validator.validate_metrics({"pe": 15})) == 0

    def test_validate_metrics_empty(self):
        assert len(self.validator.validate_metrics({})) > 0

    def test_validate_weights_valid(self):
        errors = self.validator.validate_weights({ScoreType.FINANCIAL: 0.5, ScoreType.MOMENTUM: 0.5})
        assert len(errors) == 0

    def test_validate_weights_empty(self):
        assert len(self.validator.validate_weights({})) > 0

    def test_validate_weights_negative(self):
        assert len(self.validator.validate_weights({ScoreType.FINANCIAL: -0.1})) > 0

    def test_validate_result_valid(self):
        result = ScoreResult(symbol="TEST", scores={"financial": 75.0})
        assert len(self.validator.validate_result(result)) == 0

    def test_validate_result_no_symbol(self):
        result = ScoreResult(symbol="", scores={"financial": 75.0})
        assert len(self.validator.validate_result(result)) > 0

    def test_validate_result_no_scores(self):
        result = ScoreResult(symbol="TEST")
        assert len(self.validator.validate_result(result)) > 0

    def test_validate_result_out_of_range(self):
        result = ScoreResult(symbol="TEST", scores={"financial": 150.0})
        assert len(self.validator.validate_result(result)) > 0

    def test_validate_breakdown(self):
        bd = ScoreBreakdown(
            score_type=ScoreType.FINANCIAL, raw_score=80.0,
            normalized_score=80.0, weight=0.5, contribution=40.0,
            penalty=0.0, bonus=0.0, final_contribution=40.0,
        )
        assert len(self.validator.validate_breakdown(bd)) == 0

    def test_validate_breakdown_invalid(self):
        bd = ScoreBreakdown(
            score_type=ScoreType.FINANCIAL, raw_score=80.0,
            normalized_score=150.0, weight=0.5, contribution=40.0,
            penalty=0.0, bonus=0.0, final_contribution=40.0,
        )
        assert len(self.validator.validate_breakdown(bd)) > 0

    def test_validate_config(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            weights={
                ScoreType.FINANCIAL: ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.5),
                ScoreType.MOMENTUM: ScoreWeight(score_type=ScoreType.MOMENTUM, weight=0.5),
            },
        )
        assert len(self.validator.validate_config(config)) == 0

    def test_is_valid(self):
        result = ScoreResult(symbol="TEST", scores={"financial": 75.0})
        assert self.validator.is_valid(result) is True

    def test_is_invalid(self):
        result = ScoreResult(symbol="")
        assert self.validator.is_valid(result) is False


from modules.scoring_engine.core.types import ScoreWeight
