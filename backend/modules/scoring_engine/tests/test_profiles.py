from modules.scoring_engine.weights.profiles import get_profile_weights, build_score_weights, DEFAULT_PROFILES
from modules.scoring_engine.core.types import ScoreType, WeightProfile


class TestProfiles:
    def test_all_profiles_have_weights(self):
        for profile in WeightProfile:
            if profile == WeightProfile.CUSTOM:
                continue
            weights = get_profile_weights(profile)
            assert len(weights) > 0, f"No weights for {profile}"

    def test_balanced_weights_sum(self):
        weights = get_profile_weights(WeightProfile.BALANCED)
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.01

    def test_conservative_favors_quality(self):
        conservative = get_profile_weights(WeightProfile.CONSERVATIVE)
        aggressive = get_profile_weights(WeightProfile.AGGRESSIVE)
        assert conservative.get(ScoreType.QUALITY, 0) > aggressive.get(ScoreType.QUALITY, 0)

    def test_aggressive_favors_momentum(self):
        aggressive = get_profile_weights(WeightProfile.AGGRESSIVE)
        conservative = get_profile_weights(WeightProfile.CONSERVATIVE)
        assert aggressive.get(ScoreType.MOMENTUM, 0) > conservative.get(ScoreType.MOMENTUM, 0)

    def test_build_score_weights(self):
        weights = build_score_weights(WeightProfile.BALANCED)
        assert len(weights) > 0
        for st, sw in weights.items():
            assert sw.score_type == st
            assert 0 <= sw.weight <= 1.0

    def test_custom_profile(self):
        weights = get_profile_weights(WeightProfile.CUSTOM)
        assert len(weights) == len(ScoreType)
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.01

    def test_profiles_are_different(self):
        bal = get_profile_weights(WeightProfile.BALANCED)
        grow = get_profile_weights(WeightProfile.GROWTH)
        assert bal != grow
