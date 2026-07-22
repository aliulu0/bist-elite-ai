from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.core.types import RiskProfile, RISK_PROFILE_PRESETS
from modules.position_sizing_engine.profiles.risk_profiles import RiskProfileManager


@pytest.fixture
def mgr():
    return RiskProfileManager()


class TestGetParams:
    def test_conservative(self, mgr: RiskProfileManager):
        params = mgr.get_params(RiskProfile.CONSERVATIVE)
        assert params["max_position"] == 8.0
        assert params["cash_reserve"] == 15.0

    def test_balanced(self, mgr: RiskProfileManager):
        params = mgr.get_params(RiskProfile.BALANCED)
        assert params["max_position"] == 12.0
        assert params["cash_reserve"] == 10.0

    def test_aggressive(self, mgr: RiskProfileManager):
        params = mgr.get_params(RiskProfile.AGGRESSIVE)
        assert params["max_position"] == 20.0
        assert params["cash_reserve"] == 5.0

    def test_custom(self, mgr: RiskProfileManager):
        params = mgr.get_params(RiskProfile.CUSTOM)
        assert params["max_position"] == 15.0
        assert params["min_position"] == 1.0

    def test_returns_dict(self, mgr: RiskProfileManager):
        for profile in RiskProfile:
            params = mgr.get_params(profile)
            assert isinstance(params, dict)

    def test_returns_copy(self, mgr: RiskProfileManager):
        params = mgr.get_params(RiskProfile.BALANCED)
        params["max_position"] = 999.0
        original = mgr.get_params(RiskProfile.BALANCED)
        assert original["max_position"] == 12.0

    def test_has_all_required_keys(self, mgr: RiskProfileManager):
        required = {"max_position", "min_position", "max_sector_exposure", "cash_reserve", "max_risk_per_trade"}
        for profile in RiskProfile:
            params = mgr.get_params(profile)
            assert required.issubset(params.keys()), f"Missing keys for {profile}"


class TestGetAllProfiles:
    def test_returns_all_profiles(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        assert len(all_profiles) == 4

    def test_keys_are_strings(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        for key in all_profiles:
            assert isinstance(key, str)

    def test_values_are_dicts(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        for val in all_profiles.values():
            assert isinstance(val, dict)

    def test_contains_conservative(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        assert "conservative" in all_profiles

    def test_contains_balanced(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        assert "balanced" in all_profiles

    def test_contains_aggressive(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        assert "aggressive" in all_profiles

    def test_contains_custom(self, mgr: RiskProfileManager):
        all_profiles = mgr.get_all_profiles()
        assert "custom" in all_profiles


class TestGetProfileNames:
    def test_returns_list(self, mgr: RiskProfileManager):
        names = mgr.get_profile_names()
        assert isinstance(names, list)

    def test_has_four_names(self, mgr: RiskProfileManager):
        names = mgr.get_profile_names()
        assert len(names) == 4

    def test_contains_expected_names(self, mgr: RiskProfileManager):
        names = mgr.get_profile_names()
        assert "conservative" in names
        assert "balanced" in names
        assert "aggressive" in names
        assert "custom" in names


class TestValidateCustomParams:
    def test_fills_defaults(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({})
        expected_keys = {"max_position", "min_position", "max_sector_exposure", "cash_reserve", "max_risk_per_trade"}
        assert expected_keys.issubset(result.keys())

    def test_clamps_max_position_high(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_position": 100.0})
        assert result["max_position"] == 50.0

    def test_clamps_max_position_low(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_position": 0.0})
        assert result["max_position"] == 1.0

    def test_clamps_min_position_high(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"min_position": 30.0})
        assert result["min_position"] == 20.0

    def test_clamps_min_position_low(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"min_position": 0.0})
        assert result["min_position"] == 0.5

    def test_clamps_sector_exposure_high(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_sector_exposure": 200.0})
        assert result["max_sector_exposure"] == 100.0

    def test_clamps_sector_exposure_low(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_sector_exposure": 0.0})
        assert result["max_sector_exposure"] == 5.0

    def test_clamps_cash_reserve_high(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"cash_reserve": 100.0})
        assert result["cash_reserve"] == 50.0

    def test_clamps_cash_reserve_low(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"cash_reserve": -10.0})
        assert result["cash_reserve"] == 0.0

    def test_clamps_risk_per_trade_high(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_risk_per_trade": 20.0})
        assert result["max_risk_per_trade"] == 10.0

    def test_clamps_risk_per_trade_low(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_risk_per_trade": 0.0})
        assert result["max_risk_per_trade"] == 0.5

    def test_non_numeric_uses_default(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_position": "invalid"})
        assert result["max_position"] == 15.0

    def test_valid_params_pass_through(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({
            "max_position": 10.0,
            "min_position": 2.0,
            "max_sector_exposure": 25.0,
            "cash_reserve": 10.0,
            "max_risk_per_trade": 2.0,
        })
        assert result["max_position"] == 10.0
        assert result["min_position"] == 2.0

    def test_values_are_floats(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_position": 10, "min_position": 2})
        assert isinstance(result["max_position"], float)
        assert isinstance(result["min_position"], float)

    def test_partial_params_fills_rest(self, mgr: RiskProfileManager):
        result = mgr._validate_custom_params({"max_position": 10.0})
        assert "min_position" in result
        assert "cash_reserve" in result
