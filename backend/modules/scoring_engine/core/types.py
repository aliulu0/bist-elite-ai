from __future__ import annotations

from enum import Enum
from dataclasses import dataclass, field
from typing import Any
import time


class ScoreType(str, Enum):
    ELITE = "elite"
    OPPORTUNITY = "opportunity"
    CONFIDENCE = "confidence"
    RISK = "risk"
    GROWTH = "growth"
    VALUE = "value"
    MOMENTUM = "momentum"
    TREND = "trend"
    TECHNICAL = "technical"
    FINANCIAL = "financial"
    SMART_MONEY = "smart_money"
    VOLUME = "volume"
    LIQUIDITY = "liquidity"
    PATTERN = "pattern"
    QUALITY = "quality"
    SECTOR_STRENGTH = "sector_strength"
    TIMING = "timing"
    PROBABILITY = "probability"
    COMPOSITE = "composite"


class WeightProfile(str, Enum):
    VERY_CONSERVATIVE = "very_conservative"
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    GROWTH = "growth"
    AGGRESSIVE = "aggressive"
    CUSTOM = "custom"


class InvestmentHorizon(str, Enum):
    WEEKLY = "weekly"
    ONE_MONTH = "one_month"
    THREE_MONTHS = "three_months"
    SIX_MONTHS = "six_months"
    TWELVE_MONTHS = "twelve_months"


class MarketRegime(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class ScoringMethod(str, Enum):
    WEIGHTED = "weighted"
    RULE_BASED = "rule_based"
    REGIME_ADJUSTED = "regime_adjusted"
    HISTORICAL_OPTIMIZED = "historical_optimized"
    DYNAMIC = "dynamic"
    COMPOSITE = "composite"


class ScoreDirection(str, Enum):
    HIGHER_IS_BETTER = "higher_is_better"
    LOWER_IS_BETTER = "lower_is_better"
    NEUTRAL = "neutral"


@dataclass
class ScoreWeight:
    score_type: ScoreType
    weight: float
    min_threshold: float = 0.0
    max_threshold: float = 100.0
    penalty_factor: float = 0.0
    bonus_factor: float = 0.0
    confidence_multiplier: float = 1.0

    def clamp(self) -> ScoreWeight:
        self.weight = max(0.0, min(1.0, self.weight))
        self.min_threshold = max(0.0, min(100.0, self.min_threshold))
        self.max_threshold = max(self.min_threshold, min(100.0, self.max_threshold))
        return self


@dataclass
class ScoreBreakdown:
    score_type: ScoreType
    raw_score: float
    normalized_score: float
    weight: float
    contribution: float
    penalty: float
    bonus: float
    final_contribution: float
    confidence: float = 1.0
    direction: ScoreDirection = ScoreDirection.HIGHER_IS_BETTER
    evidence_count: int = 0
    calculation_time_ms: float = 0.0

    @property
    def weighted_score(self) -> float:
        return self.final_contribution * self.weight


@dataclass
class ScoreHistoryEntry:
    score_type: ScoreType
    score: float
    timestamp: str
    profile: WeightProfile = WeightProfile.BALANCED
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    regime: MarketRegime = MarketRegime.SIDEWAYS


@dataclass
class ScoreTrend:
    score_type: ScoreType
    current: float
    previous: float
    delta: float
    trend_direction: str = "stable"
    history_count: int = 0


@dataclass
class ScoreResult:
    symbol: str
    scores: dict[str, float] = field(default_factory=dict)
    breakdowns: dict[str, ScoreBreakdown] = field(default_factory=dict)
    profile: WeightProfile = WeightProfile.BALANCED
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    regime: MarketRegime = MarketRegime.SIDEWAYS
    composite_score: float = 0.0
    confidence: float = 0.0
    method: ScoringMethod = ScoringMethod.WEIGHTED
    timestamp: str = ""
    calculation_time_ms: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)

    def get_score(self, score_type: ScoreType) -> float:
        return self.scores.get(score_type.value, 0.0)

    def get_breakdown(self, score_type: ScoreType) -> ScoreBreakdown | None:
        return self.breakdowns.get(score_type.value)

    def top_scores(self, n: int = 5) -> list[tuple[str, float]]:
        sorted_scores = sorted(self.scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[:n]


@dataclass
class WeightConfig:
    profile: WeightProfile
    horizon: InvestmentHorizon
    regime: MarketRegime
    weights: dict[ScoreType, ScoreWeight] = field(default_factory=dict)
    penalty_rules: list[PenaltyRule] = field(default_factory=list)
    bonus_rules: list[BonusRule] = field(default_factory=list)
    normalization_min: float = 0.0
    normalization_max: float = 100.0

    def get_weight(self, score_type: ScoreType) -> ScoreWeight:
        if score_type in self.weights:
            return self.weights[score_type]
        return ScoreWeight(score_type=score_type, weight=0.0)

    def total_weight(self) -> float:
        return sum(sw.weight for sw in self.weights.values())

    def normalize_weights(self) -> None:
        total = self.total_weight()
        if total > 0:
            for sw in self.weights.values():
                sw.weight = sw.weight / total


@dataclass
class PenaltyRule:
    name: str
    condition: str
    penalty_factor: float
    applies_to: list[ScoreType] = field(default_factory=list)
    enabled: bool = True


@dataclass
class BonusRule:
    name: str
    condition: str
    bonus_factor: float
    applies_to: list[ScoreType] = field(default_factory=list)
    enabled: bool = True


@dataclass
class OptimizationResult:
    original_weights: dict[str, float]
    optimized_weights: dict[str, float]
    improvement_pct: float
    iterations: int
    method: str = "rule_based"
    timestamp: str = ""


@dataclass
class ScoringProfile:
    name: str
    profile: WeightProfile
    description: str
    weights: dict[ScoreType, float] = field(default_factory=dict)
    horizon_defaults: dict[InvestmentHorizon, dict[ScoreType, float]] = field(default_factory=dict)
    regime_adjustments: dict[MarketRegime, dict[ScoreType, float]] = field(default_factory=dict)
    is_active: bool = True
    created_at: str = ""
    updated_at: str = ""


@dataclass
class BenchmarkResult:
    iterations: int = 0
    total_seconds: float = 0.0
    avg_ms: float = 0.0
    ops_per_second: float = 0.0
    memory_bytes: int = 0
