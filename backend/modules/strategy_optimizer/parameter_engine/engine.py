from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import (
    OptimizationType,
    ParameterCategory,
    ParameterRange,
    classify_horizon_days,
)


class ParameterSpaceBuilder:
    """Constructs search spaces for each optimization type."""

    def __init__(self) -> None:
        self._defaults: Dict[ParameterCategory, Dict[str, ParameterRange]] = {}

    def build_space(
        self,
        optimization_type: OptimizationType,
        categories: Optional[List[ParameterCategory]] = None,
        overrides: Optional[Dict[str, ParameterRange]] = None,
    ) -> Dict[str, ParameterRange]:
        if categories is None:
            categories = self._default_categories(optimization_type)

        space: Dict[str, ParameterRange] = {}
        for cat in categories:
            defaults = self._defaults_for_category(cat)
            space.update(defaults)

        if overrides:
            space.update(overrides)
        return space

    def generate_candidates(
        self,
        space: Dict[str, ParameterRange],
        max_candidates: int,
        seed: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        import itertools
        import random

        discrete_keys = [k for k, v in space.items() if v.is_discrete and v.values]
        continuous_keys = [k for k, v in space.items() if not v.is_discrete]

        candidates: List[Dict[str, Any]] = []

        if discrete_keys:
            all_value_lists = [space[k].values for k in discrete_keys]
            for combo in itertools.product(*all_value_lists):
                base: Dict[str, Any] = dict(zip(discrete_keys, combo))
                for ck in continuous_keys:
                    pr = space[ck]
                    base[ck] = pr.current_value
                candidates.append(base)
                if len(candidates) >= max_candidates:
                    return candidates

        if continuous_keys and len(candidates) < max_candidates:
            rng = random.Random(seed) if seed is not None else random.Random()
            while len(candidates) < max_candidates:
                point: Dict[str, Any] = {}
                for dk in discrete_keys:
                    pr = space[dk]
                    point[dk] = rng.choice(pr.values) if pr.values else pr.current_value
                for ck in continuous_keys:
                    pr = space[ck]
                    if pr.step > 0:
                        steps = int((pr.max_value - pr.min_value) / pr.step) + 1
                        idx = rng.randint(0, steps - 1)
                        point[ck] = round(pr.min_value + idx * pr.step, 6)
                    else:
                        point[ck] = rng.uniform(pr.min_value, pr.max_value)
                candidates.append(point)

        return candidates[:max_candidates]

    def perturb_candidate(
        self,
        candidate: Dict[str, Any],
        space: Dict[str, ParameterRange],
        magnitude: float = 0.1,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        import random

        rng = random.Random(seed) if seed is not None else random.Random()
        result = dict(candidate)
        for key, pr in space.items():
            if key not in result:
                continue
            current = result[key]
            if pr.is_discrete and pr.values:
                idx = pr.values.index(current) if current in pr.values else 0
                shift = rng.randint(-1, 1)
                new_idx = max(0, min(len(pr.values) - 1, idx + shift))
                result[key] = pr.values[new_idx]
            else:
                span = pr.max_value - pr.min_value
                delta = rng.uniform(-magnitude * span, magnitude * span)
                new_val = current + delta
                result[key] = round(
                    max(pr.min_value, min(pr.max_value, new_val)), 6
                )
        return result

    def grid_search_space(
        self,
        space: Dict[str, ParameterRange],
        max_points: int = 1000,
    ) -> List[Dict[str, Any]]:
        import itertools

        param_lists: Dict[str, List[Any]] = {}
        total_points = 1

        for key, pr in space.items():
            if pr.is_discrete and pr.values:
                param_lists[key] = pr.values[:]
            elif pr.step > 0:
                steps = int((pr.max_value - pr.min_value) / pr.step) + 1
                param_lists[key] = [
                    round(pr.min_value + i * pr.step, 6) for i in range(steps)
                ]
            else:
                param_lists[key] = [pr.current_value]
            total_points *= max(1, len(param_lists[key]))

        if total_points > max_points:
            factor = (max_points / total_points) ** (1.0 / len(param_lists))
            for key in param_lists:
                if len(param_lists[key]) > 2:
                    n = max(2, int(len(param_lists[key]) * factor))
                    pr = space[key]
                    if pr.is_discrete:
                        indices = [int(i * (len(pr.values) - 1) / (n - 1)) for i in range(n)]
                        param_lists[key] = [pr.values[i] for i in indices]
                    else:
                        param_lists[key] = [
                            round(pr.min_value + i * (pr.max_value - pr.min_value) / (n - 1), 6)
                            for i in range(n)
                        ]

        keys = list(param_lists.keys())
        return [dict(zip(keys, combo)) for combo in itertools.product(*param_lists.values())]

    def _default_categories(self, optimization_type: OptimizationType) -> List[ParameterCategory]:
        mapping = {
            OptimizationType.RULE_THRESHOLD: [
                ParameterCategory.ELITE_SCORE,
                ParameterCategory.CONFIDENCE,
                ParameterCategory.RISK,
            ],
            OptimizationType.WEIGHT: [
                ParameterCategory.ELITE_SCORE,
                ParameterCategory.RSI,
                ParameterCategory.MACD,
                ParameterCategory.MOVING_AVERAGE,
                ParameterCategory.VOLUME,
                ParameterCategory.SMART_MONEY,
                ParameterCategory.PATTERN,
                ParameterCategory.FINANCIAL,
            ],
            OptimizationType.BONUS: [
                ParameterCategory.SMART_MONEY,
                ParameterCategory.PATTERN,
                ParameterCategory.FINANCIAL,
            ],
            OptimizationType.PENALTY: [
                ParameterCategory.RISK,
                ParameterCategory.CONFIDENCE,
            ],
            OptimizationType.FILTER: [
                ParameterCategory.ELITE_SCORE,
                ParameterCategory.OPPORTUNITY_SCORE,
                ParameterCategory.VOLUME,
            ],
            OptimizationType.RANKING: [
                ParameterCategory.ELITE_SCORE,
                ParameterCategory.CONFIDENCE,
                ParameterCategory.RISK,
                ParameterCategory.RSI,
            ],
        }
        return mapping.get(optimization_type, list(ParameterCategory))

    def _defaults_for_category(self, cat: ParameterCategory) -> Dict[str, ParameterRange]:
        defaults: Dict[str, ParameterRange] = {
            ParameterCategory.ELITE_SCORE: {
                "elite_score_threshold": ParameterRange(
                    name="elite_score_threshold",
                    category=ParameterCategory.ELITE_SCORE,
                    min_value=0.3,
                    max_value=0.9,
                    step=0.05,
                    current_value=0.6,
                ),
            },
            ParameterCategory.OPPORTUNITY_SCORE: {
                "opportunity_score_threshold": ParameterRange(
                    name="opportunity_score_threshold",
                    category=ParameterCategory.OPPORTUNITY_SCORE,
                    min_value=0.3,
                    max_value=0.9,
                    step=0.05,
                    current_value=0.5,
                ),
            },
            ParameterCategory.CONFIDENCE: {
                "confidence_threshold": ParameterRange(
                    name="confidence_threshold",
                    category=ParameterCategory.CONFIDENCE,
                    min_value=0.3,
                    max_value=0.9,
                    step=0.05,
                    current_value=0.5,
                ),
            },
            ParameterCategory.RISK: {
                "risk_threshold": ParameterRange(
                    name="risk_threshold",
                    category=ParameterCategory.RISK,
                    min_value=0.1,
                    max_value=0.8,
                    step=0.05,
                    current_value=0.4,
                ),
            },
            ParameterCategory.RSI: {
                "rsi_oversold": ParameterRange(
                    name="rsi_oversold",
                    category=ParameterCategory.RSI,
                    min_value=15.0,
                    max_value=40.0,
                    step=1.0,
                    current_value=30.0,
                ),
                "rsi_overbought": ParameterRange(
                    name="rsi_overbought",
                    category=ParameterCategory.RSI,
                    min_value=60.0,
                    max_value=85.0,
                    step=1.0,
                    current_value=70.0,
                ),
            },
            ParameterCategory.MACD: {
                "macd_fast": ParameterRange(
                    name="macd_fast",
                    category=ParameterCategory.MACD,
                    min_value=8,
                    max_value=16,
                    step=1,
                    current_value=12,
                    is_discrete=True,
                    values=[8, 9, 10, 11, 12, 13, 14, 15, 16],
                ),
                "macd_slow": ParameterRange(
                    name="macd_slow",
                    category=ParameterCategory.MACD,
                    min_value=20,
                    max_value=32,
                    step=1,
                    current_value=26,
                    is_discrete=True,
                    values=[20, 22, 24, 26, 28, 30, 32],
                ),
                "macd_signal": ParameterRange(
                    name="macd_signal",
                    category=ParameterCategory.MACD,
                    min_value=6,
                    max_value=12,
                    step=1,
                    current_value=9,
                    is_discrete=True,
                    values=[6, 7, 8, 9, 10, 11, 12],
                ),
            },
            ParameterCategory.MOVING_AVERAGE: {
                "ma_short": ParameterRange(
                    name="ma_short",
                    category=ParameterCategory.MOVING_AVERAGE,
                    min_value=5,
                    max_value=30,
                    step=1,
                    current_value=10,
                    is_discrete=True,
                    values=[5, 10, 15, 20, 25, 30],
                ),
                "ma_long": ParameterRange(
                    name="ma_long",
                    category=ParameterCategory.MOVING_AVERAGE,
                    min_value=30,
                    max_value=200,
                    step=1,
                    current_value=50,
                    is_discrete=True,
                    values=[30, 50, 100, 150, 200],
                ),
            },
            ParameterCategory.VOLUME: {
                "volume_threshold": ParameterRange(
                    name="volume_threshold",
                    category=ParameterCategory.VOLUME,
                    min_value=1.0,
                    max_value=3.0,
                    step=0.1,
                    current_value=1.5,
                ),
            },
            ParameterCategory.SMART_MONEY: {
                "smart_money_weight": ParameterRange(
                    name="smart_money_weight",
                    category=ParameterCategory.SMART_MONEY,
                    min_value=0.0,
                    max_value=1.0,
                    step=0.1,
                    current_value=0.3,
                ),
            },
            ParameterCategory.PATTERN: {
                "pattern_confidence": ParameterRange(
                    name="pattern_confidence",
                    category=ParameterCategory.PATTERN,
                    min_value=0.3,
                    max_value=0.9,
                    step=0.05,
                    current_value=0.6,
                ),
            },
            ParameterCategory.FINANCIAL: {
                "pe_ratio_max": ParameterRange(
                    name="pe_ratio_max",
                    category=ParameterCategory.FINANCIAL,
                    min_value=10.0,
                    max_value=40.0,
                    step=1.0,
                    current_value=25.0,
                ),
                "debt_ratio_max": ParameterRange(
                    name="debt_ratio_max",
                    category=ParameterCategory.FINANCIAL,
                    min_value=0.3,
                    max_value=2.0,
                    step=0.1,
                    current_value=1.0,
                ),
            },
        }
        return defaults.get(cat, {})
