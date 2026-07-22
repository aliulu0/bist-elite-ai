import pytest
from modules.decision_engine.decision_profiles.profiles import (
    DEFAULT_PROFILES,
    get_profile_weights,
    CONSERVATIVE_DIMENSIONS,
    BALANCED_DIMENSIONS,
    AGGRESSIVE_DIMENSIONS,
)
from modules.decision_engine.core.types import DecisionDimension


class TestDecisionWeightProfiles:
    def test_has_three_profiles(self):
        assert len(DEFAULT_PROFILES) == 3

    def test_conservative(self):
        p = DEFAULT_PROFILES["conservative"]
        assert p.name == "conservative"
        assert p.risk_tolerance == 30.0
        assert len(p.dimension_weights) == 13

    def test_balanced(self):
        p = DEFAULT_PROFILES["balanced"]
        assert p.name == "balanced"
        assert p.risk_tolerance == 50.0

    def test_aggressive(self):
        p = DEFAULT_PROFILES["aggressive"]
        assert p.name == "aggressive"
        assert p.risk_tolerance == 75.0

    def test_conservative_weights_sum(self):
        total = sum(CONSERVATIVE_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.01

    def test_balanced_weights_sum(self):
        total = sum(BALANCED_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.01

    def test_aggressive_weights_sum(self):
        total = sum(AGGRESSIVE_DIMENSIONS.values())
        assert abs(total - 1.0) < 0.01


class TestGetProfileWeights:
    def test_get_balanced(self):
        p = get_profile_weights("balanced")
        assert p.name == "balanced"

    def test_get_unknown(self):
        p = get_profile_weights("unknown")
        assert p.name == "balanced"

    def test_get_conservative(self):
        p = get_profile_weights("conservative")
        assert p.name == "conservative"

    def test_get_aggressive(self):
        p = get_profile_weights("aggressive")
        assert p.name == "aggressive"

    def test_all_dimensions_covered(self):
        p = get_profile_weights("balanced")
        for dim in DecisionDimension:
            assert dim in p.dimension_weights
