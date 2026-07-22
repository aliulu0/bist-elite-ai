from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class InvestmentHorizon(Enum):
    HOURS_4 = "hours_4"
    DAY_1 = "day_1"
    WEEK_1 = "week_1"
    MONTH_1 = "month_1"
    MONTH_3 = "month_3"
    MONTH_6 = "month_6"
    MONTH_12 = "month_12"


class RiskProfile(Enum):
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"
    CUSTOM = "custom"


class PositionGrade(Enum):
    A_PLUS = "A+"
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class StopLossType(Enum):
    SUGGESTED = "suggested"
    ATR_BASED = "atr_based"
    VOLATILITY = "volatility"
    TRAILING = "trailing"


class ReportType(Enum):
    FULL = "full"
    SUMMARY = "summary"
    ALLOCATION = "allocation"
    RISK = "risk"
    EXPOSURE = "exposure"
    EXPLAINABILITY = "explainability"


class BenchmarkResultStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


DEFAULT_MAX_POSITION_PCT = 15.0
DEFAULT_MIN_POSITION_PCT = 1.0
DEFAULT_MAX_SECTOR_EXPOSURE = 30.0
DEFAULT_CASH_RESERVE = 10.0
DEFAULT_MAX_CORRELATION = 0.7
DEFAULT_ATR_STOP_MULTIPLIER = 2.0
DEFAULT_VOLATILITY_STOP_MULTIPLIER = 2.5

RISK_PROFILE_PRESETS: Dict[RiskProfile, Dict[str, float]] = {
    RiskProfile.CONSERVATIVE: {
        "max_position": 8.0,
        "min_position": 1.0,
        "max_sector_exposure": 20.0,
        "cash_reserve": 15.0,
        "max_risk_per_trade": 1.0,
    },
    RiskProfile.BALANCED: {
        "max_position": 12.0,
        "min_position": 2.0,
        "max_sector_exposure": 25.0,
        "cash_reserve": 10.0,
        "max_risk_per_trade": 2.0,
    },
    RiskProfile.AGGRESSIVE: {
        "max_position": 20.0,
        "min_position": 3.0,
        "max_sector_exposure": 35.0,
        "cash_reserve": 5.0,
        "max_risk_per_trade": 3.0,
    },
    RiskProfile.CUSTOM: {
        "max_position": DEFAULT_MAX_POSITION_PCT,
        "min_position": DEFAULT_MIN_POSITION_PCT,
        "max_sector_exposure": DEFAULT_MAX_SECTOR_EXPOSURE,
        "cash_reserve": DEFAULT_CASH_RESERVE,
        "max_risk_per_trade": 2.0,
    },
}


@dataclass
class PositionInput:
    symbol: str
    sector: str = ""
    elite_score: float = 0.0
    confidence: float = 0.0
    risk: float = 50.0
    liquidity: float = 50.0
    avg_daily_volume: float = 0.0
    atr: float = 0.0
    volatility: float = 0.0
    beta: float = 1.0
    market_regime: str = "sideways"
    sector_exposure: float = 0.0
    correlation: float = 0.0
    agreement_score: float = 0.0
    price: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StopLoss:
    symbol: str
    stop_loss_price: float = 0.0
    stop_loss_pct: float = 0.0
    stop_loss_type: StopLossType = StopLossType.SUGGESTED
    atr_multiplier: float = DEFAULT_ATR_STOP_MULTIPLIER
    volatility_multiplier: float = DEFAULT_VOLATILITY_STOP_MULTIPLIER
    explanation: str = ""


@dataclass
class TakeProfit:
    symbol: str
    primary_target: float = 0.0
    secondary_target: float = 0.0
    risk_reward_ratio: float = 2.0
    explanation: str = ""


@dataclass
class PositionSizing:
    symbol: str
    recommended_pct: float = 0.0
    min_pct: float = DEFAULT_MIN_POSITION_PCT
    max_pct: float = DEFAULT_MAX_POSITION_PCT
    portfolio_weight: float = 0.0
    cash_allocation_pct: float = 0.0
    position_grade: PositionGrade = PositionGrade.C
    stop_loss: Optional[StopLoss] = None
    take_profit: Optional[TakeProfit] = None
    explanation: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortfolioExposure:
    sector_exposure: Dict[str, float] = field(default_factory=dict)
    market_exposure: float = 0.0
    total_risk_exposure: float = 0.0
    cash_ratio: float = DEFAULT_CASH_RESERVE
    concentration_risk: float = 0.0
    sector_count: int = 0


@dataclass
class PositionSizingRequest:
    reference_date: str = ""
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    risk_profile: RiskProfile = RiskProfile.BALANCED
    total_capital: float = 100000.0
    positions: List[PositionInput] = field(default_factory=list)
    sector_limits: Dict[str, float] = field(default_factory=dict)
    max_sector_exposure: float = DEFAULT_MAX_SECTOR_EXPOSURE
    max_correlation: float = DEFAULT_MAX_CORRELATION
    custom_params: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PositionSizingResult:
    request: Optional[PositionSizingRequest] = None
    positions: List[PositionSizing] = field(default_factory=list)
    exposure: PortfolioExposure = field(default_factory=PortfolioExposure)
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


def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def grade_to_value(grade: PositionGrade) -> int:
    mapping = {
        PositionGrade.A_PLUS: 5,
        PositionGrade.A: 4,
        PositionGrade.B: 3,
        PositionGrade.C: 2,
        PositionGrade.D: 1,
    }
    return mapping.get(grade, 2)


def value_to_grade(value: int) -> PositionGrade:
    if value >= 5:
        return PositionGrade.A_PLUS
    if value == 4:
        return PositionGrade.A
    if value == 3:
        return PositionGrade.B
    if value == 2:
        return PositionGrade.C
    return PositionGrade.D


def compute_position_grade(score: float) -> PositionGrade:
    if score >= 85:
        return PositionGrade.A_PLUS
    if score >= 70:
        return PositionGrade.A
    if score >= 50:
        return PositionGrade.B
    if score >= 30:
        return PositionGrade.C
    return PositionGrade.D
