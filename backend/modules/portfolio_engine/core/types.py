from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class PortfolioSize(int, Enum):
    SMALL = 5
    MEDIUM = 10
    LARGE = 15
    XLARGE = 20


class InvestmentHorizon(str, Enum):
    WEEKLY = "weekly"
    MONTH_1 = "month_1"
    MONTH_3 = "month_3"
    MONTH_6 = "month_6"
    MONTH_12 = "month_12"


class RiskLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RejectionReason(str, Enum):
    LOW_ELITE_SCORE = "low_elite_score"
    LOW_CONFIDENCE = "low_confidence"
    LOW_LIQUIDITY = "low_liquidity"
    VERY_HIGH_RISK = "very_high_risk"
    LOW_DECISION_SCORE = "low_decision_score"
    SECTOR_CONCENTRATION = "sector_concentration"
    INSUFFICIENT_DATA = "insufficient_data"


class ReportType(str, Enum):
    FULL = "full"
    SUMMARY = "summary"
    SELECTED_STOCKS = "selected_stocks"
    REJECTED_STOCKS = "rejected_stocks"
    SECTOR_DISTRIBUTION = "sector_distribution"
    RISK_SUMMARY = "risk_summary"


class SortField(str, Enum):
    ELITE_SCORE = "elite_score"
    DECISION_SCORE = "decision_score"
    CONFIDENCE = "confidence"
    RISK = "risk"
    LIQUIDITY = "liquidity"
    COMPOSITE = "composite"


class BenchmarkResultStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_PORTFOLIO_SIZE: int = PortfolioSize.MEDIUM.value
DEFAULT_MAX_PER_SECTOR: int = 2
MIN_ELITE_SCORE: float = 40.0
MIN_CONFIDENCE: float = 30.0
MIN_LIQUIDITY: float = 20.0
MAX_RISK_FOR_INCLUSION: float = 80.0
MIN_DECISION_SCORE: float = 35.0

HORIZON_LOOKBACK_DAYS: Dict[InvestmentHorizon, int] = {
    InvestmentHorizon.WEEKLY: 5,
    InvestmentHorizon.MONTH_1: 21,
    InvestmentHorizon.MONTH_3: 63,
    InvestmentHorizon.MONTH_6: 126,
    InvestmentHorizon.MONTH_12: 252,
}

RISK_LEVEL_THRESHOLDS: List[tuple[float, RiskLevel]] = [
    (20.0, RiskLevel.VERY_LOW),
    (40.0, RiskLevel.LOW),
    (60.0, RiskLevel.MODERATE),
    (80.0, RiskLevel.HIGH),
    (100.0, RiskLevel.VERY_HIGH),
]

SECTOR_DIVERSIFICATION_PRESETS: Dict[str, int] = {
    "conservative": 1,
    "balanced": 2,
    "aggressive": 3,
    "unconstrained": 999,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def risk_score_to_level(score: float) -> RiskLevel:
    for threshold, level in RISK_LEVEL_THRESHOLDS:
        if score <= threshold:
            return level
    return RiskLevel.VERY_HIGH


def compute_composite_score(
    elite_score: float,
    decision_score: float,
    confidence: float,
    risk: float,
    liquidity: float,
) -> float:
    return _clamp(
        elite_score * 0.30
        + decision_score * 0.25
        + confidence * 0.20
        + (100.0 - risk) * 0.15
        + liquidity * 0.10
    )


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class StockCandidate:
    symbol: str
    sector: str = ""
    elite_score: float = 0.0
    decision_score: float = 0.0
    confidence: float = 0.0
    risk: float = 50.0
    liquidity: float = 50.0
    composite_score: float = 0.0
    rank: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SelectionResult:
    symbol: str
    selected: bool = True
    reason: str = ""
    rejection_reason: Optional[RejectionReason] = None
    rank: int = 0
    composite_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortfolioProposal:
    portfolio_id: str = ""
    reference_date: str = ""
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    size: int = DEFAULT_PORTFOLIO_SIZE
    selected: List[StockCandidate] = field(default_factory=list)
    rejected: List[SelectionResult] = field(default_factory=list)
    quality_metrics: Optional[PortfolioQuality] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortfolioQuality:
    avg_elite_score: float = 0.0
    avg_confidence: float = 0.0
    avg_risk: float = 0.0
    avg_liquidity: float = 0.0
    avg_composite_score: float = 0.0
    sector_distribution: Dict[str, int] = field(default_factory=dict)
    liquidity_distribution: Dict[str, int] = field(default_factory=dict)
    risk_distribution: Dict[str, int] = field(default_factory=dict)
    diversification_score: float = 0.0
    concentration_risk: float = 0.0


@dataclass
class PortfolioRequest:
    reference_date: str = ""
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    portfolio_size: int = DEFAULT_PORTFOLIO_SIZE
    max_per_sector: int = DEFAULT_MAX_PER_SECTOR
    min_elite_score: float = MIN_ELITE_SCORE
    min_confidence: float = MIN_CONFIDENCE
    min_liquidity: float = MIN_LIQUIDITY
    max_risk: float = MAX_RISK_FOR_INCLUSION
    min_decision_score: float = MIN_DECISION_SCORE
    candidates: List[StockCandidate] = field(default_factory=list)
    sector_data: Dict[str, Any] = field(default_factory=dict)
    sort_by: SortField = SortField.COMPOSITE
    diversification_preset: Optional[str] = None
    seed: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortfolioResult:
    request: PortfolioRequest
    proposal: PortfolioProposal
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    name: str
    status: BenchmarkResultStatus = BenchmarkResultStatus.SUCCESS
    execution_time_ms: float = 0.0
    result: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
