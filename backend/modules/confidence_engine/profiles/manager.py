from __future__ import annotations

import threading
from typing import Dict, Optional, List

from modules.confidence_engine.core.types import ConfidenceProfile


_DEFAULT_PROFILES: Dict[str, ConfidenceProfile] = {}


def _init_defaults() -> None:
    if _DEFAULT_PROFILES:
        return
    from modules.confidence_engine.profiles.profiles import (
        STANDARD_DIMENSIONS,
        STANDARD_BONUS_RULES,
        STANDARD_PENALTY_RULES,
        CONSERVATIVE_DIMENSIONS,
        AGGRESSIVE_DIMENSIONS,
    )

    _DEFAULT_PROFILES["standard"] = ConfidenceProfile(
        name="standard",
        description="Balanced confidence evaluation across all dimensions",
        dimension_weights=STANDARD_DIMENSIONS,
        bonus_rules=STANDARD_BONUS_RULES,
        penalty_rules=STANDARD_PENALTY_RULES,
    )
    _DEFAULT_PROFILES["conservative"] = ConfidenceProfile(
        name="conservative",
        description="Emphasizes data quality, evidence, and risk assessment",
        dimension_weights=CONSERVATIVE_DIMENSIONS,
        bonus_rules=STANDARD_BONUS_RULES,
        penalty_rules=STANDARD_PENALTY_RULES,
    )
    _DEFAULT_PROFILES["aggressive"] = ConfidenceProfile(
        name="aggressive",
        description="Emphasizes signal strength and pattern confirmation",
        dimension_weights=AGGRESSIVE_DIMENSIONS,
        bonus_rules=STANDARD_BONUS_RULES,
        penalty_rules=STANDARD_PENALTY_RULES,
    )


class ProfileManager:
    _instance: Optional["ProfileManager"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "ProfileManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        _init_defaults()
        self._profiles: Dict[str, ConfidenceProfile] = dict(_DEFAULT_PROFILES)

    def get_profile(self, name: str) -> Optional[ConfidenceProfile]:
        return self._profiles.get(name)

    def register_profile(self, profile: ConfidenceProfile) -> None:
        self._profiles[profile.name] = profile

    def delete_profile(self, name: str) -> bool:
        if name in self._profiles and name in _DEFAULT_PROFILES:
            return False
        if name in self._profiles:
            del self._profiles[name]
            return True
        return False

    def list_profiles(self) -> List[str]:
        return list(self._profiles.keys())

    def get_all_profiles(self) -> Dict[str, ConfidenceProfile]:
        return dict(self._profiles)

    def is_default(self, name: str) -> bool:
        return name in _DEFAULT_PROFILES


def reset_profile_manager() -> None:
    ProfileManager._instance = None
    ProfileManager._lock = threading.Lock()
