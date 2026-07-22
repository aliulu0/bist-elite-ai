from __future__ import annotations

from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, ScoreWeight,
)


def _sw(st: ScoreType, w: float, **kw) -> ScoreWeight:
    return ScoreWeight(score_type=st, weight=w, **kw)


CONSERVATIVE_BASE = {
    ScoreType.FINANCIAL: 0.18, ScoreType.QUALITY: 0.14, ScoreType.RISK: 0.14,
    ScoreType.VALUE: 0.12, ScoreType.LIQUIDITY: 0.10, ScoreType.TREND: 0.08,
    ScoreType.VOLUME: 0.06, ScoreType.TECHNICAL: 0.06, ScoreType.MOMENTUM: 0.05,
    ScoreType.PATTERN: 0.04, ScoreType.SMART_MONEY: 0.03,
}

BALANCED_BASE = {
    ScoreType.FINANCIAL: 0.12, ScoreType.TECHNICAL: 0.12, ScoreType.MOMENTUM: 0.10,
    ScoreType.TREND: 0.10, ScoreType.VOLUME: 0.08, ScoreType.SMART_MONEY: 0.08,
    ScoreType.PATTERN: 0.08, ScoreType.VALUE: 0.08, ScoreType.GROWTH: 0.07,
    ScoreType.QUALITY: 0.07, ScoreType.RISK: 0.05, ScoreType.LIQUIDITY: 0.05,
}

GROWTH_BASE = {
    ScoreType.GROWTH: 0.18, ScoreType.MOMENTUM: 0.14, ScoreType.TECHNICAL: 0.12,
    ScoreType.TREND: 0.12, ScoreType.SMART_MONEY: 0.10, ScoreType.PATTERN: 0.08,
    ScoreType.FINANCIAL: 0.08, ScoreType.VOLUME: 0.07, ScoreType.QUALITY: 0.05,
    ScoreType.VALUE: 0.03, ScoreType.RISK: 0.02, ScoreType.LIQUIDITY: 0.01,
}

AGGRESSIVE_BASE = {
    ScoreType.MOMENTUM: 0.18, ScoreType.TECHNICAL: 0.16, ScoreType.SMART_MONEY: 0.14,
    ScoreType.TREND: 0.12, ScoreType.PATTERN: 0.10, ScoreType.VOLUME: 0.10,
    ScoreType.GROWTH: 0.08, ScoreType.FINANCIAL: 0.05, ScoreType.QUALITY: 0.03,
    ScoreType.VALUE: 0.02, ScoreType.RISK: 0.01, ScoreType.LIQUIDITY: 0.01,
}

VERY_CONSERVATIVE_BASE = {
    ScoreType.QUALITY: 0.20, ScoreType.FINANCIAL: 0.18, ScoreType.RISK: 0.16,
    ScoreType.LIQUIDITY: 0.12, ScoreType.VALUE: 0.10, ScoreType.TREND: 0.08,
    ScoreType.VOLUME: 0.05, ScoreType.TECHNICAL: 0.05, ScoreType.MOMENTUM: 0.03,
    ScoreType.PATTERN: 0.02, ScoreType.SMART_MONEY: 0.01,
}


DEFAULT_PROFILES: dict[WeightProfile, dict[ScoreType, float]] = {
    WeightProfile.VERY_CONSERVATIVE: VERY_CONSERVATIVE_BASE,
    WeightProfile.CONSERVATIVE: CONSERVATIVE_BASE,
    WeightProfile.BALANCED: BALANCED_BASE,
    WeightProfile.GROWTH: GROWTH_BASE,
    ScoreType.AGGRESSIVE if False else WeightProfile.AGGRESSIVE: AGGRESSIVE_BASE,
}


def get_profile_weights(profile: WeightProfile) -> dict[ScoreType, float]:
    if profile == WeightProfile.CUSTOM:
        return {st: 1.0 / len(ScoreType) for st in ScoreType}
    return dict(DEFAULT_PROFILES.get(profile, BALANCED_BASE))


def build_score_weights(profile: WeightProfile) -> dict[ScoreType, ScoreWeight]:
    raw = get_profile_weights(profile)
    return {st: _sw(st, w) for st, w in raw.items()}
