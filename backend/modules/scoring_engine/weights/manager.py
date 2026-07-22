from __future__ import annotations

import threading
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime,
    ScoreWeight, WeightConfig, PenaltyRule, BonusRule,
)
from modules.scoring_engine.weights.profiles import build_score_weights
from modules.scoring_engine.weights.horizon import apply_horizon_adjustments
from modules.scoring_engine.weights.regime import apply_regime_adjustments


class WeightManager:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls) -> WeightManager:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._configs: dict[tuple, WeightConfig] = {}
        self._custom_weights: dict[WeightProfile, dict[ScoreType, float]] = {}
        self._penalty_rules: list[PenaltyRule] = []
        self._bonus_rules: list[BonusRule] = []
        self._initialized = True

    def get_config(
        self,
        profile: WeightProfile = WeightProfile.BALANCED,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
    ) -> WeightConfig:
        key = (profile, horizon, regime)
        if key not in self._configs:
            self._configs[key] = self._build_config(profile, horizon, regime)
        return self._configs[key]

    def set_custom_weights(
        self,
        profile: WeightProfile,
        weights: dict[ScoreType, float],
    ) -> None:
        self._custom_weights[profile] = dict(weights)
        keys_to_remove = [k for k in self._configs if k[0] == profile]
        for k in keys_to_remove:
            del self._configs[k]

    def get_effective_weights(
        self,
        profile: WeightProfile = WeightProfile.BALANCED,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
    ) -> dict[ScoreType, ScoreWeight]:
        config = self.get_config(profile, horizon, regime)
        return dict(config.weights)

    def add_penalty_rule(self, rule: PenaltyRule) -> None:
        self._penalty_rules.append(rule)

    def add_bonus_rule(self, rule: BonusRule) -> None:
        self._bonus_rules.append(rule)

    def get_penalty_rules(self) -> list[PenaltyRule]:
        return list(self._penalty_rules)

    def get_bonus_rules(self) -> list[BonusRule]:
        return list(self._bonus_rules)

    def list_profiles(self) -> list[WeightProfile]:
        return list(WeightProfile)

    def list_horizons(self) -> list[InvestmentHorizon]:
        return list(InvestmentHorizon)

    def list_regimes(self) -> list[MarketRegime]:
        return list(MarketRegime)

    def validate_weights(self, weights: dict[ScoreType, float]) -> list[str]:
        errors = []
        if not weights:
            errors.append("Weights dictionary is empty")
            return errors
        total = sum(weights.values())
        if abs(total - 1.0) > 0.01:
            errors.append(f"Weights do not sum to 1.0 (got {total:.4f})")
        for st, w in weights.items():
            if w < 0:
                errors.append(f"Negative weight for {st.value}: {w}")
            if w > 1.0:
                errors.append(f"Weight > 1.0 for {st.value}: {w}")
        return errors

    def _build_config(
        self,
        profile: WeightProfile,
        horizon: InvestmentHorizon,
        regime: MarketRegime,
    ) -> WeightConfig:
        if profile == WeightProfile.CUSTOM and profile in self._custom_weights:
            raw = self._custom_weights[profile]
            base_weights = {st: ScoreWeight(score_type=st, weight=w) for st, w in raw.items()}
        else:
            base_weights = build_score_weights(profile)

        adjusted = apply_horizon_adjustments(base_weights, horizon)
        adjusted = apply_regime_adjustments(adjusted, regime)

        return WeightConfig(
            profile=profile,
            horizon=horizon,
            regime=regime,
            weights=adjusted,
            penalty_rules=list(self._penalty_rules),
            bonus_rules=list(self._bonus_rules),
        )

    def reset(self) -> None:
        self._configs.clear()
        self._custom_weights.clear()
        self._penalty_rules.clear()
        self._bonus_rules.clear()


def get_weight_manager() -> WeightManager:
    return WeightManager()


def reset_weight_manager() -> WeightManager:
    WeightManager._instance = None
    WeightManager._lock = threading.Lock()
    return WeightManager()
