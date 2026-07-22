from __future__ import annotations

import enum
import dataclasses
import uuid
import datetime
from typing import Dict, List, Optional, Any


class ConfidenceLabel(enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"
    EXCEPTIONAL = "exceptional"


class ConfidenceDimension(enum.Enum):
    DATA = "data"
    SIGNAL = "signal"
    EVIDENCE = "evidence"
    MODEL = "model"
    HISTORICAL = "historical"
    PATTERN = "pattern"
    RISK = "risk"
    MARKET = "market"
    SECTOR = "sector"
    EXECUTION = "execution"
    LIQUIDITY = "liquidity"


class ConfidenceTrend(enum.Enum):
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"


class BonusFactor(enum.Enum):
    STRONG_CONFIRMATION = "strong_confirmation"
    HIGH_SIMILARITY = "high_similarity"
    EXCELLENT_EVIDENCE = "excellent_evidence"
    INSTITUTIONAL_ACCUMULATION = "institutional_accumulation"
    HISTORICAL_CONSISTENCY = "historical_consistency"


class PenaltyFactor(enum.Enum):
    WEAK_DATA = "weak_data"
    LOW_LIQUIDITY = "low_liquidity"
    CONFLICTING_INDICATORS = "conflicting_indicators"
    HIGH_VOLATILITY = "high_volatility"
    WEAK_EVIDENCE = "weak_evidence"
    LOW_HISTORICAL_ACCURACY = "low_historical_accuracy"


class ReportType(enum.Enum):
    EXECUTIVE = "executive"
    DIMENSION_ANALYSIS = "dimension_analysis"
    WEAKNESS_ANALYSIS = "weakness_analysis"
    IMPROVEMENT_SUGGESTIONS = "improvement_suggestions"


@dataclasses.dataclass(frozen=True, slots=True)
class DimensionWeight:
    dimension: ConfidenceDimension
    weight: float
    min_value: float = 0.0
    max_value: float = 100.0
    description: str = ""


@dataclasses.dataclass(frozen=True, slots=True)
class BonusRule:
    factor: BonusFactor
    points: float
    condition: str = ""
    description: str = ""


@dataclasses.dataclass(frozen=True, slots=True)
class PenaltyRule:
    factor: PenaltyFactor
    points: float
    condition: str = ""
    description: str = ""


@dataclasses.dataclass(slots=True)
class ConfidenceWeightConfig:
    profile_name: str
    dimensions: Dict[ConfidenceDimension, DimensionWeight]
    bonus_rules: List[BonusRule] = dataclasses.field(default_factory=list)
    penalty_rules: List[PenaltyRule] = dataclasses.field(default_factory=list)
    total_weight: float = 1.0


@dataclasses.dataclass(slots=True)
class DimensionContribution:
    dimension: ConfidenceDimension
    raw_score: float
    normalized_score: float
    weighted_score: float
    contribution: float
    weight: float
    confidence: float = 1.0
    evidence_count: int = 0
    details: Dict[str, Any] = dataclasses.field(default_factory=dict)


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
class ConfidenceWarning:
    dimension: str
    message: str
    severity: str = "medium"


@dataclasses.dataclass(slots=True)
class ConfidenceResult:
    symbol: str
    confidence_score: float
    confidence_label: ConfidenceLabel
    dimension_contributions: Dict[ConfidenceDimension, DimensionContribution]
    bonuses: List[BonusApplied]
    penalties: List[PenaltyApplied]
    warnings: List[ConfidenceWarning]
    raw_score: float
    total_weight: float
    calculated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )
    calculation_id: str = dataclasses.field(default_factory=lambda: uuid.uuid4().hex[:12])
    source_data: Optional[Dict[str, Any]] = None


@dataclasses.dataclass(slots=True)
class ConfidenceHistoryEntry:
    symbol: str
    confidence_score: float
    confidence_label: ConfidenceLabel
    calculated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )
    delta: float = 0.0
    trend: ConfidenceTrend = ConfidenceTrend.STABLE


@dataclasses.dataclass(slots=True)
class ConfidenceTrendResult:
    symbol: str
    current_score: float
    previous_score: float
    delta: float
    trend: ConfidenceTrend
    history: List[ConfidenceHistoryEntry] = dataclasses.field(default_factory=list)
    avg_score: float = 0.0
    volatility: float = 0.0


@dataclasses.dataclass(slots=True)
class ConfidenceProfile:
    name: str
    description: str
    dimension_weights: Dict[ConfidenceDimension, DimensionWeight]
    bonus_rules: List[BonusRule] = dataclasses.field(default_factory=list)
    penalty_rules: List[PenaltyRule] = dataclasses.field(default_factory=list)
    is_active: bool = True


@dataclasses.dataclass(slots=True)
class ConfidenceCalculationRequest:
    symbol: str
    scores: Dict[str, float] = dataclasses.field(default_factory=dict)
    dimension_scores: Optional[Dict[str, float]] = None
    breakdowns: Optional[Dict[str, Any]] = None
    profile_name: str = "standard"
    source_data: Optional[Dict[str, Any]] = None


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


@dataclasses.dataclass(slots=True)
class ConfidenceReport:
    symbol: str
    report_type: ReportType
    title: str
    summary: str
    sections: List[Dict[str, Any]] = dataclasses.field(default_factory=list)
    generated_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.utcnow
    )


LABEL_RANGES: Dict[ConfidenceLabel, tuple[float, float]] = {
    ConfidenceLabel.VERY_LOW: (0.0, 20.0),
    ConfidenceLabel.LOW: (21.0, 40.0),
    ConfidenceLabel.MEDIUM: (41.0, 60.0),
    ConfidenceLabel.HIGH: (61.0, 80.0),
    ConfidenceLabel.VERY_HIGH: (81.0, 95.0),
    ConfidenceLabel.EXCEPTIONAL: (96.0, 100.0),
}


LABEL_DESCRIPTIONS: Dict[ConfidenceLabel, str] = {
    ConfidenceLabel.VERY_LOW: "Very low reliability, multiple critical issues",
    ConfidenceLabel.LOW: "Low reliability, significant concerns present",
    ConfidenceLabel.MEDIUM: "Moderate reliability, some areas need improvement",
    ConfidenceLabel.HIGH: "High reliability, strong supporting evidence",
    ConfidenceLabel.VERY_HIGH: "Very high reliability, multiple strong confirmations",
    ConfidenceLabel.EXCEPTIONAL: "Exceptional reliability, near-certain analysis",
}


DIMENSION_DESCRIPTIONS: Dict[ConfidenceDimension, str] = {
    ConfidenceDimension.DATA: "Data quality, freshness, and completeness",
    ConfidenceDimension.SIGNAL: "Cross-engine signal confirmation strength",
    ConfidenceDimension.EVIDENCE: "Evidence coverage and quality",
    ConfidenceDimension.MODEL: "Historical model accuracy and backtest performance",
    ConfidenceDimension.HISTORICAL: "Historical win rate and consistency",
    ConfidenceDimension.PATTERN: "Pattern quality, age, and confirmation",
    ConfidenceDimension.RISK: "Risk assessment reliability",
    ConfidenceDimension.MARKET: "Market regime and macro environment alignment",
    ConfidenceDimension.SECTOR: "Sector trend strength and rotation",
    ConfidenceDimension.EXECUTION: "Trade execution feasibility",
    ConfidenceDimension.LIQUIDITY: "Trading liquidity and capacity",
}


def classify_confidence(score: float) -> ConfidenceLabel:
    if score >= 96:
        return ConfidenceLabel.EXCEPTIONAL
    if score >= 81:
        return ConfidenceLabel.VERY_HIGH
    if score >= 61:
        return ConfidenceLabel.HIGH
    if score >= 41:
        return ConfidenceLabel.MEDIUM
    if score >= 21:
        return ConfidenceLabel.LOW
    return ConfidenceLabel.VERY_LOW


def normalize_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    if max_val == min_val:
        return 0.0
    return max(min_val, min(max_val, value))
