from __future__ import annotations

import enum
import dataclasses
import uuid
import datetime
from typing import Dict, List, Optional, Any


class EliteCategory(enum.Enum):
    AVOID = "avoid"
    WEAK = "weak"
    WATCH = "watch"
    GOOD = "good"
    STRONG = "strong"
    ELITE = "elite"
    EXCEPTIONAL = "exceptional"


class EliteLabel(enum.Enum):
    UNDERVALUED = "undervalued"
    HIGH_CONVICTION = "high_conviction"
    EARLY_OPPORTUNITY = "early_opportunity"
    BREAKOUT_CANDIDATE = "breakout_candidate"
    WATCHLIST = "watchlist"
    HIGH_RISK = "high_risk"


class ScoringDimension(enum.Enum):
    FINANCIAL_QUALITY = "financial_quality"
    VALUATION = "valuation"
    GROWTH = "growth"
    PROFITABILITY = "profitability"
    TECHNICAL_STRUCTURE = "technical_structure"
    TREND_QUALITY = "trend_quality"
    MOMENTUM = "momentum"
    VOLUME = "volume"
    LIQUIDITY = "liquidity"
    SMART_MONEY = "smart_money"
    PATTERN_QUALITY = "pattern_quality"
    RISK = "risk"
    SECTOR_STRENGTH = "sector_strength"
    MARKET_REGIME = "market_regime"
    TIMING = "timing"
    HISTORICAL_SIMILARITY = "historical_similarity"
    CONFIDENCE = "confidence"


class SectorType(enum.Enum):
    BANKS = "banks"
    HOLDINGS = "holdings"
    INDUSTRIALS = "industrials"
    TECHNOLOGY = "technology"
    ENERGY = "energy"
    RETAIL = "retail"
    TRANSPORTATION = "transportation"
    CONSTRUCTION = "construction"
    INSURANCE = "insurance"
    REAL_ESTATE = "real_estate"
    MINING = "mining"
    OTHER = "other"


class BonusFactor(enum.Enum):
    GOLDEN_CROSS = "golden_cross"
    EARLY_BREAKOUT = "early_breakout"
    STRONG_EARNINGS = "strong_earnings"
    VOLUME_EXPLOSION = "volume_explosion"
    INSTITUTIONAL_ACCUMULATION = "institutional_accumulation"
    SMART_MONEY_CONFIRMATION = "smart_money_confirmation"
    POSITIVE_SECTOR_ROTATION = "positive_sector_rotation"
    LOW_VALUATION = "low_valuation"


class PenaltyFactor(enum.Enum):
    WEAK_LIQUIDITY = "weak_liquidity"
    HIGH_DEBT = "high_debt"
    DISTRIBUTION = "distribution"
    LATE_TREND = "late_trend"
    OVERBOUGHT = "overbought"
    WEAK_EARNINGS = "weak_earnings"
    NEGATIVE_DIVERGENCE = "negative_divergence"
    CORPORATE_GOVERNANCE = "corporate_governance"


class EliteTrend(enum.Enum):
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"


class InvestmentHorizon(enum.Enum):
    WEEKLY = "weekly"
    ONE_MONTH = "one_month"
    THREE_MONTHS = "three_months"
    SIX_MONTHS = "six_months"
    TWELVE_MONTHS = "twelve_months"


class MarketRegime(enum.Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class RankingPeriod(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ScoreDirection(enum.Enum):
    HIGHER_IS_BETTER = "higher_is_better"
    LOWER_IS_BETTER = "lower_is_better"


@dataclasses.dataclass(frozen=True, slots=True)
class DimensionWeight:
    dimension: ScoringDimension
    weight: float
    direction: ScoreDirection = ScoreDirection.HIGHER_IS_BETTER
    min_value: float = 0.0
    max_value: float = 100.0
    description: str = ""


@dataclasses.dataclass(frozen=True, slots=True)
class BonusRule:
    factor: BonusFactor
    points: float
    condition: str = ""
    max_applications: int = 1
    description: str = ""


@dataclasses.dataclass(frozen=True, slots=True)
class PenaltyRule:
    factor: PenaltyFactor
    points: float
    condition: str = ""
    max_applications: int = 1
    description: str = ""


@dataclasses.dataclass(slots=True)
class EliteWeightConfig:
    profile_name: str
    dimensions: Dict[ScoringDimension, DimensionWeight]
    bonus_rules: List[BonusRule] = dataclasses.field(default_factory=list)
    penalty_rules: List[PenaltyRule] = dataclasses.field(default_factory=list)
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    regime: MarketRegime = MarketRegime.SIDEWAYS
    sector: SectorType = SectorType.OTHER
    total_weight: float = 1.0


@dataclasses.dataclass(slots=True)
class DimensionContribution:
    dimension: ScoringDimension
    raw_score: float
    normalized_score: float
    weighted_score: float
    contribution: float
    direction: ScoreDirection
    weight: float
    confidence: float = 1.0
    evidence_count: int = 0


@dataclasses.dataclass(slots=True)
class BonusApplied:
    factor: BonusFactor
    points: float
    condition: str
    applied_count: int = 1


@dataclasses.dataclass(slots=True)
class PenaltyApplied:
    factor: PenaltyFactor
    points: float
    condition: str
    applied_count: int = 1


@dataclasses.dataclass(slots=True)
class EliteScoreResult:
    symbol: str
    elite_score: float
    elite_category: EliteCategory
    label: EliteLabel
    dimension_contributions: Dict[ScoringDimension, DimensionContribution]
    bonuses: List[BonusApplied]
    penalties: List[PenaltyApplied]
    raw_score: float
    total_weight: float
    confidence: float
    evidence_count: int
    horizon: InvestmentHorizon
    regime: MarketRegime
    sector: SectorType
    calculated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )
    calculation_id: str = dataclasses.field(default_factory=lambda: uuid.uuid4().hex[:12])
    source_scores: Optional[Dict[str, Any]] = None
    source_breakdowns: Optional[Dict[str, Any]] = None


@dataclasses.dataclass(slots=True)
class EliteScoreHistoryEntry:
    symbol: str
    elite_score: float
    elite_category: EliteCategory
    label: EliteLabel
    ranking: Optional[int] = None
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    calculated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )
    delta: float = 0.0
    trend: EliteTrend = EliteTrend.STABLE


@dataclasses.dataclass(slots=True)
class EliteRankingEntry:
    symbol: str
    elite_score: float
    elite_category: EliteCategory
    label: EliteLabel
    rank: int
    previous_rank: Optional[int] = None
    rank_change: int = 0
    trend: EliteTrend = EliteTrend.STABLE
    sector: SectorType = SectorType.OTHER
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    period: RankingPeriod = RankingPeriod.DAILY
    calculated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )


@dataclasses.dataclass(slots=True)
class EliteScoreTrend:
    symbol: str
    current_score: float
    previous_score: float
    delta: float
    trend: EliteTrend
    history: List[EliteScoreHistoryEntry] = dataclasses.field(default_factory=list)
    avg_score: float = 0.0
    volatility: float = 0.0


@dataclasses.dataclass(slots=True)
class EliteProfile:
    name: str
    description: str
    dimension_weights: Dict[ScoringDimension, DimensionWeight]
    bonus_rules: List[BonusRule] = dataclasses.field(default_factory=list)
    penalty_rules: List[PenaltyRule] = dataclasses.field(default_factory=list)
    is_active: bool = True


@dataclasses.dataclass(slots=True)
class EliteCalculationRequest:
    symbol: str
    scores: Dict[str, float]
    dimension_scores: Optional[Dict[str, float]] = None
    breakdowns: Optional[Dict[str, Any]] = None
    profile_name: str = "balanced"
    horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH
    regime: MarketRegime = MarketRegime.SIDEWAYS
    sector: SectorType = SectorType.OTHER
    source_scores: Optional[Dict[str, Any]] = None
    source_breakdowns: Optional[Dict[str, Any]] = None


@dataclasses.dataclass(slots=True)
class BenchmarkResult:
    operation: str
    execution_time_ms: float
    memory_mb: float
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    p95_time_ms: float
    success: bool = True
    error_message: Optional[str] = None


def classify_elite(score: float) -> EliteCategory:
    if score >= 96:
        return EliteCategory.EXCEPTIONAL
    if score >= 90:
        return EliteCategory.ELITE
    if score >= 76:
        return EliteCategory.STRONG
    if score >= 61:
        return EliteCategory.GOOD
    if score >= 41:
        return EliteCategory.WATCH
    if score >= 21:
        return EliteCategory.WEAK
    return EliteCategory.AVOID


def classify_label(
    score: float,
    bonuses: List[BonusApplied],
    penalties: List[PenaltyApplied],
) -> EliteLabel:
    bonus_count = len(bonuses)
    penalty_count = len(penalties)
    if score >= 90 and bonus_count >= 2:
        return EliteLabel.HIGH_CONVICTION
    if score >= 76 and any(b.factor == BonusFactor.EARLY_BREAKOUT for b in bonuses):
        return EliteLabel.BREAKOUT_CANDIDATE
    if score >= 61 and any(b.factor == BonusFactor.LOW_VALUATION for b in bonuses):
        return EliteLabel.UNDERVALUED
    if score >= 61:
        return EliteLabel.EARLY_OPPORTUNITY
    if penalty_count >= 3 or score < 30:
        return EliteLabel.HIGH_RISK
    return EliteLabel.WATCHLIST


CATEGORY_RANGES: Dict[EliteCategory, tuple[float, float]] = {
    EliteCategory.AVOID: (0.0, 20.0),
    EliteCategory.WEAK: (21.0, 40.0),
    EliteCategory.WATCH: (41.0, 60.0),
    EliteCategory.GOOD: (61.0, 75.0),
    EliteCategory.STRONG: (76.0, 89.0),
    EliteCategory.ELITE: (90.0, 95.0),
    EliteCategory.EXCEPTIONAL: (96.0, 100.0),
}


CATEGORY_DESCRIPTIONS: Dict[EliteCategory, str] = {
    EliteCategory.AVOID: "Stocks with weak fundamentals and technicals",
    EliteCategory.WEAK: "Below average opportunity, requires caution",
    EliteCategory.WATCH: "Neutral stocks worth monitoring",
    EliteCategory.GOOD: "Above average opportunity with positive signals",
    EliteCategory.STRONG: "High-quality opportunity with multiple confirmations",
    EliteCategory.ELITE: "Exceptional opportunity with institutional-grade signals",
    EliteCategory.EXCEPTIONAL: "Rare opportunity with extreme conviction signals",
}


LABEL_DESCRIPTIONS: Dict[EliteLabel, str] = {
    EliteLabel.UNDERVALUED: "Trading below intrinsic value with positive catalysts",
    EliteLabel.HIGH_CONVICTION: "Strong conviction with multiple confirming signals",
    EliteLabel.EARLY_OPPORTUNITY: "Early stage opportunity before market recognition",
    EliteLabel.BREAKOUT_CANDIDATE: "Technical breakout pattern forming",
    EliteLabel.WATCHLIST: "Neutral, worth adding to watchlist",
    EliteLabel.HIGH_RISK: "Elevated risk factors detected",
}
