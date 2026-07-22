from __future__ import annotations

from typing import Any, Dict, List

from modules.position_sizing_engine.core.types import (
    RISK_PROFILE_PRESETS,
    RiskProfile,
    _clamp,
)


class RiskProfileManager:

    def get_params(self, profile: RiskProfile) -> Dict[str, Any]:
        if profile == RiskProfile.CUSTOM:
            return dict(RISK_PROFILE_PRESETS[RiskProfile.CUSTOM])
        return dict(RISK_PROFILE_PRESETS.get(profile, RISK_PROFILE_PRESETS[RiskProfile.BALANCED]))

    def get_all_profiles(self) -> Dict[str, Dict[str, Any]]:
        return {
            profile.value: dict(params)
            for profile, params in RISK_PROFILE_PRESETS.items()
        }

    def get_profile_names(self) -> List[str]:
        return [profile.value for profile in RISK_PROFILE_PRESETS]

    def _validate_custom_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        defaults = RISK_PROFILE_PRESETS[RiskProfile.CUSTOM]
        validated: Dict[str, Any] = {}

        for key, default_val in defaults.items():
            value = params.get(key, default_val)
            if not isinstance(value, (int, float)):
                value = default_val

            if key == "max_position":
                value = _clamp(value, 1.0, 50.0)
            elif key == "min_position":
                value = _clamp(value, 0.5, 20.0)
            elif key == "max_sector_exposure":
                value = _clamp(value, 5.0, 100.0)
            elif key == "cash_reserve":
                value = _clamp(value, 0.0, 50.0)
            elif key == "max_risk_per_trade":
                value = _clamp(value, 0.5, 10.0)

            validated[key] = round(float(value), 2)

        return validated
