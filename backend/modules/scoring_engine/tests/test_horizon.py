from modules.scoring_engine.weights.horizon import apply_horizon_adjustments, HORIZON_MULTIPLIERS
from modules.scoring_engine.weights.profiles import build_score_weights
from modules.scoring_engine.core.types import ScoreType, WeightProfile, InvestmentHorizon, ScoreWeight


class TestHorizon:
    def test_all_horizons_have_multipliers(self):
        for h in InvestmentHorizon:
            assert h in HORIZON_MULTIPLIERS, f"No multipliers for {h}"

    def test_weekly_boosts_momentum(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_horizon_adjustments(base, InvestmentHorizon.WEEKLY)
        assert adjusted[ScoreType.MOMENTUM].weight > base[ScoreType.MOMENTUM].weight

    def test_yearly_boosts_financial(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_horizon_adjustments(base, InvestmentHorizon.TWELVE_MONTHS)
        assert adjusted[ScoreType.FINANCIAL].weight > base[ScoreType.FINANCIAL].weight

    def test_weights_renormalized(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_horizon_adjustments(base, InvestmentHorizon.WEEKLY)
        total = sum(sw.weight for sw in adjusted.values())
        assert abs(total - 1.0) < 0.01

    def test_preserves_non_adjusted(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_horizon_adjustments(base, InvestmentHorizon.ONE_MONTH)
        for st in base:
            if st not in HORIZON_MULTIPLIERS.get(InvestmentHorizon.ONE_MONTH, {}):
                assert abs(adjusted[st].weight - base[st].weight) < 0.01
