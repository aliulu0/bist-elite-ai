import pytest
from modules.elite_score_engine.weights.regime import (
    REGIME_ADJUSTMENTS,
    apply_regime_adjustments,
    get_regime_multiplier,
)
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    MarketRegime,
    ScoreDirection,
)


class TestRegimeAdjustments:
    def test_has_five_regimes(self):
        assert len(REGIME_ADJUSTMENTS) == 5

    def test_bull_boosts_momentum(self):
        assert REGIME_ADJUSTMENTS[MarketRegime.BULL][ScoringDimension.MOMENTUM] > 1.0

    def test_bear_boosts_risk(self):
        assert REGIME_ADJUSTMENTS[MarketRegime.BEAR][ScoringDimension.RISK] > 1.0

    def test_bear_reduces_momentum(self):
        assert REGIME_ADJUSTMENTS[MarketRegime.BEAR][ScoringDimension.MOMENTUM] < 1.0

    def test_high_vol_boosts_liquidity(self):
        assert REGIME_ADJUSTMENTS[MarketRegime.HIGH_VOLATILITY][ScoringDimension.LIQUIDITY] > 1.0

    def test_low_vol_boosts_trend(self):
        assert REGIME_ADJUSTMENTS[MarketRegime.LOW_VOLATILITY][ScoringDimension.TREND_QUALITY] > 1.0


class TestApplyRegimeAdjustments:
    def test_basic(self):
        dims = {
            ScoringDimension.MOMENTUM: DimensionWeight(
                dimension=ScoringDimension.MOMENTUM,
                weight=0.1,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_regime_adjustments(dims, MarketRegime.BULL)
        assert result[ScoringDimension.MOMENTUM].weight > 0.1

    def test_clamp_bounds(self):
        dims = {
            ScoringDimension.RISK: DimensionWeight(
                dimension=ScoringDimension.RISK,
                weight=0.25,
                direction=ScoreDirection.LOWER_IS_BETTER,
            )
        }
        result = apply_regime_adjustments(dims, MarketRegime.BEAR)
        assert result[ScoringDimension.RISK].weight <= 0.30
        assert result[ScoringDimension.RISK].weight >= 0.01


class TestGetRegimeMultiplier:
    def test_bull_momentum(self):
        assert get_regime_multiplier(MarketRegime.BULL, ScoringDimension.MOMENTUM) > 1.0

    def test_unknown_dim(self):
        assert get_regime_multiplier(MarketRegime.BULL, ScoringDimension.CONFIDENCE) == 1.0
