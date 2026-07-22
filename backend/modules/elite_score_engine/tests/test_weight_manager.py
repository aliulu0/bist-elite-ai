import pytest
from modules.elite_score_engine.weights.manager import WeightManager, reset_weight_manager
from modules.elite_score_engine.core.types import (
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    EliteWeightConfig,
)


@pytest.fixture(autouse=True)
def fresh_manager():
    reset_weight_manager()
    yield
    reset_weight_manager()


class TestWeightManager:
    def test_singleton(self):
        m1 = WeightManager()
        m2 = WeightManager()
        assert m1 is m2

    def test_get_config_default(self):
        m = WeightManager()
        config = m.get_config()
        assert config.profile_name == "balanced"
        assert config.horizon == InvestmentHorizon.ONE_MONTH

    def test_get_config_conservative(self):
        m = WeightManager()
        config = m.get_config(profile_name="conservative")
        assert config.profile_name == "conservative"

    def test_get_config_cached(self):
        m = WeightManager()
        c1 = m.get_config(profile_name="balanced", horizon=InvestmentHorizon.WEEKLY)
        c2 = m.get_config(profile_name="balanced", horizon=InvestmentHorizon.WEEKLY)
        assert c1 is c2

    def test_set_custom_config(self):
        m = WeightManager()
        config = EliteWeightConfig(
            profile_name="custom_test",
            dimensions={},
        )
        m.set_custom_config("custom_test", config)
        assert "custom_test" in m.list_profiles()

    def test_remove_custom_config(self):
        m = WeightManager()
        config = EliteWeightConfig(profile_name="to_remove", dimensions={})
        m.set_custom_config("to_remove", config)
        assert m.remove_custom_config("to_remove")
        assert "to_remove" not in m.list_profiles()

    def test_remove_default_returns_false(self):
        m = WeightManager()
        assert m.remove_custom_config("balanced") is False

    def test_list_profiles(self):
        m = WeightManager()
        profiles = m.list_profiles()
        assert "balanced" in profiles
        assert "conservative" in profiles
        assert "aggressive" in profiles

    def test_list_horizons(self):
        m = WeightManager()
        horizons = m.list_horizons()
        assert len(horizons) == 5
        assert "weekly" in horizons

    def test_list_regimes(self):
        m = WeightManager()
        regimes = m.list_regimes()
        assert len(regimes) == 5
        assert "bull" in regimes

    def test_list_sectors(self):
        m = WeightManager()
        sectors = m.list_sectors()
        assert len(sectors) == 12
        assert "banks" in sectors

    def test_validate_config_valid(self):
        m = WeightManager()
        config = m.get_config()
        errors = m.validate_config(config)
        assert len(errors) == 0

    def test_validate_config_empty_dims(self):
        m = WeightManager()
        config = EliteWeightConfig(profile_name="empty", dimensions={})
        errors = m.validate_config(config)
        assert any("No dimensions" in e for e in errors)

    def test_validate_config_negative_weight(self):
        from modules.elite_score_engine.core.types import ScoringDimension, DimensionWeight, ScoreDirection
        m = WeightManager()
        config = EliteWeightConfig(
            profile_name="neg",
            dimensions={
                ScoringDimension.MOMENTUM: DimensionWeight(
                    dimension=ScoringDimension.MOMENTUM,
                    weight=-0.1,
                    direction=ScoreDirection.HIGHER_IS_BETTER,
                )
            },
        )
        errors = m.validate_config(config)
        assert any("negative" in e for e in errors)

    def test_validate_config_invalid_range(self):
        from modules.elite_score_engine.core.types import ScoringDimension, DimensionWeight, ScoreDirection
        m = WeightManager()
        config = EliteWeightConfig(
            profile_name="range",
            dimensions={
                ScoringDimension.MOMENTUM: DimensionWeight(
                    dimension=ScoringDimension.MOMENTUM,
                    weight=0.1,
                    direction=ScoreDirection.HIGHER_IS_BETTER,
                    min_value=100.0,
                    max_value=0.0,
                )
            },
        )
        errors = m.validate_config(config)
        assert any("Invalid range" in e for e in errors)

    def test_validate_bonus_negative_points(self):
        from modules.elite_score_engine.core.types import BonusRule, BonusFactor
        m = WeightManager()
        config = EliteWeightConfig(
            profile_name="bonus_neg",
            dimensions={},
            bonus_rules=[BonusRule(factor=BonusFactor.GOLDEN_CROSS, points=-5.0)],
        )
        errors = m.validate_config(config)
        assert any("negative" in e for e in errors)

    def test_validate_penalty_positive_points(self):
        from modules.elite_score_engine.core.types import PenaltyRule, PenaltyFactor
        m = WeightManager()
        config = EliteWeightConfig(
            profile_name="pen_pos",
            dimensions={},
            penalty_rules=[PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=5.0)],
        )
        errors = m.validate_config(config)
        assert any("positive" in e for e in errors)

    def test_horizon_regime_sector_combination(self):
        m = WeightManager()
        config = m.get_config(
            profile_name="balanced",
            horizon=InvestmentHorizon.WEEKLY,
            regime=MarketRegime.BULL,
            sector=SectorType.BANKS,
        )
        assert config.horizon == InvestmentHorizon.WEEKLY
        assert config.regime == MarketRegime.BULL
        assert config.sector == SectorType.BANKS
