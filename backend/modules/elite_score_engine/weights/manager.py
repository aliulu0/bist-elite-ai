from __future__ import annotations

import threading
from typing import Dict, Optional, List

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    BonusRule,
    PenaltyRule,
    EliteWeightConfig,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    ScoreDirection,
)
from modules.elite_score_engine.weights.profiles import DEFAULT_PROFILES, get_profile_weights
from modules.elite_score_engine.weights.horizon import apply_horizon_adjustments
from modules.elite_score_engine.weights.regime import apply_regime_adjustments
from modules.elite_score_engine.weights.sector import apply_sector_adjustments


class WeightManager:
    _instance: Optional["WeightManager"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "WeightManager":
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
        self._custom_configs: Dict[str, EliteWeightConfig] = {}
        self._cache: Dict[str, EliteWeightConfig] = {}

    def get_config(
        self,
        profile_name: str = "balanced",
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
        sector: SectorType = SectorType.OTHER,
    ) -> EliteWeightConfig:
        cache_key = f"{profile_name}:{horizon.value}:{regime.value}:{sector.value}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        if profile_name in self._custom_configs:
            base = self._custom_configs[profile_name]
        else:
            base = get_profile_weights(profile_name)

        adjusted_dims = apply_horizon_adjustments(base.dimensions, horizon)
        adjusted_dims = apply_regime_adjustments(adjusted_dims, regime)
        adjusted_dims = apply_sector_adjustments(adjusted_dims, sector)

        total_weight = sum(dw.weight for dw in adjusted_dims.values())

        config = EliteWeightConfig(
            profile_name=profile_name,
            dimensions=adjusted_dims,
            bonus_rules=list(base.bonus_rules),
            penalty_rules=list(base.penalty_rules),
            horizon=horizon,
            regime=regime,
            sector=sector,
            total_weight=total_weight,
        )

        self._cache[cache_key] = config
        return config

    def set_custom_config(self, name: str, config: EliteWeightConfig) -> None:
        self._custom_configs[name] = config
        self._clear_cache_for(name)

    def remove_custom_config(self, name: str) -> bool:
        if name in self._custom_configs:
            del self._custom_configs[name]
            self._clear_cache_for(name)
            return True
        return False

    def list_profiles(self) -> List[str]:
        profiles = list(DEFAULT_PROFILES.keys())
        profiles.extend(self._custom_configs.keys())
        return profiles

    def list_horizons(self) -> List[str]:
        return [h.value for h in InvestmentHorizon]

    def list_regimes(self) -> List[str]:
        return [r.value for r in MarketRegime]

    def list_sectors(self) -> List[str]:
        return [s.value for s in SectorType]

    def validate_config(self, config: EliteWeightConfig) -> List[str]:
        errors: List[str] = []
        if not config.dimensions:
            errors.append("No dimensions configured")
        total = sum(dw.weight for dw in config.dimensions.values())
        if total <= 0:
            errors.append("Total weight must be positive")
        if abs(total - 1.0) > 0.1:
            errors.append(f"Total weight should be ~1.0, got {total:.4f}")
        for dim, dw in config.dimensions.items():
            if dw.weight < 0:
                errors.append(f"Weight for {dim.value} is negative")
            if dw.min_value >= dw.max_value:
                errors.append(f"Invalid range for {dim.value}")
        for br in config.bonus_rules:
            if br.points < 0:
                errors.append(f"Bonus rule {br.factor.value} has negative points")
        for pr in config.penalty_rules:
            if pr.points > 0:
                errors.append(f"Penalty rule {pr.factor.value} has positive points")
        return errors

    def _clear_cache_for(self, profile_name: str) -> None:
        keys_to_remove = [k for k in self._cache if k.startswith(f"{profile_name}:")]
        for key in keys_to_remove:
            del self._cache[key]


def reset_weight_manager() -> None:
    WeightManager._instance = None
    WeightManager._lock = threading.Lock()
