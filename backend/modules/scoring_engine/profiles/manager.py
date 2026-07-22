from __future__ import annotations

import threading
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime,
    ScoringProfile,
)


class ScoringProfileManager:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls) -> ScoringProfileManager:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._profiles: dict[str, ScoringProfile] = {}
        self._build_defaults()
        self._initialized = True

    def get_profile(self, name: str) -> ScoringProfile | None:
        return self._profiles.get(name)

    def list_profiles(self) -> list[ScoringProfile]:
        return list(self._profiles.values())

    def register_profile(self, profile: ScoringProfile) -> None:
        self._profiles[profile.name] = profile

    def delete_profile(self, name: str) -> bool:
        if name in self._profiles:
            del self._profiles[name]
            return True
        return False

    def get_weight_profile(self, name: str) -> WeightProfile:
        p = self.get_profile(name)
        if p:
            return p.profile
        return WeightProfile.BALANCED

    def _build_defaults(self) -> None:
        now = ""
        defaults = [
            ScoringProfile(
                name="Very Conservative", profile=WeightProfile.VERY_CONSERVATIVE,
                description="Minimal risk, prioritize quality and financial health",
                is_active=True, created_at=now,
            ),
            ScoringProfile(
                name="Conservative", profile=WeightProfile.CONSERVATIVE,
                description="Low risk, emphasize fundamentals and liquidity",
                is_active=True, created_at=now,
            ),
            ScoringProfile(
                name="Balanced", profile=WeightProfile.BALANCED,
                description="Balanced approach across all factors",
                is_active=True, created_at=now,
            ),
            ScoringProfile(
                name="Growth", profile=WeightProfile.GROWTH,
                description="Growth-oriented, emphasize momentum and growth metrics",
                is_active=True, created_at=now,
            ),
            ScoringProfile(
                name="Aggressive", profile=WeightProfile.AGGRESSIVE,
                description="High risk tolerance, maximize momentum and smart money signals",
                is_active=True, created_at=now,
            ),
        ]
        for p in defaults:
            self._profiles[p.name] = p


def get_profile_manager() -> ScoringProfileManager:
    return ScoringProfileManager()


def reset_profile_manager() -> ScoringProfileManager:
    ScoringProfileManager._instance = None
    ScoringProfileManager._lock = threading.Lock()
    return ScoringProfileManager()
