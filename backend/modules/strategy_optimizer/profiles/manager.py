from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationType,
    ParameterCategory,
    classify_horizon_days,
)


@dataclass
class HorizonProfile:
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    lookback_days: int = 63
    min_trades: int = 10
    max_drawdown_pct: float = 25.0
    min_sharpe: float = 0.5
    rebalance_frequency_days: int = 21
    objectives: List[OptimizationObjective] = field(default_factory=list)
    parameter_categories: List[ParameterCategory] = field(default_factory=list)
    optimization_types: List[OptimizationType] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ProfileManager:
    """Manages optimization profiles for each investment horizon."""

    def __init__(self) -> None:
        self._profiles: Dict[InvestmentHorizon, HorizonProfile] = {}
        self._build_defaults()

    def get_profile(self, horizon: InvestmentHorizon) -> HorizonProfile:
        return self._profiles.get(horizon, HorizonProfile(horizon=horizon))

    def set_profile(self, horizon: InvestmentHorizon, profile: HorizonProfile) -> None:
        self._profiles[horizon] = profile

    def get_all_profiles(self) -> Dict[InvestmentHorizon, HorizonProfile]:
        return dict(self._profiles)

    def list_horizons(self) -> List[InvestmentHorizon]:
        return list(self._profiles.keys())

    def get_objectives_for_horizon(
        self, horizon: InvestmentHorizon
    ) -> List[OptimizationObjective]:
        profile = self.get_profile(horizon)
        return profile.objectives

    def get_categories_for_horizon(
        self, horizon: InvestmentHorizon
    ) -> List[ParameterCategory]:
        profile = self.get_profile(horizon)
        return profile.parameter_categories

    def get_types_for_horizon(
        self, horizon: InvestmentHorizon
    ) -> List[OptimizationType]:
        profile = self.get_profile(horizon)
        return profile.optimization_types

    def _build_defaults(self) -> None:
        self._profiles = {
            InvestmentHorizon.WEEKLY: HorizonProfile(
                horizon=InvestmentHorizon.WEEKLY,
                lookback_days=52 * 5,
                min_trades=30,
                max_drawdown_pct=15.0,
                min_sharpe=1.0,
                rebalance_frequency_days=5,
                objectives=[
                    OptimizationObjective.MAXIMIZE_RETURN,
                    OptimizationObjective.MAXIMIZE_WIN_RATE,
                    OptimizationObjective.REDUCE_FALSE_POSITIVES,
                ],
                parameter_categories=[
                    ParameterCategory.ELITE_SCORE,
                    ParameterCategory.CONFIDENCE,
                    ParameterCategory.VOLUME,
                    ParameterCategory.RSI,
                ],
                optimization_types=[
                    OptimizationType.RULE_THRESHOLD,
                    OptimizationType.FILTER,
                ],
            ),
            InvestmentHorizon.MONTH_1: HorizonProfile(
                horizon=InvestmentHorizon.MONTH_1,
                lookback_days=52 * 5,
                min_trades=20,
                max_drawdown_pct=18.0,
                min_sharpe=0.8,
                rebalance_frequency_days=21,
                objectives=[
                    OptimizationObjective.MAXIMIZE_RETURN,
                    OptimizationObjective.MAXIMIZE_SHARPE,
                    OptimizationObjective.REDUCE_FALSE_POSITIVES,
                ],
                parameter_categories=[
                    ParameterCategory.ELITE_SCORE,
                    ParameterCategory.CONFIDENCE,
                    ParameterCategory.RISK,
                    ParameterCategory.VOLUME,
                    ParameterCategory.RSI,
                ],
                optimization_types=[
                    OptimizationType.RULE_THRESHOLD,
                    OptimizationType.WEIGHT,
                    OptimizationType.FILTER,
                ],
            ),
            InvestmentHorizon.MONTH_3: HorizonProfile(
                horizon=InvestmentHorizon.MONTH_3,
                lookback_days=52 * 5,
                min_trades=15,
                max_drawdown_pct=25.0,
                min_sharpe=0.5,
                rebalance_frequency_days=63,
                objectives=[
                    OptimizationObjective.MAXIMIZE_SHARPE,
                    OptimizationObjective.MINIMIZE_DRAWDOWN,
                    OptimizationObjective.IMPROVE_ROBUSTNESS,
                    OptimizationObjective.INCREASE_CONSISTENCY,
                ],
                parameter_categories=[
                    ParameterCategory.ELITE_SCORE,
                    ParameterCategory.CONFIDENCE,
                    ParameterCategory.RISK,
                    ParameterCategory.RSI,
                    ParameterCategory.MACD,
                    ParameterCategory.MOVING_AVERAGE,
                    ParameterCategory.VOLUME,
                    ParameterCategory.SMART_MONEY,
                    ParameterCategory.PATTERN,
                    ParameterCategory.FINANCIAL,
                ],
                optimization_types=list(OptimizationType),
            ),
            InvestmentHorizon.MONTH_6: HorizonProfile(
                horizon=InvestmentHorizon.MONTH_6,
                lookback_days=52 * 5,
                min_trades=10,
                max_drawdown_pct=30.0,
                min_sharpe=0.4,
                rebalance_frequency_days=126,
                objectives=[
                    OptimizationObjective.MAXIMIZE_SHARPE,
                    OptimizationObjective.MINIMIZE_DRAWDOWN,
                    OptimizationObjective.IMPROVE_ROBUSTNESS,
                    OptimizationObjective.INCREASE_CONSISTENCY,
                    OptimizationObjective.REDUCE_FALSE_NEGATIVES,
                ],
                parameter_categories=list(ParameterCategory),
                optimization_types=list(OptimizationType),
            ),
            InvestmentHorizon.MONTH_12: HorizonProfile(
                horizon=InvestmentHorizon.MONTH_12,
                lookback_days=52 * 5,
                min_trades=8,
                max_drawdown_pct=35.0,
                min_sharpe=0.3,
                rebalance_frequency_days=252,
                objectives=[
                    OptimizationObjective.MAXIMIZE_RETURN,
                    OptimizationObjective.MAXIMIZE_SHARPE,
                    OptimizationObjective.MINIMIZE_DRAWDOWN,
                    OptimizationObjective.IMPROVE_ROBUSTNESS,
                    OptimizationObjective.INCREASE_CONSISTENCY,
                ],
                parameter_categories=list(ParameterCategory),
                optimization_types=list(OptimizationType),
            ),
        }
