import pytest
from modules.elite_score_engine.weights.profiles import (
    DEFAULT_PROFILES,
    get_profile_weights,
    build_dimension_weights,
    CONSERVATIVE_DIMENSIONS,
    BALANCED_DIMENSIONS,
    AGGRESSIVE_DIMENSIONS,
)
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    ScoreDirection,
    EliteWeightConfig,
)


class TestDefaultProfiles:
    def test_has_three_profiles(self):
        assert len(DEFAULT_PROFILES) == 3

    def test_has_conservative(self):
        assert "conservative" in DEFAULT_PROFILES

    def test_has_balanced(self):
        assert "balanced" in DEFAULT_PROFILES

    def test_has_aggressive(self):
        assert "aggressive" in DEFAULT_PROFILES

    def test_conservative_profile(self):
        p = DEFAULT_PROFILES["conservative"]
        assert p.profile_name == "conservative"
        assert len(p.dimensions) == 17

    def test_balanced_profile(self):
        p = DEFAULT_PROFILES["balanced"]
        assert p.profile_name == "balanced"
        assert len(p.dimensions) == 17

    def test_aggressive_profile(self):
        p = DEFAULT_PROFILES["aggressive"]
        assert p.profile_name == "aggressive"
        assert len(p.dimensions) == 17

    def test_conservative_weights_sum(self):
        total = sum(dw.weight for dw in CONSERVATIVE_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.15

    def test_balanced_weights_sum(self):
        total = sum(dw.weight for dw in BALANCED_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.15

    def test_aggressive_weights_sum(self):
        total = sum(dw.weight for dw in AGGRESSIVE_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.15


class TestGetProfileWeights:
    def test_get_conservative(self):
        config = get_profile_weights("conservative")
        assert config.profile_name == "conservative"

    def test_get_balanced(self):
        config = get_profile_weights("balanced")
        assert config.profile_name == "balanced"

    def test_get_aggressive(self):
        config = get_profile_weights("aggressive")
        assert config.profile_name == "aggressive"

    def test_unknown_returns_balanced(self):
        config = get_profile_weights("unknown")
        assert config.profile_name == "balanced"

    def test_bonus_rules(self):
        config = get_profile_weights("balanced")
        assert len(config.bonus_rules) > 0

    def test_penalty_rules(self):
        config = get_profile_weights("balanced")
        assert len(config.penalty_rules) > 0


class TestBuildDimensionWeights:
    def test_basic(self):
        config = get_profile_weights("balanced")
        scores = {dim: 50.0 for dim in ScoringDimension}
        result = build_dimension_weights(scores, config)
        assert len(result) == 17
        for dim, val in result.items():
            dw = config.dimensions[dim]
            if dw.direction == ScoreDirection.LOWER_IS_BETTER:
                assert val == pytest.approx(50.0 * dw.weight)
            else:
                assert val == pytest.approx(50.0 * dw.weight)

    def test_missing_score_zero(self):
        config = get_profile_weights("balanced")
        result = build_dimension_weights({}, config)
        for dim, val in result.items():
            dw = config.dimensions[dim]
            if dw.direction == ScoreDirection.LOWER_IS_BETTER:
                assert val == pytest.approx(100.0 * dw.weight)
            else:
                assert val == 0.0

    def test_lower_is_better(self):
        config = get_profile_weights("balanced")
        scores = {ScoringDimension.RISK: 80.0}
        result = build_dimension_weights(scores, config)
        risk_val = result[ScoringDimension.RISK]
        assert risk_val == 20.0 * config.dimensions[ScoringDimension.RISK].weight

    def test_clamp_max(self):
        config = get_profile_weights("balanced")
        scores = {ScoringDimension.MOMENTUM: 150.0}
        result = build_dimension_weights(scores, config)
        assert result[ScoringDimension.MOMENTUM] <= 100.0 * config.dimensions[ScoringDimension.MOMENTUM].weight

    def test_clamp_min(self):
        config = get_profile_weights("balanced")
        scores = {ScoringDimension.MOMENTUM: -10.0}
        result = build_dimension_weights(scores, config)
        assert result[ScoringDimension.MOMENTUM] >= 0.0
