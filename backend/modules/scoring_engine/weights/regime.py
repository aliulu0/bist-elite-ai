from __future__ import annotations

from modules.scoring_engine.core.types import (
    ScoreType, MarketRegime, ScoreWeight,
)


REGIME_ADJUSTMENTS: dict[MarketRegime, dict[ScoreType, float]] = {
    MarketRegime.BULL: {
        ScoreType.MOMENTUM: 1.3, ScoreType.TREND: 1.2, ScoreType.SMART_MONEY: 1.2,
        ScoreType.GROWTH: 1.1, ScoreType.TECHNICAL: 1.1,
        ScoreType.RISK: 0.7, ScoreType.VALUE: 0.8, ScoreType.QUALITY: 0.9,
    },
    MarketRegime.BEAR: {
        ScoreType.RISK: 1.5, ScoreType.QUALITY: 1.3, ScoreType.FINANCIAL: 1.2,
        ScoreType.VALUE: 1.2, ScoreType.LIQUIDITY: 1.1,
        ScoreType.MOMENTUM: 0.6, ScoreType.GROWTH: 0.6, ScoreType.TREND: 0.7,
        ScoreType.SMART_MONEY: 0.8, ScoreType.PATTERN: 0.7,
    },
    MarketRegime.SIDEWAYS: {
        ScoreType.VOLUME: 1.2, ScoreType.SMART_MONEY: 1.2, ScoreType.PATTERN: 1.1,
        ScoreType.TECHNICAL: 1.1, ScoreType.MOMENTUM: 0.9,
        ScoreType.TREND: 0.8, ScoreType.GROWTH: 0.9,
    },
    MarketRegime.HIGH_VOLATILITY: {
        ScoreType.RISK: 1.4, ScoreType.LIQUIDITY: 1.3, ScoreType.QUALITY: 1.2,
        ScoreType.FINANCIAL: 1.1,
        ScoreType.MOMENTUM: 0.6, ScoreType.GROWTH: 0.7, ScoreType.SMART_MONEY: 0.8,
    },
    MarketRegime.LOW_VOLATILITY: {
        ScoreType.MOMENTUM: 1.2, ScoreType.TREND: 1.1, ScoreType.GROWTH: 1.1,
        ScoreType.TECHNICAL: 1.1,
        ScoreType.RISK: 0.8, ScoreType.LIQUIDITY: 0.9,
    },
}


def apply_regime_adjustments(
    weights: dict[ScoreType, ScoreWeight],
    regime: MarketRegime,
) -> dict[ScoreType, ScoreWeight]:
    adjustments = REGIME_ADJUSTMENTS.get(regime, {})
    adjusted: dict[ScoreType, ScoreWeight] = {}
    for st, sw in weights.items():
        mult = adjustments.get(st, 1.0)
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
