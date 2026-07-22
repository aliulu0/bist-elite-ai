from __future__ import annotations

from typing import Dict

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    ScoreDirection,
    BonusRule,
    BonusFactor,
    PenaltyRule,
    PenaltyFactor,
    EliteWeightConfig,
)


CONSERVATIVE_DIMENSIONS: Dict[ScoringDimension, DimensionWeight] = {
    ScoringDimension.FINANCIAL_QUALITY: DimensionWeight(
        dimension=ScoringDimension.FINANCIAL_QUALITY,
        weight=0.12,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Balance sheet strength",
    ),
    ScoringDimension.VALUATION: DimensionWeight(
        dimension=ScoringDimension.VALUATION,
        weight=0.10,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price vs value",
    ),
    ScoringDimension.GROWTH: DimensionWeight(
        dimension=ScoringDimension.GROWTH,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Revenue and earnings growth",
    ),
    ScoringDimension.PROFITABILITY: DimensionWeight(
        dimension=ScoringDimension.PROFITABILITY,
        weight=0.10,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="ROE and margin quality",
    ),
    ScoringDimension.TECHNICAL_STRUCTURE: DimensionWeight(
        dimension=ScoringDimension.TECHNICAL_STRUCTURE,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="RSI, MACD, ADX signals",
    ),
    ScoringDimension.TREND_QUALITY: DimensionWeight(
        dimension=ScoringDimension.TREND_QUALITY,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="SMA crossover and trend",
    ),
    ScoringDimension.MOMENTUM: DimensionWeight(
        dimension=ScoringDimension.MOMENTUM,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price momentum",
    ),
    ScoringDimension.VOLUME: DimensionWeight(
        dimension=ScoringDimension.VOLUME,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Volume profile",
    ),
    ScoringDimension.LIQUIDITY: DimensionWeight(
        dimension=ScoringDimension.LIQUIDITY,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Trading liquidity",
    ),
    ScoringDimension.SMART_MONEY: DimensionWeight(
        dimension=ScoringDimension.SMART_MONEY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Institutional footprints",
    ),
    ScoringDimension.PATTERN_QUALITY: DimensionWeight(
        dimension=ScoringDimension.PATTERN_QUALITY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Classical and candlestick patterns",
    ),
    ScoringDimension.RISK: DimensionWeight(
        dimension=ScoringDimension.RISK,
        weight=0.12,
        direction=ScoreDirection.LOWER_IS_BETTER,
        description="Volatility and drawdown",
    ),
    ScoringDimension.SECTOR_STRENGTH: DimensionWeight(
        dimension=ScoringDimension.SECTOR_STRENGTH,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Sector relative strength",
    ),
    ScoringDimension.MARKET_REGIME: DimensionWeight(
        dimension=ScoringDimension.MARKET_REGIME,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Regime alignment",
    ),
    ScoringDimension.TIMING: DimensionWeight(
        dimension=ScoringDimension.TIMING,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Entry timing quality",
    ),
    ScoringDimension.HISTORICAL_SIMILARITY: DimensionWeight(
        dimension=ScoringDimension.HISTORICAL_SIMILARITY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Historical pattern match",
    ),
    ScoringDimension.CONFIDENCE: DimensionWeight(
        dimension=ScoringDimension.CONFIDENCE,
        weight=0.03,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Cross-engine confidence",
    ),
}

CONSERVATIVE_BONUS_RULES: list[BonusRule] = [
    BonusRule(factor=BonusFactor.STRONG_EARNINGS, points=3.0, description="Strong earnings confirmation"),
    BonusRule(factor=BonusFactor.LOW_VALUATION, points=3.0, description="Attractive valuation"),
    BonusRule(factor=BonusFactor.VOLUME_EXPLOSION, points=1.0, max_applications=1, description="Volume spike"),
]

CONSERVATIVE_PENALTY_RULES: list[PenaltyRule] = [
    PenaltyRule(factor=PenaltyFactor.HIGH_DEBT, points=-8.0, description="High leverage"),
    PenaltyRule(factor=PenaltyFactor.WEAK_EARNINGS, points=-6.0, description="Declining earnings"),
    PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0, description="Low liquidity"),
    PenaltyRule(factor=PenaltyFactor.OVERBOUGHT, points=-3.0, description="Overbought condition"),
    PenaltyRule(factor=PenaltyFactor.CORPORATE_GOVERNANCE, points=-10.0, description="Governance issues"),
]


BALANCED_DIMENSIONS: Dict[ScoringDimension, DimensionWeight] = {
    ScoringDimension.FINANCIAL_QUALITY: DimensionWeight(
        dimension=ScoringDimension.FINANCIAL_QUALITY,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Balance sheet strength",
    ),
    ScoringDimension.VALUATION: DimensionWeight(
        dimension=ScoringDimension.VALUATION,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price vs value",
    ),
    ScoringDimension.GROWTH: DimensionWeight(
        dimension=ScoringDimension.GROWTH,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Revenue and earnings growth",
    ),
    ScoringDimension.PROFITABILITY: DimensionWeight(
        dimension=ScoringDimension.PROFITABILITY,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="ROE and margin quality",
    ),
    ScoringDimension.TECHNICAL_STRUCTURE: DimensionWeight(
        dimension=ScoringDimension.TECHNICAL_STRUCTURE,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="RSI, MACD, ADX signals",
    ),
    ScoringDimension.TREND_QUALITY: DimensionWeight(
        dimension=ScoringDimension.TREND_QUALITY,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="SMA crossover and trend",
    ),
    ScoringDimension.MOMENTUM: DimensionWeight(
        dimension=ScoringDimension.MOMENTUM,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price momentum",
    ),
    ScoringDimension.VOLUME: DimensionWeight(
        dimension=ScoringDimension.VOLUME,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Volume profile",
    ),
    ScoringDimension.LIQUIDITY: DimensionWeight(
        dimension=ScoringDimension.LIQUIDITY,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Trading liquidity",
    ),
    ScoringDimension.SMART_MONEY: DimensionWeight(
        dimension=ScoringDimension.SMART_MONEY,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Institutional footprints",
    ),
    ScoringDimension.PATTERN_QUALITY: DimensionWeight(
        dimension=ScoringDimension.PATTERN_QUALITY,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Classical and candlestick patterns",
    ),
    ScoringDimension.RISK: DimensionWeight(
        dimension=ScoringDimension.RISK,
        weight=0.06,
        direction=ScoreDirection.LOWER_IS_BETTER,
        description="Volatility and drawdown",
    ),
    ScoringDimension.SECTOR_STRENGTH: DimensionWeight(
        dimension=ScoringDimension.SECTOR_STRENGTH,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Sector relative strength",
    ),
    ScoringDimension.MARKET_REGIME: DimensionWeight(
        dimension=ScoringDimension.MARKET_REGIME,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Regime alignment",
    ),
    ScoringDimension.TIMING: DimensionWeight(
        dimension=ScoringDimension.TIMING,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Entry timing quality",
    ),
    ScoringDimension.HISTORICAL_SIMILARITY: DimensionWeight(
        dimension=ScoringDimension.HISTORICAL_SIMILARITY,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Historical pattern match",
    ),
    ScoringDimension.CONFIDENCE: DimensionWeight(
        dimension=ScoringDimension.CONFIDENCE,
        weight=0.05,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Cross-engine confidence",
    ),
}

BALANCED_BONUS_RULES: list[BonusRule] = [
    BonusRule(factor=BonusFactor.GOLDEN_CROSS, points=4.0, description="Golden cross formation"),
    BonusRule(factor=BonusFactor.EARLY_BREAKOUT, points=4.0, description="Early breakout detected"),
    BonusRule(factor=BonusFactor.STRONG_EARNINGS, points=3.0, description="Strong earnings"),
    BonusRule(factor=BonusFactor.VOLUME_EXPLOSION, points=3.0, description="Volume explosion"),
    BonusRule(factor=BonusFactor.INSTITUTIONAL_ACCUMULATION, points=3.0, description="Institutional buying"),
    BonusRule(factor=BonusFactor.SMART_MONEY_CONFIRMATION, points=2.0, description="Smart money flows"),
    BonusRule(factor=BonusFactor.POSITIVE_SECTOR_ROTATION, points=2.0, description="Sector rotation positive"),
    BonusRule(factor=BonusFactor.LOW_VALUATION, points=2.0, description="Low valuation"),
]

BALANCED_PENALTY_RULES: list[PenaltyRule] = [
    PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0, description="Weak liquidity"),
    PenaltyRule(factor=PenaltyFactor.HIGH_DEBT, points=-5.0, description="High debt levels"),
    PenaltyRule(factor=PenaltyFactor.DISTRIBUTION, points=-4.0, description="Distribution phase"),
    PenaltyRule(factor=PenaltyFactor.LATE_TREND, points=-3.0, description="Late trend entry"),
    PenaltyRule(factor=PenaltyFactor.OVERBOUGHT, points=-3.0, description="Overbought RSI"),
    PenaltyRule(factor=PenaltyFactor.WEAK_EARNINGS, points=-4.0, description="Weak earnings"),
    PenaltyRule(factor=PenaltyFactor.NEGATIVE_DIVERGENCE, points=-4.0, description="Bearish divergence"),
    PenaltyRule(factor=PenaltyFactor.CORPORATE_GOVERNANCE, points=-8.0, description="Governance risk"),
]


AGGRESSIVE_DIMENSIONS: Dict[ScoringDimension, DimensionWeight] = {
    ScoringDimension.FINANCIAL_QUALITY: DimensionWeight(
        dimension=ScoringDimension.FINANCIAL_QUALITY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Balance sheet strength",
    ),
    ScoringDimension.VALUATION: DimensionWeight(
        dimension=ScoringDimension.VALUATION,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price vs value",
    ),
    ScoringDimension.GROWTH: DimensionWeight(
        dimension=ScoringDimension.GROWTH,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Revenue and earnings growth",
    ),
    ScoringDimension.PROFITABILITY: DimensionWeight(
        dimension=ScoringDimension.PROFITABILITY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="ROE and margin quality",
    ),
    ScoringDimension.TECHNICAL_STRUCTURE: DimensionWeight(
        dimension=ScoringDimension.TECHNICAL_STRUCTURE,
        weight=0.10,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="RSI, MACD, ADX signals",
    ),
    ScoringDimension.TREND_QUALITY: DimensionWeight(
        dimension=ScoringDimension.TREND_QUALITY,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="SMA crossover and trend",
    ),
    ScoringDimension.MOMENTUM: DimensionWeight(
        dimension=ScoringDimension.MOMENTUM,
        weight=0.12,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Price momentum",
    ),
    ScoringDimension.VOLUME: DimensionWeight(
        dimension=ScoringDimension.VOLUME,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Volume profile",
    ),
    ScoringDimension.LIQUIDITY: DimensionWeight(
        dimension=ScoringDimension.LIQUIDITY,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Trading liquidity",
    ),
    ScoringDimension.SMART_MONEY: DimensionWeight(
        dimension=ScoringDimension.SMART_MONEY,
        weight=0.08,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Institutional footprints",
    ),
    ScoringDimension.PATTERN_QUALITY: DimensionWeight(
        dimension=ScoringDimension.PATTERN_QUALITY,
        weight=0.07,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Classical and candlestick patterns",
    ),
    ScoringDimension.RISK: DimensionWeight(
        dimension=ScoringDimension.RISK,
        weight=0.03,
        direction=ScoreDirection.LOWER_IS_BETTER,
        description="Volatility and drawdown",
    ),
    ScoringDimension.SECTOR_STRENGTH: DimensionWeight(
        dimension=ScoringDimension.SECTOR_STRENGTH,
        weight=0.04,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Sector relative strength",
    ),
    ScoringDimension.MARKET_REGIME: DimensionWeight(
        dimension=ScoringDimension.MARKET_REGIME,
        weight=0.03,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Regime alignment",
    ),
    ScoringDimension.TIMING: DimensionWeight(
        dimension=ScoringDimension.TIMING,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Entry timing quality",
    ),
    ScoringDimension.HISTORICAL_SIMILARITY: DimensionWeight(
        dimension=ScoringDimension.HISTORICAL_SIMILARITY,
        weight=0.06,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Historical pattern match",
    ),
    ScoringDimension.CONFIDENCE: DimensionWeight(
        dimension=ScoringDimension.CONFIDENCE,
        weight=0.03,
        direction=ScoreDirection.HIGHER_IS_BETTER,
        description="Cross-engine confidence",
    ),
}

AGGRESSIVE_BONUS_RULES: list[BonusRule] = [
    BonusRule(factor=BonusFactor.GOLDEN_CROSS, points=5.0, description="Golden cross"),
    BonusRule(factor=BonusFactor.EARLY_BREAKOUT, points=5.0, description="Early breakout"),
    BonusRule(factor=BonusFactor.STRONG_EARNINGS, points=3.0, description="Strong earnings"),
    BonusRule(factor=BonusFactor.VOLUME_EXPLOSION, points=4.0, description="Volume explosion"),
    BonusRule(factor=BonusFactor.INSTITUTIONAL_ACCUMULATION, points=4.0, description="Institutional buying"),
    BonusRule(factor=BonusFactor.SMART_MONEY_CONFIRMATION, points=3.0, description="Smart money"),
    BonusRule(factor=BonusFactor.POSITIVE_SECTOR_ROTATION, points=2.0, description="Sector rotation"),
    BonusRule(factor=BonusFactor.LOW_VALUATION, points=2.0, description="Low valuation"),
]

AGGRESSIVE_PENALTY_RULES: list[PenaltyRule] = [
    PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-3.0, description="Weak liquidity"),
    PenaltyRule(factor=PenaltyFactor.HIGH_DEBT, points=-3.0, description="High debt"),
    PenaltyRule(factor=PenaltyFactor.DISTRIBUTION, points=-3.0, description="Distribution phase"),
    PenaltyRule(factor=PenaltyFactor.LATE_TREND, points=-2.0, description="Late trend"),
    PenaltyRule(factor=PenaltyFactor.OVERBOUGHT, points=-2.0, description="Overbought"),
    PenaltyRule(factor=PenaltyFactor.WEAK_EARNINGS, points=-4.0, description="Weak earnings"),
    PenaltyRule(factor=PenaltyFactor.NEGATIVE_DIVERGENCE, points=-4.0, description="Bearish divergence"),
    PenaltyRule(factor=PenaltyFactor.CORPORATE_GOVERNANCE, points=-8.0, description="Governance risk"),
]


DEFAULT_PROFILES: Dict[str, EliteWeightConfig] = {
    "conservative": EliteWeightConfig(
        profile_name="conservative",
        dimensions=CONSERVATIVE_DIMENSIONS,
        bonus_rules=CONSERVATIVE_BONUS_RULES,
        penalty_rules=CONSERVATIVE_PENALTY_RULES,
    ),
    "balanced": EliteWeightConfig(
        profile_name="balanced",
        dimensions=BALANCED_DIMENSIONS,
        bonus_rules=BALANCED_BONUS_RULES,
        penalty_rules=BALANCED_PENALTY_RULES,
    ),
    "aggressive": EliteWeightConfig(
        profile_name="aggressive",
        dimensions=AGGRESSIVE_DIMENSIONS,
        bonus_rules=AGGRESSIVE_BONUS_RULES,
        penalty_rules=AGGRESSIVE_PENALTY_RULES,
    ),
}


def get_profile_weights(profile_name: str) -> EliteWeightConfig:
    if profile_name in DEFAULT_PROFILES:
        return DEFAULT_PROFILES[profile_name]
    return DEFAULT_PROFILES["balanced"]


def build_dimension_weights(
    dimension_scores: Dict[ScoringDimension, float],
    config: EliteWeightConfig,
) -> Dict[ScoringDimension, float]:
    result: Dict[ScoringDimension, float] = {}
    for dim, weight in config.dimensions.items():
        raw = dimension_scores.get(dim, 0.0)
        if weight.direction == ScoreDirection.LOWER_IS_BETTER:
            normalized = max(0.0, min(100.0, 100.0 - raw))
        else:
            normalized = max(0.0, min(100.0, raw))
        result[dim] = normalized * weight.weight
    return result
