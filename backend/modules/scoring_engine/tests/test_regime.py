from modules.scoring_engine.weights.regime import apply_regime_adjustments, REGIME_ADJUSTMENTS
from modules.scoring_engine.weights.profiles import build_score_weights
from modules.scoring_engine.core.types import ScoreType, WeightProfile, MarketRegime


class TestRegime:
    def test_all_regimes_have_adjustments(self):
        for r in MarketRegime:
            assert r in REGIME_ADJUSTMENTS

    def test_bull_boosts_momentum(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_regime_adjustments(base, MarketRegime.BULL)
        assert adjusted[ScoreType.MOMENTUM].weight > base[ScoreType.MOMENTUM].weight

    def test_bear_boosts_risk(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_regime_adjustments(base, MarketRegime.BEAR)
        assert adjusted[ScoreType.RISK].weight > base[ScoreType.RISK].weight

    def test_weights_renormalized(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_regime_adjustments(base, MarketRegime.BULL)
        total = sum(sw.weight for sw in adjusted.values())
        assert abs(total - 1.0) < 0.01

    def test_high_volatility_boosts_risk(self):
        base = build_score_weights(WeightProfile.BALANCED)
        adjusted = apply_regime_adjustments(base, MarketRegime.HIGH_VOLATILITY)
        assert adjusted[ScoreType.RISK].weight > base[ScoreType.RISK].weight
