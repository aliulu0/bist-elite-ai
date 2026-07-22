import pytest
from modules.elite_score_engine.weights.horizon import (
    HORIZON_MULTIPLIERS,
    apply_horizon_adjustments,
    get_horizon_multiplier,
)
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    InvestmentHorizon,
    ScoreDirection,
)


class TestHorizonMultipliers:
    def test_has_five_horizons(self):
        assert len(HORIZON_MULTIPLIERS) == 5

    def test_weekly_boosts_momentum(self):
        assert HORIZON_MULTIPLIERS[InvestmentHorizon.WEEKLY][ScoringDimension.MOMENTUM] > 1.0

    def test_weekly_reduces_financial(self):
        assert HORIZON_MULTIPLIERS[InvestmentHorizon.WEEKLY][ScoringDimension.FINANCIAL_QUALITY] < 1.0

    def test_monthly_boosts_financial(self):
        assert HORIZON_MULTIPLIERS[InvestmentHorizon.TWELVE_MONTHS][ScoringDimension.FINANCIAL_QUALITY] > 1.0

    def test_monthly_reduces_momentum(self):
        assert HORIZON_MULTIPLIERS[InvestmentHorizon.TWELVE_MONTHS][ScoringDimension.MOMENTUM] < 1.0

    def test_three_months_neutral(self):
        for dim in ScoringDimension:
            assert HORIZON_MULTIPLIERS[InvestmentHorizon.THREE_MONTHS][dim] == 1.0


class TestApplyHorizonAdjustments:
    def test_basic(self):
        dims = {
            ScoringDimension.MOMENTUM: DimensionWeight(
                dimension=ScoringDimension.MOMENTUM,
                weight=0.1,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_horizon_adjustments(dims, InvestmentHorizon.WEEKLY)
        assert result[ScoringDimension.MOMENTUM].weight > 0.1

    def test_clamp_min(self):
        dims = {
            ScoringDimension.FINANCIAL_QUALITY: DimensionWeight(
                dimension=ScoringDimension.FINANCIAL_QUALITY,
                weight=0.01,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_horizon_adjustments(dims, InvestmentHorizon.WEEKLY)
        assert result[ScoringDimension.FINANCIAL_QUALITY].weight >= 0.01

    def test_clamp_max(self):
        dims = {
            ScoringDimension.MOMENTUM: DimensionWeight(
                dimension=ScoringDimension.MOMENTUM,
                weight=0.25,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_horizon_adjustments(dims, InvestmentHorizon.WEEKLY)
        assert result[ScoringDimension.MOMENTUM].weight <= 0.30


class TestGetHorizonMultiplier:
    def test_weekly_momentum(self):
        assert get_horizon_multiplier(InvestmentHorizon.WEEKLY, ScoringDimension.MOMENTUM) > 1.0

    def test_unknown_dim(self):
        assert get_horizon_multiplier(InvestmentHorizon.WEEKLY, ScoringDimension.CONFIDENCE) == 1.0
