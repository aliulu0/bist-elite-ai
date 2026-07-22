from modules.scoring_engine.weights.manager import WeightManager, get_weight_manager, reset_weight_manager
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime, PenaltyRule,
)


class TestWeightManager:
    def setup_method(self):
        reset_weight_manager()
        self.mgr = get_weight_manager()

    def test_singleton(self):
        assert get_weight_manager() is get_weight_manager()

    def test_get_config(self):
        config = self.mgr.get_config()
        assert config.profile == WeightProfile.BALANCED
        assert len(config.weights) > 0

    def test_different_profiles_different_configs(self):
        bal = self.mgr.get_config(WeightProfile.BALANCED)
        agg = self.mgr.get_config(WeightProfile.AGGRESSIVE)
        assert bal.weights[ScoreType.MOMENTUM].weight != agg.weights[ScoreType.MOMENTUM].weight

    def test_effective_weights(self):
        weights = self.mgr.get_effective_weights()
        assert len(weights) > 0
        total = sum(sw.weight for sw in weights.values())
        assert abs(total - 1.0) < 0.01

    def test_set_custom_weights(self):
        custom = {st: 1.0 / len(ScoreType) for st in ScoreType}
        self.mgr.set_custom_weights(WeightProfile.CUSTOM, custom)
        weights = self.mgr.get_effective_weights(profile=WeightProfile.CUSTOM)
        assert len(weights) > 0

    def test_add_penalty_rule(self):
        rule = PenaltyRule(name="test", condition="x", penalty_factor=0.2)
        self.mgr.add_penalty_rule(rule)
        assert len(self.mgr.get_penalty_rules()) >= 1

    def test_list_profiles(self):
        assert len(self.mgr.list_profiles()) == 6

    def test_list_horizons(self):
        assert len(self.mgr.list_horizons()) == 5

    def test_list_regimes(self):
        assert len(self.mgr.list_regimes()) == 5

    def test_validate_weights_valid(self):
        errors = self.mgr.validate_weights({ScoreType.FINANCIAL: 0.5, ScoreType.MOMENTUM: 0.5})
        assert len(errors) == 0

    def test_validate_weights_empty(self):
        errors = self.mgr.validate_weights({})
        assert len(errors) > 0

    def test_validate_weights_negative(self):
        errors = self.mgr.validate_weights({ScoreType.FINANCIAL: -0.1})
        assert len(errors) > 0

    def test_reset(self):
        self.mgr.add_penalty_rule(PenaltyRule(name="t", condition="c", penalty_factor=0.1))
        self.mgr.reset()
        assert len(self.mgr.get_penalty_rules()) == 0

    def test_horizon_regime_combination(self):
        config = self.mgr.get_config(WeightProfile.AGGRESSIVE, InvestmentHorizon.WEEKLY, MarketRegime.BULL)
        assert config.profile == WeightProfile.AGGRESSIVE
        assert config.horizon == InvestmentHorizon.WEEKLY
        assert config.regime == MarketRegime.BULL
