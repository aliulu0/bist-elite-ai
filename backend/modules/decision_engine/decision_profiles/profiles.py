from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from modules.decision_engine.core.types import DecisionDimension


@dataclass
class DecisionWeightProfile:
    name: str
    description: str
    dimension_weights: Dict[DecisionDimension, float]
    risk_tolerance: float = 50.0
    aggression_level: float = 50.0
    min_confidence_threshold: float = 40.0
    max_conflicts_allowed: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)


CONSERVATIVE_DIMENSIONS: Dict[DecisionDimension, float] = {
    DecisionDimension.FINANCIAL_QUALITY: 0.15,
    DecisionDimension.VALUATION: 0.12,
    DecisionDimension.GROWTH: 0.08,
    DecisionDimension.TECHNICAL_TREND: 0.08,
    DecisionDimension.MOMENTUM: 0.06,
    DecisionDimension.SMART_MONEY: 0.08,
    DecisionDimension.PATTERN_QUALITY: 0.05,
    DecisionDimension.RISK: 0.15,
    DecisionDimension.SECTOR_STRENGTH: 0.08,
    DecisionDimension.MARKET_REGIME: 0.07,
    DecisionDimension.LIQUIDITY: 0.04,
    DecisionDimension.CONFIDENCE: 0.02,
    DecisionDimension.HISTORICAL_SIMILARITY: 0.02,
}

BALANCED_DIMENSIONS: Dict[DecisionDimension, float] = {
    DecisionDimension.FINANCIAL_QUALITY: 0.10,
    DecisionDimension.VALUATION: 0.10,
    DecisionDimension.GROWTH: 0.08,
    DecisionDimension.TECHNICAL_TREND: 0.10,
    DecisionDimension.MOMENTUM: 0.09,
    DecisionDimension.SMART_MONEY: 0.09,
    DecisionDimension.PATTERN_QUALITY: 0.07,
    DecisionDimension.RISK: 0.10,
    DecisionDimension.SECTOR_STRENGTH: 0.08,
    DecisionDimension.MARKET_REGIME: 0.08,
    DecisionDimension.LIQUIDITY: 0.06,
    DecisionDimension.CONFIDENCE: 0.03,
    DecisionDimension.HISTORICAL_SIMILARITY: 0.02,
}

AGGRESSIVE_DIMENSIONS: Dict[DecisionDimension, float] = {
    DecisionDimension.FINANCIAL_QUALITY: 0.06,
    DecisionDimension.VALUATION: 0.06,
    DecisionDimension.GROWTH: 0.10,
    DecisionDimension.TECHNICAL_TREND: 0.14,
    DecisionDimension.MOMENTUM: 0.15,
    DecisionDimension.SMART_MONEY: 0.12,
    DecisionDimension.PATTERN_QUALITY: 0.10,
    DecisionDimension.RISK: 0.04,
    DecisionDimension.SECTOR_STRENGTH: 0.08,
    DecisionDimension.MARKET_REGIME: 0.08,
    DecisionDimension.LIQUIDITY: 0.03,
    DecisionDimension.CONFIDENCE: 0.02,
    DecisionDimension.HISTORICAL_SIMILARITY: 0.02,
}

DEFAULT_PROFILES: Dict[str, DecisionWeightProfile] = {
    "conservative": DecisionWeightProfile(
        name="conservative",
        description="Prioritizes safety, quality, and risk management",
        dimension_weights=CONSERVATIVE_DIMENSIONS,
        risk_tolerance=30.0,
        aggression_level=20.0,
        min_confidence_threshold=50.0,
        max_conflicts_allowed=2,
    ),
    "balanced": DecisionWeightProfile(
        name="balanced",
        description="Balanced approach across all dimensions",
        dimension_weights=BALANCED_DIMENSIONS,
        risk_tolerance=50.0,
        aggression_level=50.0,
        min_confidence_threshold=40.0,
        max_conflicts_allowed=3,
    ),
    "aggressive": DecisionWeightProfile(
        name="aggressive",
        description="Prioritizes momentum, growth, and opportunity detection",
        dimension_weights=AGGRESSIVE_DIMENSIONS,
        risk_tolerance=75.0,
        aggression_level=80.0,
        min_confidence_threshold=30.0,
        max_conflicts_allowed=4,
    ),
}


def get_profile_weights(name: str) -> DecisionWeightProfile:
    return DEFAULT_PROFILES.get(name, DEFAULT_PROFILES["balanced"])
