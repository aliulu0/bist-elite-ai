from __future__ import annotations

from typing import Dict

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    MarketRegime,
    ScoreDirection,
)


REGIME_ADJUSTMENTS: Dict[MarketRegime, Dict[ScoringDimension, float]] = {
    MarketRegime.BULL: {
        ScoringDimension.FINANCIAL_QUALITY: 0.8,
        ScoringDimension.VALUATION: 0.8,
        ScoringDimension.GROWTH: 1.2,
        ScoringDimension.PROFITABILITY: 1.0,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.1,
        ScoringDimension.TREND_QUALITY: 1.2,
        ScoringDimension.MOMENTUM: 1.3,
        ScoringDimension.VOLUME: 1.1,
        ScoringDimension.LIQUIDITY: 1.0,
        ScoringDimension.SMART_MONEY: 1.1,
        ScoringDimension.PATTERN_QUALITY: 1.0,
        ScoringDimension.RISK: 0.7,
        ScoringDimension.SECTOR_STRENGTH: 1.1,
        ScoringDimension.MARKET_REGIME: 1.3,
        ScoringDimension.TIMING: 1.0,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.0,
        ScoringDimension.CONFIDENCE: 1.0,
    },
    MarketRegime.BEAR: {
        ScoringDimension.FINANCIAL_QUALITY: 1.3,
        ScoringDimension.VALUATION: 1.3,
        ScoringDimension.GROWTH: 0.8,
        ScoringDimension.PROFITABILITY: 1.2,
        ScoringDimension.TECHNICAL_STRUCTURE: 0.8,
        ScoringDimension.TREND_QUALITY: 0.8,
        ScoringDimension.MOMENTUM: 0.7,
        ScoringDimension.VOLUME: 0.9,
        ScoringDimension.LIQUIDITY: 1.1,
        ScoringDimension.SMART_MONEY: 1.2,
        ScoringDimension.PATTERN_QUALITY: 0.8,
        ScoringDimension.RISK: 1.4,
        ScoringDimension.SECTOR_STRENGTH: 0.9,
        ScoringDimension.MARKET_REGIME: 0.6,
        ScoringDimension.TIMING: 0.8,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.1,
        ScoringDimension.CONFIDENCE: 1.1,
    },
    MarketRegime.SIDEWAYS: {
        ScoringDimension.FINANCIAL_QUALITY: 1.1,
        ScoringDimension.VALUATION: 1.1,
        ScoringDimension.GROWTH: 1.0,
        ScoringDimension.PROFITABILITY: 1.0,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.0,
        ScoringDimension.TREND_QUALITY: 1.0,
        ScoringDimension.MOMENTUM: 1.0,
        ScoringDimension.VOLUME: 1.0,
        ScoringDimension.LIQUIDITY: 1.0,
        ScoringDimension.SMART_MONEY: 1.1,
        ScoringDimension.PATTERN_QUALITY: 1.0,
        ScoringDimension.RISK: 1.1,
        ScoringDimension.SECTOR_STRENGTH: 1.0,
        ScoringDimension.MARKET_REGIME: 1.0,
        ScoringDimension.TIMING: 1.1,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.1,
        ScoringDimension.CONFIDENCE: 1.0,
    },
    MarketRegime.HIGH_VOLATILITY: {
        ScoringDimension.FINANCIAL_QUALITY: 1.2,
        ScoringDimension.VALUATION: 1.0,
        ScoringDimension.GROWTH: 0.8,
        ScoringDimension.PROFITABILITY: 1.1,
        ScoringDimension.TECHNICAL_STRUCTURE: 0.8,
        ScoringDimension.TREND_QUALITY: 0.8,
        ScoringDimension.MOMENTUM: 0.8,
        ScoringDimension.VOLUME: 1.2,
        ScoringDimension.LIQUIDITY: 1.2,
        ScoringDimension.SMART_MONEY: 1.2,
        ScoringDimension.PATTERN_QUALITY: 0.7,
        ScoringDimension.RISK: 1.3,
        ScoringDimension.SECTOR_STRENGTH: 0.8,
        ScoringDimension.MARKET_REGIME: 0.7,
        ScoringDimension.TIMING: 0.9,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.0,
        ScoringDimension.CONFIDENCE: 1.2,
    },
    MarketRegime.LOW_VOLATILITY: {
        ScoringDimension.FINANCIAL_QUALITY: 0.9,
        ScoringDimension.VALUATION: 1.0,
        ScoringDimension.GROWTH: 1.1,
        ScoringDimension.PROFITABILITY: 0.9,
        ScoringDimension.TECHNICAL_STRUCTURE: 1.2,
        ScoringDimension.TREND_QUALITY: 1.2,
        ScoringDimension.MOMENTUM: 1.2,
        ScoringDimension.VOLUME: 0.8,
        ScoringDimension.LIQUIDITY: 0.9,
        ScoringDimension.SMART_MONEY: 0.9,
        ScoringDimension.PATTERN_QUALITY: 1.1,
        ScoringDimension.RISK: 0.8,
        ScoringDimension.SECTOR_STRENGTH: 1.1,
        ScoringDimension.MARKET_REGIME: 1.2,
        ScoringDimension.TIMING: 1.1,
        ScoringDimension.HISTORICAL_SIMILARITY: 1.1,
        ScoringDimension.CONFIDENCE: 0.9,
    },
}


def apply_regime_adjustments(
    dimensions: Dict[ScoringDimension, DimensionWeight],
    regime: MarketRegime,
) -> Dict[ScoringDimension, DimensionWeight]:
    adjustments = REGIME_ADJUSTMENTS.get(regime, {})
    adjusted: Dict[ScoringDimension, DimensionWeight] = {}
    for dim, dw in dimensions.items():
        multiplier = adjustments.get(dim, 1.0)
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


def get_regime_multiplier(regime: MarketRegime, dim: ScoringDimension) -> float:
    adjustments = REGIME_ADJUSTMENTS.get(regime, {})
    return adjustments.get(dim, 1.0)
