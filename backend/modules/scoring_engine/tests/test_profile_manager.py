from modules.scoring_engine.profiles.manager import ScoringProfileManager, get_profile_manager, reset_profile_manager
from modules.scoring_engine.core.types import ScoringProfile, WeightProfile


class TestScoringProfileManager:
    def setup_method(self):
        reset_profile_manager()
        self.mgr = get_profile_manager()

    def test_singleton(self):
        assert get_profile_manager() is get_profile_manager()

    def test_has_defaults(self):
        profiles = self.mgr.list_profiles()
        assert len(profiles) == 5

    def test_get_profile(self):
        p = self.mgr.get_profile("Balanced")
        assert p is not None
        assert p.profile == WeightProfile.BALANCED

    def test_register_custom(self):
        custom = ScoringProfile(name="MyCustom", profile=WeightProfile.CUSTOM, description="Custom")
        self.mgr.register_profile(custom)
        assert self.mgr.get_profile("MyCustom") is not None

    def test_delete(self):
        self.mgr.register_profile(ScoringProfile(name="ToDelete", profile=WeightProfile.CUSTOM, description="del"))
        assert self.mgr.delete_profile("ToDelete") is True
        assert self.mgr.get_profile("ToDelete") is None

    def test_delete_nonexistent(self):
        assert self.mgr.delete_profile("nonexistent") is False

    def test_get_weight_profile(self):
        assert self.mgr.get_weight_profile("Balanced") == WeightProfile.BALANCED
        assert self.mgr.get_weight_profile("nonexistent") == WeightProfile.BALANCED
