from __future__ import annotations

from typing import Dict

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    InvestmentHorizon,
    ScoreDirection,
)


HORIZON_MULTIPLIERS: Dict[InvestmentHorizon, Dict[ScoringDimension, float]] = {
    InvestmentHorizon.WEEKLY: {
        ScoringDimension.FINANCIAL_QUALITY: 0.5,
        ScoringDimension.VALUATION: 0.6,
        ScoringDimension.GROWTH: 0.5,
        ScoringDimension.PROFITABILITY: 0.5,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.4,
        ScoringDimension.TREND_QUALITY: 1.3,
        ScoringDimension.MOMENTUM: 1.5,
        ScoringDimension.VOLUME: 1.3,
        ScoringDimension.LIQUIDITY: 1.2,
        ScoringDimension.SMART_MONEY: 1.2,
        ScoringDimension.PATTERN_QUALITY: 1.3,
        ScoringDimension.RISK: 0.8,
        ScoringDimension.SECTOR_STRENGTH: 0.7,
        ScoringDimension.MARKET_REGIME: 1.2,
        ScoringDimension.TIMING: 1.5,
        ScoringDimension.HISTORICAL_SIMILARITY: 0.8,
        ScoringDimension.CONFIDENCE: 1.0,
    },
    InvestmentHorizon.ONE_MONTH: {
        ScoringDimension.FINANCIAL_QUALITY: 0.7,
        ScoringDimension.VALUATION: 0.8,
        ScoringDimension.GROWTH: 0.7,
        ScoringDimension.PROFITABILITY: 0.7,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.3,
        ScoringDimension.TREND_QUALITY: 1.2,
        ScoringDimension.MOMENTUM: 1.3,
        ScoringDimension.VOLUME: 1.2,
        ScoringDimension.LIQUIDITY: 1.1,
        ScoringDimension.SMART_MONEY: 1.1,
        ScoringDimension.PATTERN_QUALITY: 1.2,
        ScoringDimension.RISK: 0.9,
        ScoringDimension.SECTOR_STRENGTH: 0.8,
        ScoringDimension.MARKET_REGIME: 1.1,
        ScoringDimension.TIMING: 1.3,
        ScoringDimension.HISTORICAL_SIMILARITY: 0.9,
        ScoringDimension.CONFIDENCE: 1.0,
    },
    InvestmentHorizon.THREE_MONTHS: {
        ScoringDimension.FINANCIAL_QUALITY: 1.0,
        ScoringDimension.VALUATION: 1.0,
        ScoringDimension.GROWTH: 1.0,
        ScoringDimension.PROFITABILITY: 1.0,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.0,
        ScoringDimension.TREND_QUALITY: 1.0,
        ScoringDimension.MOMENTUM: 1.0,
        ScoringDimension.VOLUME: 1.0,
        ScoringDimension.LIQUIDITY: 1.0,
        ScoringDimension.SMART_MONEY: 1.0,
        ScoringDimension.PATTERN_QUALITY: 1.0,
        ScoringDimension.RISK: 1.0,
        ScoringDimension.SECTOR_STRENGTH: 1.0,
        ScoringDimension.MARKET_REGIME: 1.0,
        ScoringDimension.TIMING: 1.0,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.0,
        ScoringDimension.CONFIDENCE: 1.0,
    },
    InvestmentHorizon.SIX_MONTHS: {
        ScoringDimension.FINANCIAL_QUALITY: 1.2,
        ScoringDimension.VALUATION: 1.1,
        ScoringDimension.GROWTH: 1.2,
        ScoringDimension.PROFITABILITY: 1.2,
        ScoringDimension.TECHNICAL_STRUCTURE: 0.8,
        ScoringDimension.TREND_QUALITY: 0.9,
        ScoringDimension.MOMENTUM: 0.8,
        ScoringDimension.VOLUME: 0.9,
        ScoringDimension.LIQUIDITY: 0.9,
        ScoringDimension.SMART_MONEY: 0.9,
        ScoringDimension.PATTERN_QUALITY: 0.8,
        ScoringDimension.RISK: 1.1,
        ScoringDimension.SECTOR_STRENGTH: 1.1,
        ScoringDimension.MARKET_REGIME: 0.9,
        ScoringDimension.TIMING: 0.8,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.2,
        ScoringDimension.CONFIDENCE: 1.1,
    },
    InvestmentHorizon.TWELVE_MONTHS: {
        ScoringDimension.FINANCIAL_QUALITY: 1.3,
        ScoringDimension.VALUATION: 1.2,
        ScoringDimension.GROWTH: 1.3,
        ScoringDimension.PROFITABILITY: 1.3,
        ScoringDimension.TECHNICAL_STRUCTURE: 0.6,
        ScoringDimension.TREND_QUALITY: 0.8,
        ScoringDimension.MOMENTUM: 0.7,
        ScoringDimension.VOLUME: 0.8,
        ScoringDimension.LIQUIDITY: 0.8,
        ScoringDimension.SMART_MONEY: 0.8,
        ScoringDimension.PATTERN_QUALITY: 0.7,
        ScoringDimension.RISK: 1.2,
        ScoringDimension.SECTOR_STRENGTH: 1.2,
        ScoringDimension.MARKET_REGIME: 0.8,
        ScoringDimension.TIMING: 0.7,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.3,
        ScoringDimension.CONFIDENCE: 1.2,
    },
}


def apply_horizon_adjustments(
    dimensions: Dict[ScoringDimension, DimensionWeight],
    horizon: InvestmentHorizon,
) -> Dict[ScoringDimension, DimensionWeight]:
    multipliers = HORIZON_MULTIPLIERS.get(horizon, HORIZON_MULTIPLIERS[InvestmentHorizon.THREE_MONTHS])
    adjusted: Dict[ScoringDimension, DimensionWeight] = {}
    for dim, dw in dimensions.items():
        multiplier = multipliers.get(dim, 1.0)
        new_weight = max(0.01, min(0.30, dw.weight * multiplier))
        adjusted[dim] = DimensionWeight(
            dimension=dw.dimension,
            weight=new_weight,
            direction=dw.direction,
            min_value=dw.min_value,
            max_value=dw.max_value,
            description=dw.description,
        )
    return adjusted


def get_horizon_multiplier(horizon: InvestmentHorizon, dim: ScoringDimension) -> float:
    multipliers = HORIZON_MULTIPLIERS.get(horizon, {})
    return multipliers.get(dim, 1.0)
