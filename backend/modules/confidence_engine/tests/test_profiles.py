import pytest
from modules.confidence_engine.profiles.profiles import (
    DEFAULT_PROFILES,
    get_profile_weights,
    STANDARD_DIMENSIONS,
    CONSERVATIVE_DIMENSIONS,
    AGGRESSIVE_DIMENSIONS,
)
from modules.confidence_engine.core.types import ConfidenceDimension


class TestDefaultProfiles:
    def test_has_three_profiles(self):
        assert len(DEFAULT_PROFILES) == 3

    def test_has_standard(self):
        assert "standard" in DEFAULT_PROFILES

    def test_has_conservative(self):
        assert "conservative" in DEFAULT_PROFILES

    def test_has_aggressive(self):
        assert "aggressive" in DEFAULT_PROFILES

    def test_standard_dimensions_count(self):
        assert len(STANDARD_DIMENSIONS) == 11

    def test_conservative_dimensions_count(self):
        assert len(CONSERVATIVE_DIMENSIONS) == 11

    def test_aggressive_dimensions_count(self):
        assert len(AGGRESSIVE_DIMENSIONS) == 11


class TestGetProfileWeights:
    def test_get_standard(self):
        config = get_profile_weights("standard")
        assert config.profile_name == "standard"

    def test_get_conservative(self):
        config = get_profile_weights("conservative")
        assert config.profile_name == "conservative"

    def test_get_aggressive(self):
        config = get_profile_weights("aggressive")
        assert config.profile_name == "aggressive"

    def test_unknown_returns_standard(self):
        config = get_profile_weights("unknown")
        assert config.profile_name == "standard"

    def test_bonus_rules(self):
        config = get_profile_weights("standard")
        assert len(config.bonus_rules) > 0

    def test_penalty_rules(self):
        config = get_profile_weights("standard")
        assert len(config.penalty_rules) > 0
