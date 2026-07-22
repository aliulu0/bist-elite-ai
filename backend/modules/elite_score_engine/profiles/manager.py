from __future__ import annotations

import threading
from typing import Dict, Optional, List

from modules.elite_score_engine.core.types import EliteProfile


_DEFAULT_PROFILES: Dict[str, EliteProfile] = {}


def _init_defaults() -> None:
    if _DEFAULT_PROFILES:
        return
    from modules.elite_score_engine.weights.profiles import (
        CONSERVATIVE_DIMENSIONS,
        CONSERVATIVE_BONUS_RULES,
        CONSERVATIVE_PENALTY_RULES,
        BALANCED_DIMENSIONS,
        BALANCED_BONUS_RULES,
        BALANCED_PENALTY_RULES,
        AGGRESSIVE_DIMENSIONS,
        AGGRESSIVE_BONUS_RULES,
        AGGRESSIVE_PENALTY_RULES,
    )

    _DEFAULT_PROFILES["conservative"] = EliteProfile(
        name="conservative",
        description="Prioritizes financial quality, risk control, and low valuation",
        dimension_weights=CONSERVATIVE_DIMENSIONS,
        bonus_rules=CONSERVATIVE_BONUS_RULES,
        penalty_rules=CONSERVATIVE_PENALTY_RULES,
    )
    _DEFAULT_PROFILES["balanced"] = EliteProfile(
        name="balanced",
        description="Even distribution across all 17 scoring dimensions",
        dimension_weights=BALANCED_DIMENSIONS,
        bonus_rules=BALANCED_BONUS_RULES,
        penalty_rules=BALANCED_PENALTY_RULES,
    )
    _DEFAULT_PROFILES["aggressive"] = EliteProfile(
        name="aggressive",
        description="Emphasizes momentum, technical signals, and smart money",
        dimension_weights=AGGRESSIVE_DIMENSIONS,
        bonus_rules=AGGRESSIVE_BONUS_RULES,
        penalty_rules=AGGRESSIVE_PENALTY_RULES,
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
        self._profiles: Dict[str, EliteProfile] = dict(_DEFAULT_PROFILES)

    def get_profile(self, name: str) -> Optional[EliteProfile]:
        return self._profiles.get(name)

    def register_profile(self, profile: EliteProfile) -> None:
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

    def get_all_profiles(self) -> Dict[str, EliteProfile]:
        return dict(self._profiles)

    def is_default(self, name: str) -> bool:
        return name in _DEFAULT_PROFILES


def reset_profile_manager() -> None:
    ProfileManager._instance = None
    ProfileManager._lock = threading.Lock()
