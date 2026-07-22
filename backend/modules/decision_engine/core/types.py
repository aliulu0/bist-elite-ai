from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ── Enums ──────────────────────────────────────────────────────────────────

class DecisionType(enum.Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    EARLY_ACCUMULATION = "early_accumulation"
    ACCUMULATE = "accumulate"
    WATCH = "watch"
    WAIT_CONFIRMATION = "wait_for_confirmation"
    NEUTRAL = "neutral"
    REDUCE = "reduce"
    TAKE_PROFIT = "take_profit"
    AVOID = "avoid"
    DISTRIBUTION_RISK = "distribution_risk"


class EntryTiming(enum.Enum):
    IMMEDIATE = "immediate_entry"
    WAIT_PULLBACK = "wait_pullback"
    WAIT_BREAKOUT = "wait_breakout"
    SCALE_IN = "scale_in"
    NO_ENTRY = "no_entry"


class ExitAction(enum.Enum):
    HOLD = "hold"
    TRAILING_STOP = "trailing_stop"
    TAKE_PARTIAL = "take_partial"
    EXIT = "exit"


class DecisionDimension(enum.Enum):
    FINANCIAL_QUALITY = "financial_quality"
    VALUATION = "valuation"
    GROWTH = "growth"
    TECHNICAL_TREND = "technical_trend"
    MOMENTUM = "momentum"
    SMART_MONEY = "smart_money"
    PATTERN_QUALITY = "pattern_quality"
    RISK = "risk"
    SECTOR_STRENGTH = "sector_strength"
    MARKET_REGIME = "market_regime"
    LIQUIDITY = "liquidity"
    CONFIDENCE = "confidence"
    HISTORICAL_SIMILARITY = "historical_similarity"


class InvestmentHorizon(enum.Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class ConflictSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DecisionUrgency(enum.Enum):
    IMMEDIATE = "immediate"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


class ReportType(enum.Enum):
    EXECUTIVE = "executive"
    DETAILED = "detailed"
    EVIDENCE = "evidence"
    RISK_ANALYSIS = "risk_analysis"
    TIMELINE = "timeline"
    TELEGRAM = "telegram"


class DataSource(enum.Enum):
    UNIFIED_SCORING = "unified_scoring"
    ELITE_SCORE = "elite_score"
    CONFIDENCE = "confidence"
    EARLY_OPPORTUNITY = "early_opportunity"
    EVIDENCE = "evidence"
    EXPLAINABILITY = "explainability"
    RISK = "risk"
    FINANCIAL = "financial"
    PATTERN = "pattern"
    STRATEGY = "strategy"
    SIMILARITY = "similarity"
    MARKET_REGIME = "market_regime"


# ── Core Data Classes ──────────────────────────────────────────────────────

@dataclass
class EngineOutput:
    source: DataSource
    score: float
    confidence: float
    signals: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: Optional[str] = None


@dataclass
class DimensionScore:
    dimension: DecisionDimension
    raw_score: float
    normalized_score: float
    weight: float
    contribution: float
    confidence: float
    evidence: List[str] = field(default_factory=list)


@dataclass
class Conflict:
    dimension_a: DecisionDimension
    dimension_b: DecisionDimension
    severity: ConflictSeverity
    description: str
    explanation: str


@dataclass
class DecisionBonus:
    factor: str
    value: float
    description: str


@dataclass
class DecisionPenalty:
    factor: str
    value: float
    description: str


@dataclass
class EntryGuidance:
    timing: EntryTiming
    suggested_entry_price: Optional[float] = None
    scale_in_levels: List[float] = field(default_factory=list)
    max_position_pct: float = 0.0
    rationale: str = ""


@dataclass
class ExitGuidance:
    action: ExitAction
    initial_target: Optional[float] = None
    secondary_target: Optional[float] = None
    risk_stop: Optional[float] = None
    trailing_stop_pct: Optional[float] = None
    review_days: int = 30
    rationale: str = ""


@dataclass
class PortfolioImpact:
    diversification_effect: float = 0.0
    sector_concentration: float = 0.0
    risk_contribution: float = 0.0
    position_size_suggestion: float = 0.0
    existing_overlap: List[str] = field(default_factory=list)


@dataclass
class HorizonRecommendation:
    horizon: InvestmentHorizon
    decision: DecisionType
    score: float
    confidence: float
    entry: EntryGuidance
    exit: ExitGuidance
    summary: str = ""


@dataclass
class RecommendationPackage:
    symbol: str
    decision: DecisionType
    decision_score: float
    decision_confidence: float
    decision_risk: float
    decision_urgency: DecisionUrgency
    decision_stability: float
    summary: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)
    holding_period: str = ""
    entry: EntryGuidance = field(default_factory=EntryGuidance)
    exit: ExitGuidance = field(default_factory=ExitGuidance)
    portfolio_impact: PortfolioImpact = field(default_factory=PortfolioImpact)
    horizon_recommendations: List[HorizonRecommendation] = field(default_factory=list)
    dimension_scores: Dict[DecisionDimension, DimensionScore] = field(default_factory=dict)
    conflicts: List[Conflict] = field(default_factory=list)
    bonuses: List[DecisionBonus] = field(default_factory=list)
    penalties: List[DecisionPenalty] = field(default_factory=list)
    engine_outputs: Dict[DataSource, EngineOutput] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DecisionResult:
    symbol: str
    recommendation: RecommendationPackage
    decision_score: float
    decision_label: DecisionType
    decision_confidence: float
    decision_risk: float
    decision_urgency: DecisionUrgency
    generated_at: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


# ── Classification Helpers ─────────────────────────────────────────────────

def classify_decision(score: float) -> DecisionType:
    if score >= 90:
        return DecisionType.STRONG_BUY
    elif score >= 80:
        return DecisionType.BUY
    elif score >= 70:
        return DecisionType.EARLY_ACCUMULATION
    elif score >= 60:
        return DecisionType.ACCUMULATE
    elif score >= 50:
        return DecisionType.WATCH
    elif score >= 40:
        return DecisionType.WAIT_CONFIRMATION
    elif score >= 30:
        return DecisionType.NEUTRAL
    elif score >= 20:
        return DecisionType.REDUCE
    elif score >= 10:
        return DecisionType.TAKE_PROFIT
    elif score >= 5:
        return DecisionType.AVOID
    else:
        return DecisionType.DISTRIBUTION_RISK


def classify_urgency(score: float, momentum: float = 50.0) -> DecisionUrgency:
    if score >= 85 and momentum >= 70:
        return DecisionUrgency.IMMEDIATE
    elif score >= 75 and momentum >= 60:
        return DecisionUrgency.HIGH
    elif score >= 55:
        return DecisionUrgency.MEDIUM
    elif score >= 35:
        return DecisionUrgency.LOW
    else:
        return DecisionUrgency.NONE


def classify_stability(dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
    if not dimension_scores:
        return 0.0
    scores = [ds.normalized_score for ds in dimension_scores.values()]
    if len(scores) < 2:
        return 100.0
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    std_dev = variance ** 0.5
    return max(0.0, min(100.0, 100.0 - std_dev))


def classify_confidence_score(confidence: float) -> str:
    if confidence >= 80:
        return "high"
    elif confidence >= 60:
        return "medium_high"
    elif confidence >= 40:
        return "medium"
    elif confidence >= 20:
        return "low"
    else:
        return "very_low"
