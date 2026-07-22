from __future__ import annotations

from typing import Dict

from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    DimensionWeight,
    BonusRule,
    BonusFactor,
    PenaltyRule,
    PenaltyFactor,
    ConfidenceWeightConfig,
)


STANDARD_DIMENSIONS: Dict[ConfidenceDimension, DimensionWeight] = {
    ConfidenceDimension.DATA: DimensionWeight(
        dimension=ConfidenceDimension.DATA, weight=0.12,
        description="Data quality, freshness, completeness",
    ),
    ConfidenceDimension.SIGNAL: DimensionWeight(
        dimension=ConfidenceDimension.SIGNAL, weight=0.14,
        description="Cross-engine signal confirmation",
    ),
    ConfidenceDimension.EVIDENCE: DimensionWeight(
        dimension=ConfidenceDimension.EVIDENCE, weight=0.10,
        description="Evidence coverage and quality",
    ),
    ConfidenceDimension.MODEL: DimensionWeight(
        dimension=ConfidenceDimension.MODEL, weight=0.10,
        description="Historical model accuracy",
    ),
    ConfidenceDimension.HISTORICAL: DimensionWeight(
        dimension=ConfidenceDimension.HISTORICAL, weight=0.10,
        description="Historical win rate and consistency",
    ),
    ConfidenceDimension.PATTERN: DimensionWeight(
        dimension=ConfidenceDimension.PATTERN, weight=0.09,
        description="Pattern quality and confirmation",
    ),
    ConfidenceDimension.RISK: DimensionWeight(
        dimension=ConfidenceDimension.RISK, weight=0.10,
        description="Risk assessment reliability",
    ),
    ConfidenceDimension.MARKET: DimensionWeight(
        dimension=ConfidenceDimension.MARKET, weight=0.09,
        description="Market regime and macro alignment",
    ),
    ConfidenceDimension.SECTOR: DimensionWeight(
        dimension=ConfidenceDimension.SECTOR, weight=0.07,
        description="Sector trend and rotation",
    ),
    ConfidenceDimension.EXECUTION: DimensionWeight(
        dimension=ConfidenceDimension.EXECUTION, weight=0.05,
        description="Trade execution feasibility",
    ),
    ConfidenceDimension.LIQUIDITY: DimensionWeight(
        dimension=ConfidenceDimension.LIQUIDITY, weight=0.04,
        description="Trading liquidity and capacity",
    ),
}

STANDARD_BONUS_RULES: list[BonusRule] = [
    BonusRule(factor=BonusFactor.STRONG_CONFIRMATION, points=4.0, description="Strong signal confirmation"),
    BonusRule(factor=BonusFactor.HIGH_SIMILARITY, points=3.0, description="High historical similarity"),
    BonusRule(factor=BonusFactor.EXCELLENT_EVIDENCE, points=3.0, description="Excellent evidence backing"),
    BonusRule(factor=BonusFactor.INSTITUTIONAL_ACCUMULATION, points=3.0, description="Institutional accumulation"),
    BonusRule(factor=BonusFactor.HISTORICAL_CONSISTENCY, points=2.0, description="Historical consistency"),
]

STANDARD_PENALTY_RULES: list[PenaltyRule] = [
    PenaltyRule(factor=PenaltyFactor.WEAK_DATA, points=-6.0, description="Weak data quality"),
    PenaltyRule(factor=PenaltyFactor.LOW_LIQUIDITY, points=-5.0, description="Low liquidity"),
    PenaltyRule(factor=PenaltyFactor.CONFLICTING_INDICATORS, points=-5.0, description="Conflicting indicators"),
    PenaltyRule(factor=PenaltyFactor.HIGH_VOLATILITY, points=-4.0, description="High market volatility"),
    PenaltyRule(factor=PenaltyFactor.WEAK_EVIDENCE, points=-4.0, description="Weak evidence"),
    PenaltyRule(factor=PenaltyFactor.LOW_HISTORICAL_ACCURACY, points=-3.0, description="Low historical accuracy"),
]


CONSERVATIVE_DIMENSIONS: Dict[ConfidenceDimension, DimensionWeight] = {
    ConfidenceDimension.DATA: DimensionWeight(dimension=ConfidenceDimension.DATA, weight=0.15, description="Data quality"),
    ConfidenceDimension.SIGNAL: DimensionWeight(dimension=ConfidenceDimension.SIGNAL, weight=0.12, description="Signal confirmation"),
    ConfidenceDimension.EVIDENCE: DimensionWeight(dimension=ConfidenceDimension.EVIDENCE, weight=0.12, description="Evidence"),
    ConfidenceDimension.MODEL: DimensionWeight(dimension=ConfidenceDimension.MODEL, weight=0.12, description="Model accuracy"),
    ConfidenceDimension.HISTORICAL: DimensionWeight(dimension=ConfidenceDimension.HISTORICAL, weight=0.12, description="Historical"),
    ConfidenceDimension.PATTERN: DimensionWeight(dimension=ConfidenceDimension.PATTERN, weight=0.08, description="Pattern"),
    ConfidenceDimension.RISK: DimensionWeight(dimension=ConfidenceDimension.RISK, weight=0.12, description="Risk"),
    ConfidenceDimension.MARKET: DimensionWeight(dimension=ConfidenceDimension.MARKET, weight=0.08, description="Market"),
    ConfidenceDimension.SECTOR: DimensionWeight(dimension=ConfidenceDimension.SECTOR, weight=0.05, description="Sector"),
    ConfidenceDimension.EXECUTION: DimensionWeight(dimension=ConfidenceDimension.EXECUTION, weight=0.02, description="Execution"),
    ConfidenceDimension.LIQUIDITY: DimensionWeight(dimension=ConfidenceDimension.LIQUIDITY, weight=0.02, description="Liquidity"),
}


AGGRESSIVE_DIMENSIONS: Dict[ConfidenceDimension, DimensionWeight] = {
    ConfidenceDimension.DATA: DimensionWeight(dimension=ConfidenceDimension.DATA, weight=0.08, description="Data quality"),
    ConfidenceDimension.SIGNAL: DimensionWeight(dimension=ConfidenceDimension.SIGNAL, weight=0.18, description="Signal confirmation"),
    ConfidenceDimension.EVIDENCE: DimensionWeight(dimension=ConfidenceDimension.EVIDENCE, weight=0.08, description="Evidence"),
    ConfidenceDimension.MODEL: DimensionWeight(dimension=ConfidenceDimension.MODEL, weight=0.08, description="Model accuracy"),
    ConfidenceDimension.HISTORICAL: DimensionWeight(dimension=ConfidenceDimension.HISTORICAL, weight=0.08, description="Historical"),
    ConfidenceDimension.PATTERN: DimensionWeight(dimension=ConfidenceDimension.PATTERN, weight=0.12, description="Pattern"),
    ConfidenceDimension.RISK: DimensionWeight(dimension=ConfidenceDimension.RISK, weight=0.06, description="Risk"),
    ConfidenceDimension.MARKET: DimensionWeight(dimension=ConfidenceDimension.MARKET, weight=0.10, description="Market"),
    ConfidenceDimension.SECTOR: DimensionWeight(dimension=ConfidenceDimension.SECTOR, weight=0.08, description="Sector"),
    ConfidenceDimension.EXECUTION: DimensionWeight(dimension=ConfidenceDimension.EXECUTION, weight=0.07, description="Execution"),
    ConfidenceDimension.LIQUIDITY: DimensionWeight(dimension=ConfidenceDimension.LIQUIDITY, weight=0.07, description="Liquidity"),
}


DEFAULT_PROFILES: Dict[str, ConfidenceWeightConfig] = {
    "conservative": ConfidenceWeightConfig(
        profile_name="conservative",
        dimensions=CONSERVATIVE_DIMENSIONS,
        bonus_rules=[r for r in STANDARD_BONUS_RULES],
        penalty_rules=[r for r in STANDARD_PENALTY_RULES],
    ),
    "standard": ConfidenceWeightConfig(
        profile_name="standard",
        dimensions=STANDARD_DIMENSIONS,
        bonus_rules=[r for r in STANDARD_BONUS_RULES],
        penalty_rules=[r for r in STANDARD_PENALTY_RULES],
    ),
    "aggressive": ConfidenceWeightConfig(
        profile_name="aggressive",
        dimensions=AGGRESSIVE_DIMENSIONS,
        bonus_rules=[r for r in STANDARD_BONUS_RULES],
        penalty_rules=[r for r in STANDARD_PENALTY_RULES],
    ),
}


def get_profile_weights(profile_name: str) -> ConfidenceWeightConfig:
    if profile_name in DEFAULT_PROFILES:
        return DEFAULT_PROFILES[profile_name]
    return DEFAULT_PROFILES["standard"]
