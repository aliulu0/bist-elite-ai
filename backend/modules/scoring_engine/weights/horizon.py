from __future__ import annotations

from modules.scoring_engine.core.types import (
    ScoreType, InvestmentHorizon, ScoreWeight,
)


HORIZON_MULTIPLIERS: dict[InvestmentHorizon, dict[ScoreType, float]] = {
    InvestmentHorizon.WEEKLY: {
        ScoreType.MOMENTUM: 1.4, ScoreType.TECHNICAL: 1.3, ScoreType.VOLUME: 1.2,
        ScoreType.PATTERN: 1.2, ScoreType.SMART_MONEY: 1.1,
        ScoreType.FINANCIAL: 0.5, ScoreType.GROWTH: 0.5, ScoreType.QUALITY: 0.6,
        ScoreType.VALUE: 0.7, ScoreType.RISK: 0.8,
    },
    InvestmentHorizon.ONE_MONTH: {
        ScoreType.MOMENTUM: 1.2, ScoreType.TECHNICAL: 1.1, ScoreType.TREND: 1.1,
        ScoreType.VOLUME: 1.0, ScoreType.PATTERN: 1.0,
        ScoreType.FINANCIAL: 0.8, ScoreType.GROWTH: 0.8, ScoreType.QUALITY: 0.9,
    },
    InvestmentHorizon.THREE_MONTHS: {
        ScoreType.TREND: 1.1, ScoreType.FINANCIAL: 1.1, ScoreType.GROWTH: 1.1,
        ScoreType.MOMENTUM: 1.0, ScoreType.TECHNICAL: 1.0,
        ScoreType.VOLUME: 0.9, ScoreType.PATTERN: 0.8,
    },
    InvestmentHorizon.SIX_MONTHS: {
        ScoreType.FINANCIAL: 1.2, ScoreType.GROWTH: 1.2, ScoreType.QUALITY: 1.1,
        ScoreType.VALUE: 1.1, ScoreType.RISK: 1.1,
        ScoreType.MOMENTUM: 0.8, ScoreType.TECHNICAL: 0.7, ScoreType.PATTERN: 0.6,
    },
    InvestmentHorizon.TWELVE_MONTHS: {
        ScoreType.FINANCIAL: 1.3, ScoreType.GROWTH: 1.3, ScoreType.QUALITY: 1.2,
        ScoreType.VALUE: 1.2, ScoreType.RISK: 1.2,
        ScoreType.MOMENTUM: 0.6, ScoreType.TECHNICAL: 0.5, ScoreType.PATTERN: 0.4,
        ScoreType.SMART_MONEY: 0.5, ScoreType.VOLUME: 0.6,
    },
}


def apply_horizon_adjustments(
    weights: dict[ScoreType, ScoreWeight],
    horizon: InvestmentHorizon,
) -> dict[ScoreType, ScoreWeight]:
    multipliers = HORIZON_MULTIPLIERS.get(horizon, {})
    adjusted: dict[ScoreType, ScoreWeight] = {}
    for st, sw in weights.items():
        mult = multipliers.get(st, 1.0)
        adjusted[st] = ScoreWeight(
            score_type=st,
            weight=sw.weight * mult,
            min_threshold=sw.min_threshold,
            max_threshold=sw.max_threshold,
            penalty_factor=sw.penalty_factor,
            bonus_factor=sw.bonus_factor,
            confidence_multiplier=sw.confidence_multiplier,
        )
    total = sum(sw.weight for sw in adjusted.values())
    if total > 0:
        for sw in adjusted.values():
            sw.weight = sw.weight / total
    return adjusted
