from __future__ import annotations

import threading
from typing import Dict, List, Optional

from modules.decision_engine.decision_profiles.profiles import (
    DEFAULT_PROFILES,
    DecisionWeightProfile,
)


_instance: Optional[ProfileManager] = None
_lock = threading.Lock()


class ProfileManager:
    """Singleton manager for decision weight profiles."""

    def __new__(cls, *args, **kwargs) -> ProfileManager:
        global _instance
        if _instance is None:
            with _lock:
                if _instance is None:
                    _instance = super().__new__(cls)
                    _instance._initialized = False
        return _instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._profiles: Dict[str, DecisionWeightProfile] = dict(DEFAULT_PROFILES)
        self._initialized = True

    def get_profile(self, name: str) -> Optional[DecisionWeightProfile]:
        return self._profiles.get(name)

    def list_profiles(self) -> List[str]:
        return list(self._profiles.keys())

    def get_all_profiles(self) -> Dict[str, DecisionWeightProfile]:
        return dict(self._profiles)

    def register_profile(self, profile: DecisionWeightProfile) -> None:
        self._profiles[profile.name] = profile

    def delete_profile(self, name: str) -> bool:
        if name in DEFAULT_PROFILES:
            return False
        if name in self._profiles:
            del self._profiles[name]
            return True
        return False

    def is_default(self, name: str) -> bool:
        return name in DEFAULT_PROFILES


def reset_profile_manager() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
