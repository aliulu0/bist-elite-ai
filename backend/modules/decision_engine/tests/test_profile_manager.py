import pytest
from modules.decision_engine.decision_profiles.manager import ProfileManager, reset_profile_manager
from modules.decision_engine.decision_profiles.profiles import DecisionWeightProfile
from modules.decision_engine.core.types import DecisionDimension


@pytest.fixture(autouse=True)
def fresh_manager():
    reset_profile_manager()
    yield
    reset_profile_manager()


class TestProfileManager:
    def test_singleton(self):
        m1 = ProfileManager()
        m2 = ProfileManager()
        assert m1 is m2

    def test_has_defaults(self):
        m = ProfileManager()
        profiles = m.list_profiles()
        assert "conservative" in profiles
        assert "balanced" in profiles
        assert "aggressive" in profiles

    def test_get_profile(self):
        m = ProfileManager()
        p = m.get_profile("balanced")
        assert p is not None
        assert p.name == "balanced"

    def test_get_unknown(self):
        m = ProfileManager()
        assert m.get_profile("unknown") is None

    def test_register_custom(self):
        m = ProfileManager()
        profile = DecisionWeightProfile(
            name="custom",
            description="Custom profile",
            dimension_weights={DecisionDimension.MOMENTUM: 1.0},
        )
        m.register_profile(profile)
        assert "custom" in m.list_profiles()

    def test_delete_custom(self):
        m = ProfileManager()
        profile = DecisionWeightProfile(
            name="to_delete",
            description="Delete me",
            dimension_weights={},
        )
        m.register_profile(profile)
        assert m.delete_profile("to_delete") is True
        assert "to_delete" not in m.list_profiles()

    def test_delete_default_returns_false(self):
        m = ProfileManager()
        assert m.delete_profile("balanced") is False

    def test_delete_nonexistent(self):
        m = ProfileManager()
        assert m.delete_profile("nonexistent") is False

    def test_get_all_profiles(self):
        m = ProfileManager()
        all_p = m.get_all_profiles()
        assert len(all_p) >= 3

    def test_is_default(self):
        m = ProfileManager()
        assert m.is_default("balanced") is True
        assert m.is_default("custom") is False
